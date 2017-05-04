// TODO: Should use group when figure out how
class Tank {
    // Things that will be displayed.
    private guntower: Phaser.Sprite;
    private tankbody: Phaser.Sprite;
    private bloodText: Phaser.Text;
    private bullets: Phaser.Group;

    // Others.
    private ownerGame: Phaser.Game;
    private blood: number;
    private gameOver: boolean = false;

    // Publics.
    id: number;
    direction: Directions = Directions.None;
    
    constructor(game: Phaser.Game, id: number, x:number, y:number) {
        this.ownerGame = game;
        this.id = id;
        this.blood = 100;

        // Seperate tank body and gun tower.           
        this.tankbody = game.add.sprite(x, y, tankbodyName);
        this.guntower = game.add.sprite(x, y, guntowerName);
        var style = { font: "20px Arial", fill: "#00A000", align: "center" };
        this.bloodText = game.add.text(x, y - bloodTextOffset, <string><any>(this.blood), style);

        this.tankbody.anchor.set(0.5, 0.5);
        this.guntower.anchor.set(0.5, 0.5);
        this.bloodText.anchor.set(0.5, 0.5);
    
        // Setup physics
        game.physics.arcade.enable(this.tankbody);
        this.tankbody.body.collideWorldBounds = true;
        this.tankbody.body.bounce.set(0.1, 0.1);
        this.tankbody.body.mass = 100000;
        
        // Create bullets.
        this.bullets = game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(30, bulletName);

        this.bullets.setAll("checkWorldBounds", true);
        this.bullets.setAll("outOfBoundsKill", true);
        this.bullets.forEachAlive((item:Phaser.Sprite) => { 
            item.body.mass = 0.1; }, this);
    }

    update(shouldFire): IUpdatemessage {
        // If game over, do nothing.
        if (this.gameOver) {
            return this.getJson(false);
        }

        if (this.blood <= 0) {
            this.gameOver = true;
            Tank.tankExplode(this);
            return this.getJson(false);
        }

        let fire: boolean = false;
        this.setPosition();
        
        if (shouldFire) {
            fire = this.fire();
        }

        return this.getJson(fire);
    }

// #regions Move system
    setDirection(d: Directions) {
        if (this.gameOver) {
            return;
        }
        this.direction = d;
        let newAngle = InputManager.directionToAngle(d);
        let newSpeed = InputManager.directionToSpeed(d);

        if (newAngle != undefined) {
            this.tankbody.angle = newAngle;
        }
        
        this.tankbody.body.velocity.x = newSpeed.x;
        this.tankbody.body.velocity.y = newSpeed.y;
    }

    private setPosition() {
        // First, move gun tower to point to mouse.
        const angle: number = Phaser.Math.angleBetweenPoints(this.ownerGame.input.activePointer.position, this.tankbody.body.position);
        this.guntower.angle = Phaser.Math.radToDeg(angle) - 90;

        // Second, move the tank.
        // this.tankbody.body.velocity.set(0, 0);
        // switch (this.direction) {
        //     case Directions.None: break;
        //     case Directions.Up: this.tankbody.position.add(0, -1 * tankSpeed); break;
        //     case Directions.Down: this.tankbody.position.add(0, tankSpeed); break;
        //     case Directions.Left: this.tankbody.position.add(-1 * tankSpeed, 0); break;
        //     case Directions.Right: this.tankbody.position.add(tankSpeed, 0); break;
        //     default: break;
        // }

        // Finally, force to coordinate the guntower, tankbody and blood text
        this.guntower.position = this.tankbody.position;
        this.bloodText.position = new Phaser.Point(this.tankbody.position.x, this.tankbody.position.y + bloodTextOffset);
        this.bloodText.text = <string><any>this.blood;
    }
// #endregion Move system

// #region: Fire system

    private nextFire: number = 0;

    private shouldFire(forceFiring: boolean = false): boolean {
        let shouldFire = false;
        if (forceFiring || (this.ownerGame.time.now > this.nextFire && this.bullets.countDead() > 0)) {
            shouldFire = true;
            // Set the cooldown time.
            this.nextFire = this.ownerGame.time.now + fireRate;
        }
        return shouldFire;
    }

    private calculateTrajectory(): ITrajectory {
        // Get a random offset. I don't think I can support random offset since the current
        // comm system cannot do the coordinate if there is a offset.
        const randomAngleOffset: number = (Math.random() - 0.5) * accuracy;
        const theta: number = Phaser.Math.degToRad(this.guntower.angle) + randomAngleOffset;

        // Set-up constants.
        const halfLength: number = this.guntower.height / 2;
        const sinTheta = Math.sin(theta);
        const reverseCosTheta = -1 * Math.cos(theta);
        const tankPosition = this.tankbody.body.center;

        // Bullet start position and move to position.
        let startX: number = sinTheta * halfLength + tankPosition.x;
        let startY: number = reverseCosTheta * halfLength + tankPosition.y;
        let moveToX: number = startX + sinTheta * Number.MAX_VALUE;
        let moveToY: number = startY + reverseCosTheta * Number.MAX_VALUE;

        return { theta: theta, sinTheta: sinTheta, reverseCosTheta: reverseCosTheta, 
            startX: startX, startY: startY, moveToX: moveToX, moveToY: moveToY };
    }

    private fireCore(startX: number, startY: number, moveToX: number, moveToY: number) {
        // Get bullet.
        const bullet: Phaser.Sprite = this.bullets.getFirstDead();
        bullet.angle = this.guntower.angle;
        bullet.anchor.set(0.5, 0.5);
        bullet.reset(startX, startY);
        // bullet.body.angularVelocity = 5000;
        this.ownerGame.physics.arcade.moveToXY(bullet, moveToX, moveToY, bulletSpeed);
    }

    private fire(forceFiring: boolean = false) : boolean {
        if (!this.shouldFire(forceFiring)) {
            return false;
        }

        // Calculate the trajectory.
        let trajectory: ITrajectory = this.calculateTrajectory();
        
        // Fire.
        this.fireCore(trajectory.startX, trajectory.startY, trajectory.moveToX, trajectory.moveToY);
        
        // Just move the guntower a little bit to simulate the Newton's second law.
        let Newton = true;
        if (Newton) {
            let xguntowerOffset: number = -1 * trajectory.sinTheta * 5;
            let yguntowerOffset: number = -1 * trajectory.reverseCosTheta * 5;
            this.ownerGame.add.tween(this.guntower).to( 
                { x: this.tankbody.position.x + xguntowerOffset, y: this.tankbody.position.y + yguntowerOffset }, 
                30, Phaser.Easing.Linear.None, true, 0, 0, true);
        }
        return true;
    }
// #endregion: Fire system

// #region: Comms

    private getJson(firing: boolean) : IUpdatemessage {
        // If already died, just return an useless message.
        if (this.gameOver) {
            return {
                tankId: this.id,
                x: -1,
                y: -1,
                gunAngle: 0,
                tankAngle: 0,
                firing: false,
                blood: 0
            };
        }

        return {
            tankId: this.id,
            x: this.tankbody.position.x,
            y: this.tankbody.position.y,
            gunAngle: this.guntower.angle,
            tankAngle: this.tankbody.angle,
            firing: firing,
            blood: this.blood
        }
    }

    setByJson(params: IUpdatemessage) {
        this.tankUpdateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing, params.blood);
    }

    private tankUpdateAsPuppet(gunAngle: number, tankAngle: number, 
        position: Phaser.Point, firing: boolean, blood: number) {
        // if already gameover, do nothing.
        if (this.gameOver) {
            return;
        }

        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this.blood <= 0) {
            this.gameOver = true;
            Tank.tankExplode(this);
            return;
        }

        this.guntower.angle = gunAngle;
        this.tankbody.angle = tankAngle;
        
        this.tankbody.body.velocity.x = 0;
        this.tankbody.body.velocity.y = 0;

        this.tankbody.position = position;
        this.guntower.position = position;
        this.bloodText.position = new Phaser.Point(position.x, position.y + bloodTextOffset);
        
        this.blood = blood;
        this.bloodText.text = <string><any>blood;
        if (this.blood <= 0) {
            let self = this;
            Tank.tankExplode(self);
        }

        if (firing) {
            this.fire(firing);
        }
    }

// #endregion: Comms

// #region: Physics and effects

    checkCombatResult(another: Tank) {
        let self = this;

        // this.ownerGame.physics.arcade.collide(this.tankbody, another);
        this.bullets.forEachAlive((item:Phaser.Sprite) => {
            self.ownerGame.physics.arcade.collide(item, another.tankbody, 
                (bullet: Phaser.Sprite, another: Phaser.Sprite) => Tank.bulletHit(bullet, another, self.ownerGame));
        }, this);

        another.bullets.forEachAlive((item:Phaser.Sprite) => {
            self.ownerGame.physics.arcade.collide(item, self.tankbody, 
                (bullet: Phaser.Sprite, another: Phaser.Sprite) => {
                    Tank.bulletHit(bullet, another, self.ownerGame);
                    this.blood -= damage;   
                });
        }, this);
    }    

    private static tankExplode(self: Tank) {
        // Emit and destroy everything.
        let emitter = self.ownerGame.add.emitter(self.tankbody.position.x, self.tankbody.position.y);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(500, 50);
        
        self.tankbody.destroy();
        self.guntower.destroy();
        self.bloodText.destroy();
        self.bullets.destroy();
    }

    private static bulletHit(bullet: Phaser.Sprite, another: Phaser.Sprite, game: Phaser.Game) {
        bullet.kill();
        // Now we are creating the particle emitter, centered to the world
        let emitter = game.add.emitter((bullet.x + another.body.x) / 2, (bullet.y + another.body.y) / 2);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);
    }

// #endregion: Physics and effects
}
/// ********************************************************** ///