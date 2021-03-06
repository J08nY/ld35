/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>
/// <reference path="three_js/ts/detector.d.ts"/>
/// <reference path="three_js/ts/three-canvasrenderer.d.ts"/>
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Vector3 = THREE.Vector3;
var Face3 = THREE.Face3;
var Material = THREE.Material;
var Geometry = THREE.Geometry;
var CanvasRenderer = THREE.CanvasRenderer;
var WebGLRenderer = THREE.WebGLRenderer;
//wtf fix..
Physijs.scripts.worker = "physi_js/physijs_worker.js";
Physijs.scripts.ammo = "ammo.js";
var PointerLock = (function () {
    function PointerLock(game, blocker, instructions, overlay) {
        var _this = this;
        this.game = game;
        this.blocker = blocker;
        this.instructions = instructions;
        this.overlay = overlay;
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
var Poly = (function (_super) {
    __extends(Poly, _super);
    function Poly(pos, polarity) {
        var _this = this;
        _super.call(this, Poly.generateGeometry(), polarity > 0 ? Poly.blue : Poly.red, 0.3);
        this.polarity = polarity;
        this.addEventListener("ready", function () { return _this.init(); });
        this.position.copy(pos);
    }
    Poly.prototype.init = function () {
        //launch the poly into space
        this.setLinearVelocity(Poly.generateDirection().normalize());
    };
    Poly.generateDirection = function () {
        var verts = [];
        for (var i = 0; i < 3; i++) {
            verts.push(Math.random() * (Math.random() > 0.5 ? 1 : -1));
        }
        verts[1] = Math.abs(verts[1]);
        return new Vector3().fromArray(verts);
    };
    Poly.generateGeometry = function () {
        //generate two random verts, construct a triangle
        var geom = new THREE.Geometry();
        geom.vertices.push(new Vector3());
        geom.vertices.push(Poly.generateDirection());
        geom.vertices.push(Poly.generateDirection());
        geom.faces.push(new THREE.Face3(0, 1, 2));
        return geom;
    };
    Poly.prototype.collides = function (other) {
        return this.position.clone().sub(other.position).lengthSq() <= ((other.radius) ^ 2);
    };
    Poly.prototype.dispose = function () {
        this.geometry.dispose();
    };
    Poly.red = Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0xa01000
    }), 1, 1);
    Poly.blue = Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0x00a0b0
    }), 1, 1);
    return Poly;
}(Physijs.PlaneMesh));
var Morph = (function (_super) {
    __extends(Morph, _super);
    function Morph(pos, level, material, mass) {
        var _this = this;
        _super.call(this, Morph.generateGeometry(level), material, mass);
        this.level = level;
        this.radius = this.geometry.boundingSphere.radius;
        this.position.copy(pos);
        this.addEventListener("ready", function () { return _this.init(); });
    }
    Morph.prototype.init = function () {
        this.castShadow = true;
    };
    Morph.generateGeometry = function (level) {
        var numFaces = Morph.levels[level];
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
    };
    Morph.prototype.updateGeometry = function () {
        this.geometry.dispose();
        this.geometry = Morph.generateGeometry(this.level);
        this.geometry.computeBoundingSphere();
        this.radius = this.geometry.boundingSphere.radius;
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
    Morph.prototype.collides = function (other) {
        return this.position.clone().sub(other.position).length() <= (this.radius + other.radius);
    };
    Morph.prototype.dispose = function () {
        this.geometry.dispose();
    };
    Morph.levels = [4, 6, 12, 20];
    return Morph;
}(Physijs.SphereMesh));
var Projectile = (function (_super) {
    __extends(Projectile, _super);
    function Projectile(pos, dir, level) {
        _super.call(this, pos.clone().add(dir.clone().setLength(2)), level, Projectile.mat, 0.05);
        this.pos = pos;
        this.dir = dir;
        this.time = 0;
    }
    Projectile.prototype.init = function () {
        this.launch();
    };
    ;
    Projectile.prototype.launch = function () {
        this.setLinearVelocity(this.dir);
    };
    Projectile.prototype.tick = function (delta) {
        this.time += delta;
    };
    Projectile.mat = Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0x303030
    }), 0.5, 0.3);
    return Projectile;
}(Morph));
var LiveMorph = (function (_super) {
    __extends(LiveMorph, _super);
    function LiveMorph() {
        _super.apply(this, arguments);
        this.life = 100;
    }
    LiveMorph.prototype.damage = function (by) {
        if (this.isAlive())
            this.life -= by;
    };
    LiveMorph.prototype.isAlive = function () {
        return this.life > 0;
    };
    LiveMorph.prototype.getSpeed = function () {
        return this.speeds[this.level];
    };
    return LiveMorph;
}(Morph));
var Mob = (function (_super) {
    __extends(Mob, _super);
    function Mob(pos, level) {
        _super.call(this, pos, level, Mob.mat, 2);
        this.speeds = [25.1, 23, 21, 19];
    }
    Mob.prototype.approach = function (player) {
        var toPlayer = player.position.clone().sub(this.position).normalize();
        this.setLinearVelocity(toPlayer.setLength(this.getSpeed()));
    };
    Mob.prototype.die = function () {
        var polys = [];
        var amount = Math.floor(Math.random() * 10) + 3;
        for (var i = 0; i < amount; i++) {
            var poly = new Poly(this.position, Math.random() > 0.5 ? 1 : -1);
            polys.push(poly);
        }
        return polys;
    };
    Mob.mat = Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0xa01000
    }), .8, .6);
    return Mob;
}(LiveMorph));
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(pos) {
        _super.call(this, pos, 0, Physijs.createMaterial(new THREE.MeshBasicMaterial({
            color: 0x00a0b0
        }), 1, 0.1), 0.5);
        this.minus = 5;
        this.plus = 5;
        this.forward = new Vector3(0, 0, -1);
        this.upward = new Vector3(0, 1, 0);
        this.camera = new Vector3(0, 6, 10);
        this.heading = 0;
        this.pitch = 0;
        this.score = 0;
        this.projectiles = [];
        this.speeds = [25, 24, 22, 20];
        this.listener = new THREE.AudioListener();
        this.add(this.listener);
    }
    Player.prototype.init = function () {
        this.castShadow = true;
        this.setDamping(0.05, 0.05);
    };
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
        return this.getForward().cross(this.upward).normalize();
    };
    Player.prototype.getDirection = function () {
        return this.getForward().applyAxisAngle(this.getRight(), this.pitch);
    };
    Player.prototype.getForward = function () {
        return this.forward.clone().applyAxisAngle(this.upward, this.heading);
    };
    Player.prototype.getCamera = function () {
        return this.camera.clone().applyAxisAngle(this.upward, this.heading).applyAxisAngle(this.getRight(), this.pitch);
    };
    return Player;
}(LiveMorph));
var Level = (function (_super) {
    __extends(Level, _super);
    function Level(player, level) {
        _super.call(this);
        this.player = player;
        this.level = level;
        this.mobs = [];
        this.projectiles = [];
        this.polygons = [];
        this.time = 0;
        this.setGravity(new THREE.Vector3(0, -40, 0));
        this.add(player);
        for (var i = 0; i < 3; i++) {
            this.spawn(20, 20);
        }
        var groundGeometry = new THREE.BoxGeometry(1200, 1, 1200);
        this.ground = new Physijs.BoxMesh(groundGeometry, Level.mat, 0);
        this.add(this.ground);
    }
    Level.prototype.random = function (start, range) {
        var a = Math.random() > 0.5 ? -1 : 1;
        var b = Math.random() > 0.5 ? -1 : 1;
        var x = Math.floor(Math.random() * range + start);
        var z = Math.floor(Math.random() * range + start);
        return new Vector3(a * x, 2, b * z);
    };
    Level.prototype.spawnMob = function (where, size) {
        var mob = new Mob(where, size);
        this.add(mob);
        this.mobs.push(mob);
    };
    Level.prototype.spawnGroup = function (where, amount, size) {
        for (var i = 0; i < amount; i++) {
            this.spawnMob(where, size);
        }
    };
    Level.prototype.spawn = function (start, range, size) {
        if (!size) {
            size = Math.floor(Math.random() * 4);
        }
        this.spawnMob(this.player.position.clone().add(this.random(start, range)), size);
    };
    Level.prototype.tick = function (delta) {
        var _this = this;
        this.time += delta;
        //push projectiles queued from player into the world.
        while (this.player.projectiles.length > 0) {
            var projectile = this.player.projectiles.pop();
            this.projectiles.push(projectile);
            this.add(projectile);
        }
        //enemy movement
        this.mobs.forEach(function (mob) {
            mob.approach(_this.player);
            if (mob.collides(_this.player)) {
                //collide?
                _this.player.damage((mob.level + 1));
            }
        });
        //tick projectiles and remove them if time out/on hit
        this.projectiles = this.projectiles.filter(function (projectile) {
            projectile.tick(delta);
            var keep = projectile.time < 10 * 1000;
            var collided = false;
            if (!keep) {
                _this.remove(projectile);
            }
            else {
                for (var _i = 0, _a = _this.mobs; _i < _a.length; _i++) {
                    var mob = _a[_i];
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
                _this.remove(projectile);
            }
            return keep && !collided;
        });
        this.mobs = this.mobs.filter(function (mob) {
            var alive = mob.isAlive();
            if (!alive) {
                _this.player.score += mob.level + 1;
                var polys = mob.die();
                polys.forEach(function (poly) {
                    _this.add(poly);
                    poly.init();
                    _this.polygons.push(poly);
                });
                _this.remove(mob);
            }
            return alive;
        });
        this.polygons = this.polygons.filter(function (poly) {
            if (poly.collides(_this.player)) {
                if (poly.polarity > 0) {
                    _this.player.plus += 1;
                }
                else {
                    _this.player.minus += 1;
                }
                _this.remove(poly);
                return false;
            }
            return true;
        });
        //spawn new mob?
        var amount = 0.004 * ((this.level + 1) / 2 + 0.8);
        if (this.level == Level.numLevels - 1) {
            amount += (this.time / 1000) / 2000;
        }
        if (Math.random() < amount) {
            var size = Math.floor(Math.random() * 4);
            var pos = this.random(20, 10);
            this.spawnGroup(pos, 3, size);
        }
        //physijs
        this.simulate(delta, 1);
    };
    Level.prototype.timeLeft = function () {
        return Level.durations[this.level] - (this.time / 1000);
    };
    Level.prototype.dispose = function () {
        var _this = this;
        this.remove(this.ground);
        this.ground.geometry.dispose();
        this.mobs.forEach(function (obj) {
            _this.remove(obj);
            obj.dispose();
        });
        this.projectiles.forEach(function (obj) {
            _this.remove(obj);
            obj.dispose();
        });
        this.polygons.forEach(function (obj) {
            _this.remove(obj);
            obj.dispose();
        });
    };
    //unused
    Level.generateGeometry = function (level) {
        switch (level) {
            default:
            case 0:
                var vertices = [
                    1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1
                ];
                var verts = [];
                for (var i = 0; i < 4; i++) {
                    verts.push(new Vector3().fromArray(vertices, i * 3));
                }
                var indices = [
                    0, 1, 2, 2, 3, 0, 0, 3, 1, 1, 3, 2
                ];
                var faces = [];
                for (var i = 0; i < 4; i++) {
                    faces.push(new Face3(indices[i * 3], indices[i * 3 + 1], indices[i * 3 + 2]));
                }
                return [new THREE.PolyhedronGeometry(verts, faces, 200)];
        }
    };
    Level.durations = [25, 30, 45, Infinity];
    Level.numLevels = Level.durations.length;
    Level.mat = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0xcacaca }), 1, 1);
    return Level;
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
        if (Detector.webgl) {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            var rendr = this.renderer;
            rendr.setClearColor(0xcacaca);
            rendr.setPixelRatio(window.devicePixelRatio);
            rendr.setSize(window.innerWidth, window.innerHeight);
        }
        else {
            this.renderer = new THREE.CanvasRenderer();
            var rendr = this.renderer;
            rendr.setClearColor(0xcacaca);
            rendr.setPixelRatio(window.devicePixelRatio);
            rendr.setSize(window.innerWidth, window.innerHeight);
        }
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", this.onWindowResize, false);
        this.overlay = document.getElementById("overlay");
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);
    }
    Game.prototype.init = function () {
        //init player
        this.player = new Player(new Vector3(0, 2, 0));
        //init audio
        this.audio = new THREE.Audio(this.player.listener);
        this.audio.load("background.ogg");
        this.audio.autoplay = true;
        this.audio.setLoop(true);
        this.audio.setVolume(0.5);
        //init keyboard and mouse
        this.keyboard = new Keyboard();
        this.mouse = new Mouse(this.player);
        this.state = GameState.INITIALIZED;
        this.newLevel(0);
    };
    Game.prototype.newLevel = function (num) {
        //init level
        this.level = new Level(this.player, num);
        //init camera
        this.camera.position.addVectors(this.player.position, this.player.camera);
        this.camera.lookAt(this.player.position);
        this.updateOverlay();
    };
    Game.prototype.updateOverlay = function () {
        this.overlay.querySelector("#score").innerHTML = "Score: " + this.player.score;
        this.overlay.querySelector("#time").innerHTML = "Time left: " + this.level.timeLeft().toFixed(0) + "s";
        this.overlay.querySelector("#level").innerHTML = "Level: " + (this.level.level + 1) + "/" + Level.numLevels;
        this.overlay.querySelector("#life").innerHTML = "Life: " + this.player.life + "%";
        this.overlay.querySelector("#positive").innerHTML = "Pos polygons(E): " + this.player.plus;
        this.overlay.querySelector("#negative").innerHTML = "Neg polygons(Q): " + this.player.minus;
    };
    /**
     * Just render the scene.
     */
    Game.prototype.render = function () {
        this.renderer.render(this.level, this.camera);
    };
    /**
     * Update logic based on @param delta.
     * @param delta
     */
    Game.prototype.tick = function (delta) {
        this.ticks++;
        if (this.ticks % 60 == 0) {
            this.updateOverlay();
        }
        this.keyboard.update();
        //camera
        this.camera.position.addVectors(this.player.position, this.player.getCamera());
        this.camera.lookAt(this.player.position);
        //player movement
        var playerSpeed = this.player.getSpeed();
        var forward = this.player.getForward();
        forward.setLength(playerSpeed);
        var right = forward.clone().cross(this.player.upward);
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
        var velocity = this.player.getLinearVelocity().clampLength(-playerSpeed, playerSpeed);
        this.player.setLinearVelocity(velocity);
        //morph!
        if (this.keyboard.down("Q")) {
            if (this.player.minus > 0 && this.player.level > 0) {
                this.player.shrink();
                this.player.minus--;
            }
        }
        else if (this.keyboard.down("E")) {
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
        this.updateOverlay();
        this.state = GameState.PAUSED;
        this.keyboard.unregister();
        this.mouse.unregister();
        this.keepRunning = false;
    };
    Game.prototype.stop = function (result) {
        if (result === void 0) { result = false; }
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
        else {
            result = true; //fix last level not winning
        }
        this.level.dispose();
        window.removeEventListener("resize", this.onWindowResize, false);
        var blocker = document.getElementById("block");
        blocker.style.display = '-webkit-box';
        blocker.style.display = '-moz-box';
        blocker.style.display = 'box';
        var instructions = document.getElementById("instructions");
        instructions.style.fontSize = "40px";
        instructions.innerHTML = result ? "You won!" : "You lost!";
        instructions.style.display = "";
        if (Detector.webgl) {
            this.renderer.dispose();
        }
    };
    return Game;
}());
window.onload = function () {
    var game = new Game();
    game.init();
    //make sure we have pointerlock here
    //from three.js example(PointerLock), thanks
    var block = document.getElementById("block");
    var instructions = document.getElementById("instructions");
    var overlay = document.getElementById("overlay");
    var plock = new PointerLock(game, block, instructions, overlay);
    plock.gain();
};
//# sourceMappingURL=game.js.map