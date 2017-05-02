/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
class SimpleGame {
    private game: Phaser.Game;
    private player: Tank;
    private enemies: Tank[];
    private socket: any;

    constructor() {
        this.game = new Phaser.Game(1200, 750, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload, update: this.update
            // TODO: Check this http://phaser.io/docs/2.4.4/Phaser.State.html
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
        // Set-up physics.
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // Set-up inputs.
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.W, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.A, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.S, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);
        SimpleGame.registerKeyInputs(this, Phaser.Keyboard.D, SimpleGame.prototype.moveTank, SimpleGame.prototype.stopTank);    
    
        // Add player, give it an id and put it at random location.
        let x = Math.floor(this.game.width * Math.random());
        let y = Math.floor(this.game.height * Math.random());
        let id = Math.ceil(Math.random() * 1000);
        this.player = new Tank(this.game, id, x, y);
        
        // Create socket, register events and tell the server
        this.socket = io();
        let self = this;
        this.socket.on("tankUpdateGlobal", function(player: IUpdatemessage) {
               // If player has no blood, remove it from the list.
               // TODO: At least you should merge the logic.
               if (player.blood <= 0) {
                   // TODO: Refactor these ugly logic.
                   let foundTank: Tank;
                   self.enemies.forEach(item => {
                        if (player.tankId == item.id) {
                            foundTank = item;
                        }});
                   foundTank.setByJson(player);
                   let index = self.enemies.indexOf(foundTank);
                   if (index > -1) {
                        self.enemies.splice(index, 1);                    
                   }
                   // Should also try to destroy the sprite and text.
                   return;
               }

               if (self.enemies == undefined) {
                   self.enemies = [new Tank(self.game, player.tankId, player.x, player.y)];
               }
               else {
                    let exist: boolean = false;
                    self.enemies.forEach(item => {
                        if (player.tankId == item.id) {
                            item.setByJson(player);
                            exist = true;
                        } 
                    });
                    if (!exist) {
                        self.enemies.push(new Tank(self.game, player.tankId, player.x, player.y));
                    }
               }
         });  
    }

    update() {
        // First, update tank itself.
        this.player.tankUpdate();
        
        // Then, fire if it should.
        let firing = false;
        if (this.game.input.activePointer.isDown) {
            firing = this.player.tankFire();
        }

        // Third, let others know your decision.
        this.socket.emit("tankUpdate", this.player.getJson(firing));

        // Finally, check collision.
        if (this.enemies != undefined) {
            this.enemies.forEach(enemy => this.player.checkCombatResult(enemy));
        }

        if (this.player.blood <= 0) {
            // TODO: we should game over at here.
        }
    }

    stopTank(e: Phaser.Key) {
        let shouldStop = false;

        switch (e.event.key) {
            case "w":
                shouldStop = this.player.getDirection() === Directions.Up; break;
            case "a":
                shouldStop = this.player.getDirection() === Directions.Left; break;
            case "s":
                shouldStop = this.player.getDirection() === Directions.Down; break;
            case "d":
                shouldStop = this.player.getDirection() === Directions.Right; break;
        }

        if (shouldStop) {
            this.player.tankEndMove();
        }
    }
    
    moveTank(e: Phaser.Key) {
        switch (e.event.key) {
            case "w":
                this.player.tankStartMove(Directions.Up);
                return;
            case "a":
                this.player.tankStartMove(Directions.Left);
                return;
            case "s":
                this.player.tankStartMove(Directions.Down);
                return;
            case "d":
                this.player.tankStartMove(Directions.Right);
                return;
        }
    }

    static registerKeyInputs(self: any, key: number, keydownHandler: any, keyupHandler?: any) {
        let realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null) realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null) realKey.onUp.add(keyupHandler, self);
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
}