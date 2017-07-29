canvas = document.getElementById('sandbox');
ctx = canvas.getContext('2d');
cw = canvas.width;
ch = canvas.height;
borderSide = 19;
borderTop = 19;
paused = false;

balls = [];
blocks = [];
particles = [];

colors = [
    '#c53538', '#ba7a60', '#c5a583', '#49a8b6', '#0a7dc1',
    '#3a3795', '#8e3399'
];

player = {};

/* Background pattern from subtlepatterns.com */
bgImage = new Image();
bgImage.src = 'dark-triangles.png';
bgImage.onload = function() {
    bgPattern = ctx.createPattern(bgImage, 'repeat');
};

// Pre-prepare some unchanging gradients
gradients = {};

gradients.background = ctx.createLinearGradient(0,0,0,ch);
gradients.background.addColorStop(0, 'rgba(255,255,255,0.2)');
gradients.background.addColorStop(1, 'rgba(255,255,255,0)');

gradients.borderTop = ctx.createLinearGradient(0, 0, 0, borderTop);
gradients.borderTop.addColorStop(0, '#fff');
gradients.borderTop.addColorStop(1, '#aaa');

gradients.borderLeft = ctx.createLinearGradient(0, 0, borderSide, 0);
gradients.borderLeft.addColorStop(0, '#fff');
gradients.borderLeft.addColorStop(1, '#aaa');

gradients.borderRight = ctx.createLinearGradient(cw, 0, cw - borderSide, 0);
gradients.borderRight.addColorStop(0, '#fff');
gradients.borderRight.addColorStop(1, '#aaa');

window.onload = function() {
    resetGame();
    document.addEventListener('mousemove', playerMove);
    document.addEventListener('touchmove', playerMove);

    document.addEventListener('mousedown', mouseDown);
    document.addEventListener('keydown', keyDown);
    initLevel();
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
        balls[i].update();
    }

    for (i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
    }
}

function drawLoop() {
    // Clear screen
    ctx.fillStyle = bgPattern;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = gradients.background;
    ctx.fillRect(0, 0, cw, ch);

    // Draw particles
    for (i = particles.length - 1; i >= 0; i--) {
        particles[i].draw();
    }

    for (i = balls.length - 1; i >= 0; i--) {
        balls[i].draw();
    }

    for (i = blocks.length - 1; i >= 0; i--) {
        blocks[i].draw();
    }

    // Draw player
    lingrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.height);
    lingrad.addColorStop(0, '#666');
    lingrad.addColorStop(0.2, '#fff');
    lingrad.addColorStop(1, '#666');
    ctx.fillStyle = lingrad;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw borders
    ctx.fillStyle = gradients.borderLeft;
    ctx.fillRect(0, 0, borderSide, ch);

    ctx.fillStyle = gradients.borderRight;
    ctx.fillRect(cw - borderSide, 0, borderSide, ch);

    ctx.fillStyle = gradients.borderTop;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cw, 0);
    ctx.lineTo(cw-borderSide, borderTop);
    ctx.lineTo(borderSide, borderTop);
    ctx.fill();

    // Text
    ctx.font = '16px Helvetica Neue, Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText( 'Score: ' + score, borderSide, 1 );
    ctx.textAlign = 'center';
    ctx.fillText( 'Lives: ' + lives, cw/2, 1 );
    ctx.textAlign = 'right';
    ctx.fillText( 'Level: ' + level, cw - borderSide, 1 );

    if (paused) {
        ctx.font = 'bold 28px Helvetica Neue, Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText( 'Paused', cw/2, ch/2 - borderTop);
    }
}


function resetGame() {
    score = 0;
    lives = 5;
    level = 1;
    initLevel();
}

/* ---- Ball ---- */

function Ball(x, y, vx, vy, stuck) {
    this.rad = 8;
    this.clr = '#666';
    if (stuck) {
        this.stuck = true;
        this.x = player.x + player.width/2;
        this.y = player.y - this.rad;
        this.vx = 0;
        this.vy = 0;
    } else {
        this.stuck = false;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }
}

Ball.prototype.update = function() {
    if ( this.stuck ) {
        this.x = player.x + player.width/2;
        this.y = player.y - this.rad;
        this.vx = 0;
        this.vy = 0;
        return;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Bounce off walls
    if (this.x - this.rad <= borderSide) {
        this.x = borderSide + this.rad;
        this.vx = -this.vx;
    }
    if (this.x + this.rad >= cw - borderSide) {
        this.x = cw - borderSide - this.rad;
        this.vx = -this.vx;
    }
    if (this.y - this.rad <= borderTop) {
        this.y = borderTop + this.rad;
        this.vy = -this.vy;
    }

    // Bounce off paddle
    if (this.y + this.rad >= player.y) {
        if (this.x > player.x && this.x < player.x + player.width) {
            this.y = player.y - this.rad;
            this.vy = -this.vy;
            dx = this.x - (player.x + player.width/2);
            this.vx = dx * 0.15;
        }
    }

    // Lost ball
    if (this.y + this.rad >= ch) {
        var i = balls.indexOf(this);
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
    particles.push(new Particle( 
        this.x, this.y,
        this.vx * Math.random() * 0.5, 
        this.vy * Math.random() * 0.5,
        colors[1],
        60
    ));

    // Collision with blocks
    // TODO: fix this for corner cases
    for (var i = blocks.length - 1; i >= 0; i--) {
        var block = blocks[i];
        if (this.x + this.rad >= block.x && 
            this.x - this.rad <= block.x + block.width &&
            this.y + this.rad >= block.y &&
            this.y - this.rad <= block.y + block.height) {
            
            if (this.x >= block.x && this.x <= block.x + block.width) {
                // Top or bottom hit
                this.vy = -this.vy;
            }
            if (this.y >= block.y && this.y <= block.y + block.height) {
                // Side hit
                this.vx = -this.vx;
            }

            block.destroy();
        }
    }
};

Ball.prototype.launch = function() {
    this.stuck = false;
    this.vx = Math.random()*4 - 2;
    this.vy = -5;
};

Ball.prototype.draw = function() {
    if (this.y < ch) {
        var radgrad = ctx.createRadialGradient(
            this.x - this.rad/2, this.y - this.rad/2, 0,
            this.x, this.y, this.rad
        );
        radgrad.addColorStop(0, '#fff');
        radgrad.addColorStop(1, this.clr);

        ctx.fillStyle = radgrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.rad, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
    }
};


/* ---- Particle ---- */

function Particle(x, y, vx, vy, clr, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.clr = clr;
    this.life = life;
}

Particle.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if ( this.life <= 0 ) {
        // Expired
        this.destroy();
    }
    if ( this.x < borderSide || this.x > cw - borderSide ||
         this.y < borderTop  || this.y > ch ) {
        // Off edges
        this.destroy();
    }
    if ( this.x > player.x && 
         this.x < player.x + player.width && 
         this.y > player.y && 
         this.y < player.y + player.height ) {
        // Hit player paddle
        this.destroy();
    }
};

Particle.prototype.destroy = function() {
    var i = particles.indexOf(this);
    particles.splice(i, 1);
};

Particle.prototype.draw = function() {
    ctx.fillStyle = this.clr;
    if ( this.life < 60 ) {
        ctx.globalAlpha = this.life/60;
    } else {
        ctx.globalAlpha = 1;
    }
    ctx.fillRect( this.x - 1, this.y - 1, 3, 3);
    ctx.globalAlpha = 1;
};

/* ---- Block ---- */

function Block(x, y, clr) {
    this.x = x;
    this.y = y;
    this.clr = clr;
    this.width = 40;
    this.height = 20;
}

Block.prototype.destroy = function() {
    // Asplode
    for (var i = 0; i < 10; i++) {
        particles.push(new Particle(
            this.x + this.width/2, 
            this.y + this.height/2, 
            Math.random()*2 - 1, Math.random()*2 - 1, // vx, vy
            this.clr, 60
        ));
    }

    score += 10;

    var j = blocks.indexOf(this);
    blocks.splice(j, 1);
};

Block.prototype.draw = function() {
    var blockGrad = ctx.createLinearGradient( 
        this.x, this.y, this.x, this.y + 20
    );
    blockGrad.addColorStop(0, this.clr);
    blockGrad.addColorStop(0.2, '#fff');
    blockGrad.addColorStop(1, this.clr);
    ctx.fillStyle = blockGrad;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = '#000';
    ctx.strokeRect(this.x, this.y, this.width, this.height);
};

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
        new Ball(0,0,0,0,stuck=true)
    ];
}

function resetBlocks() {
    blocks = [];
    for (var i = levels[level].length - 1; i >= 0; i--) {
        b = levels[level][i];
        blocks.push(new Block(b.x, b.y, b.clr));
    }
}

function mouseDown(e) {
    for (var i = balls.length - 1; i >= 0; i--) {
        if ( balls[i].stuck ) {
            balls[i].launch();
        }
    }
}

function playerMove(e) {
    if (!paused) {
        var x = getPos(canvas, e).x - player.width/2;
        if (x <= borderSide) {
            player.x = borderSide;
        } else if (x + player.width >= cw - borderSide) {
            player.x = cw - borderSide - player.width;
        } else {
            player.x = x;
        }
    }
}

function getPos(canvas, e) {
    if ( e.type === 'touchmove' ) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    /* Correct for canvas position/size */
    var rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function keyDown(e) {
    switch (e.keyCode) {
        case KEY_LEFT:
            if ( level > 1 ) {
                level--;
                initLevel();
            }
            break;
        case KEY_RIGHT:
            if ( level + 1 < levels.length ) {
                level++;
                initLevel();
            }
            break;
    }
}

levels = [];
levels[1] = [
    { x: 100, y: 100, clr: colors[0] },
    { x: 140, y: 100, clr: colors[1] },
    { x: 180, y: 100, clr: colors[2] },
    { x: 220, y: 100, clr: colors[3] },
    { x: 260, y: 100, clr: colors[4] },
    { x: 300, y: 100, clr: colors[5] },
    { x: 340, y: 100, clr: colors[6] }
];
levels[2] = [
    { x:  80, y: 160, clr: colors[1] },
    { x: 120, y: 160, clr: colors[4] },
    { x: 160, y: 160, clr: colors[1] },
    { x: 200, y: 160, clr: colors[4] },
    { x: 240, y: 160, clr: colors[1] },
    { x: 280, y: 160, clr: colors[4] },
    { x: 320, y: 160, clr: colors[1] },
    { x: 360, y: 160, clr: colors[4] },

    { x: 120, y: 140, clr: colors[1] },
    { x: 160, y: 140, clr: colors[4] },
    { x: 200, y: 140, clr: colors[1] },
    { x: 240, y: 140, clr: colors[4] },
    { x: 280, y: 140, clr: colors[1] },
    { x: 320, y: 140, clr: colors[4] },

    { x: 160, y: 120, clr: colors[1] },
    { x: 200, y: 120, clr: colors[4] },
    { x: 240, y: 120, clr: colors[1] },
    { x: 280, y: 120, clr: colors[4] },

    { x: 200, y: 100, clr: colors[1] },
    { x: 240, y: 100, clr: colors[4] },
];
levels[3] = [
    { x:  20, y: 20, clr: colors[2] },
    { x:  60, y: 20, clr: colors[2] },
    { x: 100, y: 20, clr: colors[2] },
    { x: 140, y: 20, clr: colors[2] },
    { x: 180, y: 20, clr: colors[2] },
    { x: 220, y: 20, clr: colors[2] },
    { x: 260, y: 20, clr: colors[2] },
    { x: 300, y: 20, clr: colors[2] },
    { x: 340, y: 20, clr: colors[2] },
    { x: 380, y: 20, clr: colors[2] },
    { x: 420, y: 20, clr: colors[2] },

    { x:  20, y: 40, clr: colors[1] },
    { x:  60, y: 40, clr: colors[1] },
    { x: 100, y: 40, clr: colors[1] },
    { x: 140, y: 40, clr: colors[1] },
    { x: 180, y: 40, clr: colors[1] },
    { x: 220, y: 40, clr: colors[1] },
    { x: 260, y: 40, clr: colors[1] },
    { x: 300, y: 40, clr: colors[1] },
    { x: 340, y: 40, clr: colors[1] },
    { x: 380, y: 40, clr: colors[1] },
    { x: 420, y: 40, clr: colors[1] },

    { x:  20, y: 60, clr: colors[0] },
    { x:  60, y: 60, clr: colors[0] },
    { x: 100, y: 60, clr: colors[0] },
    { x: 140, y: 60, clr: colors[0] },
    { x: 180, y: 60, clr: colors[0] },
    { x: 220, y: 60, clr: colors[0] },
    { x: 260, y: 60, clr: colors[0] },
    { x: 300, y: 60, clr: colors[0] },
    { x: 340, y: 60, clr: colors[0] },
    { x: 380, y: 60, clr: colors[0] },
    { x: 420, y: 60, clr: colors[0] },
];
