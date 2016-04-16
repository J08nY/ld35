///<reference path="three_js/ts/three.d.ts"/>
///<reference path="physi_js/physijs.d.ts"/>

Physijs.scripts.ammo = "../ammo_js/ammo.js";
Physijs.scripts.worker = "physi_js/physijs_worker.js";

let renderer, camera, scene, box, plane;

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xffffff);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new Physijs.Scene;
    scene.setGravity(10);


    scene.addEventListener("update", function () {
        scene.simulate(undefined, 1);
    });

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    scene.add(camera);

    let boxMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({
        color: 0xaf0000
    }));

    box = new Physijs.BoxMesh(
        new THREE.BoxGeometry(4, 4, 4),
        boxMaterial,
        1
    );
    box.position.set(0,5,0);
    scene.add(box);

    let groundMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({
        color: 0xfafafa
    }));

    plane = new Physijs.BoxMesh(
        new THREE.BoxGeometry(100, 1, 100),
        groundMaterial,
        0
    );
    scene.add(plane);

    requestAnimationFrame(render);
    scene.simulate();
}

function render() {
    requestAnimationFrame(render);
    box.applyCentralForce(new THREE.Vector3(1, 0, 0));
    renderer.render(scene, camera);
}

window.onload = init;

