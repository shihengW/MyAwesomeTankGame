class SimpleGame {
    game: Phaser.Game;
    tank: Tank;

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
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.tank = new Tank(this.game, "tank", "bullet");

        // Inputs.
        let W = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        let A = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        let S = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        let D = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
        let P = this.game.input.keyboard.addKey(Phaser.Keyboard.P);

        // Keydown
        W.onDown.add(SimpleGame.prototype.moveTank, this);
        A.onDown.add(SimpleGame.prototype.moveTank, this);
        S.onDown.add(SimpleGame.prototype.moveTank, this);
        D.onDown.add(SimpleGame.prototype.moveTank, this);
        P.onDown.add(SimpleGame.prototype.fireGun, this);

        // Keyup
        W.onUp.add(SimpleGame.prototype.stopTank, this);
        A.onUp.add(SimpleGame.prototype.stopTank, this);
        S.onUp.add(SimpleGame.prototype.stopTank, this);
        D.onUp.add(SimpleGame.prototype.stopTank, this);
    }

    update() {
        this.tank.tankMove();
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

    fireGun() {
       this.tank.tankFire();
    }
}

window.onload = () => {
    var game = new SimpleGame();
};

enum Directions { Up, Down, Left, Right, None }

class Tank {
    private tank: Phaser.Sprite;
    private bullets: Phaser.Group;
    private ownerGame: Phaser.Game;
    private tankSpeed: number = 3;
    private direction: number;

    constructor(game: Phaser.Game, spriteName: string, bulletName: string) {
        this.ownerGame = game;

        // Create tank.
        this.tank = game.add.sprite(game.width / 2, game.height / 2, spriteName);
        this.tank.anchor.set(0.5, 0.5);

        // Tank physics.
        game.physics.enable(this.tank, Phaser.Physics.ARCADE);
        this.tank.body.collideWorldBounds = true;
        this.tank.body.bounce.y = 1;
        this.tank.body.bounce.x = 0.5;

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
                this.tank.angle = 0;
                return;
            case Directions.Left:
                this.tank.angle = -90;
                return;
            case Directions.Down:
                this.tank.angle = 180;
                return;
            case Directions.Right:
                this.tank.angle = 90;
                return;
        }
    }

    getDirection() : Directions {
        return this.direction;
    }

    tankEndMove() {
        this.direction = Directions.None;
    }

    tankMove() {
        switch (this.direction) {
            case Directions.None:
                return;
            case Directions.Up:
                this.tank.position.add(0, -1 * this.tankSpeed);
                return;
            case Directions.Down:
                this.tank.position.add(0, this.tankSpeed);
                return;
            case Directions.Left:
                this.tank.position.add(-1 * this.tankSpeed, 0);
                return;
            case Directions.Right:
                this.tank.position.add(this.tankSpeed, 0);
                return;
            default:
        }
    }

    tankFire() {
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
        this.ownerGame.physics.arcade.moveToXY(bullet, this.tank.x + xOffset, this.tank.y + yOffset, 1000);
    }
}