/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
class TheGame {
    private game: Phaser.Game;
    // How to control a tank?
    // 1. Update.
    // 2. Check collision.
    // 3. Update by json.
    private _player: Tank;
    private _enemies: Tank[];
    private _socket: any;

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
        for (let key of [ Phaser.Keyboard.W, Phaser.Keyboard.A, Phaser.Keyboard.S, Phaser.Keyboard.D ]) {
            TheGame.registerKeyInputs(this, key, TheGame.prototype.onKeyDown, TheGame.prototype.onKeyUp);
        }

        // Add player, give it an id and put it at random location. TODO: Let's pray there won't be equal Id.
        let x = Math.floor(this.game.width * Math.random());
        let y = Math.floor(this.game.height * Math.random());
        let id = Math.ceil(Math.random() * 1000);
        this._player = new Tank(this.game, id, x, y);
        
        // Create socket, register events and tell the server
        this._socket = io();
        let self = this;
        // Add new -> show.
        this._socket.on(addNewGlobalEventName, function(player: Message) {
            TheGame.updateEnemyByJson(self, player);
        });

        // Update -> update.
        this._socket.on(tankUpdateGlobalEventName, function(player: Message) {
            TheGame.updateEnemyByJson(self, player);
         });

        // Hit -> hit.
        this._socket.on(hitGlobalEventName, function(player: HitMessage) {
            let tank = TheGame.getOrAddEnemy(self, player);
            // If player has no blood, remove it from the list.
            if (player.blood <= 0) {
                TheGame.removeEnemyByJson(self, player);
                tank.explode();
            }
            else {
                tank.hitEffect(player.hitX, player.hitY);
            }
        });

        this._socket.on(goneGlobalEventName, function(player: Message) {
            // If player has no blood, remove it from the list.
            let tank = TheGame.removeEnemyByJson(self, player);
            tank.explode();
        });

        // Finally, let others know me.
        this._socket.emit(addNewEventName, { tankId: id, x: x, y: y,
            gunAngle: 0, tankAngle: 0, firing: undefined, blood: 100 });
    }

    update() {
        // First, update tank itself.
        let message = this._player.update(this.game.input.activePointer.isDown);
        this._socket.emit(tankUpdateEventName, message);

        // Then, check collision.
        if (this._enemies != undefined) {
            this._enemies.forEach(enemy => {
                let hitMessage = this._player.combat(enemy);
                if (hitMessage != undefined) {
                    this._socket.emit(hitEventName, hitMessage);
                }
            });
        }
    }

// #region: privates.
    private onKeyDown(e: Phaser.Key) {
        let addDirection = TheGame.mapKeyToDirection(e.event.key);
        MovementHelper.addDirectionIntegral(this._player, addDirection);
    }

    private onKeyUp(e: Phaser.Key) {
        let removeDirection = TheGame.mapKeyToDirection(e.event.key);
        MovementHelper.removeDirectionIntegral(this._player, removeDirection);
    }
    
    private static removeEnemyByJson(self: TheGame, enemy: IdMessage): Tank {
        // TODO: Refactor these ugly logic.
        let foundTank: Tank = undefined;
        self._enemies.forEach(item => {
            if (enemy.tankId == item.id) {
                foundTank = item;
            }});
        let index = self._enemies.indexOf(foundTank);
        if (index > -1) { 
            self._enemies.splice(index, 1); 
        }

        return foundTank;
    }

    private static getOrAddEnemy(self: TheGame, enemy: IdMessage) : Tank {
        let tank: Tank = undefined;
        if (self._enemies == undefined) {
            tank = new Tank(self.game, enemy.tankId, 0, 0)
            self._enemies = [tank];
        }
        else {
            let exist: boolean = false;
            self._enemies.forEach(item => {
                if (enemy.tankId == item.id) {
                    tank = item;
                    exist = true;
                } 
            });
            if (!exist) {
                tank = new Tank(self.game, enemy.tankId, 0, 0);
                self._enemies.push(tank);
            }
        }
        return tank;
    }

    private static updateEnemyByJson(self: TheGame, enemy: Message) {
        let tank = TheGame.getOrAddEnemy(self, enemy);
        tank.updateByJson(enemy)
    }

    private static registerKeyInputs(self: any, key: number, keydownHandler: any, keyupHandler?: any) {
        let realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null) realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null) realKey.onUp.add(keyupHandler, self);
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
// #endregion
}