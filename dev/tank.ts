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
        this._bloodText = game.add.text(x, y - BloodTextOffset, <string><any>(this._blood), style);

        this._tankbody.anchor.set(0.5, 0.5);
        this._guntower.anchor.set(0.5, 0.5);
        this._bloodText.anchor.set(0.5, 0.5);
    
        // Setup physics
        game.physics.arcade.enable(this._tankbody);
        this._tankbody.body.collideWorldBounds = true;
        this._tankbody.body.bounce.set(0.1, 0.1);
        this._tankbody.body.maxVelocity.set(MaxVelocity);
                
        // Create bullets.
        this._bullets = game.add.group();
        this._bullets.enableBody = true;
        this._bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this._bullets.createMultiple(50, bulletName);

        this._bullets.setAll("checkWorldBounds", true);
        this._bullets.setAll("outOfBoundsKill", true);
        this._bullets.forEachAlive((item:Phaser.Sprite) => { 
            item.body.bounce.set(0.1, 0.1);
            item.body.mass = 0.1; }, this);
    }

    getBody() : Phaser.Sprite {
        return this._tankbody;
    }

    update(shouldFire): Message {
        // If game over, do nothing.
        if (this._gameOver) { return this.getJson(undefined); }
        if (this._blood <= 0) {
            this._gameOver = true;
            Tank.onExplode(this);
            return this.getJson(undefined);
        }

        // Move.
        this.syncPosition();

        // Fire.
        let fire: number = undefined;
        if (shouldFire) { fire = this.fire(undefined); }

        // Return result.
        return this.getJson(fire);
    }

    updateByJson(params: Message) {
        this.updateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing, params.blood);
    }

    drive(d: Directions) {
        if (this._gameOver) {
            return;
        }
        
        this.direction = d;

        if (d == Directions.None) {
            this._tankbody.body.velocity.set(0, 0);
            this._tankbody.body.acceleration.set(0, 0);
            return;
        }
        
        let angle = MovementHelpers.directionToAngle(d);
        this._tankbody.angle = angle;
        MovementHelpers.angleToAcceleration(angle, this._tankbody.body.acceleration, this._tankbody.body.maxVelocity);
    }

    combat(another: Tank) : HitMessage {
        let self = this;
        another._bullets.forEachAlive((item:Phaser.Sprite) => {
            self._ownerGame.physics.arcade.collide(item, self._tankbody, 
                (bullet: Phaser.Sprite, notUsed: any) => {
                    return self.onHit(bullet);
                });
        }, this);

        this._bullets.forEachAlive((item: Phaser.Sprite) => {
            self._ownerGame.physics.arcade.collide(item, another, () => { item.kill(); });
        }, this);

        return undefined;
    }

    explode() {
        let self = this;
        Tank.onExplode(self);
    }

    hitEffect(x: number, y: number) {
        let emitter = this._ownerGame.add.emitter(x, y);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);
    }

// #regions privates.
    private syncPosition() {
        // First, move gun tower to point to mouse.
        const angle: number = this._ownerGame.physics.arcade.angleToPointer(this._guntower);
        this._guntower.angle = Phaser.Math.radToDeg(angle) + 90;

        // Second, force to coordinate the guntower, tankbody and blood text
        this._guntower.position = this._tankbody.position;
        this._bloodText.position = new Phaser.Point(this._tankbody.position.x, 
            this._tankbody.position.y + BloodTextOffset);
        this._bloodText.text = <string><any>this._blood;
    }

    private nextFireTime: number = 0;

    private shouldFire(firingTo: number): boolean {
        return firingTo != undefined
            || (this._ownerGame.time.now > this.nextFireTime && this._bullets.countDead() > 0);
    }

    private calculateTrajectory(): Trajectory {
        // Get a random offset. I don't think I can support random offset since the current
        // comm system cannot do the coordinate if there is a offset.
        const randomAngleOffset: number = (Math.random() - 0.5) * AngleOffsetBase;
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

    private fireInternal(startX: number, startY: number, moveToX: number, moveToY: number) {
        // Get bullet.
        const bullet: Phaser.Sprite = this._bullets.getFirstDead();
        bullet.angle = this._guntower.angle;
        bullet.anchor.set(0.5, 0.5);
        bullet.reset(startX, startY);
        // bullet.body.angularVelocity = 5000;
        this._ownerGame.physics.arcade.moveToXY(bullet, moveToX, moveToY, BulletSpeed);
    }

    private fire(firingTo: number = undefined) : number {
        if (!this.shouldFire(firingTo)) {
            return undefined;
        }

        // Set time.
        this.nextFireTime = this._ownerGame.time.now + FireRate;

        // Calculate the trajectory.
        let trajectory: Trajectory = this.calculateTrajectory();

        if (firingTo != undefined) {
            trajectory.theta = firingTo;
        }
        
        // Fire.
        this.fireInternal(trajectory.startX, trajectory.startY, trajectory.moveToX, trajectory.moveToY);
        // Let's shake it shake it.
        this._ownerGame.camera.shake(0.005, 50);
        return trajectory.theta;
    }

    private getJson(firingTo: number) : Message {
        // If already died, just return an useless message.
        if (this._gameOver) {
            return {
                tankId: this.id,
                x: -1,
                y: -1,
                gunAngle: 0,
                tankAngle: 0,
                firing: undefined,
                blood: 0
            };
        }

        return {
            tankId: this.id,
            x: this._tankbody.position.x,
            y: this._tankbody.position.y,
            gunAngle: this._guntower.angle,
            tankAngle: this._tankbody.angle,
            firing: firingTo,
            blood: this._blood
        }
    }

    private updateAsPuppet(gunAngle: number, tankAngle: number, 
        position: Phaser.Point, firing: number, blood: number) {
        // if already gameover, do nothing.
        if (this._gameOver) {
            return;
        }

        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this._blood <= 0) {
            this._gameOver = true;
            Tank.onExplode(this);
            return;
        }

        this._guntower.angle = gunAngle;
        this._tankbody.angle = tankAngle;
        
        this._tankbody.body.velocity.x = 0;
        this._tankbody.body.velocity.y = 0;

        this._tankbody.position = position;
        this._guntower.position = position;
        this._bloodText.position = new Phaser.Point(position.x, position.y + BloodTextOffset);
        
        this._blood = blood;
        this._bloodText.text = <string><any>blood;
        if (this._blood <= 0) {
            let self = this;
            Tank.onExplode(self);
        }

        if (firing != undefined) {
            this.fire(firing);
        }
    }

    private static onExplode(self: Tank) {
        // Emit and destroy everything.
        let emitter = self._ownerGame.add.emitter(self._tankbody.position.x, self._tankbody.position.y);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(500, 50);
        
        self._tankbody.destroy();
        self._guntower.destroy();
        self._bloodText.destroy();
        self._bullets.destroy();
    }

    private onHit(bullet: Phaser.Sprite): HitMessage {
        this._blood -= Math.random() * Damage;
        bullet.kill();
        // Now we are creating the particle emitter, centered to the world
        let hitX: number = (bullet.x + this._tankbody.body.x) / 2;
        let hitY: number =  (bullet.y + this._tankbody.body.y) / 2;
        let emitter = this._ownerGame.add.emitter(hitX, hitY);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(300, 50);

        return {
            tankId: this.id,
            hitX: hitX,
            hitY: hitY,
            blood: this._blood
        }
    }

// #endregion
}
/// ********************************************************** ///