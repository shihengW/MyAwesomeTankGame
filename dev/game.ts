/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />

enum Directions { Up, Down, Left, Right, None }

class SimpleGame {
    game: Phaser.Game;
    tank: Tank;
    sandbag: Phaser.Sprite;
    enemies: Tank[];
    id: number = Math.random() * 10000;

    // Find its real class;
    socket: any;

    constructor() {
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload, update: this.update
        });
    }

    preload() {
        this.game.load.image(sandbagName, "../resources/tank.png");
        this.game.load.image(bulletName, "../resources/bullet.png");
        this.game.load.image(particleName, "../resources/particle.png");
        this.game.load.image(tankbodyName, "../resources/tankbody.png");
        this.game.load.image(guntowerName, "../resources/guntower.png");
        this.game.stage.disableVisibilityChange = true;
    }

    create() {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // Inputs.
        SimpleGame.registerKey(this, Phaser.Keyboard.W, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.A, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.S, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKey(this, Phaser.Keyboard.D, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);    
    
        // Add yourself.
        // Create the tank, give it a random location an let the server know.
        let x = Math.floor(this.game.width * Math.random());
        let y = Math.floor(this.game.height * Math.random());
        this.tank = new Tank(this.game, this.id, x, y);
        
        // Create socket and tell the server
        this.socket = io();
        let self = this;

        // First register everything I need.
        this.socket.on("tankUpdateGlobal", function(player:any) {
               let exist: boolean = false;

               if (self.enemies == undefined) {
                   self.enemies = [new Tank(self.game, player.id, player.x, player.y)];
               }

               self.enemies.forEach(item => {
                    if (player.id == item.id) {
                        item.setByJson(player);
                        exist = true;   
                    } 
               })
               if (!exist) {
                   self.enemies.push(new Tank(self.game, player.id, player.x, player.y));
               }
         });  
        // Add a sandbag for testing.
        // this.sandbag = SimpleGame.createSandbagAndMakeItMove(this.game);
    }

    static createSandbagAndMakeItMove(game: Phaser.Game) : Phaser.Sprite {
        let sandbag = game.add.sprite(game.width, game.height / 2 - 50, sandbagName);

        // Setup
        game.physics.arcade.enable(sandbag);
        sandbag.body.collideWorldBounds = true;
        sandbag.body.bounce.x = 1;
        sandbag.body.bounce.y = 1;
        sandbag.body.mass = 100;
        sandbag.anchor.set(0.5, 0.5);

        // Make it run.
        // TODO: Should find a way to make it run randomly.
        game.physics.arcade.accelerateToXY(sandbag, game.width / 2, game.height / 2 - 50, 100);
        return sandbag;
    }

    // Don't know how to make this more acurate, actually, this is not a SimpleGame.
    static registerKey(self: SimpleGame, key: number, keydownHandler: any, keyupHandler?: any) : Phaser.Key {
        let realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null) realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null) realKey.onUp.add(keyupHandler, self);
        // I don't think the output is going to be used.
        return realKey;
    }

    update() {
        // First, update tank itself.
        this.tank.tankUpdate();
        
        // Then, fire if it should.
        let firing = false;
        if (this.game.input.activePointer.isDown) {
            firing = this.tank.tankFire();
        }

        // Third, let others know your decision.
        this.socket.emit("tankUpdate", this.tank.getJson(firing));

        // Finally, check collision.
        if (this.enemies != undefined) {
            this.enemies.forEach(enemy => this.tank.checkCollide(enemy));
        }
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
}