/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>
/// <reference path="three_js/ts/detector.d.ts"/>
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Vector3 = THREE.Vector3;
var Material = THREE.Material;
var Geometry = THREE.Geometry;
//wtf fix..
Physijs.scripts.worker = "physi_js/physijs_worker.js";
Physijs.scripts.ammo = "ammo.js";
var PointerLock = (function () {
    function PointerLock(game, blocker, instructions) {
        var _this = this;
        this.game = game;
        this.blocker = blocker;
        this.instructions = instructions;
        this.hasLock = false;
        this.onChange = function (event) {
            var element = document.body;
            var doc = document;
            if (doc.pointerLockElement === element || doc.mozPointerLockElement === element || doc.webkitPointerLockElement === element) {
                //gained
                _this.hasLock = true;
                _this.blocker.style.display = "none";
                if (_this.game.state == GameState.INITIALIZED || _this.game.state == GameState.PAUSED) {
                    _this.game.start();
                }
                console.log("gained");
            }
            else {
                //lost
                _this.hasLock = false;
                _this.blocker.style.display = '-webkit-box';
                _this.blocker.style.display = '-moz-box';
                _this.blocker.style.display = 'box';
                _this.instructions.style.display = "";
                if (_this.game.state == GameState.STARTED) {
                    _this.game.pause();
                }
                console.log("lost");
            }
        };
        this.onError = function (event) {
            _this.instructions.style.display = "";
        };
        this.onClick = function (event) {
            var element = document.body;
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            _this.instructions.style.display = "none";
            element.requestPointerLock();
        };
    }
    PointerLock.prototype.gain = function () {
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        if (!havePointerLock) {
            return;
        }
        document.addEventListener('pointerlockchange', this.onChange, false);
        document.addEventListener('mozpointerlockchange', this.onChange, false);
        document.addEventListener('webkitpointerlockchange', this.onChange, false);
        document.addEventListener('pointerlockerror', this.onError, false);
        document.addEventListener('mozpointerlockerror', this.onError, false);
        document.addEventListener('webkitpointerlockerror', this.onError, false);
        this.blocker.addEventListener("click", this.onClick, false);
    };
    return PointerLock;
}());
var Keyboard = (function () {
    function Keyboard() {
        var _this = this;
        this.status = {};
        this.onKeyDown = function (event) {
            var key = Keyboard.keyName(event.keyCode);
            if (!_this.status[key])
                _this.status[key] = { down: false, pressed: false, up: false, updatedPreviously: false };
        };
        this.onKeyUp = function (event) {
            var key = Keyboard.keyName(event.keyCode);
            if (_this.status[key])
                _this.status[key].pressed = false;
        };
    }
    Keyboard.prototype.update = function () {
        for (var key in this.status) {
            // insure that every keypress has "down" status exactly once
            if (!this.status[key].updatedPreviously) {
                this.status[key].down = true;
                this.status[key].pressed = true;
                this.status[key].updatedPreviously = true;
            }
            else {
                this.status[key].down = false;
            }
            // key has been flagged as "up" since last update
            if (this.status[key].up) {
                delete this.status[key];
                continue; // move on to next key
            }
            if (!this.status[key].pressed)
                this.status[key].up = true;
        }
    };
    Keyboard.prototype.down = function (key) {
        return (this.status[key] && this.status[key].down);
    };
    Keyboard.prototype.pressed = function (key) {
        return (this.status[key] && this.status[key].pressed);
    };
    Keyboard.prototype.up = function (key) {
        return (this.status[key] && this.status[key].up);
    };
    Keyboard.prototype.register = function () {
        document.addEventListener("keydown", this.onKeyDown, false);
        document.addEventListener("keyup", this.onKeyUp, false);
    };
    Keyboard.prototype.unregister = function () {
        document.removeEventListener("keydown", this.onKeyDown, false);
        document.removeEventListener("keyup", this.onKeyUp, false);
    };
    Keyboard.keyName = function (keyCode) {
        return (Keyboard.k[keyCode] != null) ?
            Keyboard.k[keyCode] :
            String.fromCharCode(keyCode);
    };
    /*
     Credit to: https://github.com/stemkoski
     */
    Keyboard.k = {
        8: "backspace", 9: "tab", 13: "enter", 16: "shift",
        17: "ctrl", 18: "alt", 27: "esc", 32: "space",
        33: "pageup", 34: "pagedown", 35: "end", 36: "home",
        37: "left", 38: "up", 39: "right", 40: "down",
        45: "insert", 46: "delete", 186: ";", 187: "=",
        188: ",", 189: "-", 190: ".", 191: "/",
        219: "[", 220: "\\", 221: "]", 222: "'"
    };
    return Keyboard;
}());
/**
 *
 */
var Mouse = (function () {
    function Mouse(player) {
        var _this = this;
        this.player = player;
        this.xMovement = 0;
        this.yMovement = 0;
        this.buttons = {};
        this.onMouseMove = function (event) {
            _this.x = event.screenX;
            _this.xMovement = event.movementX;
            _this.y = event.screenY;
            _this.yMovement = event.movementY;
            _this.player.rotate(event.movementX);
            _this.player.look(event.movementY);
        };
        this.onMouseDown = function (event) {
            _this.buttons[event.button] = true;
            _this.player.click(event.button);
        };
        this.onMouseUp = function (event) {
            _this.buttons[event.button] = false;
        };
    }
    Mouse.prototype.pressed = function (button) {
        return this.buttons[button];
    };
    Mouse.prototype.register = function () {
        document.addEventListener("mousemove", this.onMouseMove, false);
        document.addEventListener("mousedown", this.onMouseDown, false);
        document.addEventListener("mouseup", this.onMouseUp, false);
    };
    Mouse.prototype.unregister = function () {
        document.removeEventListener("mousemove", this.onMouseMove, false);
        document.removeEventListener("mousedown", this.onMouseDown, false);
        document.removeEventListener("mouseup", this.onMouseUp, false);
    };
    return Mouse;
}());
/**
 *
 */
var Morph = (function (_super) {
    __extends(Morph, _super);
    function Morph(level, material, mass) {
        _super.call(this, Morph.generateGeometry(level), material, mass);
        this.level = level;
    }
    Morph.generateGeometry = function (level) {
        var numFaces = Morph.levels[level];
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
    };
    Morph.prototype.updateGeometry = function () {
        this.geometry = Morph.generateGeometry(this.level);
    };
    Morph.prototype.shrink = function () {
        if (this.level > 0) {
            this.level--;
            this.updateGeometry();
        }
    };
    Morph.prototype.grow = function () {
        if (this.level < 3) {
            this.level++;
            this.updateGeometry();
        }
    };
    Morph.levels = [4, 6, 12, 20];
    return Morph;
}(Physijs.SphereMesh));
/**
 *
 */
var Projectile = (function (_super) {
    __extends(Projectile, _super);
    function Projectile(pos, dir, level) {
        _super.call(this, level, Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0x303030
        }), 0.5, 0.3), 0.01);
        this.pos = pos;
        this.dir = dir;
        this.time = 0;
        this.position.copy(pos.clone().add(dir.clone().setLength(2)));
    }
    Projectile.prototype.shoot = function () {
        this.setLinearVelocity(this.dir);
    };
    Projectile.prototype.tick = function (delta) {
        this.time += delta;
    };
    return Projectile;
}(Morph));
/**
 *
 */
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy() {
        _super.call(this, 0, Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0xb02000
        }), .8, .6), 2);
        this.speed = 10;
    }
    Enemy.prototype.approach = function (player) {
        var toPlayer = player.position.clone().sub(this.position).normalize();
        this.setLinearVelocity(toPlayer.setLength(this.speed));
    };
    return Enemy;
}(Morph));
var Player = (function (_super) {
    __extends(Player, _super);
    function Player() {
        _super.call(this, 1, Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0x00a0b0
        }), 1, 0.1), 0.5);
        this.forward = new Vector3(0, 0, -1);
        this.upward = new Vector3(0, 1, 0);
        this.camera = new Vector3(0, 10, 10);
        this.heading = 0;
        this.pitch = 0;
        this.speed = 25;
        this.projectiles = [];
    }
    Player.prototype.jump = function () {
        this.applyCentralImpulse(new Vector3(0, 8, 0));
    };
    Player.prototype.rotate = function (xMovement) {
        this.heading -= xMovement * 0.002;
    };
    Player.prototype.look = function (yMovement) {
        this.pitch -= yMovement * 0.002;
    };
    Player.prototype.click = function (button) {
        if (button == THREE.MOUSE.LEFT) {
            this.projectiles.push(new Projectile(this.position, this.getDirection().multiplyScalar(35), this.level));
        }
    };
    Player.prototype.getRight = function () {
        return this.getDirection().cross(this.upward).normalize();
    };
    Player.prototype.getDirection = function () {
        return this.forward.clone().applyAxisAngle(this.upward, this.heading);
    };
    Player.prototype.getCamera = function () {
        return this.camera.clone().applyAxisAngle(this.upward, this.heading).applyAxisAngle(this.getRight(), this.pitch);
    };
    return Player;
}(Morph));
var World = (function (_super) {
    __extends(World, _super);
    function World(player) {
        _super.call(this);
        this.player = player;
        this.mobs = [];
        this.projectiles = [];
        this.setGravity(new THREE.Vector3(0, -40, 0));
        this.add(player);
        player.position.set(0, 2, 0);
        player.castShadow = true;
        player.setDamping(0.05, 0.05);
        for (var i = 0; i < 10; i++) {
            var enemy = new Enemy();
            var x = Math.floor(Math.random() * 20 + 3);
            var z = Math.floor(Math.random() * 20 + 3);
            enemy.position.set(x, 2, z);
            this.add(enemy);
            this.mobs.push(enemy);
        }
        var light = new THREE.DirectionalLight(0xFFFFFF);
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
        var groundGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        var groundMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0xdadada }), 1, 1);
        var ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
        ground.receiveShadow = true;
        this.add(ground);
    }
    World.prototype.tick = function (delta) {
        var _this = this;
        //push projectiles queued from player into the world.
        while (this.player.projectiles.length > 0) {
            var projectile = this.player.projectiles.pop();
            this.projectiles.push(projectile);
            this.add(projectile);
            projectile.shoot();
        }
        //enemy movement
        this.mobs.forEach(function (mob) {
            mob.approach(_this.player);
        });
        //tick projectiles and remove them if time out
        this.projectiles.filter(function (projectile) {
            projectile.tick(delta);
            var keep = projectile.time < 10 * 1000;
            if (!keep) {
                _this.remove(projectile);
            }
            return keep;
        });
        //physijs
        this.simulate(delta, 1);
    };
    return World;
}(Physijs.Scene));
var GameState;
(function (GameState) {
    GameState[GameState["INITIALIZED"] = 0] = "INITIALIZED";
    GameState[GameState["STARTED"] = 1] = "STARTED";
    GameState[GameState["PAUSED"] = 2] = "PAUSED";
    GameState[GameState["STOPPED"] = 3] = "STOPPED";
})(GameState || (GameState = {}));
var Game = (function () {
    function Game() {
        var _this = this;
        this.ticks = 0;
        this.delta = 0;
        this.lastFrame = 0;
        this.timestep = 1000 / 60;
        this.maxFPS = 60;
        this.onWindowResize = function () {
            _this.camera.aspect = window.innerWidth / window.innerHeight;
            _this.camera.updateProjectionMatrix();
            _this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
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
    Game.prototype.init = function () {
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
    };
    /**
     * Just render the scene.
     */
    Game.prototype.render = function () {
        this.renderer.render(this.world, this.camera);
    };
    /**
     * Update logic based on @param delta.
     * @param delta
     */
    Game.prototype.tick = function (delta) {
        this.ticks++;
        this.keyboard.update();
        //camera
        this.camera.position.addVectors(this.player.position, this.player.getCamera());
        this.camera.lookAt(this.player.position);
        //player movement
        var forward = this.player.getDirection();
        forward.setLength(this.player.speed);
        var right = forward.clone().cross(this.player.upward);
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
        var velocity = this.player.getLinearVelocity().clampLength(-20, 20);
        this.player.setLinearVelocity(velocity);
        //morph!
        if (this.keyboard.down("Q")) {
            this.player.shrink();
        }
        else if (this.keyboard.down("E")) {
            this.player.grow();
        }
        //jump!
        if (this.keyboard.down("space")) {
            console.log("jump");
            this.player.jump();
        }
        this.world.tick(delta);
    };
    Game.prototype.run = function (timestamp) {
        var _this = this;
        if (!timestamp) {
            timestamp = performance.now();
        }
        if (timestamp < this.lastFrame + (1000 / this.maxFPS)) {
            if (this.keepRunning) {
                requestAnimationFrame(function () { return _this.run(); });
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
            requestAnimationFrame(function (time) { return _this.run(time); });
        }
    };
    Game.prototype.start = function () {
        this.state = GameState.STARTED;
        this.keepRunning = true;
        this.lastFrame = performance.now();
        this.keyboard.register();
        this.mouse.register();
        this.run();
    };
    Game.prototype.pause = function () {
        this.state = GameState.PAUSED;
        this.keyboard.unregister();
        this.mouse.unregister();
        this.keepRunning = false;
    };
    Game.prototype.stop = function () {
        this.pause();
        this.state = GameState.STOPPED;
        this.mouse.unregister();
        this.keyboard.unregister();
        window.removeEventListener("resize", this.onWindowResize, false);
        //todo
    };
    return Game;
}());
if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}
window.onload = function () {
    var game = new Game();
    game.init();
    //make sure we have pointerlock here
    //from three.js example(PointerLock), thanks
    var block = document.getElementById("block");
    var instructions = document.getElementById("instructions");
    var plock = new PointerLock(game, block, instructions);
    plock.gain();
};
//# sourceMappingURL=game.js.map