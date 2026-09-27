const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let stars = [];
let running = true;

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const count = Math.round((canvas.width * canvas.height) / 7000);
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() < 0.88 ? 1 : 2,
            a: 0.35 + Math.random() * 0.65
        });
    }
}

function draw() {
    if (running) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            ctx.fillStyle = 'rgba(255, 255, 255, ' + star.a + ')';
            ctx.fillRect(star.x, star.y, star.r, star.r);
        }
    }
    requestAnimationFrame(draw);
}

document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
});

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
draw();
