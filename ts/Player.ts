/// <reference path="../three_js/ts/three.d.ts"/>
/// <reference path="../physi_js/physijs.d.ts"/>

import {Morph} from "./Morph";

export class Player extends Morph {

    constructor() {
        let mat = new THREE.MeshBasicMaterial({
            color: 0x00b0a0,
            shading: THREE.SmoothShading
        });
        super(4, mat, 1);
    }
}