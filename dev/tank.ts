// TODO: Should use group when figure out how
class Tank {
    // Things that will be displayed.
    private _guntower: Phaser.Sprite;
    private _tankbody: Phaser.Sprite;
    private _bloodText: Phaser.Text;
    private _bullets: Phaser.Group;

    // Others.
    private _ownerGame: Phaser.Game;
    private _blood: number;
    private _gameOver: boolean = false;

    // Publics.
    id: number;
    direction: Directions = Directions.None;
    
    constructor(game: Phaser.Game, id: number, x:number, y:number) {
        this._ownerGame = game;
        this.id = id;
        this._blood = 100;

        // Seperate tank body and gun tower.           
        this._tankbody = game.add.sprite(x, y, tankbodyName);
        this._guntower = game.add.sprite(x, y, guntowerName);
        var style = { font: "20px Arial", fill: "#00A000", align: "center" };
        this._bloodText = game.add.text(x, y - bloodTextOffset, <string><any>(this._blood), style);

        this._tankbody.anchor.set(0.5, 0.5);
        this._guntower.anchor.set(0.5, 0.5);
        this._bloodText.anchor.set(0.5, 0.5);
    
        // Setup physics
        game.physics.arcade.enable(this._tankbody);
        this._tankbody.body.collideWorldBounds = true;
        this._tankbody.body.bounce.set(0.1, 0.1);
        this._tankbody.body.mass = 100000;
        
        // Create bullets.
        this._bullets = game.add.group();
        this._bullets.enableBody = true;
        this._bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this._bullets.createMultiple(30, bulletName);

        this._bullets.setAll("checkWorldBounds", true);
        this._bullets.setAll("outOfBoundsKill", true);
        this._bullets.forEachAlive((item:Phaser.Sprite) => { 
            item.body.mass = 0.1; }, this);
    }

    update(shouldFire): UpdateMessage {
        // If game over, do nothing.
        if (this._gameOver) {
            return this.getJson(false);
        }

        if (this._blood <= 0) {
            this._gameOver = true;
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
        if (this._gameOver) {
            return;
        }
        this.direction = d;
        let newAngle = MovementHelper.directionToAngle(d);
        let newSpeed = MovementHelper.directionToSpeed(d);

        if (newAngle != undefined) {
            this._tankbody.angle = newAngle;
        }
        
        this._tankbody.body.velocity.x = newSpeed.x;
        this._tankbody.body.velocity.y = newSpeed.y;
    }

    private setPosition() {
        // First, move gun tower to point to mouse.
        const angle: number = Phaser.Math.angleBetweenPoints(this._ownerGame.input.activePointer.position, this._tankbody.body.position);
        this._guntower.angle = Phaser.Math.radToDeg(angle) - 90;

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
        this._guntower.position = this._tankbody.position;
        this._bloodText.position = new Phaser.Point(this._tankbody.position.x, this._tankbody.position.y + bloodTextOffset);
        this._bloodText.text = <string><any>this._blood;
    }
// #endregion Move system

// #region: Fire system

    private nextFire: number = 0;

    private shouldFire(forceFiring: boolean = false): boolean {
        let shouldFire = false;
        if (forceFiring || (this._ownerGame.time.now > this.nextFire && this._bullets.countDead() > 0)) {
            shouldFire = true;
            // Set the cooldown time.
            this.nextFire = this._ownerGame.time.now + fireRate;
        }
        return shouldFire;
    }

    private calculateTrajectory(): Trajectory {
        // Get a random offset. I don't think I can support random offset since the current
        // comm system cannot do the coordinate if there is a offset.
        const randomAngleOffset: number = (Math.random() - 0.5) * accuracy;
        const theta: number = Phaser.Math.degToRad(this._guntower.angle) + randomAngleOffset;

        // Set-up constants.
        const halfLength: number = this._guntower.height / 2;
        const sinTheta = Math.sin(theta);
        const reverseCosTheta = -1 * Math.cos(theta);
        const tankPosition = this._tankbody.body.center;

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
        const bullet: Phaser.Sprite = this._bullets.getFirstDead();
        bullet.angle = this._guntower.angle;
        bullet.anchor.set(0.5, 0.5);
        bullet.reset(startX, startY);
        // bullet.body.angularVelocity = 5000;
        this._ownerGame.physics.arcade.moveToXY(bullet, moveToX, moveToY, bulletSpeed);
    }

    private fire(forceFiring: boolean = false) : boolean {
        if (!this.shouldFire(forceFiring)) {
            return false;
        }

        // Calculate the trajectory.
        let trajectory: Trajectory = this.calculateTrajectory();
        
        // Fire.
        this.fireCore(trajectory.startX, trajectory.startY, trajectory.moveToX, trajectory.moveToY);
        
        // Just move the guntower a little bit to simulate the Newton's second law.
        let Newton = true;
        if (Newton) {
            let xguntowerOffset: number = -1 * trajectory.sinTheta * 5;
            let yguntowerOffset: number = -1 * trajectory.reverseCosTheta * 5;
            this._ownerGame.add.tween(this._guntower).to( 
                { x: this._tankbody.position.x + xguntowerOffset, y: this._tankbody.position.y + yguntowerOffset }, 
                30, Phaser.Easing.Linear.None, true, 0, 0, true);
        }
        return true;
    }
// #endregion: Fire system

// #region: Comms

    private getJson(firing: boolean) : UpdateMessage {
        // If already died, just return an useless message.
        if (this._gameOver) {
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
            x: this._tankbody.position.x,
            y: this._tankbody.position.y,
            gunAngle: this._guntower.angle,
            tankAngle: this._tankbody.angle,
            firing: firing,
            blood: this._blood
        }
    }

    setByJson(params: UpdateMessage) {
        this.tankUpdateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing, params.blood);
    }

    private tankUpdateAsPuppet(gunAngle: number, tankAngle: number, 
        position: Phaser.Point, firing: boolean, blood: number) {
        // if already gameover, do nothing.
        if (this._gameOver) {
            return;
        }

        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this._blood <= 0) {
            this._gameOver = true;
            Tank.tankExplode(this);
            return;
        }

        this._guntower.angle = gunAngle;
        this._tankbody.angle = tankAngle;
        
        this._tankbody.body.velocity.x = 0;
        this._tankbody.body.velocity.y = 0;

        this._tankbody.position = position;
        this._guntower.position = position;
        this._bloodText.position = new Phaser.Point(position.x, position.y + bloodTextOffset);
        
        this._blood = blood;
        this._bloodText.text = <string><any>blood;
        if (this._blood <= 0) {
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
        this._bullets.forEachAlive((item:Phaser.Sprite) => {
            self._ownerGame.physics.arcade.collide(item, another._tankbody, 
                (bullet: Phaser.Sprite, another: Phaser.Sprite) => Tank.bulletHit(bullet, another, self._ownerGame));
        }, this);

        another._bullets.forEachAlive((item:Phaser.Sprite) => {
            self._ownerGame.physics.arcade.collide(item, self._tankbody, 
                (bullet: Phaser.Sprite, another: Phaser.Sprite) => {
                    Tank.bulletHit(bullet, another, self._ownerGame);
                    this._blood -= damage;   
                });
        }, this);
    }    

    private static tankExplode(self: Tank) {
        // Emit and destroy everything.
        let emitter = self._ownerGame.add.emitter(self._tankbody.position.x, self._tankbody.position.y);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(500, 50);
        
        self._tankbody.destroy();
        self._guntower.destroy();
        self._bloodText.destroy();
        self._bullets.destroy();
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