canvas = document.getElementById('sandbox');
ctx = canvas.getContext('2d');
cw = canvas.width;
ch = canvas.height;
borderSide = 5;
borderTop = 20;

balls = [];
blocks = [];
particles = [];

colors = [
    '#c53538', '#ba7a60', '#c5a583', '#49a8b6', '#0a7dc1'
];

player = {};

/* Background pattern from subtlepatterns.com */
bgImage = new Image();
bgImage.src = 'dark-triangles.png';
bgImage.onload = function() {
    bgPattern = ctx.createPattern(bgImage, 'repeat');
};

bgGrad = ctx.createLinearGradient(0,0,0,ch);
bgGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
bgGrad.addColorStop(1, 'rgba(255,255,255,0)');

window.onload = function() {
    resetGame();
    document.addEventListener('mousemove', playerMove);
    document.addEventListener('mousedown', mouseDown);
    setInterval(game, 1000/60);
};

KEY_SPACE = 32;
KEY_LEFT  = 37;
KEY_UP    = 38;
KEY_RIGHT = 39;
KEY_DOWN  = 40;

function game() {

    if ( document.hasFocus() ) {
        paused = false;
        updateLoop();
    } else {
        paused = true;
    }

    drawLoop();

    if (paused) {
        ctx.font = '20px Consolas';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText( 'Paused', cw/2, ch/2);
    }

}

function updateLoop() {
    if ( blocks.length === 0 ) {
        level++;
        if (level >= levels.length) {
            console.log(level, blocks);
            window.alert('A winner is you!');
            level = 1;
            resetGame();
        }
        initLevel();
    }

    for (i = balls.length - 1; i >= 0; i--) {
        updateBall(balls[i]);
    }

    for (i = particles.length - 1; i >= 0; i--) {
        p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0 || 
            p.x < borderSide ||
            p.x > cw - borderSide ||
            p.y < borderTop ||
            p.y > ch 
            ) {
            particles.splice(i, 1);
        }
    }
}

function drawLoop() {
    // Clear screen
    ctx.fillStyle = bgPattern;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    // Draw borders
    ctx.fillStyle = '#aaa';
    ctx.fillRect(0, 0, borderSide, ch);
    ctx.fillRect(cw - borderSide, 0, borderSide, ch);

    lingrad = ctx.createLinearGradient(0, 0, 0, borderTop);
    lingrad.addColorStop(0, '#fff');
    lingrad.addColorStop(1, '#aaa');
    ctx.fillStyle = lingrad;
    ctx.fillRect(0, 0, cw, borderTop);
    


    // Text
    ctx.font = '16px Consolas';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText( 'Score: ' + score, borderSide, 4 );
    ctx.textAlign = 'center';
    ctx.fillText( 'Lives: ' + lives, cw/2, 4 );
    ctx.textAlign = 'right';
    ctx.fillText( 'Level: ' + level, cw - borderSide, 4 );

    // Draw particles
    for (i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        ctx.fillStyle = p.clr;
        if ( p.life < 60 ) {
            ctx.globalAlpha = p.life/60;
        } else {
            ctx.globalAlpha = 1;
        }
        ctx.fillRect( p.x-1, p.y-1, 3, 3);
    }
    ctx.globalAlpha = 1;

    for (i = balls.length - 1; i >= 0; i--) {
        drawBall(balls[i]);
    }

    for (i = blocks.length - 1; i >= 0; i--) {
        drawBlock(blocks[i]);
    }

    // Draw player
    lingrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.height);
    lingrad.addColorStop(0, '#666');
    lingrad.addColorStop(0.2, '#fff');
    lingrad.addColorStop(1, '#666');
    ctx.fillStyle = lingrad;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}


function resetGame() {
    score = 0;
    lives = 5;
    level = 1;
    initLevel();
}


function updateBall(ball) {
    if ( ball.stuck ) {
        ball.x = player.x + player.width/2;
        ball.y = player.y - ball.rad;
        ball.vx = 0;
        ball.vy = 0;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce off walls
    if (ball.x - ball.rad <= borderSide) {
        ball.x = borderSide + ball.rad;
        ball.vx = -ball.vx;
    }
    if (ball.x + ball.rad >= cw - borderSide) {
        ball.x = cw - borderSide - ball.rad;
        ball.vx = -ball.vx;
    }
    if (ball.y - ball.rad <= borderTop) {
        ball.y = borderTop + ball.rad;
        ball.vy = -ball.vy;
    }

    // Bounce off paddle
    if (ball.y + ball.rad >= player.y) {
        if (ball.x > player.x && ball.x < player.x + player.width) {
            ball.y = player.y - ball.rad;
            ball.vy = -ball.vy;
            dx = ball.x - (player.x + player.width/2);
            ball.vx = dx * 0.15;
        }
    }

    // Lost ball
    if (ball.y + ball.rad >= ch) {
        var i = balls.indexOf(ball);
        balls.splice(i, 1);

        if ( balls.length === 0 ) {
            lives--;
            if (lives === 0) {
                window.alert('Game Over');
                resetGame();
            }
            resetBalls();
        }
    }

    // Crazy ball trail
    if (!ball.stuck) {
        particles.push({ 
            x: ball.x, y: ball.y,
            vx: ball.vx * Math.random() * 0.5, 
            vy: ball.vy * Math.random() * 0.5,
            clr: colors[1], 
            life: 60
        });
    }

    // Collision with blocks
    // TODO: fix this for corner cases
    for (var i = blocks.length - 1; i >= 0; i--) {
        var block = blocks[i];
        if (ball.x + ball.rad >= block.x && 
            ball.x - ball.rad <= block.x + block.width &&
            ball.y + ball.rad >= block.y &&
            ball.y - ball.rad <= block.y + block.height) {
            
            if (ball.x >= block.x && ball.x <= block.x + block.width) {
                // Top or bottom hit
                ball.vy = -ball.vy;
            }
            if (ball.y >= block.y && ball.y <= block.y + block.height) {
                // Side hit
                ball.vx = -ball.vx;
            }

            asplode(block.x + block.width/2, block.y + block.height/2, block.clr);
            
            blocks.splice(i, 1);
            score += 10;
        }
    }
}

function asplode(x, y, clr) {
    for (var i = 0; i < 10; i++) {
        var p = {};
        p.x = x;
        p.y = y;
        p.vx = Math.random()*2 - 1;
        p.vy = Math.random()*2 - 1;
        p.clr = clr;
        p.life = 60;
        particles.push(p);
    }
}

function initLevel() {
    resetBlocks();
    resetBalls();
    particles = [];
    player.width = 80;
    player.height = 15;
    player.x = cw/2 - player.width/2;
    player.y = ch - 10 - player.height;
    playerSpeed = 4;
}

function resetBalls() {
    balls = [
        { rad: 8, clr: '#666', stuck: true }
    ];
}

function resetBlocks() {
    blocks = [];
    for (var i = levels[level].length - 1; i >= 0; i--) {
        blocks.push( levels[level][i] );
    }
}

function drawBlock(block) {
    var lingrad = ctx.createLinearGradient( 
        block.x, 
        block.y, 
        block.x, 
        block.y + 20
    );
    lingrad.addColorStop(0, block.clr);
    lingrad.addColorStop(0.2, '#fff');
    lingrad.addColorStop(1, block.clr);
    ctx.fillStyle = lingrad;
    ctx.fillRect(block.x, block.y, block.width, block.height);

    ctx.strokeStyle = '#000';
    ctx.strokeRect(block.x, block.y, block.width, block.height);
}

function drawBall(ball) {
    var radgrad = ctx.createRadialGradient(
        ball.x - ball.rad/2, ball.y - ball.rad/2, 0,
        ball.x, ball.y, ball.rad
    );
    radgrad.addColorStop(0, '#fff');
    radgrad.addColorStop(1, ball.clr);

    ctx.fillStyle = radgrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.rad, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
}

function mouseDown(e) {
    for (var i = balls.length - 1; i >= 0; i--) {
        if ( balls[i].stuck ) {
            balls[i].stuck = false;
            balls[i].vx = Math.random()*4 - 2;
            balls[i].vy = -5;
        }
    }
}

function playerMove(e) {
    var x = getMousePos(canvas, e).x;
    if (x <= borderSide) {
        player.x = borderSide;
    } else if (x + player.width >= cw - borderSide) {
        player.x = cw - borderSide - player.width;
    } else {
        player.x = x;
    }
}

function getMousePos(canvas, e) {
    /* Correct for canvas position/size */
    var rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

levels = [];
levels[1] = [
    { x: 140, y: 100, width: 40, height: 20, clr: colors[0] },
    { x: 180, y: 100, width: 40, height: 20, clr: colors[1] },
    { x: 220, y: 100, width: 40, height: 20, clr: colors[2] },
    { x: 260, y: 100, width: 40, height: 20, clr: colors[3] },
    { x: 300, y: 100, width: 40, height: 20, clr: colors[4] }
];
levels[2] = [
    { x:  80, y: 160, width: 40, height: 20, clr: colors[1] },
    { x: 120, y: 160, width: 40, height: 20, clr: colors[4] },
    { x: 160, y: 160, width: 40, height: 20, clr: colors[1] },
    { x: 200, y: 160, width: 40, height: 20, clr: colors[4] },
    { x: 240, y: 160, width: 40, height: 20, clr: colors[1] },
    { x: 280, y: 160, width: 40, height: 20, clr: colors[4] },
    { x: 320, y: 160, width: 40, height: 20, clr: colors[1] },
    { x: 360, y: 160, width: 40, height: 20, clr: colors[4] },

    { x: 120, y: 140, width: 40, height: 20, clr: colors[1] },
    { x: 160, y: 140, width: 40, height: 20, clr: colors[4] },
    { x: 200, y: 140, width: 40, height: 20, clr: colors[1] },
    { x: 240, y: 140, width: 40, height: 20, clr: colors[4] },
    { x: 280, y: 140, width: 40, height: 20, clr: colors[1] },
    { x: 320, y: 140, width: 40, height: 20, clr: colors[4] },

    { x: 160, y: 120, width: 40, height: 20, clr: colors[1] },
    { x: 200, y: 120, width: 40, height: 20, clr: colors[4] },
    { x: 240, y: 120, width: 40, height: 20, clr: colors[1] },
    { x: 280, y: 120, width: 40, height: 20, clr: colors[4] },

    { x: 200, y: 100, width: 40, height: 20, clr: colors[1] },
    { x: 240, y: 100, width: 40, height: 20, clr: colors[4] },
];
