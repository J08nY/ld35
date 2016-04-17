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
        document.addEventListener('pointerlockchange', this.onChange, false);
        document.addEventListener('mozpointerlockchange', this.onChange, false);
        document.addEventListener('webkitpointerlockchange', this.onChange, false);

        document.addEventListener('pointerlockerror', this.onError, false);
        document.addEventListener('mozpointerlockerror', this.onError, false);
        document.addEventListener('webkitpointerlockerror', this.onError, false);

        this.blocker.addEventListener("click", this.onClick, false)
    }

    onChange = (event) => {
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
    };

    onError = (event) => {
        this.instructions.style.display = "";
    };

    onClick = (event) => {
        let element:any = document.body;
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        this.instructions.style.display = "none";

        element.requestPointerLock();
    };
}

class Keyboard {
    /*
     Credit to: https://github.com/stemkoski
     */
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

    update():void {
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

    register():void {
        document.addEventListener("keydown", this.onKeyDown, false);
        document.addEventListener("keyup", this.onKeyUp, false);
    }

    unregister():void {
        document.removeEventListener("keydown", this.onKeyDown, false);
        document.removeEventListener("keyup", this.onKeyUp, false);
    }

    static keyName(keyCode) {
        return ( Keyboard.k[keyCode] != null ) ?
            Keyboard.k[keyCode] :
            String.fromCharCode(keyCode);
    }
}

/**
 *
 */
class Mouse {
    x:number;
    y:number;
    xMovement:number = 0;
    yMovement:number = 0;
    private buttons = {};

    constructor(private player:Player) {
    }

    onMouseMove = (event:MouseEvent) => {
        this.x = event.screenX;
        this.xMovement = event.movementX;
        this.y = event.screenY;
        this.yMovement = event.movementY;
        this.player.rotate(event.movementX);
        this.player.look(event.movementY);
    };

    onMouseDown = (event:MouseEvent) => {
        this.buttons[event.button] = true;
        this.player.click(event.button);
    };

    onMouseUp = (event:MouseEvent) => {
        this.buttons[event.button] = false;
    };

    pressed(button:number):boolean {
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

/**
 *
 */
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

    private updateGeometry():void {
        this.geometry = Morph.generateGeometry(this.level);
    }

    shrink():void {
        if (this.level > 0) {
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

/**
 *
 */
class Projectile extends Morph {
    time:number = 0;

    constructor(private pos:Vector3, private dir:Vector3, level:number) {
        super(level,
            Physijs.createMaterial(new THREE.MeshBasicMaterial({
                    color: 0x303030
                }),
                0.5,
                0.3
            ),
            0.01);
        this.position.copy(pos.clone().add(dir.clone().setLength(2)));
    }

    shoot():void {
        this.setLinearVelocity(this.dir);
    }

    tick(delta):void {
        this.time += delta;
    }
}

/**
 *
 */
class Enemy extends Morph {
    speed:number = 10;

    constructor() {
        super(0, Physijs.createMaterial(
            new THREE.MeshBasicMaterial({
                color: 0xb02000
            }),
            .8,
            .6
        ), 2);
    }

    approach(player:Player) {
        let toPlayer = player.position.clone().sub(this.position).normalize();
        this.setLinearVelocity(toPlayer.setLength(this.speed));
    }

}

class Player extends Morph {
    minus:number;
    plus:number;
    life:number;
    forward:Vector3 = new Vector3(0, 0, -1);
    upward:Vector3 = new Vector3(0, 1, 0);
    camera:Vector3 = new Vector3(0, 10, 10);
    heading:number = 0;
    pitch:number = 0;
    speed:number = 25;

    projectiles:Projectile[] = [];

    constructor() {

        super(1, Physijs.createMaterial(
            new THREE.MeshBasicMaterial({
                color: 0x00a0b0
            }),
            1,
            0.1
            ),
            0.5);
    }

    jump():void {
        this.applyCentralImpulse(new Vector3(0, 8, 0));
    }

    rotate(xMovement:number):void {
        this.heading -= xMovement * 0.002;
    }

    look(yMovement:number):void {
        this.pitch -= yMovement * 0.002;
    }

    click(button:number):void {
        if (button == THREE.MOUSE.LEFT) {
            this.projectiles.push(new Projectile(this.position, this.getDirection().multiplyScalar(35), this.level));
        }
    }

    getRight():Vector3 {
        return this.getDirection().cross(this.upward).normalize();
    }

    getDirection():Vector3 {
        return this.forward.clone().applyAxisAngle(this.upward, this.heading);
    }

    getCamera():Vector3 {
        return this.camera.clone().applyAxisAngle(this.upward, this.heading).applyAxisAngle(this.getRight(), this.pitch);
    }
}

class World extends Physijs.Scene {
    private mobs:Enemy[] = [];
    private projectiles:Projectile[] = [];

    constructor(private player:Player) {
        super();
        this.setGravity(new THREE.Vector3(0, -40, 0));

        this.add(player);
        player.position.set(0, 2, 0);
        player.castShadow = true;
        player.setDamping(0.05, 0.05);

        for (let i = 0; i < 10; i++) {
            let enemy = new Enemy();
            let x = Math.floor(Math.random() * 20 + 3);
            let z = Math.floor(Math.random() * 20 + 3);
            enemy.position.set(x, 2, z);
            this.add(enemy);
            this.mobs.push(enemy);
        }

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
        this.add(light);

        let groundGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        let groundMaterial = Physijs.createMaterial(
            new THREE.MeshBasicMaterial({color: 0xdadada}),
            1,
            1
        );

        let ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
        ground.receiveShadow = true;
        this.add(ground);

    }

    tick(delta:number):void {
        //push projectiles queued from player into the world.
        while (this.player.projectiles.length > 0) {
            let projectile = this.player.projectiles.pop();
            this.projectiles.push(projectile);
            this.add(projectile);
            projectile.shoot();
        }

        //enemy movement
        this.mobs.forEach((mob) => {
            mob.approach(this.player);
        });
        //tick projectiles and remove them if time out
        //todo fix projectile removal, now ammojs spams obj s undefined
        /*
        this.projectiles.filter((projectile) => {
            projectile.tick(delta);
            let keep = projectile.time < 10 * 1000;
            if (!keep) {
                this.remove(projectile);
            }
            return keep;
        });
        */

        //physijs
        this.simulate(delta, 1);
    }

}

enum GameState {
    INITIALIZED,
    STARTED,
    PAUSED,
    STOPPED
}

class Game {
    private renderer:THREE.WebGLRenderer;
    private camera:THREE.PerspectiveCamera;

    private player:Player;
    private world:World;

    private keyboard:Keyboard;
    private mouse:Mouse;

    state:GameState;
    private ticks:number = 0;
    private delta:number = 0;
    private lastFrame:number = 0;
    private timestep:number = 1000 / 60;
    private maxFPS:number = 60;

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
        window.addEventListener("resize", this.onWindowResize, false);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);
    }

    init():void {
        //init player and world
        this.player = new Player();
        this.world = new World(this.player);

        //init camera
        this.camera.position.addVectors(this.player.position, this.player.camera);
        this.camera.lookAt(this.player.position);

        //init keyboard and mouse
        this.keyboard = new Keyboard();
        this.mouse = new Mouse(this.player);

        this.state = GameState.INITIALIZED;
    }

    onWindowResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    /**
     * Just render the scene.
     */
    render():void {
        this.renderer.render(this.world, this.camera);
    }

    /**
     * Update logic based on @param delta.
     * @param delta
     */
    tick(delta:number):void {
        this.ticks++;
        this.keyboard.update();

        //camera
        this.camera.position.addVectors(this.player.position, this.player.getCamera());
        this.camera.lookAt(this.player.position);

        //player movement
        let forward = this.player.getDirection();
        forward.setLength(this.player.speed);
        let right = forward.clone().cross(this.player.upward);
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
        //clamp speed, TODO into  a method
        let velocity = this.player.getLinearVelocity().clampLength(-20, 20);
        this.player.setLinearVelocity(velocity);

        //morph!
        if (this.keyboard.down("Q")) {
            this.player.shrink();
        } else if (this.keyboard.down("E")) {
            this.player.grow();
        }

        //jump!
        if (this.keyboard.down("space")) {
            console.log("jump");
            this.player.jump();
        }

        this.world.tick(delta);
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
            requestAnimationFrame((time) => this.run(time));
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

        this.mouse.unregister();
        this.keyboard.unregister();
        window.removeEventListener("resize", this.onWindowResize, false);
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
    //from three.js example(PointerLock), thanks
    let block = document.getElementById("block");
    let instructions = document.getElementById("instructions");

    let plock = new PointerLock(game, block, instructions);
    plock.gain();
};