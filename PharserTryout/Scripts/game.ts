const slowSpeed: number = 3;
const fastSpeed: number = 6;

class SimpleGame {

    game: Phaser.Game;
    tank: Phaser.Sprite;
    bullets: Phaser.Group;
    movingDirection: Directions;
    speedUp: boolean;
    W: Phaser.Key;
    A: Phaser.Key;
    S: Phaser.Key;
    D: Phaser.Key;
    P: Phaser.Key;

    constructor() {
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload, update: this.update
        });
    }

    preload() {
        this.game.load.image("tank", "../Resources/tank.png");
        this.game.load.image("bullet", "../Resources/bullet.png");
        this.game.stage.disableVisibilityChange = true;
    }

    create() {
        this.tank = this.game.add.sprite(this.game.width / 2, this.game.height / 2, "tank");
        this.tank.anchor.set(0.5, 0.5);

        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.enable(this.tank, Phaser.Physics.ARCADE);

        this.tank.body.collideWorldBounds = true;
        this.tank.body.bounce.y = 1;
        this.tank.body.bounce.x = 0.5;

        this.bullets = this.game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(30, "bullet");
        this.bullets.setAll("checkWorldBounds", true);
        this.bullets.setAll("outOfBoundsKill", true);
        
        this.W = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.A = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.S = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.D = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

        this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.W);

        this.W.onDown.add(SimpleGame.prototype.moveTank, this);
        this.A.onDown.add(SimpleGame.prototype.moveTank, this);
        this.S.onDown.add(SimpleGame.prototype.moveTank, this);
        this.D.onDown.add(SimpleGame.prototype.moveTank, this);
        
        this.W.onUp.add(SimpleGame.prototype.stopTank, this);
        this.A.onUp.add(SimpleGame.prototype.stopTank, this);
        this.S.onUp.add(SimpleGame.prototype.stopTank, this);
        this.D.onUp.add(SimpleGame.prototype.stopTank, this);

        this.P = this.game.input.keyboard.addKey(Phaser.Keyboard.P);
        this.P.onDown.add(SimpleGame.prototype.fireGun, this);
    }

    update() {
        switch (this.movingDirection) {
            case Directions.None:
                return;
            case Directions.Up:
                this.tank.position.add(0, this.speedUp ? -1 * fastSpeed : -1 * slowSpeed);
                return;
            case Directions.Down:
                this.tank.position.add(0, this.speedUp ? fastSpeed : slowSpeed);
                return;
            case Directions.Left:
                this.tank.position.add(this.speedUp ? -1 * fastSpeed : -1 * slowSpeed, 0);
                return;
            case Directions.Right:
                this.tank.position.add(this.speedUp ? fastSpeed : slowSpeed, 0);
                return;
        default:
        }
    }

    stopTank(e: Phaser.Key) {

        let shouldStop = false;

        if (e.ctrlKey) {
            this.speedUp = false;
        }

        switch (e.event.key) {
            case "w":
                shouldStop = this.movingDirection === Directions.Up; break;
            case "a":
                shouldStop = this.movingDirection === Directions.Left; break;
            case "s":
                shouldStop = this.movingDirection === Directions.Down; break;
            case "d":
                shouldStop = this.movingDirection === Directions.Right; break;
        }

        if (shouldStop) {
            this.movingDirection = Directions.None;
        }
    }
    
    moveTank(e: Phaser.Key) {
        this.speedUp = e.ctrlKey;

        switch (e.event.key) {
            case "w":
                this.tank.angle = 0;
                this.movingDirection = Directions.Up;
                return;
            case "a":
                this.tank.angle = -90;
                this.movingDirection = Directions.Left;
                return;
            case "s":
                this.tank.angle = 180;
                this.movingDirection = Directions.Down;
                return;
            case "d":
                this.tank.angle = 90;
                this.movingDirection = Directions.Right;
                return;
        }
    }

    fireGun() {
        let randomAngleOffset = (Math.random() - 0.5) * 0.2;
        let halfLength = this.tank.height / 2;
        let theta = this.tank.angle / 360 * 6.283 + randomAngleOffset;

        let xOffset = Math.sin(theta) * halfLength;
        let yOffset = -1 * Math.cos(theta) * halfLength;
        let bullet = this.bullets.getFirstDead();
        bullet.anchor.set(0.5, 0.5);
        bullet.angle = this.tank.angle;

        bullet.reset(this.tank.x + xOffset, this.tank.y + yOffset);

        let longway = 10000;
        xOffset = Math.sin(theta) * longway;
        yOffset = -1 * Math.cos(theta) * longway;
        this.game.physics.arcade.moveToXY(bullet, this.tank.x + xOffset, this.tank.y + yOffset, 1000);
    }
}

window.onload = () => {
    var game = new SimpleGame();
};

enum Directions { Up, Down, Left, Right, None }