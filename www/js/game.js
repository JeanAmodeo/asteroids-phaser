let scene = new Phaser.Scene('Game');

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 512,
    height: 512,
    // pixelArt: true,
    physics: {
        default: 'arcade',
    },
    scene: scene
};

var interval = 0;
//interval is the cooldwon time between shots

var invul = 0;

var bullets;
//bullets is a group that contains all the Bullet entities in the game
var asteroids;
//asteroids is a group that contains all the Asteroid entities in the game

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
        maxSpeed: 200,
        score: 100
    },
};

var gSize = "astroLarge";
var lives = 3;

// console.log(gSize)

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
        // console.log(this);
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
            // console.log(gSize);
            this.size = gSize;
            // if (this.size === undefined || this.size == 0){this.size = "astroLarge"};

            Phaser.Physics.Arcade.Sprite.call(this, scene, 0, 0, astroPresets[this.size].sprite);
            // console.log(this.size)
            this.score = astroPresets[this.size].score;
            this.nextSize = astroPresets[this.size].nextSize;
            this.parts = astroPresets[this.size].parts;
            this.speed = astroPresets[this.size].maxSpeed;
        },

    spawn: function (x, y, size) {
        // console.log(this.size);
        if (x === undefined) {
            x = Phaser.Math.Between(520, 600)
        };
        if (y === undefined) {
            y = Phaser.Math.Between(520, 600)
        };

        var pos = [x, y];
        // console.log(this);
        gSize = size;
        // console.log(gSize);
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(pos[0], pos[1]);

        this.rotation = Phaser.Math.Between(0, 180);
        //console.log( this.size)
        this.speed = Phaser.Math.Between(astroPresets[this.size].minSpeed, astroPresets[this.size].maxSpeed);
        // this.speed = 80;

        var angle = Phaser.Math.RND.angle();

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
    },
    update: function (time, delta) {
        this.rotation += 0.01;
    },

    kill: function () {
        //function call when asteroids die

        for (var i = 0; i < astroPresets[this.size].parts; i++) {
            console.log(this.size);
            // console.log(astroPresets[this.size].nextSize)
            this.scene.spawnAstro(this.x, this.y, astroPresets[this.size].nextSize);
        }


        this.body.stop();
        this.setActive(false);
        this.setVisible(false);
        this.destroy();
        // console.log(this)


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
};

scene.create = function () {

    scene.cameras.main.setBackgroundColor('#000000')
    //sets scene background to black
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
    this.cursors = this.input.keyboard.createCursorKeys();

    //ship physics
    this.ship.setDrag(100);
    this.ship.setAngularDrag(100);
    this.ship.setMaxVelocity(200);

    //check collisions between asteroids and bullets
    this.physics.add.overlap(bullets, asteroids, this.astroHit, this.checkHit, this);
    this.physics.add.overlap(this.ship, asteroids, this.shipHit, this.checkHit, this);

    for (var i = 0; i < 6; i++) {
        this.spawnAstro('', '', "astroLarge");
    }
}

scene.update = function (time) {

    this.physics.world.wrap(this.ship, 5);
    this.physics.world.wrap(bullets, 5);
    this.physics.world.wrap(asteroids, 20);
    //wrap function enables border traversal for the ship, asteroids and bullets, with an offset of 5
    // this.ship.body.setVelocity(0);

    if (!this.ship.alive) {
        this.ship.setVisible(false);
    } else {
        this.ship.setVisible(true);
    }

    if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(300);
    } else if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-300);
    } else {
        this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
        // console.log(this.ship.body.acceleration);
        this.physics.velocityFromRotation(this.ship.rotation, 200, this.ship.body.acceleration);
        //alternates ship texture
        this.ship.setTexture('ship2');
    } else {
        this.ship.setAcceleration(0);
        this.ship.setTexture('ship');
    }

    if (shot.isDown && time > interval) {
        //console.log(time);
        var bullet = bullets.get();
        if (bullet) {
            bullet.fire(this.ship);
            interval = time + 100;
        }
    }
    // console.log(this.ship.alive);

    if (!this.ship.alive && time > invul) {
        this.ship.alive = true;
        invul = time + 5000;

    }
};

scene.checkHit = function (obj1, obj2) {
    return (obj1.active && obj2.active);
}

scene.astroHit = function (bullet, astro) {
    bullet.kill();
    astro.kill();
}
scene.shipHit = function (ship, astro) {
    astro.kill();
    if (ship.alive) {
        ship.alive = false;
        // console.log("DED XD");
        lives--;
        
    };

}

scene.spawnAstro = function (x, y, size) {
    // console.log(size)
    var as = asteroids.get();
    if (as) {
        as.spawn(x, y, size);
    };
}