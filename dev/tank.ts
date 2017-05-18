class Tank implements Shoot, Drive {   
// Mixin-Drive
    direction: Directions = Directions.None;
    _tankbody: Phaser.Sprite;
    _gameOver: boolean = false;
    drive: (d: Directions) => void;
    updateAngle: () => void;
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

    id: number;
    _bloodText: Phaser.Text;

    constructor(game: Phaser.Game, id: number, x:number, y:number) {
        this.setupGame(game, id);
        this.setupTank(game, x, y);
    }

    update(shouldFire): Message {
        // If game over, do nothing.
        if (this._gameOver) { 
            return this.getJson(undefined); 
        }

        // 1. Gun points to pointer.
        this.updateAngle();

        // 2. Update blood.
        this._bloodText.text = <string><any>this.blood;

        // 3. Fire.
        let fire: number = undefined;
        if (shouldFire) { fire = this.fire(undefined); }

        // 4. Get result.
        return this.getJson(fire);
    }

    updateAsPuppet(params: Message) {
        this.updateAsPuppetCore(params.gunAngle, params.tankAngle, 
                new Phaser.Point(params.x, params.y),
                params.firing, params.blood);
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
            self._ownerGame.physics.arcade.collide(item, another._tankbody, () => { 
                TankHelper.onHitVisual(item, another._tankbody, self._ownerGame);
            })
        }, this);

        // Check if I am dead
        if (this.blood <= 0) {
            this._gameOver = true;
            TankHelper.onExplode(this);
        }

        return result;
    }

    explode() {
        let self = this;
        TankHelper.onExplode(self);
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

    private setupGame(game: Phaser.Game, id: number) {
        this._ownerGame = game;
        this.id = id;
        this.blood = 100;
    }

    private setupTank(game: Phaser.Game, x: number, y: number) {
        // This is the parent.
        this._tankbody = game.add.sprite(x, y, TankbodyName);
        // These are children.
        this._guntower = game.make.sprite(0, 0, GuntowerName);
        this._bloodText = game.add.text(0, 0 - BloodTextOffset, <string><any>(this.blood), 
                    { font: "20px Arial", fill: "#00A000", align: "center" });

        this._tankbody.anchor.set(0.5, 0.5);
        this._guntower.anchor.set(0.5, 0.5);
        this._bloodText.anchor.set(0.5, 0.5);
        
        this._tankbody.addChild(this._guntower);
        this._tankbody.addChild(this._bloodText);
    
        // Setup physics only to body.
        game.physics.arcade.enable(this._tankbody);
        this._tankbody.body.collideWorldBounds = true;
        this._tankbody.body.bounce.set(0.1, 0.1);
        this._tankbody.body.maxVelocity.set(MaxVelocity);
        
        // Create bullets.
        this._bullets = game.add.group();
        this._bullets.enableBody = true;
        this._bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this._bullets.createMultiple(50, BulletName);

        this._bullets.setAll("checkWorldBounds", true);
        this._bullets.setAll("outOfBoundsKill", true);
        this._bullets.forEach((item:Phaser.Sprite) => { 
            item.body.bounce.set(0.1, 0.1);
            item.anchor.set(0.5, 1);
            item.body.mass = 0.05; }, this);
    }

    private updateAsPuppetCore(gunAngle: number, tankAngle: number, position: Phaser.Point, firing: number, blood: number) {
        // if already gameover, do nothing.
        if (this._gameOver) {
            return;
        }

        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this.blood <= 0) {
            this._gameOver = true;
            TankHelper.onExplode(this);
            return;
        }

        this._guntower.angle = gunAngle;
        this._tankbody.angle = tankAngle;
        
        this._tankbody.body.velocity.x = 0;
        this._tankbody.body.velocity.y = 0;

        this._tankbody.position = position;
        
        this.blood = blood;
        this._bloodText.text = <string><any>blood;
        if (this.blood <= 0) {
            let self = this;
            TankHelper.onExplode(self);
        }

        if (firing != undefined) {
            this.fire(firing);
        }
    }

    private onHit(bullet: Phaser.Sprite): HitMessage {
        this.blood -= Math.floor(Math.random() * Damage);
        let self = this;
        let result = TankHelper.onHitVisual(bullet, self._tankbody, this._ownerGame);

        return {
            tankId: this.id,
            hitX: result.hitX,
            hitY: result.hitY,
            blood: this.blood
        }
    }
}

// Set-up mixin.
applyMixins(Tank, [Drive, Shoot]);