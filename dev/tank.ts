/// *** tank class *** ///
class Tank {
    private tank: Phaser.Group;
    private guntower: Phaser.Sprite;
    private tankbody: Phaser.Sprite;

    private bullets: Phaser.Group;
    private ownerGame: Phaser.Game;
    private tankSpeed: number = 3;
    private direction: Directions = Directions.None;
    id: number;

    constructor(game: Phaser.Game, id: number, x:number, y:number) {
        this.ownerGame = game;
        this.id = id;

        // Creat tank.
        this.tank = game.add.group(game, "tank", true, true, Phaser.Physics.ARCADE);
        this.tank.position.set(x, y);

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

    tankUpdateAsPuppet(gunAngle: number, tankAngle: number, position: Phaser.Point, firing: boolean) {
        this.guntower.angle = gunAngle;
        this.tankbody.angle = tankAngle;

        this.tankbody.body.velocity.x = 0;
        this.tankbody.body.velocity.y = 0;

        this.tank.position = position;
        
        if (firing) {
            Tank.prototype.tankFire();
        }
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

    tankFire(forceFiring: boolean = false) : boolean {
        if (!forceFiring 
        && (this.ownerGame.time.now < this.nextFire || this.bullets.countDead() <= 0)) {
            return false;
        }

        // Set the cooldown time.
        this.nextFire = this.ownerGame.time.now + fireRate;

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
        return true;
    }

    checkCollide(another: Tank) {
        let self = this;

        // this.ownerGame.physics.arcade.collide(this.tankbody, another);
        this.bullets.forEachAlive((item:Phaser.Sprite) => {
            self.ownerGame.physics.arcade.collide(item, another.tankbody, 
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

    getJson(firing: boolean) : any {
        return {
            id: this.id,
            x: this.tank.position.x,
            y: this.tank.position.y,
            gunAngle: this.guntower.angle,
            tankAngle: this.tankbody.angle,
            firing: firing
        }
    }

    setByJson(params: any) {
        this.tankUpdateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing);
    }
}
/// ********************************************************** ///