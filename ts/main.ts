/// <reference path="../three_js/ts/three.d.ts"/>
/// <reference path="../three_js/ts/detector.d.ts"/>

import {Player} from "./Player";
import {World} from "./World";

export class Game {
    renderer:THREE.WebGLRenderer;
    scene:THREE.Scene;
    camera:THREE.PerspectiveCamera;
    player:Player;
    world:World;
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
    game.run();
};