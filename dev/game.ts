/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
class TheGame implements GameSocket, Inputs {
    game: Phaser.Game;
    _miniMap: MiniMap;
    _joystick: Joystick;

    constructor() {
        this.game = new Phaser.Game(
            window.innerWidth - 30/*slideroffset*/, 
            window.innerHeight - 30/*slideroffset*/, 
            Phaser.CANVAS, 'body', { 
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

        let self = this;
        // Set-up bg, player, socket, map, joystick.
        TheGame.setupBackground(this.game);
        TheGame.prototype.setupKeys(self);
        TheGame.setupPlayer(self);
        TheGame.prototype.setupSocket(self);
        TheGame.setupForeground(self);
    }

    update() {
        let message: any = undefined;
        // First, update tank itself.
        if (this._joystick != undefined) {
            let result = this._joystick.checkPointer();
            if (this._player.direction != result.direction) {
                this._player.drive(result.direction);
            }
            message = this._player.update(result.fire);
        }
        else {
            message = this._player.update(this.game.input.activePointer.isDown);
        }
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

        // Finally, update minimap.
        this._miniMap.updateMap(this._player.direction != Directions.None);
    }

    static setupPlayer(self: TheGame) {
        let x = Math.floor(GameWidth * Math.random());
        let y = Math.floor(GameHeight * Math.random());
        let id = Math.ceil(Math.random() * 1000);

        self._player = new Tank(self.game, id, x, y);
        self.game.camera.follow(self._player._tankbody);
    }

    static setupBackground(game: Phaser.Game) {
        game.world.setBounds(0, 0, GameWidth, GameHeight);
        DrawHelpers.drawGrids(game.add.graphics(0, 0), GameWidth, GameHeight);
        let deadzoneOffsetX = Math.abs(Math.floor(game.width / 2.3));
        let deadzoneOffsetY = Math.abs(Math.floor(game.height / 2.3));
        game.camera.deadzone = new Phaser.Rectangle(deadzoneOffsetX, deadzoneOffsetY, 
                game.width - deadzoneOffsetX * 2, game.height - deadzoneOffsetY * 2);
    }

    static setupForeground(self: TheGame) {
        self._miniMap = new MiniMap(self.game, self._player);
        if (MobileChecker.isMobile()) {
            self._joystick = new Joystick(self.game);
            self._joystick.drawJoystick();
        }
    }

// Mixin-Socket
    _socket: any;
    _enemies: Tank[];
    setupSocket: (self: TheGame) => void;
    static getOrAddEnemy: (self: TheGame, enemy: IdMessage) => Tank;
    static updateEnemyByJson: (self: TheGame, enemy: Message) => void;
    static removeEnemyByJson: (self: TheGame, enemy: IdMessage) => Tank;
//
// Inputs
    _player: Tank;
    setupKeys: (self: TheGame) => void;
    onKeyDown: (e: Phaser.Key) => void;
    onKeyUp: (e: Phaser.Key) => void;
    static registerKeyInputs: (self: any, key: number, keydownHandler: any, keyupHandler?: any) => void;
    static mapKeyToDirection: (key: any) => Directions;
//
}

applyMixins(TheGame, [GameSocket, Inputs]);