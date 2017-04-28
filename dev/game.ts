/// ****** names and parameters. ****** ///
// Names
const sandbagName: string = "sandbag";
const tankbodyName: string = "tankbody";
const guntowerName: string = "guntower";
const bulletName: string = "bullet";
const particleName: string = "particle";
// Parameters
const playerSpeed: number = 10;
/// ********************************************************** ///

/// *** Game main class *** ///
window.onload = () => {
    var game = new SimpleGame();
};

enum Directions { Up, Down, Left, Right, None }

class SimpleGame {
    game: Phaser.Game;
    tank: Tank;
    sandbag: Phaser.Sprite;
    // Find its real class;
    socket: any;

    constructor() {
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload, update: this.update
        });
        this.socket = io();
    }

    preload() {
        this.game.load.image(sandbagName, "../resources/tank.png");
        this.game.load.image(bulletName, "../resources/bullet.png");
        this.game.load.image(particleName, "../resources/particle.png");
        this.game.load.image(tankbodyName, "../resources/tankbody.png");
        this.game.load.image(guntowerName, "../resources/guntower.png");
        this.game.stage.disableVisibilityChange = true;
    }

    create() {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.tank = new Tank(this.game);
        
        // Add enemy.
        this.sandbag = SimpleGame.createSandbagAndMakeItMove(this.game);
        
        // Inputs.
        SimpleGame.registerKey(this, Phaser.Keyboard.W, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.A, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.S, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.D, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
    }

    static createSandbagAndMakeItMove(game: Phaser.Game) : Phaser.Sprite {
        let sandbag = game.add.sprite(game.width, game.height / 2 - 50, sandbagName);

        // Setup
        game.physics.arcade.enable(sandbag);
        sandbag.body.collideWorldBounds = true;
        sandbag.body.bounce.x = 1;
        sandbag.body.bounce.y = 1;
        sandbag.body.mass = 100;
        sandbag.anchor.set(0.5, 0.5);

        // Make it run.
        // TODO: Should find a way to make it run randomly.
        game.physics.arcade.accelerateToXY(sandbag, game.width / 2, game.height / 2 - 50, 100);
        return sandbag;
    }

    // Don't know how to make this more acurate, actually, this is not a SimpleGame.
    static registerKey(self: SimpleGame, key: number, keydownHandler: any, keyupHandler?: any) : Phaser.Key {
        let realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null) realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null) realKey.onUp.add(keyupHandler, self);
        // I don't think the output is going to be used.
        return realKey;
    }

    update() {
        // First, update tank itself.
        this.tank.tankUpdate();
        // Second, update the relationship between tank and sandbag.
        this.tank.checkCollide(this.sandbag);

        // Finally, fire if it should.
        if (this.game.input.activePointer.isDown) {
            this.tank.tankFire();
            return;
        }
    }

    stopTank(e: Phaser.Key) {
        let shouldStop = false;

        switch (e.event.key) {
            case "w":
                shouldStop = this.tank.getDirection() === Directions.Up; break;
            case "a":
                shouldStop = this.tank.getDirection() === Directions.Left; break;
            case "s":
                shouldStop = this.tank.getDirection() === Directions.Down; break;
            case "d":
                shouldStop = this.tank.getDirection() === Directions.Right; break;
        }

        if (shouldStop) {
            this.tank.tankEndMove();
        }
    }
    
    moveTank(e: Phaser.Key) {
        switch (e.event.key) {
            case "w":
                this.tank.tankStartMove(Directions.Up);
                return;
            case "a":
                this.tank.tankStartMove(Directions.Left);
                return;
            case "s":
                this.tank.tankStartMove(Directions.Down);
                return;
            case "d":
                this.tank.tankStartMove(Directions.Right);
                return;
        }
    }
}

// Don't touch anything else, just refactor this class first.
class PhysicsManager {

    // Just suppose this is right, we will test it anyway.
    static addDirection(sprite: Phaser.Sprite, direction: Directions) {

        let normalizedAngle = Phaser.Math.normalizeAngle(sprite.angle, false);

        switch (direction) {
        case Directions.Up:
            if (this.hasUpPortion(normalizedAngle)) {
                return;
                }
            if (this.hasDownPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.y = -1 * sprite.body.velocity.y;
            } else {
                sprite.angle = sprite.angle + (this.hasLeftPortion(normalizedAngle) ? 45 : -1 * 45);
                sprite.body.velocity.y = -1 * playerSpeed;
            }
            break;
        case Directions.Down:
            if (this.hasDownPortion(normalizedAngle)) {
                return;
            }
            if (this.hasUpPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.y = -1 * sprite.body.velocity.y;
            } else {
                sprite.angle = sprite.angle + (this.hasLeftPortion(normalizedAngle) ? -1 * 45 : 45);
                sprite.body.velocity.y = playerSpeed;
            }
            break;
        case Directions.Left:
            if (this.hasLeftPortion(normalizedAngle)) {
                return;
            }
            if (this.hasRightPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.x = -1 * sprite.body.velocity.x;
            } else {
                sprite.angle = sprite.angle + (this.hasUpPortion(normalizedAngle) ? -1 * 45 : 45);
                sprite.body.velocity.x = playerSpeed;
            }
            break;
        case Directions.Right:
            if (this.hasRightPortion(normalizedAngle)) {
                return;
            }
            if (this.hasLeftPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.x = -1 * sprite.body.velocity.x;
            } else {
                sprite.angle = sprite.angle + (this.hasUpPortion(normalizedAngle) ? 45 : -1 * 45);
                sprite.body.velocity.x = playerSpeed;
            }
            break;
        case Directions.None:
            break;
        default:
            break;
        }
    }

    static removeDirection(sprite: Phaser.Sprite, direction: Directions) {
    }

    static directionToAngle(direction: Directions): Number {
        switch (direction) {
        case Directions.Up:
            return 0;
        case Directions.Down:
            return 180;
        case Directions.Left:
            return -90;
        case Directions.Right:
            return 90;
        default:
            return -1;
        }
    }

    private static hasUpPortion(angle: Number) : boolean {
        return angle < 90 || angle > 270;
    }

    private static hasDownPortion(angle: Number) : boolean {
        return angle > 90 && angle < 270;
    }

    private static hasLeftPortion(angle: Number) : boolean {
        return angle > 180 && angle < 360;
    }

    private static hasRightPortion(angle: Number) : boolean {
        return angle > 0 && angle < 180;
    }
}

/// ********************************************************** ///

/// *** tank class *** ///
class Tank {
    private tank: Phaser.Group;
    private guntower: Phaser.Sprite;
    private tankbody: Phaser.Sprite;

    private bullets: Phaser.Group;
    private ownerGame: Phaser.Game;
    private tankSpeed: number = 3;
    private direction: Directions = Directions.None;

    constructor(game: Phaser.Game) {
        this.ownerGame = game;

        // Creat tank.
        this.tank = game.add.group(game, "tank", true, true, Phaser.Physics.ARCADE);
        this.tank.position.set(game.width / 2, game.height / 2);

        // Seperate tank body and gun tower.           
        this.tankbody = this.tank.create(0, 0, tankbodyName);
        this.guntower = this.tank.create(0, 0, guntowerName);
        this.tank.setAll("anchor", new Phaser.Point(0.5, 0.5));

        // NOT Only enable the physics for tankbody.
        // this.ownerGame.physics.arcade.enable(this.tankbody);
        this.tankbody.body.collideWorldBounds = true;
        this.tankbody.body.bounce.y = 1;
        this.tankbody.body.bounce.x = 1;
        this.tankbody.body.mass = 70;
        
        // Create bullets.
        this.bullets = game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(30, bulletName);

        this.bullets.setAll("checkWorldBounds", true);
        this.bullets.setAll("outOfBoundsKill", true);
    }

    tankStartMove(d: Directions) {
        this.direction = d;
        switch (d) {
            case Directions.Up:
                this.tankbody.angle = 0;
                return;
            case Directions.Left:
                this.tankbody.angle = -90;
                return;
            case Directions.Down:
                this.tankbody.angle = 180;
                return;
            case Directions.Right:
                this.tankbody.angle = 90;
                return;
        }
    }

    getDirection() : Directions {
        return this.direction;
    }

    tankEndMove() {
        this.direction = Directions.None;
    }

    tankUpdate() {
        // First, move gun tower to point to mouse.
        const angle: number = Phaser.Math.angleBetweenPoints(this.ownerGame.input.activePointer.position, this.tankbody.body.position);
        this.guntower.angle = Phaser.Math.radToDeg(angle) - 90;

        // Second, move the tank.
        // TODO: Find a better way to move the tank.
        if (this.direction === Directions.None) {
            this.tankbody.body.velocity.x = 0;
            this.tankbody.body.velocity.y = 0;
        }
        switch (this.direction) {
            case Directions.None: break;
            case Directions.Up: this.tank.position.add(0, -1 * this.tankSpeed); break;
            case Directions.Down: this.tank.position.add(0, this.tankSpeed); break;
            case Directions.Left: this.tank.position.add(-1 * this.tankSpeed, 0); break;
            case Directions.Right: this.tank.position.add(this.tankSpeed, 0); break;
            default: break;
        }

        // Finally, force to coordinate the guntower and tankbody.
        // TODO: Find a smarter way to do this.
        this.guntower.position = this.tankbody.position;        
    }

    private nextFire: number = 0;
    private fireRate: number = 200;

    tankFire() {
        if (this.ownerGame.time.now < this.nextFire || this.bullets.countDead() <= 0) {
            return;
        }

        // Set the cooldown time.
        this.nextFire = this.ownerGame.time.now + this.fireRate;

        // Get a random offset.
        const randomAngleOffset: number = (Math.random() - 0.5) * 0;
        const theta: number = Phaser.Math.degToRad(this.guntower.angle) + randomAngleOffset;

        // Bullet start position offset.
        const halfLength: number = this.guntower.height / 2;
        let xOffset: number = Math.sin(theta) * halfLength;
        let yOffset: number = -1 * Math.cos(theta) * halfLength;

        // Get bullet.
        const bullet: Phaser.Sprite = this.bullets.getFirstDead();
        bullet.anchor.set(0.5, 0.5);
        bullet.angle = this.guntower.angle;

        // Get the position of the tank.
        let guntowerPosition = this.tankbody.body.center;

        bullet.reset(guntowerPosition.x + xOffset, guntowerPosition.y + yOffset);

        const longway: number = 10000;
        xOffset = Math.sin(theta) * longway;
        yOffset = -1 * Math.cos(theta) * longway;
        this.ownerGame.physics.arcade.moveToXY(bullet, 
            guntowerPosition.x + xOffset, guntowerPosition.y + yOffset, 1000);
    }

    checkCollide(another: Phaser.Sprite) {
        let self = this;

        this.ownerGame.physics.arcade.collide(this.tankbody, another);
        this.bullets.forEachAlive((item:Phaser.Sprite) => {
            self.ownerGame.physics.arcade.collide(item, another, 
                (bullet: Phaser.Sprite, another: Phaser.Sprite) => Tank.BulletHit(bullet, another, self.ownerGame));
        }, this);
    }

    static BulletHit(bullet: Phaser.Sprite, another: Phaser.Sprite, game: Phaser.Game) {
        bullet.kill();
        // Now we are creating the particle emitter, centered to the world
        let emitter = game.add.emitter((bullet.x + another.x) / 2, (bullet.y + another.y) / 2);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);
    }
}
/// ********************************************************** ///