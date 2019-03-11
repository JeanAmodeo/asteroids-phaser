let scene = new Phaser.Scene('Game');

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 640*1.2,
    height: 480*1.2,
    // pixelArt: true,
    physics: {
        default: 'arcade',
    },
    scene: scene
};

var interval = 0;
//interval is the cooldwon time between shots

var warp = 0;

var invul = 0;
var blink = 0;
//invulnerability and flickering timers

var bullets;
//bullets is a group that contains all the Bullet entities in the game
var asteroids;
//asteroids is a group that contains all the Asteroid entities in the game

//global array, contains asteroids types and properties
var astroPresets = {
    astroLarge: {
        sprite: 'astroL',
        minSpeed: 50,
        maxSpeed: 100,
        score: 20,
        nextSize: "astroMedium",
        parts: 2
    },
    astroMedium: {
        sprite: 'astroM',
        score: 50,
        minSpeed: 100,
        maxSpeed: 150,
        nextSize: "astroSmall",
        parts: 2
    },
    astroSmall: {
        sprite: 'astroS',
        minSpeed: 150,
        maxSpeed: 180,
        score: 100
    },
};

var gSize = "astroLarge";
//global size variable, contains the size of the last asteroid hit
var lives = 5;
//global lives counter
var score = 0;
//global lives counter


let game = new Phaser.Game(config);

var Bullet = new Phaser.Class({
    //Bullet class
    Extends: Phaser.Physics.Arcade.Image,
    initialize:

        function Bullet(scene) {
            Phaser.Physics.Arcade.Image.call(this, scene, 0, 0, 'bullet');

            this.speed = 500;
            this.lifespan = 1000;
        },

    fire: function (ship) {
        //function to call when ship fires, spawns bullets

        this.lifespan = 1000;

        this.setActive(true);
        this.setVisible(true);
        //bullets are now active and visible
        this.setAngle(ship.body.rotation);
        this.setPosition(ship.x, ship.y);
        //bullets spawn in the center of the ship, not at the tip (causes problems when ship rotates)

        this.body.reset(ship.x, ship.y);
        this.body.setSize(10, 10, true);

        var angle = Phaser.Math.DegToRad(ship.body.rotation);
        //converts the angle in rad to use in VelocityFromRotation

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
        //same principle for the rotation of the ship, determines the velocity of the bullets when fired

    },
    update: function (time, delta) {
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            //bullets disappear after ((lifetime))
            this.kill();
        }
    },

    kill: function () {
        //function call when bullets attain lifespan
        this.setActive(false);
        this.setVisible(false);
        this.body.stop();
    }
})

var Asteroid = new Phaser.Class({
    //Asteroid class
    Extends: Phaser.Physics.Arcade.Image,

    initialize:

        function Asteroid(scene) {
            this.size = gSize;
            Phaser.Physics.Arcade.Sprite.call(this, scene, 0, 0, astroPresets[this.size].sprite);
            this.score = astroPresets[this.size].score;
            this.nextSize = astroPresets[this.size].nextSize;
            this.parts = astroPresets[this.size].parts;
            this.speed = astroPresets[this.size].maxSpeed;
        },

    spawn: function (x, y, size) {
        //random start position
        if (x === undefined) {
            x = Phaser.Math.Between(0, this.sys.game.config.width - 50)
        };
        if (y === undefined) {
            y = Phaser.Math.Between(0, this.sys.game.config.height - 20)
        };

        var pos = [x, y];
        gSize = size;
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(pos[0], pos[1]);

        this.rotation = Phaser.Math.Between(0, 180);
        this.speed = Phaser.Math.Between(astroPresets[this.size].minSpeed, astroPresets[this.size].maxSpeed);

        var angle = Phaser.Math.RND.angle();

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
    },
    update: function (time, delta) {
        this.rotation += 0.01;
    },

    kill: function () {
        //function call when asteroids die
        //plays impact sound
        destSound.play();
        for (var i = 0; i < astroPresets[this.size].parts; i++) {
            //spawns a number of new asteroids of size = newSize
            this.scene.spawnAstro(this.x, this.y, astroPresets[this.size].nextSize);
        }
        if (this.size == "astroSmall") {
            this.scene.spawnAstro("", "", "astroLarge");
        }
        score += astroPresets[this.size].score;
        //updates the score counter
        tScore.setText(score);
        this.body.stop();
        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
})

scene.preload = function () {
    //loading textures
    this.load.image('bullet', 'assets/bullet.png');

    this.load.image('ship', 'assets/ship.png');
    this.load.image('ship2', 'assets/ship2.png');

    this.load.image('astroL', 'assets/asteroidLarge.png');
    this.load.image('astroM', 'assets/asteroidMedium.png');
    this.load.image('astroS', 'assets/asteroidSmall.png');

    //loading sounds
    this.load.audio('fire', [
        'assets/fire.ogg',
        'assets/fire.m4a'
    ]);

    this.load.audio('destroyed', [
        'assets/destroyed.ogg',
        'assets/destroyed.mp3'
    ]);
};

scene.create = function () {

    scene.cameras.main.setBackgroundColor('#000000')
    //sets scene background to black
    //creates the lives counter (see CSS for custom font)
    tLives = this.add.text(20, 10, lives, {
        fontFamily: '"Hyperspace"',
        fontSize: 20
    });
    //creates the score counter
    tScore = this.add.text(this.sys.game.config.width - 20, 10, score, {
        fontFamily: '"HyperSpace"',
        fontSize: 20
    });
    tScore.setAlign('right');
    tScore.setOrigin(1, 0);

    copyright = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height - 20, "©2019 JATARI INC ", {
        fontFamily: '"HyperSpace"',
        fontSize: 10
    });
    copyright.setOrigin(0.5, 0);

    //impact and fire sounds
    fireSound = this.sound.add('fire');
    destSound = this.sound.add('destroyed');

    //particles creation
    particles = this.add.particles('bullet');
    particles.createEmitter({
        angle: {
            min: 0,
            max: 360
        },
        lifespan: 200,
        speed: {
            start: 100,
            end: 0
        },
        quantity: 10,
        scale: {
            start: 2,
            end: 0.5
        },
        on: false
    });

    //creates a ship sprite
    this.ship = this.physics.add.sprite(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'ship');
    this.ship.alive = true;

    // bullets = this.physics.add.group({
    //     key: 'bullet',
    //     repeat: 30,
    //     setXY: { x: 0.5, y: 0.5 },
    //     lifespan: 3000
    // });
    bullets = this.physics.add.group({
        //creates a group of bullet objects
        classType: Bullet,
        maxSize: 40,
        runChildUpdate: true
        //Uses the update function defined in the class
    });

    asteroids = this.physics.add.group({
        //creates a group of asteroids objects
        classType: Asteroid,
        maxSize: 30,
        runChildUpdate: true
    });

    //controls
    shot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    hyper = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.cursors = this.input.keyboard.createCursorKeys();

    //ship physics
    this.ship.setDrag(100);
    this.ship.setAngularDrag(100);
    this.ship.setMaxVelocity(200);

    //check collisions between asteroids and bullets
    this.physics.add.overlap(bullets, asteroids, this.astroHit, this.checkHit, this);
    this.physics.add.overlap(this.ship, asteroids, this.shipHit, this.checkHitShip, this);

    //spawns 6 large asteroids
    for (var i = 0; i < 6; i++) {
        this.spawnAstro('', '', "astroLarge");
    }
}

scene.update = function (time) {
    //wrap function enables border traversal for the ship, asteroids and bullets, with an offset of 5

    this.physics.world.wrap(this.ship, 5);
    this.physics.world.wrap(bullets, 5);
    this.physics.world.wrap(asteroids, 20);
    // this.ship.body.setVelocity(0);
    // if (!this.ship.alive) {
    //     this.ship.setVisible(false);
    // } else {
    //     this.ship.setVisible(true);
    // }

    //ship physics
    if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(300);
    } else if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-300);
    } else {
        this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation, 200, this.ship.body.acceleration);
        //alternates ship texture
        this.ship.setTexture('ship2');
    } else {
        this.ship.setAcceleration(0);
        this.ship.setTexture('ship');
    }

    //Shooting
    if (shot.isDown && time > interval && this.ship.alive) {
        var bullet = bullets.get();
        if (bullet) {
            bullet.fire(this.ship);
            fireSound.play();
            interval = time + 100;
        }
    }

    if (hyper.isDown && this.ship.alive && time > warp) {
        fireSound.play();
        //Hyperspace button, teleporting you to a random location on screen
        x = Phaser.Math.Between(0, this.sys.game.config.width)
        y = Phaser.Math.Between(0, this.sys.game.config.height)
        this.ship.setPosition(x, y);
        warp = time + 1000;
    }

    // This is the flickering when hit
    if (!this.ship.alive) {
        this.ship.setVisible(false);
        if (time > blink) {
            this.ship.setVisible(true);
            blink = time + 100;
        }
    }
    //Invulnerability when hit
    if (this.ship.alive === false && time > invul) {
        this.ship.setVisible(true);
        this.ship.alive = true;
        invul = time + 6000;

    }

    //game over if all lives = 0
    if (lives == 0) {
        if (confirm('Game Over\n'+'Score : '+score+'\nReload ?')) {
            window.location.reload();
        }
    }

    //win if no more asteroids
    if (asteroids.children.entries.length === 0) {
        if (confirm('You Win !\nReload ?')) {
            window.location.reload();
        }
    }
};

scene.checkHit = function (obj1, obj2) {
    //checks if two objects are active
    return (obj1.active && obj2.active);
}

scene.checkHitShip = function (obj, ship) {
    //specific function called when the ship is hit
    return (obj.active && ship.alive);
}

scene.astroHit = function (bullet, astro) {
    //kills the colliding bullet and asteroid
    //emits the predefined particles
    particles.emitParticleAt(astro.x, astro.y);
    bullet.kill();
    astro.kill();
}
scene.shipHit = function (ship, astro) {
    //called when the ship is hit
    if (ship.alive) {
        //plays the impact sound
        destSound.play();
        ship.alive = false;
        lives--;
    };
    //update the lives counter
    tLives.setText(lives);
}

scene.spawnAstro = function (x, y, size) {
    //spawns an asteroid
    var as = asteroids.get();
    if (as) {
        as.spawn(x, y, size);
    };
}