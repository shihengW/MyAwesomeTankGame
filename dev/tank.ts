class Tank implements Shoot, Drive {   
    id: number;
    private _bloodText: Phaser.Text;

    constructor(game: Phaser.Game, id: number, x:number, y:number) {
        // Set-up basics.
        this._ownerGame = game;
        this.id = id;
        this.blood = 100;

        // Set-up body, gun and text.
        let tank = this.createTank(game, x, y);
        this._tankbody = tank.body;
        this._guntower = tank.gun;
        this._bloodText = tank.text;
        this._bullets = tank.bullets;
    }

    update(shouldFire): Message {
        // If game over, do nothing.
        if (this._gameOver) { 
            return this.getJson(undefined); 
        }
        // Sync position.
        this.syncPosition();

        // Fire.
        let fire: number = undefined;
        if (shouldFire) { fire = this.fire(undefined); }

        // Return result.
        return this.getJson(fire);
    }

    updateAsPuppet(params: Message) {
        this.updateAsPuppetCore(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing, params.blood);
    }

    combat(another: Tank) : HitMessage {
        let self = this;
        let result: HitMessage = undefined;

        // Check if I am hit by anyone.
        another._bullets.forEachAlive((item:Phaser.Sprite) => {
            self._ownerGame.physics.arcade.collide(item, self._tankbody, 
                (bullet: Phaser.Sprite, notUsed: any) => {
                    result = self.onHit(bullet);
                });
        }, this);

        // Check if I hit anyone.
        this._bullets.forEachAlive((item: Phaser.Sprite) => {
            self._ownerGame.physics.arcade.collide(item, another.getBody(), () => { 
                Tank.onHitVisual(item, another.getBody(), self._ownerGame);
            })
        }, this);

        // Check if I am dead
        if (this.blood <= 0) {
            this._gameOver = true;
            Tank.onExplode(this);
        }

        return result;
    }

    explode() {
        let self = this;
        Tank.onExplode(self);
    }
    
    getBody() : Phaser.Sprite {
        return this._tankbody;
    }

    private createTank(game: Phaser.Game, x: number, y: number) : 
            { body: Phaser.Sprite, gun: Phaser.Sprite, text: Phaser.Text, bullets: Phaser.Group } {
        let body = game.add.sprite(x, y, tankbodyName);
        let gun = game.add.sprite(x, y, guntowerName);
        let text = game.add.text(x, y - BloodTextOffset, <string><any>(this.blood), 
                    { font: "20px Arial", fill: "#00A000", align: "center" });

        body.anchor.set(0.5, 0.5);
        gun.anchor.set(0.5, 0.5);
        text.anchor.set(0.5, 0.5);
    
        // Setup physics
        game.physics.arcade.enable(body);
        body.body.collideWorldBounds = true;
        body.body.bounce.set(0.1, 0.1);
        body.body.maxVelocity.set(MaxVelocity);
        
        // Create bullets.
        let bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(50, bulletName);

        bullets.setAll("checkWorldBounds", true);
        bullets.setAll("outOfBoundsKill", true);
        bullets.forEach((item:Phaser.Sprite) => { 
            item.body.bounce.set(0.1, 0.1);
            item.anchor.set(0.5, 1);
            item.body.mass = 0.05; }, this);
        return { body: body, gun: gun, text: text, bullets: bullets};
    }

    private syncPosition() {
        // First, move gun tower to point to mouse.
        const angle: number = this._ownerGame.physics.arcade.angleToPointer(this._guntower);
        this._guntower.angle = Phaser.Math.radToDeg(angle) + 90;

        // Second, force to coordinate the guntower, tankbody and blood text
        this._guntower.position = this._tankbody.position;
        this._bloodText.position = new Phaser.Point(this._tankbody.position.x, 
            this._tankbody.position.y + BloodTextOffset);
        this._bloodText.text = <string><any>this.blood;
    }

    getJson(firingTo: number) : Message {
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
            blood: this.blood
        }
    }

    private updateAsPuppetCore(gunAngle: number, tankAngle: number, position: Phaser.Point, firing: number, blood: number) {
        // if already gameover, do nothing.
        if (this._gameOver) {
            return;
        }

        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this.blood <= 0) {
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
        
        this.blood = blood;
        this._bloodText.text = <string><any>blood;
        if (this.blood <= 0) {
            let self = this;
            Tank.onExplode(self);
        }

        if (firing != undefined) {
            this.fire(firing);
        }
    }

    private static onExplode(self: Tank) {
        // If already exploded, return.
        if (self._tankbody.body == null) {
            return;
        }

        // Emit and destroy everything.
        let emitter = self._ownerGame.add.emitter(self._tankbody.body.position.x, self._tankbody.body.position.y);
        emitter.makeParticles(particleName, 0, 200, true, false);
        emitter.explode(2000, 200);
        
        self._tankbody.destroy();
        self._guntower.destroy();
        self._bloodText.destroy();
        self._bullets.destroy();
    }

    static onHitVisual(bullet: Phaser.Sprite, tankBody: Phaser.Sprite, game: Phaser.Game) : { hitX: number, hitY: number } {
        // Now we are creating the particle emitter, centered to the world
        let hitX: number = (bullet.x + tankBody.body.x) / 2;
        let hitY: number =  (bullet.y + tankBody.body.y) / 2;
        bullet.kill();

        // Get effect.
        let emitter = game.add.emitter(hitX, hitY);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(1000, 50);
        return { hitX: hitX, hitY: hitY };
    }

    private onHit(bullet: Phaser.Sprite): HitMessage {
        this.blood -= Math.floor(Math.random() * Damage);
        let self = this;
        let result = Tank.onHitVisual(bullet, self._tankbody, this._ownerGame);

        return {
            tankId: this.id,
            hitX: result.hitX,
            hitY: result.hitY,
            blood: this.blood
        }
    }

// Mixin-Drive
    direction: Directions = Directions.None;
    _tankbody: Phaser.Sprite;
    _gameOver: boolean = false;
    drive: (d: Directions) => void;
// ----

// Mixin-Fight
    _bullets: Phaser.Group; 
    _ownerGame: Phaser.Game;
    _guntower: Phaser.Sprite;
    blood: number;

    fire: (firingTo: number) => number;
    nextFireTime: number = 0;

    shouldFire: (firingTo: number) => boolean;
    calculateTrajectory: () => Trajectory;
    fireInternal: (startX: number, startY: number, moveToX: number, moveToY: number) => void;
// ----
}

// Set-up mixin.
applyMixins(Tank, [Drive, Shoot]);