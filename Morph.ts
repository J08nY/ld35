/// <reference path="three_js/ts/three.d.ts"/>
/// <reference path="physi_js/physijs.d.ts"/>

export class Morph extends Physijs.Mesh {
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