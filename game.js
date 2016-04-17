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
        this.game = game;
        this.blocker = blocker;
        this.instructions = instructions;
        this.hasLock = false;
    }
    PointerLock.prototype.gain = function () {
        var _this = this;
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        if (!havePointerLock) {
            return;
        }
        document.addEventListener('pointerlockchange', function (event) { return _this.onChange(event); }, false);
        document.addEventListener('mozpointerlockchange', function (event) { return _this.onChange(event); }, false);
        document.addEventListener('webkitpointerlockchange', function (event) { return _this.onChange(event); }, false);
        document.addEventListener('pointerlockerror', function (event) { return _this.onError(event); }, false);
        document.addEventListener('mozpointerlockerror', function (event) { return _this.onError(event); }, false);
        document.addEventListener('webkitpointerlockerror', function (event) { return _this.onError(event); }, false);
        this.blocker.addEventListener("click", function (event) { return _this.onClick(event); }, false);
    };
    PointerLock.prototype.onChange = function (event) {
        var element = document.body;
        var doc = document;
        if (doc.pointerLockElement === element || doc.mozPointerLockElement === element || doc.webkitPointerLockElement === element) {
            //gained
            this.hasLock = true;
            this.blocker.style.display = "none";
            if (this.game.state == GameState.INITIALIZED || this.game.state == GameState.PAUSED) {
                this.game.start();
            }
            console.log("gained");
        }
        else {
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
    PointerLock.prototype.onError = function (event) {
        this.instructions.style.display = "";
    };
    PointerLock.prototype.onClick = function (event) {
        var element = document.body;
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        this.instructions.style.display = "none";
        element.requestPointerLock();
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
var MouseButton;
(function (MouseButton) {
    MouseButton[MouseButton["LEFT"] = 0] = "LEFT";
    MouseButton[MouseButton["RIGHT"] = 1] = "RIGHT";
    MouseButton[MouseButton["MIDDLE"] = 2] = "MIDDLE";
})(MouseButton || (MouseButton = {}));
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
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy() {
        _super.call(this, 0, Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0xb02000
        }), .8, .6), 2);
    }
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
        this.speed = 25;
    }
    Player.prototype.jump = function () {
        this.applyCentralImpulse(new Vector3(0, 8, 0));
    };
    Player.prototype.rotate = function (xMovement) {
        this.heading -= xMovement * 0.002;
    };
    Player.prototype.click = function (button) {
    };
    Player.prototype.getDirection = function () {
        return this.forward.clone().applyAxisAngle(this.upward, this.heading);
    };
    Player.prototype.getCamera = function () {
        return this.camera.clone().applyAxisAngle(this.upward, this.heading);
    };
    return Player;
}(Morph));
var World = (function () {
    function World(player, scene, camera) {
        player.position.set(0, 2, 0);
        player.castShadow = true;
        scene.add(player);
        //scene.add(camera);
        var enemy = new Enemy();
        enemy.position.set(0, 5, 0);
        enemy.castShadow = true;
        scene.add(enemy);
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
        scene.add(light);
        var groundGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        var groundMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0xdadada }), 1, 1);
        var ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
        scene.add(ground);
        ground.receiveShadow = true;
    }
    return World;
}());
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
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setClearColor(0xffffff);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", function () { return _this.onWindowResize(); }, false);
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);
    }
    Game.prototype.init = function () {
        //init scene
        this.scene = new Physijs.Scene;
        this.scene.setGravity(new THREE.Vector3(0, -40, 0));
        //init player and world
        this.player = new Player();
        this.world = new World(this.player, this.scene, this.camera);
        this.player.setDamping(0.05, 0.05);
        //init camera
        this.camera.position.addVectors(this.player.position, this.player.camera);
        this.camera.lookAt(this.player.position);
        //init keyboard and mouse
        this.keyboard = new Keyboard();
        this.mouse = new Mouse(this.player);
        this.state = GameState.INITIALIZED;
    };
    Game.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    /**
     * Just render the scene.
     */
    Game.prototype.render = function () {
        //console.log("render");
        this.renderer.render(this.scene, this.camera);
    };
    /**
     * Update logic based on @param delta.
     * @param delta
     */
    Game.prototype.tick = function (delta) {
        this.ticks++;
        this.keyboard.update();
        this.camera.position.addVectors(this.player.position, this.player.getCamera());
        this.camera.lookAt(this.player.position);
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
        if (this.keyboard.down("Q")) {
            this.player.shrink();
        }
        else if (this.keyboard.down("E")) {
            this.player.grow();
        }
        //console.log(this.player.getLinearVelocity().length());
        var velocity = this.player.getLinearVelocity().clampLength(-20, 20);
        this.player.setLinearVelocity(velocity);
        if (this.keyboard.down("space")) {
            console.log("jump");
            this.player.jump();
        }
        this.scene.simulate(delta, 1);
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
            requestAnimationFrame(function () { return _this.run(); });
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
    var block = document.getElementById("block");
    var instructions = document.getElementById("instructions");
    var plock = new PointerLock(game, block, instructions);
    plock.gain();
};
//# sourceMappingURL=game.js.map