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
const slimeRadius = 2;
const slimeBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(slimeRadius),
    position: new CANNON.Vec3(0, 5, 0),
    material: new CANNON.Material({ restitution: 0.5 }),
});
world.addBody(slimeBody);

// Create deformable slime mesh
const geometry = new THREE.SphereGeometry(slimeRadius, 32, 32);
const originalVertices = geometry.attributes.position.array.slice(); // Store original vertex positions
const slimeMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x66bb6a, transparent: true, opacity: 0.85, flatShading: true })
);
scene.add(slimeMesh);

// Static Floor (pastel-colored)
const groundBody = new CANNON.Body({ 
    mass: 0, 
    shape: new CANNON.Plane(),
    position: new CANNON.Vec3(0, 0, 0)
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0xffcdd2, side: THREE.DoubleSide }) // Light pastel pink
);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffe0b2, 0.8));

// Camera setup
camera.position.set(0, 5, 10);
camera.lookAt(0, 5, 0);

// Raycaster for touch interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(slimeMesh);
    if (intersects.length > 0) {
        deformSlime(intersects[0].point);
    }
}

// Function to stretch the slime at the touched point
function deformSlime(point) {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        let x = positions[i], y = positions[i + 1], z = positions[i + 2];
        let distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2 + (z - point.z) ** 2);
        if (distance < 1) { // Only affect nearby vertices
            let factor = 1 - distance; // Closer points stretch more
            positions[i] += (x - point.x) * factor * 0.5;
            positions[i + 1] += (y - point.y) * factor * 0.5;
            positions[i + 2] += (z - point.z) * factor * 0.5;
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

// Function to reset slime shape
function resetSlimeShape() {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i++) {
        positions[i] += (originalVertices[i] - positions[i]) * 0.05; // Slowly restore shape
    }
    geometry.attributes.position.needsUpdate = true;
}

// Event listeners
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("touchmove", (event) => onPointerMove(event.touches[0]));

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);
    slimeMesh.position.copy(slimeBody.position);
    resetSlimeShape(); // Continuously restore slime shape
    renderer.render(scene, camera);
}

animate();