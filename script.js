// Matter.js module aliases
const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Composite, Constraint } = Matter;
// Enable multi-touch interactions
let touches = {};

// Function to find the closest slime particle to a touch point
function getClosestParticle(x, y) {
    let closest = null;
    let minDist = Infinity;

    slime.forEach(particle => {
        let dx = particle.position.x - x;
        let dy = particle.position.y - y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            closest = particle;
        }
    });

    return closest;
}

// Handle touch start
window.addEventListener("touchstart", (event) => {
    for (let touch of event.touches) {
        const closest = getClosestParticle(touch.clientX, touch.clientY);
        if (closest) {
            touches[touch.identifier] = { body: closest, x: touch.clientX, y: touch.clientY };
        }
    }
});

// Handle touch move (apply forces)
window.addEventListener("touchmove", (event) => {
    for (let touch of event.touches) {
        const touchData = touches[touch.identifier];
        if (touchData) {
            let dx = touch.clientX - touchData.x;
            let dy = touch.clientY - touchData.y;

            Matter.Body.applyForce(touchData.body, touchData.body.position, {
                x: dx * 0.001,  // Scale force for realistic effect
                y: dy * 0.001
            });

            // Update stored touch position
            touches[touch.identifier].x = touch.clientX;
            touches[touch.identifier].y = touch.clientY;
        }
    }
});

// Handle touch end (remove tracking)
window.addEventListener("touchend", (event) => {
    for (let touch of event.changedTouches) {
        delete touches[touch.identifier];
    }
});

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
const rows = 30, cols = 50;
const startX = window.innerWidth / 2 - 100;
const startY = window.innerHeight / 2 - 100;
const radius = 7;
let slimeColor = "#66bb6a"; // Default slime color

// Create particles for the slime
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const circle = Bodies.circle(startX + j * (radius * 1.2), startY + i * (radius * 1.2), radius, {
            restitution: 0.7,
            friction: 0.1,
            render: { fillStyle: slimeColor },
            isSleeping: false
        });
        slime.push(circle);
    }
}

// Create constraints for soft body effect
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const index = i * cols + j;
        if (j < cols - 1) {
            World.add(world, Constraint.create({
                bodyA: slime[index],
                bodyB: slime[index + 1],
                stiffness: 0.3,
                damping: 0.3,
                render: { visible: false }
            }));
        }
        if (i < rows - 1) {
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

// Add walls, ceiling, and ground with invisible borders
const wallThickness = 20;
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, wallThickness, {
    isStatic: true,
    render: { visible: false }
});
const ceiling = Bodies.rectangle(window.innerWidth / 2, 0, window.innerWidth, wallThickness, {
    isStatic: true,
    render: { visible: false }
});
const leftWall = Bodies.rectangle(0, window.innerHeight / 2, wallThickness, window.innerHeight, {
    isStatic: true,
    render: { visible: false }
});
const rightWall = Bodies.rectangle(window.innerWidth, window.innerHeight / 2, wallThickness, window.innerHeight, {
    isStatic: true,
    render: { visible: false }
});

World.add(world, [ground, ceiling, leftWall, rightWall]);

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

// Add slime to the world
World.add(world, slime);

// Run the engine and renderer
Engine.run(engine);
Render.run(render);

// Adjust canvas on resize
window.addEventListener("resize", () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
});

// Color Picker Functionality
document.getElementById("colorPicker").addEventListener("input", (event) => {
    slimeColor = event.target.value;
    slime.forEach(particle => {
        particle.render.fillStyle = slimeColor;
    });
});
