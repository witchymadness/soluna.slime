import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.18.0/dist/cannon-es.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("slimeCanvas"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Background color
scene.background = new THREE.Color(0xfff8e1);

// Cannon.js physics world
const world = new CANNON.World();
world.gravity.set(0, -9.81, 0);

// Slime properties
const slimeRadius = 5;
const slimeBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(slimeRadius),
    position: new CANNON.Vec3(0, 5, 0),
    material: new CANNON.Material({ restitution: 0.7 }),
});
world.addBody(slimeBody);

// Create deformable slime mesh
const geometry = new THREE.SphereGeometry(slimeRadius, 64, 64);
const originalVertices = geometry.attributes.position.array.slice();
const material = new THREE.MeshStandardMaterial({ color: 0x66bb6a, transparent: true, opacity: 0.85, flatShading: false, roughness: 0.3 });
const slimeMesh = new THREE.Mesh(geometry, material);
scene.add(slimeMesh);

// Color Picker functionality
document.getElementById("colorPicker").addEventListener("input", (event) => {
    material.color.set(event.target.value);
});

// Static Floor
const groundBody = new CANNON.Body({ 
    mass: 0, 
    shape: new CANNON.Plane(),
    position: new CANNON.Vec3(0, 0, 0)
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0xffcdd2, side: THREE.DoubleSide })
);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffe0b2, 0.8));

// Add shadow effect
renderer.shadowMap.enabled = true;
light.castShadow = true;
slimeMesh.castShadow = true;
slimeMesh.receiveShadow = true;
groundMesh.receiveShadow = true;

// Camera setup
camera.position.set(0, 5, 10);
camera.lookAt(0, 5, 0);

// Raycaster for touch interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let startPoint = null;

function onPointerDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(slimeMesh);
    if (intersects.length > 0) {
        startPoint = intersects[0].point;
        isDragging = true;
    }
}

function onPointerMove(event) {
    if (!isDragging) return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(slimeMesh);
    
    if (intersects.length > 0) {
        stretchSlime(startPoint, intersects[0].point);
        startPoint = intersects[0].point;  // Update start point for continuous interaction
    }
}

function onPointerUp() {
    isDragging = false;
}

function stretchSlime(start, end) {
    const positions = geometry.attributes.position.array;
    const strength = 0.8;  // Increased strength for more stretching
    const maxEffectDistance = 5.0; // Increased effect range

    for (let i = 0; i < positions.length; i += 3) {
        let dx = positions[i] - end.x;
        let dy = positions[i + 1] - end.y;
        let dz = positions[i + 2] - end.z;
        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < maxEffectDistance) {
            let stretchFactor = Math.sin(distance * Math.PI / maxEffectDistance) * strength;
            positions[i] += (dx / distance) * stretchFactor;
            positions[i + 1] += (dy / distance) * stretchFactor;
            positions[i + 2] += (dz / distance) * stretchFactor;
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

function resetSlimeShape() {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i++) {
        positions[i] += (originalVertices[i] - positions[i]) * 0.02;
    }
    geometry.attributes.position.needsUpdate = true;
}

window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);
window.addEventListener("touchstart", (event) => onPointerDown(event.touches[0]));
window.addEventListener("touchmove", (event) => onPointerMove(event.touches[0]));
window.addEventListener("touchend", onPointerUp);

function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);
    slimeMesh.position.copy(slimeBody.position);
    resetSlimeShape();
    renderer.render(scene, camera);
}

animate();
