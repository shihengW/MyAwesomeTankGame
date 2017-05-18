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
                // TODO: Check this http://phaser.io/docs/2.4.4/Phaser.State.html
                create: this.create, preload: this.preload, update: this.update
        });
    }

    preload() {
        this.game.load.image(SandbagName, "../resources/tank.png");
        this.game.load.image(BulletName, "../resources/bullet.png");
        this.game.load.image(ParticleName, "../resources/particle.png");
        this.game.load.image(TankbodyName, "../resources/tankbody.png");
        this.game.load.image(GuntowerName, "../resources/guntower.png");
        this.game.stage.disableVisibilityChange = true;
    }

    create() {
        // Set-up physics.
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // Set-up bg, player, socket, map, joystick.
        let self = this;
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
            message = this._player.updateTank(result.fire);
        }
        else {
            message = this._player.updateTank(this.game.input.activePointer.isDown);
        }
        this._socket.emit(TankUpdateEventName, message);
        
        // Then, check collision.
        let hitMessage = TheGame.combat(this.game, this._player, this._enemies);
        if (hitMessage != undefined) {
            this._socket.emit(HitEventName, hitMessage);
        }

        if (this._player.blood <= 0) {
            this._player._gameOver = true;
            TankHelper.onExplode(this._player);
        }

        // Finally, update minimap.
        this._miniMap.updateMap(this._player.direction != Directions.None);
    }

    static combat(game: Phaser.Game, player: Tank, others: Tank[]) : HitMessage {
        if (others == undefined) {
            return undefined;
        }
        let hitMessage: HitMessage = undefined;
        let tanks = others.concat(player);
        let bullets = tanks.map(item => item._bullets);
        game.physics.arcade.collide(bullets, tanks, (tank: Tank, bullet: Phaser.Sprite) => {
            if (tank.id === player.id) {
                hitMessage = player.onHit(bullet);
            }
            else {
                TankHelper.onHitVisual(bullet, tank, game);
            }
        });

        return hitMessage;
    }

    static setupPlayer(self: TheGame) {
        let x = Math.floor(GameWidth * Math.random());
        let y = Math.floor(GameHeight * Math.random());
        let id = Math.ceil(Math.random() * 1000);

        self._player = Tank.create(self.game, id, x, y);
        self.game.camera.follow(self._player);
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