/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>
/// <reference path="three_js/ts/detector.d.ts"/>

import Vector3 = THREE.Vector3;
class Morph extends Physijs.Mesh {
    faces:number;
    //TODO, probelm s tym ze ked extendujem Mesh, tak sa nedostanem k Geometry ale iba k BufferGeometry

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
        super(null, null, null);
        //todo
    }
}

class Player extends Morph {

    constructor() {
        let mat = new THREE.MeshBasicMaterial({
            color: 0x00b0a0,
        });
        super(4, mat, 1);
    }
}

class World {

    constructor(player: Player, scene:THREE.Scene, camera:THREE.Camera) {
        scene.add(player);
    }
}

class Game {
    renderer:THREE.WebGLRenderer;
    scene:THREE.Scene;
    camera:THREE.PerspectiveCamera;
    player:Player;
    world: World;
    private ticks:number;
    private running:boolean;

    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setClearColor(0xffffff);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    }

    init():void {
        //init world
        this.player = new Player();
        this.world = new World(this.player, this.scene, this.camera);
        this.player.position.set(0,0,0);
        this.camera.position.set(10,10,10);
        this.camera.lookAt(this.player.position);
        //init camera
    }

    render():void {
        this.renderer.render(this.scene, this.camera);
    }

    tick():void {
        this.ticks++;

    }

    run():void {
        this.running = true;
        while (this.running) {
            this.tick();
            let shouldRender = true;
            if (shouldRender) {
                this.render();
            }

        }
    }

}

if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

window.onload = () => {
    var game = new Game();
    game.init();

    //game.run();
};