class SimpleGame {

    game: Phaser.Game;
    tank: Phaser.Sprite;
    W: Phaser.Key;
    A: Phaser.Key;
    S: Phaser.Key;
    D: Phaser.Key;

    constructor() {
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload
        });
    }

    preload() {
        var loader = this.game.load.image("tank", "../Resources/tank.png");
    }

    moveTank(e: KeyboardEvent) {

        let delta = e.ctrlKey ? 5 : 1;

        switch (e.key) {
            case "w":
                this.tank.position.add(0, -1 * delta);
                return;
            case "a":
                this.tank.position.add(-1 * delta, 0);
                return;
            case "s":
                this.tank.position.add(0, delta);
                return;
            case "d":
                this.tank.position.add(delta, 0);
                return;
        }

        if (this.tank.position.x > this.game.width) { this.tank.position.x = this.game.width; }
        else if (this.tank.position.x < 0) { this.tank.position.x = 0; }

        if (this.tank.position.y > this.game.height) { this.tank.position.y = this.game.height; }
        else if (this.tank.position.y < 0) { this.tank.position.y = 0; }
    }

    
    create() {

        var image = <Phaser.Image>this.game.cache.getImage("tank");
        this.tank = this.game.add.sprite(this.game.width / 2 - image.width / 2,
            this.game.height / 2 - image.height / 2,
            "tank");

        this.W = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.A = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.S = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.D = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

        this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.W);

        this.W.onDown.add(SimpleGame.prototype.moveTank, this);
        this.A.onDown.add(SimpleGame.prototype.moveTank, this);
        this.S.onDown.add(SimpleGame.prototype.moveTank, this);
        this.D.onDown.add(SimpleGame.prototype.moveTank, this);
    }
}

window.onload = () => {
    var game = new SimpleGame();
};
