// Matter.js module aliases
const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Composite } = Matter;

// Create engine and world
const engine = Engine.create();
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
const rows = 5, cols = 6;
const startX = window.innerWidth / 2 - 100;
const startY = window.innerHeight / 2 - 100;
const radius = 20;

// Create particles for the slime
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const circle = Bodies.circle(startX + j * (radius * 1.5), startY + i * (radius * 1.5), radius, {
            restitution: 0.8,
            friction: 0.1,
            render: { fillStyle: "#66bb6a" }
        });
        slime.push(circle);
    }
}

// Create soft body constraints (joints)
for (let i = 0; i < slime.length; i++) {
    for (let j = i + 1; j < slime.length; j++) {
        if (Matter.Vector.magnitude(Matter.Vector.sub(slime[i].position, slime[j].position)) < radius * 2) {
            const constraint = Matter.Constraint.create({
                bodyA: slime[i],
                bodyB: slime[j],
                stiffness: 0.5,
                damping: 0.1
            });
            World.add(world, constraint);
        }
    }
}

// Add ground
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 20, {
    isStatic: true,
    render: { fillStyle: "#388e3c" }
});
World.add(world, ground);

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

// Add all bodies to world
World.add(world, slime);

// Run the engine and renderer
Engine.run(engine);
Render.run(render);

// Adjust canvas on resize
window.addEventListener("resize", () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
});
