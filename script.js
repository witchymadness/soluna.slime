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
const slimeRadius = 3;
const slimeBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(slimeRadius),
    position: new CANNON.Vec3(0, 5, 0),
    material: new CANNON.Material({ restitution: 0.8 }),
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

// Additional shadow for dips
const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ opacity: 0.5 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0.1;
scene.add(shadowPlane);

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
        deformSlime(startPoint, intersects[0].point);
    }
}

function onPointerUp() {
    isDragging = false;
}

function deformSlime(start, end) {
    const positions = geometry.attributes.position.array;
    let stretchFactor = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
    let isStretching = stretchFactor > 0.1;
    
    for (let i = 0; i < positions.length; i += 3) {
        let distance = Math.sqrt((positions[i] - start.x) ** 2 + (positions[i + 1] - start.y) ** 2 + (positions[i + 2] - start.z) ** 2);
        if (distance < 1.5) {
            let factor = Math.exp(-distance * 2); // Smooth exponential decrease
            positions[i + 1] += isStretching ? factor * 0.5 : -factor * 0.5; // Subtle pull/stretch
            shadowPlane.material.opacity = Math.min(0.8, shadowPlane.material.opacity + 0.05);
        }
    }
    geometry.attributes.position.needsUpdate = true;
}

function resetSlimeShape() {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i++) {
        positions[i] += (originalVertices[i] - positions[i]) * 0.05; // Smoother return
    }
    shadowPlane.material.opacity = Math.max(0.5, shadowPlane.material.opacity - 0.02);
    geometry.attributes.position.needsUpdate = true;
}

// Fix touch responsiveness
window.addEventListener("touchstart", (event) => {
    event.preventDefault(); // Prevent scrolling
    onPointerDown(event.touches[0]);
}, { passive: false });

window.addEventListener("touchmove", (event) => {
    event.preventDefault(); // Prevent scrolling
    onPointerMove(event.touches[0]);
}, { passive: false });

window.addEventListener("touchend", onPointerUp);
window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);
    slimeMesh.position.copy(slimeBody.position);
    resetSlimeShape();
    renderer.render(scene, camera);
}

animate();