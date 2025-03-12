// Matter.js module aliases
const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Composite, Constraint } = Matter;

// Create engine and world
const engine = Engine.create();
engine.world.gravity.y = 0.1; // Adjusted gravity for a floating effect
const world = engine.world;

// Create renderer
const canvas = document.getElementById("slimeCanvas");
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "#e3f2fd"
    }
});

// Create soft body (slime)
const slime = [];
const rows = 30, cols = 50; // Reduced number of particles for performance
const startX = window.innerWidth / 2 - 100;
const startY = window.innerHeight / 2 - 100;
const radius = 5; // Slightly larger radius to compensate for fewer particles

// Create particles for the slime
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const circle = Bodies.circle(startX + j * (radius * 1.2), startY + i * (radius * 1.2), radius, {
            restitution: 0.6,
            friction: 0.1,
            render: { fillStyle: "#66bb6a" },
            isSleeping: false // Helps with optimization
        });
        slime.push(circle);
    }
}

// Create soft body constraints (only to adjacent particles for efficiency)
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const index = i * cols + j;
        if (j < cols - 1) { // Horizontal connections
            World.add(world, Constraint.create({
                bodyA: slime[index],
                bodyB: slime[index + 1],
                stiffness: 0.3,
                damping: 0.3,
                render: { visible: false }
            }));
        }
        if (i < rows - 1) { // Vertical connections
            World.add(world, Constraint.create({
                bodyA: slime[index],
                bodyB: slime[index + cols],
                stiffness: 0.3,
                damping: 0.3,
                render: { visible: false }
            }));
        }
    }
}

// Function to create walls
let walls = [];
const createWalls = () => {
    // Remove existing walls
    World.remove(world, walls);
    walls = [];

    const wallThickness = 20;
    walls.push(Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, wallThickness, { isStatic: true, render: { fillStyle: "#388e3c" } })); // Ground
    walls.push(Bodies.rectangle(window.innerWidth / 2, 0, window.innerWidth, wallThickness, { isStatic: true, render: { fillStyle: "#388e3c" } })); // Ceiling
    walls.push(Bodies.rectangle(0, window.innerHeight / 2, wallThickness, window.innerHeight, { isStatic: true, render: { fillStyle: "#388e3c" } })); // Left Wall
    walls.push(Bodies.rectangle(window.innerWidth, window.innerHeight / 2, wallThickness, window.innerHeight, { isStatic: true, render: { fillStyle: "#388e3c" } })); // Right Wall

    World.add(world, walls);
};

createWalls();

// Add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: { visible: false }
    }
});
World.add(world, mouseConstraint);

World.add(world, slime);

// Run the engine and renderer
Engine.run(engine);
Render.run(render);

// Adjust canvas and walls on resize
window.addEventListener("resize", () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    createWalls();
});
