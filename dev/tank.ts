class Tank extends Phaser.Sprite implements Shoot, Drive {   
    
    _gameOver: boolean = false;

// Mixin-Drive
    direction: Directions = Directions.None;
    drive: (d: Directions) => void;
    updateAngle: () => void;
    addDirection: (addDirection: Directions) => void;
    removeDirection: (removeDirection: Directions) => void;
    
    // These are helpers.
    private static directionToAngle: (direction: Directions) => number;
    private static addDirectionInternal: (direction: Directions, addDirection: Directions) => Directions;
    private static removeDirectionInternal: (direction: Directions, removeDirection: Directions) => Directions;
    private static getOpsiteDirection: (direction: Directions) => Directions;
    private static setAcceleration: (angle: number, acceleration: Phaser.Point, maxVelocity: Phaser.Point) => void;
    private static syncBloodTextPosition: (angle: number, bloodText: Phaser.Text) => void;
// ----

// Mixin-Fight
    _bullets: Phaser.Group; 
    _ownerGame: Phaser.Game;
    _guntower: Phaser.Sprite;
    blood: number;

    fire: (firingTo: number) => number;
    nextFireTime: number = 0;

    private shouldFire: (firingTo: number) => boolean;
    private fireInternal: (startX: number, startY: number, moveToX: number, moveToY: number) => void;
    private static calculateTrajectory: (guntower: Phaser.Sprite) => Trajectory;
// ----

    id: number;
    _bloodText: Phaser.Text;

    constructor(game: Phaser.Game, id: number, x:number, y:number) {
        super(game, x, y, TankbodyName);
        this.setupGame(game, id);
        this.setupTank(game, x, y);
    }

    static create(game: Phaser.Game, id: number, x:number, y:number): Tank {
        let tank = new Tank(game, id, x, y);
        game.add.existing(tank);
        return tank;
    }

    updateTank(shouldFire): FullMessage {
        // If game over, do nothing.
        if (this._gameOver) { 
            return this.getJson(undefined); 
        }

        // 1. Gun points to pointer.
        this.updateAngle();

        // 2. Fire.
        let fire: number = undefined;
        if (shouldFire) { fire = this.fire(undefined); }

        // Return.
        return this.getJson(fire);
    }

    updateAsPuppet(params: FullMessage) {
        if (this._gameOver) {
            return;
        }

        this.updateAsPuppetCore(params.gunAngle, params.tankAngle, 
                new Phaser.Point(params.x, params.y),
                params.firing, params.blood);
    }

    getJson(firingTo: number) : FullMessage {
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
            x: this.position.x,
            y: this.position.y,
            gunAngle: this._guntower.angle,
            tankAngle: this.angle,
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
        // These are children.
        this._guntower = game.make.sprite(0, 0, GuntowerName);
        this._bloodText = game.make.text(0, BloodTextOffset, <string><any>(this.blood), 
                    { font: "20px Arial", fill: "#00A000", align: "center" });
        
        this.anchor.set(0.5, 0.5);
        this._guntower.anchor.set(0.5, 0.5);
        this._bloodText.anchor.set(0.5, 0.5);

        // Set layout.
        this.addChild(this._guntower);
        this.addChild(this._bloodText);
    
        // Setup physics only to body.
        game.physics.arcade.enable(this);
        this.body.collideWorldBounds = true;
        this.body.bounce.set(0.1, 0.1);
        this.body.maxVelocity.set(MaxVelocity);
        
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
        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this.blood <= 0) {
            TankHelper.onExplode(this);
            return;
        }
        
        let angleChanged: boolean = this.angle !== tankAngle;
        if (angleChanged) {
            this.angle = tankAngle;
            Tank.syncBloodTextPosition(tankAngle, this._bloodText);
        }
        
        this._guntower.angle = gunAngle;
        this.body.velocity.setTo(0, 0);
        this.position = position;

        // Blood.        
        this.blood = blood;
        this._bloodText.text = <string><any>blood;

        if (firing != undefined) {
            this.fire(firing);
        }
    }

    onHit(bullet: Phaser.Sprite): HitMessage {
        this.blood -= Math.floor(Math.random() * Damage);
        this._bloodText.text = <string><any>this.blood;
        let self = this;
        let result = TankHelper.onHitVisual(bullet, self, this._ownerGame);

        // Only check & explode here.
        if (this.blood <= 0) {
            TankHelper.onExplode(self);
        }

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