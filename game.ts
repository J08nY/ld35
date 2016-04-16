/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>
/// <reference path="three_js/ts/detector.d.ts"/>

import Vector3 = THREE.Vector3;
import ShaderMaterial = THREE.ShaderMaterial;
import Material = THREE.Material;
import Geometry = THREE.Geometry;


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

        this.instructions.addEventListener("click", (event) => this.onClick(event), false)
    }

    onChange(event) {
        let element = document.body;
        let doc:any = document;

        if (doc.pointerLockElement === element || doc.mozPointerLockElement === element || doc.webkitPointerLockElement === element) {
            //gained
            this.hasLock = true;
            this.blocker.style.display = "none";
            if(this.game.state == GameState.INITIALIZED || this.game.state == GameState.PAUSED) {
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
            if(this.game.state == GameState.STARTED) {
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

    onKeyDown(event) {
        var key = Keyboard.keyName(event.keyCode);
        if (!this.status[key])
            this.status[key] = {down: false, pressed: false, up: false, updatedPreviously: false};
    }

    onKeyUp(event) {
        var key = Keyboard.keyName(event.keyCode);
        if (this.status[key])
            this.status[key].pressed = false;
    }

    down(key) {
        return (this.status[key] && this.status[key].down);
    }

    pressed(key) {
        return (this.status[key] && this.status[key].pressed);
    }

    up(key) {
        return (this.status[key] && this.status[key].up);
    }

    register() {
        document.addEventListener("keydown", (event) => this.onKeyDown(event), false);
        document.addEventListener("keyup", (event) => this.onKeyUp(event), false);
    }

    static keyName(keyCode) {
        return ( Keyboard.k[keyCode] != null ) ?
            Keyboard.k[keyCode] :
            String.fromCharCode(keyCode);
    }
}


class Morph extends Physijs.Mesh {
    faces:number;

    constructor(numFaces:number, material:THREE.Material, mass:number) {
        let geometry = Morph.generateGeometry(numFaces);
        super(geometry, material, mass);
    }

    static generateGeometry(numFaces:number):THREE.Geometry {
        if (numFaces == 4) {
            return new THREE.TetrahedronGeometry();
        } else if (numFaces == 6) {
            return new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
        } else if (numFaces == 12) {
            return new THREE.DodecahedronGeometry(1, 0);
        } else if (numFaces == 20) {
            return new THREE.IcosahedronGeometry(1, 0);
        }
        return null;
    }

    private updateGeometry(numFaces:number) {
        this.faces = numFaces;
        this.geometry = Morph.generateGeometry(this.faces);
    }

    shrink(numFaces:number):void {
        this.updateGeometry(this.faces - numFaces);
    }

    grow(numFaces:number):void {
        this.updateGeometry(this.faces + numFaces);
    }

    wobble():void {

    }

}

class Enemy extends Morph {

    constructor() {
        super(6, Enemy.getMaterial(), 2);
    }

    static getMaterial():Material {
        return new THREE.MeshBasicMaterial({
            color: 0xb02000
        });
        /*
         return new THREE.ShaderMaterial({
         uniforms:{},
         fragmentShader: document.getElementById(Enemy.shader).textContent,
         vertexShader: document.getElementById(World.vertex_shader).textContent,
         });*/

    }
}

class Player extends Morph {

    constructor() {
        super(4, Player.getMaterial(), 1);
    }

    static getMaterial():Material {
        return new THREE.MeshBasicMaterial({
            color: 0x00a0b0
        });
        /*
         return new THREE.ShaderMaterial({
         uniforms:{},
         fragmentShader: document.getElementById(Player.shader).textContent,
         vertexShader: document.getElementById(World.vertex_shader).textContent,
         });*/
    }
}

class World {

    constructor(player:Player, scene:THREE.Scene, camera:THREE.Camera) {
        player.position.set(0, 0, 0);
        scene.add(player);

        let enemy = new Enemy();
        enemy.position.set(0, 5, 0);
        scene.add(enemy);
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
    scene:THREE.Scene;
    camera:THREE.PerspectiveCamera;

    player:Player;
    world:World;
    state:GameState;

    keyboard:Keyboard;

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
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", () => this.onWindowResize(), false);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

        this.keyboard = new Keyboard();
        this.keyboard.register();
    }

    init():void {
        //init world
        this.player = new Player();
        this.world = new World(this.player, this.scene, this.camera);

        //init camera
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(this.player.position);

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
        this.run();
    }

    pause() {
        this.state = GameState.PAUSED;
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