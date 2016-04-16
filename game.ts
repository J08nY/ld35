/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>
/// <reference path="three_js/ts/detector.d.ts"/>
'use strict';

import Vector3 = THREE.Vector3;
import Material = THREE.Material;
import Geometry = THREE.Geometry;

//wtf fix..
Physijs.scripts.worker = "physi_js/physijs_worker.js";
Physijs.scripts.ammo = "ammo.js";

class PointerLock {
    hasLock:boolean = false;

    constructor(private game:Game, private blocker:HTMLElement, private instructions:HTMLElement) {
    }


    gain() {
        let havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        if (!havePointerLock) {
            return;
        }
        document.addEventListener('pointerlockchange', (event) => this.onChange(event), false);
        document.addEventListener('mozpointerlockchange', (event) => this.onChange(event), false);
        document.addEventListener('webkitpointerlockchange', (event) => this.onChange(event), false);

        document.addEventListener('pointerlockerror', (event) => this.onError(event), false);
        document.addEventListener('mozpointerlockerror', (event) => this.onError(event), false);
        document.addEventListener('webkitpointerlockerror', (event) => this.onError(event), false);

        this.blocker.addEventListener("click", (event) => this.onClick(event), false)
    }

    onChange(event) {
        let element = document.body;
        let doc:any = document;

        if (doc.pointerLockElement === element || doc.mozPointerLockElement === element || doc.webkitPointerLockElement === element) {
            //gained
            this.hasLock = true;
            this.blocker.style.display = "none";
            if (this.game.state == GameState.INITIALIZED || this.game.state == GameState.PAUSED) {
                this.game.start();
            }
            console.log("gained");
        } else {
            //lost
            this.hasLock = false;
            this.blocker.style.display = '-webkit-box';
            this.blocker.style.display = '-moz-box';
            this.blocker.style.display = 'box';

            this.instructions.style.display = "";
            if (this.game.state == GameState.STARTED) {
                this.game.pause();
            }
            console.log("lost");
        }
    }

    onError(event) {
        this.instructions.style.display = "";
    }

    onClick(event) {
        let element:any = document.body;
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        this.instructions.style.display = "none";

        element.requestPointerLock();
    }
}

class Keyboard {
    static k = {
        8: "backspace", 9: "tab", 13: "enter", 16: "shift",
        17: "ctrl", 18: "alt", 27: "esc", 32: "space",
        33: "pageup", 34: "pagedown", 35: "end", 36: "home",
        37: "left", 38: "up", 39: "right", 40: "down",
        45: "insert", 46: "delete", 186: ";", 187: "=",
        188: ",", 189: "-", 190: ".", 191: "/",
        219: "[", 220: "\\", 221: "]", 222: "'"
    };
    private status = {};

    constructor() {

    }

    update() {
        for (var key in this.status) {
            // insure that every keypress has "down" status exactly once
            if (!this.status[key].updatedPreviously) {
                this.status[key].down = true;
                this.status[key].pressed = true;
                this.status[key].updatedPreviously = true;
            }
            else // updated previously
            {
                this.status[key].down = false;
            }

            // key has been flagged as "up" since last update
            if (this.status[key].up) {
                delete this.status[key];
                continue; // move on to next key
            }

            if (!this.status[key].pressed) // key released
                this.status[key].up = true;
        }
    }

    onKeyDown = (event:KeyboardEvent) => {
        var key = Keyboard.keyName(event.keyCode);
        if (!this.status[key])
            this.status[key] = {down: false, pressed: false, up: false, updatedPreviously: false};
    };

    onKeyUp = (event:KeyboardEvent) => {
        var key = Keyboard.keyName(event.keyCode);
        if (this.status[key])
            this.status[key].pressed = false;
    };

    down(key):boolean {
        return (this.status[key] && this.status[key].down);
    }

    pressed(key):boolean {
        return (this.status[key] && this.status[key].pressed);
    }

    up(key):boolean {
        return (this.status[key] && this.status[key].up);
    }

    register() {
        document.addEventListener("keydown", this.onKeyDown, false);
        document.addEventListener("keyup", this.onKeyUp, false);
    }

    unregister() {
        document.removeEventListener("keydown", this.onKeyDown, false);
        document.removeEventListener("keyup", this.onKeyUp, false);
    }

    static keyName(keyCode) {
        return ( Keyboard.k[keyCode] != null ) ?
            Keyboard.k[keyCode] :
            String.fromCharCode(keyCode);
    }
}

enum MouseButton{
    LEFT,
    RIGHT,
    MIDDLE
}

class Mouse {
    x:number;
    y:number;
    xMovement:number = 0;
    yMovement:number = 0;
    private buttons = {};

    constructor() {

    }

    onMouseMove = (event:MouseEvent) => {
        this.x = event.screenX;
        this.xMovement = event.movementX;
        this.y = event.screenY;
        this.yMovement = event.movementY;
//        console.log(this.x + " " + this.y + " :: " + this.xMovement + " " + this.yMovement);
    };

    onMouseDown = (event:MouseEvent) => {
        this.buttons[event.button] = true;
    };

    onMouseUp = (event:MouseEvent) => {
        this.buttons[event.button] = false;
    };

    pressed(button:MouseButton):boolean {
        return this.buttons[button];
    }

    register() {
        document.addEventListener("mousemove", this.onMouseMove, false);
        document.addEventListener("mousedown", this.onMouseDown, false);
        document.addEventListener("mouseup", this.onMouseUp, false);
    }

    unregister() {
        document.removeEventListener("mousemove", this.onMouseMove, false);
        document.removeEventListener("mousedown", this.onMouseDown, false);
        document.removeEventListener("mouseup", this.onMouseUp, false);
    }

}


class Morph extends Physijs.SphereMesh {
    static levels:number[] = [4, 6, 12, 20];


    constructor(public level:number, material?:THREE.Material, mass?:number) {
        super(Morph.generateGeometry(level), material, mass);
    }

    static generateGeometry(level:number):THREE.Geometry {
        let numFaces = Morph.levels[level];

        switch (numFaces) {
            case 4:
                return new THREE.TetrahedronGeometry();
            case 6:
                return new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
            case 12:
                return new THREE.DodecahedronGeometry(1, 0);
            case 20:
                return new THREE.IcosahedronGeometry(1, 0);
            default:
                return new THREE.TetrahedronGeometry();
        }
    }

    private updateGeometry() {
        this.geometry = Morph.generateGeometry(this.level);
    }

    shrink():void {
        if (this.level > 1) {
            this.level--;
            this.updateGeometry();
        }
    }

    grow():void {
        if (this.level < 3) {
            this.level++;
            this.updateGeometry();
        }
    }

}

class Enemy extends Morph {

    constructor() {
        super(0, Physijs.createMaterial(
            new THREE.MeshBasicMaterial({
                color: 0xb02000
            }),
            .8,
            .6
        ), 2);
    }

    /*
     static getMaterial():Physijs.Material {
     return Physijs.createMaterial(
     new THREE.MeshBasicMaterial({
     color: 0xb02000
     }),
     .8,
     .3
     );
     }
     */
}

class Player extends Morph {
    minus:number;
    plus:number;
    life:number;
    direction:Vector3 = new Vector3(0, 0, -1);
    upward:Vector3 = new Vector3(0, 1, 0);
    camera:Vector3 = new Vector3(0, 10, 10);
    speed:number = 15;

    constructor() {

        super(1, Physijs.createMaterial(
            new THREE.MeshBasicMaterial({
                color: 0x00a0b0
            }),
            .8,
            .6
        ), 0.5);
    }

    jump() {
        this.applyCentralImpulse(new Vector3(0, 8, 0));
    }

    /*
     static getMaterial():Physijs.Material {
     return Physijs.createMaterial(
     new THREE.MeshBasicMaterial({
     color: 0x00a0b0
     }),
     .8,
     .3
     );
     }
     */
}

class World {


    constructor(player:Player, scene:Physijs.Scene, camera:THREE.Camera) {

        player.position.set(0, 2, 0);
        player.castShadow = true;
        scene.add(player);

        //scene.add(camera);

        let enemy = new Enemy();
        enemy.position.set(0, 5, 0);
        enemy.castShadow = true;
        scene.add(enemy);


        let light:any = new THREE.DirectionalLight(0xFFFFFF);
        light.position.set(20, 40, -15);
        light.target.position.copy(player.position);
        light.castShadow = true;
        light.shadow.camera.left = -60;
        light.shadow.camera.top = -60;
        light.shadow.camera.right = 60;
        light.shadow.camera.bottom = 60;
        light.shadow.camera.near = 20;
        light.shadow.camera.far = 200;
        light.shadow.bias = -.0001;
        light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
        scene.add(light);


        let groundGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        let groundMaterial = Physijs.createMaterial(
            new THREE.MeshBasicMaterial({color: 0xdadada}),
            1,
            .6
        );

        let ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
        scene.add(ground);
        ground.receiveShadow = true;

    }

}

enum GameState {
    INITIALIZED,
    STARTED,
    PAUSED,
    STOPPED
}

class Game {
    renderer:THREE.WebGLRenderer;

    camera:THREE.PerspectiveCamera;
    scene:Physijs.Scene;
    player:Player;
    playerDirection: THREE.ArrowHelper;

    world:World;
    state:GameState;

    keyboard:Keyboard;
    mouse:Mouse;

    private ticks:number = 0;
    private delta:number = 0;
    private lastFrame:number = 0;
    private timestep:number = 1000 / 30;
    private maxFPS:number = 30;

    private keepRunning:boolean;


    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setClearColor(0xffffff);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", () => this.onWindowResize(), false);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);

        this.keyboard = new Keyboard();

        this.mouse = new Mouse();
    }

    init():void {
        //init world
        this.scene = new Physijs.Scene;
        this.scene.setGravity(new THREE.Vector3(0, -10, 0));

        this.player = new Player();
        this.world = new World(this.player, this.scene, this.camera);

        //init camera
        this.camera.position.addVectors(this.player.position, this.player.camera);
        this.camera.lookAt(this.player.position);


        this.playerDirection = new THREE.ArrowHelper(this.player.direction.clone().normalize(), this.player.position, 5);
        this.scene.add(this.playerDirection);

        this.state = GameState.INITIALIZED;
    }


    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Just render the scene.
     */
    render():void {
        //console.log("render");
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update logic based on @param delta.
     * @param delta
     */
    tick(delta):void {
        //console.log("tick " + delta);
        this.ticks++;
        this.keyboard.update();

        this.camera.position.addVectors(this.player.position, this.player.camera);


        if (this.mouse.xMovement != 0) {
            this.camera.lookAt(this.player.position);
            this.player.direction.applyAxisAngle(this.player.upward, -this.mouse.xMovement / 180);
            this.player.camera.applyAxisAngle(this.player.upward, -this.mouse.xMovement / 180);
            this.playerDirection.setDirection(this.player.direction);

            /* //Please nobody look at this. I am dumb...

             //this.player.camera -> relative position of camera to player
             //to get rotation, just negate and normalize
             let dir = this.player.camera.clone().negate().normalize();
             let newCamera = this.player.camera.clone().applyAxisAngle(new Vector3(0, 1, 0), -this.mouse.xMovement / 180);
             let up = this.camera.up.clone().add(this.player.camera).applyAxisAngle(this.player.upward, -this.mouse.xMovement / 180).sub(newCamera);
             let quatr = new THREE.Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), dir);
             //this.camera.rotateY(this.mouse.xMovement / 180);
             //this.camera.up.copy(new Vector3(0,1,0));
             //this.camera.rotation.setFromQuaternion(quatr);

             this.player.direction.applyAxisAngle(new Vector3(0, 1, 0), this.mouse.xMovement / 180);
             this.player.camera.copy(newCamera);
             this.camera.lookAt(this.player.position);
             console.log("A  " + this.camera.up.toArray().toString() + " || " + this.camera.rotation.toArray().toString());
             //this.camera.up.copy(new Vector3(0,1,0));

             console.log("B  " + this.camera.up.toArray().toString() + " || " + this.camera.rotation.toArray().toString());

             //this.camera.up.copy(up);
             //this.camera.rotation.setFromQuaternion(quatr);

             let look = this.player.camera.clone().negate().normalize();
             let right = this.player.direction.clone().cross(this.player.upward).normalize();
             let angle = this.player.camera.angleTo(this.player.direction);
             let camUp = this.player.upward.clone().applyAxisAngle(right, -angle);

             this.camera.rotation.copy(
             new THREE.Euler().setFromVector3(look));
             this.camera.up.copy(camUp);
            //rotate tis.player.upward around
             this.camera.lookAt(this.player.position);
             console.log(this.camera.rotation);
             console.log(this.camera.quaternion);
            //this.camera.rotationAutoUpdate = true;
             this.camera.quaternion.setFromUnitVectors(new Vector3(0,0,-1), look);
             this.camera.up.copy(this.player.upward);
             */
        }

        let forward = this.player.direction.clone();
        forward.setLength(this.player.speed);
        let right = this.player.direction.clone().cross(this.player.upward);
        right.setLength(this.player.speed);

        if (this.keyboard.pressed("W")) {
            this.player.applyCentralForce(forward);
        }
        if (this.keyboard.pressed("S")) {
            this.player.applyCentralForce(forward.negate());
        }
        if (this.keyboard.pressed("D")) {
            this.player.applyCentralForce(right);
        }
        if (this.keyboard.pressed("A")) {
            this.player.applyCentralForce(right.negate());
        }

        if (this.keyboard.down("space")) {
            console.log("jump");
            this.player.jump();
        }


//        console.log(this.camera.position.addVectors(this.player.position, this.player.camera));
        this.scene.simulate(undefined, 2);
    }

    run(timestamp?):void {
        if (!timestamp) {
            timestamp = performance.now();
        }

        if (timestamp < this.lastFrame + (1000 / this.maxFPS)) {
            if (this.keepRunning) {
                requestAnimationFrame(() => this.run());
            }
            return;
        }
        this.delta += timestamp - this.lastFrame;
        this.lastFrame = timestamp;

        var numUpdateSteps = 0;
        while (this.delta >= this.timestep) {
            this.tick(this.timestep);
            this.delta -= this.timestep;
            if (++numUpdateSteps >= 240) {
                // panic here, reset delta
                this.delta = 0;
                break;
            }
        }
        this.render();
        if (this.keepRunning) {
            requestAnimationFrame(() => this.run());
        }
    }

    start() {
        this.state = GameState.STARTED;
        this.keepRunning = true;
        this.lastFrame = performance.now();

        this.keyboard.register();
        this.mouse.register();

        this.run();
    }

    pause() {
        this.state = GameState.PAUSED;
        this.keyboard.unregister();
        this.mouse.unregister();

        this.keepRunning = false;
    }

    stop() {
        this.pause();
        this.state = GameState.STOPPED;
        //end here!!
        //todo
    }
}

if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

window.onload = () => {
    let game = new Game();
    game.init();
    //make sure we have pointerlock here
    let block = document.getElementById("block");
    let instructions = document.getElementById("instructions");
    let plock = new PointerLock(game, block, instructions);
    plock.gain();
};