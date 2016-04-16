/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>
/// <reference path="three_js/ts/detector.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Vector3 = THREE.Vector3;
var ShaderMaterial = THREE.ShaderMaterial;
var Material = THREE.Material;
var Geometry = THREE.Geometry;
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
        this.status = {};
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
    Keyboard.prototype.onKeyDown = function (event) {
        var key = Keyboard.keyName(event.keyCode);
        if (!this.status[key])
            this.status[key] = { down: false, pressed: false, up: false, updatedPreviously: false };
    };
    Keyboard.prototype.onKeyUp = function (event) {
        var key = Keyboard.keyName(event.keyCode);
        if (this.status[key])
            this.status[key].pressed = false;
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
        var _this = this;
        document.addEventListener("keydown", function (event) { return _this.onKeyDown(event); }, false);
        document.addEventListener("keyup", function (event) { return _this.onKeyUp(event); }, false);
    };
    Keyboard.keyName = function (keyCode) {
        return (Keyboard.k[keyCode] != null) ?
            Keyboard.k[keyCode] :
            String.fromCharCode(keyCode);
    };
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
var Morph = (function (_super) {
    __extends(Morph, _super);
    function Morph(numFaces, material, mass) {
        var geometry = Morph.generateGeometry(numFaces);
        _super.call(this, geometry, material, mass);
    }
    Morph.generateGeometry = function (numFaces) {
        if (numFaces == 4) {
            return new THREE.TetrahedronGeometry();
        }
        else if (numFaces == 6) {
            return new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
        }
        else if (numFaces == 12) {
            return new THREE.DodecahedronGeometry(1, 0);
        }
        else if (numFaces == 20) {
            return new THREE.IcosahedronGeometry(1, 0);
        }
        return null;
    };
    Morph.prototype.updateGeometry = function (numFaces) {
        this.faces = numFaces;
        this.geometry = Morph.generateGeometry(this.faces);
    };
    Morph.prototype.shrink = function (numFaces) {
        this.updateGeometry(this.faces - numFaces);
    };
    Morph.prototype.grow = function (numFaces) {
        this.updateGeometry(this.faces + numFaces);
    };
    Morph.prototype.wobble = function () {
    };
    return Morph;
}(Physijs.Mesh));
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy() {
        _super.call(this, 6, Enemy.getMaterial(), 2);
    }
    Enemy.getMaterial = function () {
        return new THREE.MeshBasicMaterial({
            color: 0xb02000
        });
        /*
         return new THREE.ShaderMaterial({
         uniforms:{},
         fragmentShader: document.getElementById(Enemy.shader).textContent,
         vertexShader: document.getElementById(World.vertex_shader).textContent,
         });*/
    };
    return Enemy;
}(Morph));
var Player = (function (_super) {
    __extends(Player, _super);
    function Player() {
        _super.call(this, 4, Player.getMaterial(), 1);
    }
    Player.getMaterial = function () {
        return new THREE.MeshBasicMaterial({
            color: 0x00a0b0
        });
        /*
         return new THREE.ShaderMaterial({
         uniforms:{},
         fragmentShader: document.getElementById(Player.shader).textContent,
         vertexShader: document.getElementById(World.vertex_shader).textContent,
         });*/
    };
    return Player;
}(Morph));
var World = (function () {
    function World(player, scene, camera) {
        player.position.set(0, 0, 0);
        scene.add(player);
        var enemy = new Enemy();
        enemy.position.set(0, 5, 0);
        scene.add(enemy);
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
        this.timestep = 1000 / 30;
        this.maxFPS = 30;
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setClearColor(0xffffff);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", function () { return _this.onWindowResize(); }, false);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.keyboard = new Keyboard();
        this.keyboard.register();
    }
    Game.prototype.init = function () {
        //init world
        this.player = new Player();
        this.world = new World(this.player, this.scene, this.camera);
        //init camera
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(this.player.position);
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
        //console.log("tick " + delta);
        this.ticks++;
        this.keyboard.update();
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
        this.run();
    };
    Game.prototype.pause = function () {
        this.state = GameState.PAUSED;
        this.keepRunning = false;
    };
    Game.prototype.stop = function () {
        this.pause();
        this.state = GameState.STOPPED;
        //end here!!
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