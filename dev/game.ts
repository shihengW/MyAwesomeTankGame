/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
class TheGame implements Socket, Inputs, Torch {
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
        let self = this;
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        TheGame.setupBackground(this.game);
        TheGame.prototype.setupKeys(self);
        TheGame.setupPlayer(self);
        TheGame.prototype.setupSocket(self);
        TheGame.setupForeground(self);
        TheGame.prototype.createTorch.call(self, self.game);
    }

    update() {
        let message: FullMessage = undefined;
        
        // 1. Drive or fire.
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
                
        // 2. check collision.
        let hitMessage = TheGame.combat(this.game, this._player, this._enemies);

        // 3. Send message.
        message.blood = this._player.blood;
        Socket.sendMessage(this._socket, TankUpdateEventName, message);

        // 4. Update torch.
        TheGame.prototype.updateTorch.call(this, this._player.body.position, 
            this._player.rotation + this._player._guntower.rotation);
        
        // 5. Update minimap.
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

// set-ups

    static setupPlayer(self: TheGame) {
        let x = Math.floor(GameWidth * Math.random());
        let y = Math.floor(GameHeight * Math.random());
        let id = Math.ceil(Math.random() * 1000);

        self._player = Tank.create(self.game, id, x, y);
        self.game.camera.follow(self._player);
    }

    static setupBackground(game: Phaser.Game) {
        game.world.setBounds(0, 0, GameWidth, GameHeight);
        TheGame.drawGrids(game.add.graphics(0, 0), GameWidth, GameHeight);
        let deadzoneOffsetX = Math.abs(Math.floor(game.width / 2.3));
        let deadzoneOffsetY = Math.abs(Math.floor(game.height / 2.3));
        game.camera.deadzone = new Phaser.Rectangle(deadzoneOffsetX, deadzoneOffsetY, 
                game.width - deadzoneOffsetX * 2, game.height - deadzoneOffsetY * 2);
    }

    static drawGrids(graphics: Phaser.Graphics, width: number, height: number) {
        let hnum: number = Math.floor(width / GridWidth);
        let vnum: number = Math.floor(height / GridHeight);

        graphics.lineStyle(2, 0xE03F00, 1);
        for (let i = 2; i < hnum - 2; i++) {
            let x: number = i * GridWidth;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        graphics.lineStyle(2, 0x00E05E, 1);
        for (let i = 2; i < vnum - 2; i++) {
            let y: number = i * GridHeight;
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
    }

    static setupForeground(self: TheGame) {
        self._miniMap = new MiniMap(self.game, self._player);
        if (MobileChecker.isMobile()) {
            self._joystick = new Joystick(self.game);
            self._joystick.drawJoystick();
        }
    }

//

// Mixin-Socket
    _socket: any;
    _enemies: Tank[];
    setupSocket: (self: TheGame) => void;
    static getOrAddEnemy: (self: TheGame, enemy: IdMessage) => Tank;
    static updateEnemyByJson: (self: TheGame, enemy: FullMessage) => void;
    static removeEnemyByJson: (self: TheGame, enemy: IdMessage) => Tank;
    static sendMessage: (socket: SocketIOClient.Socket, messageName: string, message: any) => void;
//

// Mixin-Inputs
    _player: Tank;
    game: Phaser.Game;
    setupKeys: (self: TheGame) => void;
    private registerKeyInputs: (key: number, keydownHandler: any, keyupHandler?: any) => void;
    private onKeyDown: (e: Phaser.Key) => void;
    private onKeyUp: (e: Phaser.Key) => void;
    private static mapKeyToDirection: (key: any) => Directions;
//

// Mixin-Torch
    _shadowTexture: Phaser.BitmapData;
    _torch: Phaser.Image;

    createTorch: (game: Phaser.Game) => void;
    updateTorch: (position: Phaser.Point) => void;
//
}

applyMixins(TheGame, [Socket, Inputs, Torch]);