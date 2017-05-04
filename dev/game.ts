/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
class SimpleGame {
    private _game: Phaser.Game;
    private _player: Tank;
    private _enemies: Tank[];
    private _socket: any;

    constructor() {
        this._game = new Phaser.Game(1200, 750, Phaser.AUTO, 'content', {
            create: this.create, preload: this.preload, update: this.update
            // TODO: Check this http://phaser.io/docs/2.4.4/Phaser.State.html
        });
    }

    preload() {
        this._game.load.image(sandbagName, "../resources/tank.png");
        this._game.load.image(bulletName, "../resources/bullet.png");
        this._game.load.image(particleName, "../resources/particle.png");
        this._game.load.image(tankbodyName, "../resources/tankbody.png");
        this._game.load.image(guntowerName, "../resources/guntower.png");
        this._game.stage.disableVisibilityChange = true;
    }

    create() {
        // Set-up physics.
        this._game.physics.startSystem(Phaser.Physics.ARCADE);

        // Set-up inputs.
        for (let key of [ Phaser.Keyboard.W, Phaser.Keyboard.A, Phaser.Keyboard.S, Phaser.Keyboard.D ]) {
            SimpleGame.registerKeyInputs(this, key, SimpleGame.prototype.onKeyDown, SimpleGame.prototype.onKeyUp);
        }

        // Add player, give it an id and put it at random location. TODO: Let's pray there won't be equal Id.
        let x = Math.floor(this._game.width * Math.random());
        let y = Math.floor(this._game.height * Math.random());
        let id = Math.ceil(Math.random() * 1000);
        this._player = new Tank(this._game, id, x, y);
        
        // Create socket, register events and tell the server
        this._socket = io();
        let self = this;
        // TODO: Refactor. I hate these code.
        this._socket.on(tankUpdateGlobalEventName, function(player: UpdateMessage) {
               // If player has no blood, remove it from the list.
               // TODO: At least you should merge the logic.
               if (player.blood <= 0) {
                   // TODO: Refactor these ugly logic.
                   let foundTank: Tank;
                   self._enemies.forEach(item => {
                        if (player.tankId == item.id) {
                            foundTank = item;
                        }});
                   foundTank.setByJson(player);
                   let index = self._enemies.indexOf(foundTank);
                   if (index > -1) {
                        self._enemies.splice(index, 1);                    
                   }
                   // Should also try to destroy the sprite and text.
                   return;
               }

               if (self._enemies == undefined) {
                   self._enemies = [new Tank(self._game, player.tankId, player.x, player.y)];
               }
               else {
                    let exist: boolean = false;
                    self._enemies.forEach(item => {
                        if (player.tankId == item.id) {
                            item.setByJson(player);
                            exist = true;
                        } 
                    });
                    if (!exist) {
                        self._enemies.push(new Tank(self._game, player.tankId, player.x, player.y));
                    }
               }
         });  
    }

    private nextUpdate: number = 0;

    update() {
        // First, update tank itself.
        let message = this._player.update(this._game.input.activePointer.isDown);
        this._socket.emit(tankUpdateEventName, message);

        // Then, check collision.
        if (this._enemies != undefined) {
            this._enemies.forEach(enemy => this._player.checkCombatResult(enemy));
        }
    }

    private onKeyDown(e: Phaser.Key) {
        let addDirection = SimpleGame.mapKeyToDirection(e.event.key);
        MovementHelper.addDirectionIntegral(this._player, addDirection);
    }

    private onKeyUp(e: Phaser.Key) {
        let removeDirection = SimpleGame.mapKeyToDirection(e.event.key);
        MovementHelper.removeDirectionIntegral(this._player, removeDirection);
    }
    
    private static mapKeyToDirection(key: any) : Directions {
        let direction: Directions = Directions.None;
        switch (key) {
            case "w": direction = Directions.Up; break;
            case "a": direction = Directions.Left; break;
            case "s": direction = Directions.Down; break;
            case "d": direction = Directions.Right; break;
        }
        return direction;
    }

    private static registerKeyInputs(self: any, key: number, keydownHandler: any, keyupHandler?: any) {
        let realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null) realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null) realKey.onUp.add(keyupHandler, self);
    }

    private static createSandbagAndMakeItMove(game: Phaser.Game) : Phaser.Sprite {
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