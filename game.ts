/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>
/// <reference path="three_js/ts/detector.d.ts"/>
/// <reference path="three_js/ts/three-canvasrenderer.d.ts"/>
'use strict';

import Vector3 = THREE.Vector3;
import Face3 = THREE.Face3;
import Material = THREE.Material;
import Geometry = THREE.Geometry;
import CanvasRenderer = THREE.CanvasRenderer;
import WebGLRenderer = THREE.WebGLRenderer;

//wtf fix..
Physijs.scripts.worker = "physi_js/physijs_worker.js";
Physijs.scripts.ammo = "ammo.js";


class PointerLock {
    hasLock:boolean = false;

    constructor(private game:Game, private blocker:HTMLElement, private instructions:HTMLElement, private overlay:HTMLElement) {
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

class Poly extends Physijs.PlaneMesh {

    static red:Physijs.Material = Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0xa01000
        }),
        1,
        1
    );
    static blue:Physijs.Material = Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0x0010a0
        }),
        1,
        1
    );

    constructor(pos:Vector3, public polarity:number) {
        super(Poly.generateGeometry(), polarity > 0 ? Poly.blue : Poly.red, 0.3);
        this.addEventListener("ready", () => this.init());
        this.position.copy(pos);
    }

    init():void {
        //launch the poly into space
        this.setLinearVelocity(Poly.generateDirection().normalize());
    }

    static generateDirection():Vector3 {
        let verts = [];
        for (let i = 0; i < 3; i++) {
            verts.push(Math.random() * (Math.random() > 0.5 ? 1 : -1));
        }
        verts[1] = Math.abs(verts[1]);
        return new Vector3().fromArray(verts);
    }

    static generateGeometry():THREE.Geometry {
        //generate two random verts, construct a triangle
        let geom = new THREE.Geometry();
        geom.vertices.push(new Vector3());
        geom.vertices.push(Poly.generateDirection());
        geom.vertices.push(Poly.generateDirection());
        geom.faces.push(new THREE.Face3(0, 1, 2));
        return geom;
    }

    collides(other:Morph):boolean {
        return this.position.clone().sub(other.position).lengthSq() <= ((other.radius) ^ 2);
    }

    dispose() {
        this.geometry.dispose()
    }
}


class Morph extends Physijs.SphereMesh {
    radius:number;
    static levels:number[] = [4, 6, 12, 20];

    constructor(pos:Vector3, public level:number, material?:THREE.Material, mass?:number) {
        super(Morph.generateGeometry(level), material, mass);
        this.radius = this.geometry.boundingSphere.radius;
        this.position.copy(pos);
        this.addEventListener("ready", () => this.init());
    }

    init():void {
        this.castShadow = true;
    }

    static generateGeometry(level:number):THREE.Geometry {
        let numFaces = Morph.levels[level];

        switch (numFaces) {
            case 4:
                return new THREE.TetrahedronGeometry();
            case 6:
                return new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
            case 12:
                return new THREE.IcosahedronGeometry(1, 0);
            case 20:
                return new THREE.DodecahedronGeometry(1, 0);
            default:
                return new THREE.TetrahedronGeometry();
        }
    }

    private updateGeometry():void {
        this.geometry.dispose();
        this.geometry = Morph.generateGeometry(this.level);
        this.geometry.computeBoundingSphere();
        this.radius = this.geometry.boundingSphere.radius;
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

    collides(other:Morph):boolean {
        return this.position.clone().sub(other.position).length() <= (this.radius + other.radius);
    }

    dispose():void {
        this.geometry.dispose();
    }
}


class Projectile extends Morph {
    time:number = 0;

    static mat:Physijs.Material = Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0x303030
        }),
        0.5,
        0.3
    );

    constructor(private pos:Vector3, private dir:Vector3, level:number) {
        super(pos.clone().add(dir.clone().setLength(2)), level, Projectile.mat, 0.05);
    }

    init():void {
        this.launch();
    };

    launch():void {
        this.setLinearVelocity(this.dir);
    }

    tick(delta):void {
        this.time += delta;
    }
}


class LiveMorph extends Morph {
    life:number = 100;

    speeds:number[];

    damage(by:number):void {
        if (this.isAlive())
            this.life -= by;
    }

    isAlive():boolean {
        return this.life > 0;
    }

    getSpeed():number {
        return this.speeds[this.level];
    }
}


class Mob extends LiveMorph {

    speeds:number[] = [25.1, 20, 19, 17];

    static mat:Physijs.Material = Physijs.createMaterial(
        new THREE.MeshBasicMaterial({
            color: 0xa01b00
        }),
        .8,
        .6);

    constructor(pos:Vector3, level:number) {
        super(pos, level, Mob.mat, 2);
    }

    approach(player:Player) {
        let toPlayer = player.position.clone().sub(this.position).normalize();
        this.setLinearVelocity(toPlayer.setLength(this.getSpeed()));
    }

    die():Poly[] {
        let polys = [];
        let amount = Math.floor(Math.random() * 10) + 3;
        for (let i = 0; i < amount; i++) {
            let poly = new Poly(this.position, Math.random() > 0.5 ? 1 : -1);
            polys.push(poly);
        }

        return polys;
    }

}

class Player extends LiveMorph {
    minus:number = 5;
    plus:number = 5;

    forward:Vector3 = new Vector3(0, 0, -1);
    upward:Vector3 = new Vector3(0, 1, 0);
    camera:Vector3 = new Vector3(0, 7, 10);
    heading:number = 0;
    pitch:number = 0;

    score:number = 0;

    projectiles:Projectile[] = [];
    listener:THREE.AudioListener;

    speeds:number[] = [25, 24, 22, 20];

    constructor(pos:Vector3) {
        super(pos, 0, Physijs.createMaterial(
            new THREE.MeshBasicMaterial({
                color: 0x00a0b0
            }),
            1,
            0.1
            ),
            0.5);
        this.listener = new THREE.AudioListener();
        this.add(this.listener);
    }

    init():void {
        this.castShadow = true;
        this.setDamping(0.05, 0.05);
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
        return this.getForward().cross(this.upward).normalize();
    }

    getDirection():Vector3 {
        return this.getForward().applyAxisAngle(this.getRight(), this.pitch);
    }

    getForward():Vector3 {
        return this.forward.clone().applyAxisAngle(this.upward, this.heading);
    }

    getCamera():Vector3 {
        return this.camera.clone().applyAxisAngle(this.upward, this.heading).applyAxisAngle(this.getRight(), this.pitch);
    }

}

class Level extends Physijs.Scene {
    private mobs:Mob[] = [];
    private projectiles:Projectile[] = [];
    private polygons:Poly[] = [];
    private ground:Physijs.BoxMesh;
    private time:number = 0;

    static durations:number[] = [20, 30, 45, 60, -1];
    static numLevels:number = Level.durations.length;

    static mat:Physijs.Material = Physijs.createMaterial(
        new THREE.MeshBasicMaterial({color: 0xcacaca}),
        1,
        1
    );

    constructor(private player:Player, public level:number) {
        super();
        this.setGravity(new THREE.Vector3(0, -40, 0));

        this.add(player);

        for (let i = 0; i < 10; i++) {
            this.spawn(20, 20);
        }

        let groundGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        this.ground = new Physijs.BoxMesh(groundGeometry, Level.mat, 0);
        this.add(this.ground);
    }

    spawn(start:number, range:number) {
        let a = Math.random() > 0.5 ? -1 : 1;
        let b = Math.random() > 0.5 ? -1 : 1;
        let x = Math.floor(Math.random() * range + start);
        let z = Math.floor(Math.random() * range + start);
        let size = Math.floor(Math.random() * 4);

        this.spawnMob(this.player.position.clone().add(new Vector3(a * x, 0, b * z)), size);
    }

    spawnMob(where:Vector3, size:number):void {
        let mob = new Mob(where, size);
        this.add(mob);
        this.mobs.push(mob);
    }

    tick(delta:number):void {
        this.time += delta;

        //push projectiles queued from player into the world.
        while (this.player.projectiles.length > 0) {
            let projectile = this.player.projectiles.pop();
            this.projectiles.push(projectile);
            this.add(projectile);
        }

        //enemy movement
        this.mobs.forEach((mob) => {
            mob.approach(this.player);
            if (mob.collides(this.player)) {
                //collide?
                this.player.damage((mob.level + 1));
            }
        });

        //tick projectiles and remove them if time out/on hit
        this.projectiles = this.projectiles.filter((projectile) => {
            projectile.tick(delta);
            let keep = projectile.time < 10 * 1000;
            let collided:boolean = false;
            if (!keep) {
                this.remove(projectile);
            } else {
                for (let mob of this.mobs) {
                    if (mob.collides(projectile)) {
                        if (mob.level == projectile.level) {
                            collided = true;
                            mob.damage(34);
                            break;
                        }
                    }
                }
            }
            if (collided) {
                this.remove(projectile);
            }
            return keep && !collided;
        });

        this.mobs = this.mobs.filter((mob) => {
            let alive = mob.isAlive();
            if (!alive) {
                this.player.score+=mob.level+1;
                let polys = mob.die();
                polys.forEach((poly) => {
                    this.add(poly);
                    poly.init();
                    this.polygons.push(poly);
                });
                this.remove(mob);
            }
            return alive;
        });

        this.polygons = this.polygons.filter((poly) => {
            if (poly.collides(this.player)) {
                if (poly.polarity > 0) {
                    this.player.plus += 1;
                } else {
                    this.player.minus += 1;
                }
                this.remove(poly);
                return false;
            }
            return true;
        });

        //spawn new mob?
        if (Math.random() < 0.035) {
            this.spawn(20, 10);
        }

        //physijs
        this.simulate(delta, 1);
    }

    timeLeft():number {
        return Level.durations[this.level] - (this.time / 1000);
    }

    dispose():void {
        this.remove(this.ground);
        this.ground.geometry.dispose();

        this.mobs.forEach((obj) => {
            this.remove(obj);
            obj.dispose();
        });
        this.projectiles.forEach((obj) => {
            this.remove(obj);
            obj.dispose();
        });
        this.polygons.forEach((obj) => {
            this.remove(obj);
            obj.dispose();
        });

    }

    //unused
    static generateGeometry(level:number):THREE.Geometry[] {
        switch (level) {
            default:
            case 0:
                let vertices = [
                    1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1
                ];
                let verts = [];
                for (let i = 0; i < 4; i++) {
                    verts.push(new Vector3().fromArray(vertices, i * 3));
                }
                let indices = [
                    0, 1, 2, 2, 3, 0, 0, 3, 1, 1, 3, 2
                ];
                let faces = [];
                for (let i = 0; i < 4; i++) {
                    faces.push(new Face3(indices[i * 3], indices[i * 3 + 1], indices[i * 3 + 2]));
                }
                return [new THREE.PolyhedronGeometry(verts, faces, 200)];
        }
    }

}

enum GameState {
    INITIALIZED,
    STARTED,
    PAUSED,
    STOPPED
}

class Game {
    private renderer:THREE.Renderer;
    private camera:THREE.PerspectiveCamera;
    private overlay:HTMLDivElement;

    private player:Player;
    private level:Level;

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
        if (Detector.webgl) {
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            let rendr = <THREE.WebGLRenderer>this.renderer;
            rendr.setClearColor(0xffffff);
            rendr.setPixelRatio(window.devicePixelRatio);
            rendr.setSize(window.innerWidth, window.innerHeight);
        } else {
            this.renderer = new THREE.CanvasRenderer();
            let rendr = <THREE.CanvasRenderer>this.renderer;
            rendr.setClearColor(0xffffff);
            rendr.setPixelRatio(window.devicePixelRatio);
            rendr.setSize(window.innerWidth, window.innerHeight);
        }
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", this.onWindowResize, false);

        this.overlay = <HTMLDivElement>document.getElementById("overlay");

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);
    }

    init():void {
        //init player
        this.player = new Player(new Vector3(0, 2, 0));

        //init keyboard and mouse
        this.keyboard = new Keyboard();
        this.mouse = new Mouse(this.player);

        this.state = GameState.INITIALIZED;
        this.newLevel(0);
    }

    newLevel(num:number):void {
        //init level
        this.level = new Level(this.player, num);

        //init camera
        this.camera.position.addVectors(this.player.position, this.player.camera);
        this.camera.lookAt(this.player.position);

        this.updateOverlay();
    }

    updateOverlay():void {
        this.overlay.querySelector("#score").innerHTML = "Score: " + this.player.score;
        this.overlay.querySelector("#time").innerHTML = "Time left: " + this.level.timeLeft().toFixed(0);
        this.overlay.querySelector("#life").innerHTML = "Life: " + this.player.life + "%";
        this.overlay.querySelector("#positive").innerHTML = "Pos polygons: " + this.player.plus;
        this.overlay.querySelector("#negative").innerHTML = "Neg polygons: " + this.player.minus;
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
        this.renderer.render(this.level, this.camera);
    }

    /**
     * Update logic based on @param delta.
     * @param delta
     */
    tick(delta:number):void {
        this.ticks++;
        if(this.ticks % 60 == 0){
            this.updateOverlay();
        }

        this.keyboard.update();

        //camera
        this.camera.position.addVectors(this.player.position, this.player.getCamera());
        this.camera.lookAt(this.player.position);

        //player movement
        let playerSpeed = this.player.getSpeed();
        let forward = this.player.getForward();
        forward.setLength(playerSpeed);
        let right = forward.clone().cross(this.player.upward);
        right.setLength(playerSpeed);

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
        //clamp speed, TODO into a method
        let velocity = this.player.getLinearVelocity().clampLength(-playerSpeed, playerSpeed);
        this.player.setLinearVelocity(velocity);

        //morph!
        if (this.keyboard.down("Q")) {
            if (this.player.minus > 0 && this.player.level > 0) {
                this.player.shrink();
                this.player.minus--;
            }
        } else if (this.keyboard.down("E")) {
            if (this.player.plus > 0 && this.player.level < 3) {
                this.player.grow();
                this.player.plus--;
            }
        }

        //jump!
        if (this.keyboard.down("space")) {
            this.player.jump();
        }

        //debug shoot
        if (this.keyboard.down("C")) {
            this.player.click(THREE.MOUSE.LEFT);
        }

        this.level.tick(delta);

        //die!
        if (!this.player.isAlive()) {
            this.stop(false);
        }

        //next level
        if (this.level.timeLeft() < 0) {
            this.stop(true);
        }
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
        this.updateOverlay();
        this.state = GameState.PAUSED;
        this.keyboard.unregister();
        this.mouse.unregister();

        this.keepRunning = false;
    }

    stop(result:boolean = false) {
        this.pause();
        this.state = GameState.STOPPED;

        if (this.level.level != Level.numLevels - 1) {
            if (result) {
                //next level, shit!
                this.level.dispose();
                this.newLevel(this.level.level + 1);
                this.start();
                return;
            }
        }
        this.level.dispose();

        window.removeEventListener("resize", this.onWindowResize, false);

        let blocker = document.getElementById("block");
        blocker.style.display = '-webkit-box';
        blocker.style.display = '-moz-box';
        blocker.style.display = 'box';
        let instructions = document.getElementById("instructions");
        instructions.style.fontSize = "40px";
        instructions.innerHTML = result ? "You won!" : "You lost!";
        instructions.style.display = "";

        if (Detector.webgl) {
            (<WebGLRenderer>this.renderer).dispose();
        }
    }
}

window.onload = () => {
    let game = new Game();
    game.init();

    //make sure we have pointerlock here
    //from three.js example(PointerLock), thanks
    let block = document.getElementById("block");
    let instructions = document.getElementById("instructions");
    let overlay = document.getElementById("overlay");

    let plock = new PointerLock(game, block, instructions, overlay);
    plock.gain();
};