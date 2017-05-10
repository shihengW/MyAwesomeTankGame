var Directions;
(function (Directions) {
    Directions[Directions["None"] = 0] = "None";
    Directions[Directions["Up"] = 2] = "Up";
    Directions[Directions["Down"] = 4] = "Down";
    Directions[Directions["Left"] = 8] = "Left";
    Directions[Directions["Right"] = 16] = "Right";
    Directions[Directions["UpLeft"] = 10] = "UpLeft";
    Directions[Directions["UpRight"] = 18] = "UpRight";
    Directions[Directions["DownLeft"] = 12] = "DownLeft";
    Directions[Directions["DownRight"] = 20] = "DownRight";
})(Directions || (Directions = {}));
/// <reference path="../.ts_dependencies/phaser.d.ts" />
var DrawHelpers = (function () {
    function DrawHelpers() {
    }
    DrawHelpers.drawGrids = function (graphics, width, height) {
        var hnum = Math.floor(width / GridWidth);
        var vnum = Math.floor(height / GridHeight);
        graphics.lineStyle(2, 0xE03F00, 1);
        for (var i = 2; i < hnum - 2; i++) {
            var x = i * GridWidth;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        graphics.lineStyle(2, 0x00E05E, 1);
        for (var i = 2; i < vnum - 2; i++) {
            var y = i * GridHeight;
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
    };
    return DrawHelpers;
}());
var MiniMap = (function () {
    function MiniMap(game, player) {
        this._bounds = new Phaser.Point(100, 80);
        this._offsets = new Phaser.Point(10, 10);
        this._show = false;
        this._isBlinkingEnemy = false;
        this._graphicsOuter = game.add.graphics(this._offsets.x, this._offsets.y);
        this._graphicsPlayer = game.add.graphics(this._offsets.x, this._offsets.y);
        this._graphicsEnemy = game.add.graphics(this._offsets.x, this._offsets.y);
        // This should not be affected by camera.
        this._graphicsOuter.fixedToCamera = true;
        this._graphicsPlayer.fixedToCamera = true;
        this._graphicsEnemy.fixedToCamera = true;
        this._player = player;
        this._game = game;
    }
    MiniMap.prototype.updateMap = function (show) {
        this._graphicsPlayer.clear();
        if (show || this._isBlinkingEnemy) {
            if (!this._show) {
                this._show = true;
                this._graphicsOuter.beginFill(0x4D5300, 0.5);
                this._graphicsOuter.lineStyle(1, 0x4D5359, 0.5);
                this._graphicsOuter.drawRect(this._offsets.x, this._offsets.y, this._bounds.x, this._bounds.y);
                this._graphicsOuter.endFill();
            }
            var spot = this.getPlayer();
            this._graphicsPlayer.lineStyle(4, 0x00AF00, 0.8);
            this._graphicsPlayer.drawRect(spot.x, spot.y, 4, 4);
        }
        else {
            this._show = false;
            this._graphicsOuter.clear();
        }
    };
    MiniMap.prototype.blinkEnemy = function (x, y) {
        this._isBlinkingEnemy = true;
        if (!this._show) {
            this.updateMap(true);
        }
        var spot = this.getPositionCore(x, y);
        this._graphicsEnemy.lineStyle(4, 0xAF0000, 0.8);
        this._graphicsEnemy.drawRect(spot.x, spot.y, 4, 4);
        var self = this;
        setTimeout(function () {
            self._graphicsEnemy.clear();
            self._isBlinkingEnemy = false;
        }, 500);
    };
    MiniMap.prototype.getPositionCore = function (x, y) {
        return new Phaser.Point(x / GameWidth * this._bounds.x + 10, y / GameHeight * this._bounds.y + 10);
    };
    MiniMap.prototype.getPlayer = function () {
        return this.getPositionCore((this._player.getBody()).position.x, (this._player.getBody()).position.y);
    };
    return MiniMap;
}());
var Joystick = (function () {
    function Joystick(game) {
        this._r = 200;
        this._offset = 0;
        this._radMin = Math.PI * 0.25;
        this._game = game;
        this._graphics = game.add.graphics(0, 0);
        this._graphics.fixedToCamera = true;
        this._center = new Phaser.Point(this._r + this._offset, this._game.camera.height - this._r - this._offset);
    }
    Joystick.prototype.drawJoystick = function () {
        this._graphics.lineStyle(20, 0x00AF00, 0.8);
        this._graphics.drawCircle(this._center.x, this._center.y, this._r);
    };
    Joystick.prototype.checkPointer = function () {
        var fire = false;
        var drive = false;
        var direction = Directions.None;
        if (this._game.input.pointer1.isDown) {
            var d = this.getDirection(this._game.input.pointer1.position);
            if (d == undefined) {
                fire = true;
            }
            else {
                drive = true;
                direction = d;
            }
        }
        if (this._game.input.pointer2.isDown) {
            var d = this.getDirection(this._game.input.pointer2.position);
            if (d == undefined) {
                fire = true;
            }
            else {
                drive = true;
                direction = d;
            }
        }
        return { fire: fire, drive: drive, direction: direction };
    };
    Joystick.prototype.getDirection = function (point) {
        if (Phaser.Math.distance(point.x, point.y, this._center.x, this._center.y) > (this._r + this._offset)) {
            return undefined;
        }
        var rad = Phaser.Math.angleBetweenPoints(this._center, point);
        if (rad > -0.5 * this._radMin && rad < 0.5 * this._radMin) {
            return Directions.Right;
        }
        if (rad > 0.5 * this._radMin && rad < this._radMin) {
            return Directions.DownRight;
        }
        if (rad > this._radMin && rad < 1.5 * this._radMin) {
            return Directions.Down;
        }
        if (rad > 1.5 * this._radMin && rad < 2 * this._radMin) {
            return Directions.DownLeft;
        }
        if (rad > 2 * this._radMin || rad < -2 * this._radMin) {
            return Directions.Left;
        }
        if (rad < -0.5 * this._radMin && rad > -1 * this._radMin) {
            return Directions.UpRight;
        }
        if (rad < -1 * this._radMin && rad > -1.5 * this._radMin) {
            return Directions.Up;
        }
        if (rad < -1.5 * this._radMin && rad > -2 * this._radMin) {
            return Directions.UpLeft;
        }
        return Directions.None;
    };
    return Joystick;
}());
/// <reference path="../.ts_dependencies/pixi.d.ts" />
/// <reference path="../.ts_dependencies/phaser.d.ts" />
/// <reference path="../.ts_dependencies/socket.io-client.d.ts" />
var TheGame = (function () {
    function TheGame() {
        this.game = new Phaser.Game(window.innerWidth - 30 /*slideroffset*/, window.innerHeight - 30 /*slideroffset*/, Phaser.CANVAS, 'body', {
            create: this.create, preload: this.preload, update: this.update
            // TODO: Check this http://phaser.io/docs/2.4.4/Phaser.State.html
        });
        // this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
    }
    TheGame.prototype.preload = function () {
        this.game.load.image(sandbagName, "../resources/tank.png");
        this.game.load.image(bulletName, "../resources/bullet.png");
        this.game.load.image(particleName, "../resources/particle.png");
        this.game.load.image(tankbodyName, "../resources/tankbody.png");
        this.game.load.image(guntowerName, "../resources/guntower.png");
        this.game.stage.disableVisibilityChange = true;
    };
    TheGame.prototype.create = function () {
        // Set-up physics.
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        // Set-up world and bg.
        this.game.world.setBounds(0, 0, GameWidth, GameHeight);
        var graphics = this.game.add.graphics(0, 0);
        DrawHelpers.drawGrids(graphics, GameWidth, GameHeight);
        // Set-up inputs.
        for (var _i = 0, _a = [Phaser.Keyboard.W, Phaser.Keyboard.A, Phaser.Keyboard.S, Phaser.Keyboard.D,
            Phaser.Keyboard.UP, Phaser.Keyboard.LEFT, Phaser.Keyboard.DOWN, Phaser.Keyboard.RIGHT]; _i < _a.length; _i++) {
            var key = _a[_i];
            TheGame.registerKeyInputs(this, key, TheGame.prototype.onKeyDown, TheGame.prototype.onKeyUp);
        }
        // Add player, give it an id and put it at random location. TODO: Let's pray there won't be equal Id.
        var x = Math.floor(GameWidth * Math.random());
        var y = Math.floor(GameHeight * Math.random());
        var id = Math.ceil(Math.random() * 1000);
        this._player = new Tank(this.game, id, x, y);
        this.game.camera.follow(this._player.getBody());
        var deadzoneOffsetX = Math.abs(Math.floor(this.game.width / 2.3));
        var deadzoneOffsetY = Math.abs(Math.floor(this.game.height / 2.3));
        this.game.camera.deadzone = new Phaser.Rectangle(deadzoneOffsetX, deadzoneOffsetY, this.game.width - deadzoneOffsetX * 2, this.game.height - deadzoneOffsetY * 2);
        // Create socket, register events and tell the server
        this._socket = io();
        var self = this;
        // Add new -> show.
        this._socket.on(addNewGlobalEventName, function (player) {
            TheGame.updateEnemyByJson(self, player);
        });
        // Update -> update.
        this._socket.on(tankUpdateGlobalEventName, function (player) {
            TheGame.updateEnemyByJson(self, player);
            if (player.firing != undefined) {
                self._miniMap.blinkEnemy(player.x, player.y);
            }
        });
        this._socket.on(goneGlobalEventName, function (player) {
            // If player has no blood, remove it from the list.
            var tank = TheGame.removeEnemyByJson(self, player);
            tank.explode();
        });
        // Finally, let others know me.
        this._socket.emit(addNewEventName, { tankId: id, x: x, y: y,
            gunAngle: 0, tankAngle: 0, firing: undefined, blood: 100 });
        // mini map.
        this._miniMap = new MiniMap(this.game, this._player);
        if (isMobile.any()) {
            this._joystick = new Joystick(this.game);
            this._joystick.drawJoystick();
        }
    };
    TheGame.prototype.update = function () {
        var _this = this;
        var message = undefined;
        // First, update tank itself.
        if (this._joystick != undefined) {
            var result = this._joystick.checkPointer();
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
            this._enemies.forEach(function (enemy) {
                var hitMessage = _this._player.combat(enemy);
                if (hitMessage != undefined) {
                    _this._socket.emit(hitEventName, hitMessage);
                }
            });
        }
        // Finally, update minimap.
        this._miniMap.updateMap(this._player.direction != Directions.None);
    };
    // #region: privates.
    TheGame.prototype.onKeyDown = function (e) {
        var addDirection = TheGame.mapKeyToDirection(e.event.key);
        MovementHelpers.addDirectionIntegral(this._player, addDirection);
    };
    TheGame.prototype.onKeyUp = function (e) {
        var removeDirection = TheGame.mapKeyToDirection(e.event.key);
        MovementHelpers.removeDirectionIntegral(this._player, removeDirection);
    };
    TheGame.removeEnemyByJson = function (self, enemy) {
        // TODO: Refactor these ugly logic.
        var foundTank = undefined;
        self._enemies.forEach(function (item) {
            if (enemy.tankId == item.id) {
                foundTank = item;
            }
        });
        var index = self._enemies.indexOf(foundTank);
        if (index > -1) {
            self._enemies.splice(index, 1);
        }
        return foundTank;
    };
    TheGame.getOrAddEnemy = function (self, enemy) {
        var tank = undefined;
        if (self._enemies == undefined) {
            tank = new Tank(self.game, enemy.tankId, 0, 0);
            self._enemies = [tank];
        }
        else {
            var exist_1 = false;
            self._enemies.forEach(function (item) {
                if (enemy.tankId == item.id) {
                    tank = item;
                    exist_1 = true;
                }
            });
            if (!exist_1) {
                tank = new Tank(self.game, enemy.tankId, 0, 0);
                self._enemies.push(tank);
            }
        }
        return tank;
    };
    TheGame.updateEnemyByJson = function (self, enemy) {
        var tank = TheGame.getOrAddEnemy(self, enemy);
        tank.updateByJson(enemy);
    };
    TheGame.registerKeyInputs = function (self, key, keydownHandler, keyupHandler) {
        var realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null)
            realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null)
            realKey.onUp.add(keyupHandler, self);
    };
    TheGame.mapKeyToDirection = function (key) {
        var direction = Directions.None;
        switch (key) {
            case "w":
            case "ArrowUp":
                direction = Directions.Up;
                break;
            case "a":
            case "ArrowLeft":
                direction = Directions.Left;
                break;
            case "s":
            case "ArrowDown":
                direction = Directions.Down;
                break;
            case "d":
            case "ArrowRight":
                direction = Directions.Right;
                break;
        }
        return direction;
    };
    return TheGame;
}());
var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};
/// *** Game main class *** ///
window.onload = function () {
    var game = new TheGame();
};
/// <reference path="../.ts_dependencies/phaser.d.ts" />
// TODO: Finish these logic when you have time.
var MovementHelpers = (function () {
    function MovementHelpers() {
    }
    MovementHelpers.addDirectionIntegral = function (tank, addDirection) {
        var newDirection = MovementHelpers.addDirection(tank.direction, addDirection);
        tank.drive(newDirection);
    };
    MovementHelpers.removeDirectionIntegral = function (tank, removeDirection) {
        var newDirection = MovementHelpers.removeDirection(tank.direction, removeDirection);
        tank.drive(newDirection);
    };
    MovementHelpers.addDirection = function (direction, addDirection) {
        // If direction alread has the added direction, just return. This case may barely happen.
        if ((direction & addDirection) != 0) {
            return Directions.None;
        }
        var opsiteDirection = MovementHelpers.getOpsiteDirection(addDirection);
        if ((direction & opsiteDirection) != 0) {
            return direction = direction & (~opsiteDirection);
        }
        return direction | addDirection;
    };
    MovementHelpers.removeDirection = function (direction, removeDirection) {
        return direction & (~removeDirection);
    };
    MovementHelpers.getOpsiteDirection = function (direction) {
        switch (direction) {
            case Directions.Up: return Directions.Down;
            case Directions.Down: return Directions.Up;
            case Directions.Left: return Directions.Right;
            case Directions.Right: return Directions.Left;
        }
        return Directions.None;
    };
    MovementHelpers.directionToAngle = function (direction) {
        switch (direction) {
            case Directions.Up:
                return 0;
            case Directions.Down:
                return 180;
            case Directions.Left:
                return -90;
            case Directions.Right:
                return 90;
            case Directions.UpLeft:
                return -45;
            case Directions.DownLeft:
                return 225;
            case Directions.UpRight:
                return 45;
            case Directions.DownRight:
                return 135;
            default:
                return undefined;
        }
    };
    MovementHelpers.directionToRotation = function (direction) {
        if (direction == Directions.None) {
            return undefined;
        }
        var angle = MovementHelpers.directionToAngle(direction);
        return Phaser.Math.degToRad(angle);
    };
    MovementHelpers.directionToSpeed = function (direction) {
        if (direction == Directions.None) {
            return { x: 0, y: 0 };
        }
        var angle = MovementHelpers.directionToAngle(direction);
        return MovementHelpers.angleToSpeed(angle);
    };
    MovementHelpers.angleToSpeed = function (angle) {
        if (angle == undefined) {
            return { x: 0, y: 0 };
        }
        var angleRad = Phaser.Math.degToRad(angle);
        return { x: Math.sin(angleRad) * MaxVelocity, y: 0 - Math.cos(angleRad) * MaxVelocity };
    };
    MovementHelpers.stop = function (acceleration, speed) {
        acceleration.setTo(0, 0);
        speed.setTo(0, 0);
    };
    MovementHelpers.angleToAcceleration = function (angle, acceleration, maxVelocity) {
        var angleRad = Phaser.Math.degToRad(angle);
        var sinAngle = Math.sin(angleRad);
        var negCosAngle = 0 - Math.cos(angleRad);
        acceleration.setTo(Acceleration * sinAngle, Acceleration * negCosAngle);
        maxVelocity.setTo(Math.abs(MaxVelocity * sinAngle), Math.abs(MaxVelocity * negCosAngle));
    };
    return MovementHelpers;
}());
/// ********************************************************** /// 
/// ****** names and parameters. ****** ///
// Names
var sandbagName = "sandbag";
var tankbodyName = "tankbody";
var guntowerName = "guntower";
var bulletName = "bullet";
var particleName = "particle";
// Comm names
// just a notify.
var tankUpdateEventName = "tankUpdate";
var tankUpdateGlobalEventName = "tankUpdateGlobal";
var addNewEventName = "addNew";
var addNewGlobalEventName = "addNewGlobal";
var goneEventName = "gone";
var goneGlobalEventName = "goneGlobal";
var hitEventName = "hit";
var hitGlobalEventName = "hitGlobal";
// Parameters  
var FireRate = 400;
var BulletSpeed = 2000;
var BloodTextOffset = 60;
var Damage = 20;
var MaxVelocity = 500;
var Acceleration = 300;
var AngleOffsetBase = 0.1 * Math.PI; // degree.
// background
var GridHeight = 50;
var GridWidth = 90;
var GameHeight = 5000;
var GameWidth = 5000;
// TODO: Should use group when figure out how
var Tank = (function () {
    function Tank(game, id, x, y) {
        this._gameOver = false;
        this.direction = Directions.None;
        this.nextFireTime = 0;
        this._ownerGame = game;
        this.id = id;
        this.blood = 100;
        // Seperate tank body and gun tower.           
        this._tankbody = game.add.sprite(x, y, tankbodyName);
        this._guntower = game.add.sprite(x, y, guntowerName);
        var style = { font: "20px Arial", fill: "#00A000", align: "center" };
        this._bloodText = game.add.text(x, y - BloodTextOffset, (this.blood), style);
        this._tankbody.anchor.set(0.5, 0.5);
        this._guntower.anchor.set(0.5, 0.5);
        this._bloodText.anchor.set(0.5, 0.5);
        // Setup physics
        game.physics.arcade.enable(this._tankbody);
        this._tankbody.body.collideWorldBounds = true;
        this._tankbody.body.bounce.set(0.1, 0.1);
        this._tankbody.body.maxVelocity.set(MaxVelocity);
        // Create bullets.
        this._bullets = game.add.group();
        this._bullets.enableBody = true;
        this._bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this._bullets.createMultiple(50, bulletName);
        this._bullets.setAll("checkWorldBounds", true);
        this._bullets.setAll("outOfBoundsKill", true);
        this._bullets.forEachAlive(function (item) {
            item.body.bounce.set(0.1, 0.1);
            item.body.mass = 0.1;
        }, this);
    }
    Tank.prototype.getBody = function () {
        return this._tankbody;
    };
    Tank.prototype.update = function (shouldFire) {
        // If game over, do nothing.
        if (this._gameOver) {
            return this.getJson(undefined);
        }
        if (this.blood <= 0) {
            this._gameOver = true;
            Tank.onExplode(this);
            return this.getJson(undefined);
        }
        // Move.
        this.syncPosition();
        // Fire.
        var fire = undefined;
        if (shouldFire) {
            fire = this.fire(undefined);
        }
        // Return result.
        return this.getJson(fire);
    };
    Tank.prototype.updateByJson = function (params) {
        this.updateAsPuppet(params.gunAngle, params.tankAngle, new Phaser.Point(params.x, params.y), params.firing, params.blood);
    };
    Tank.prototype.drive = function (d) {
        if (this._gameOver) {
            return;
        }
        this.direction = d;
        if (d == Directions.None) {
            this._tankbody.body.velocity.set(0, 0);
            this._tankbody.body.acceleration.set(0, 0);
            return;
        }
        var angle = MovementHelpers.directionToAngle(d);
        this._tankbody.angle = angle;
        MovementHelpers.angleToAcceleration(angle, this._tankbody.body.acceleration, this._tankbody.body.maxVelocity);
    };
    Tank.prototype.combat = function (another) {
        var self = this;
        var result = undefined;
        another._bullets.forEachAlive(function (item) {
            self._ownerGame.physics.arcade.collide(item, self._tankbody, function (bullet, notUsed) {
                result = self.onHit(bullet);
            });
        }, this);
        this._bullets.forEachAlive(function (item) {
            self._ownerGame.physics.arcade.collide(item, another.getBody(), function () {
                Tank.onHitVisual(item, another.getBody(), self._ownerGame);
            });
        }, this);
        return result;
    };
    Tank.prototype.explode = function () {
        var self = this;
        Tank.onExplode(self);
    };
    // #regions privates.
    Tank.prototype.syncPosition = function () {
        // First, move gun tower to point to mouse.
        var angle = this._ownerGame.physics.arcade.angleToPointer(this._guntower);
        this._guntower.angle = Phaser.Math.radToDeg(angle) + 90;
        // Second, force to coordinate the guntower, tankbody and blood text
        this._guntower.position = this._tankbody.position;
        this._bloodText.position = new Phaser.Point(this._tankbody.position.x, this._tankbody.position.y + BloodTextOffset);
        this._bloodText.text = this.blood;
    };
    Tank.prototype.shouldFire = function (firingTo) {
        return firingTo != undefined
            || (this._ownerGame.time.now > this.nextFireTime && this._bullets.countDead() > 0);
    };
    Tank.prototype.calculateTrajectory = function () {
        // Get a random offset. I don't think I can support random offset since the current
        // comm system cannot do the coordinate if there is a offset.
        var randomAngleOffset = (Math.random() - 0.5) * AngleOffsetBase;
        var theta = Phaser.Math.degToRad(this._guntower.angle) + randomAngleOffset;
        // Set-up constants.
        var halfLength = this._guntower.height / 2;
        var sinTheta = Math.sin(theta);
        var reverseCosTheta = -1 * Math.cos(theta);
        var tankPosition = this._tankbody.body.center;
        // Bullet start position and move to position.
        var startX = sinTheta * halfLength + tankPosition.x;
        var startY = reverseCosTheta * halfLength + tankPosition.y;
        var moveToX = startX + sinTheta * Number.MAX_VALUE;
        var moveToY = startY + reverseCosTheta * Number.MAX_VALUE;
        return { theta: theta, sinTheta: sinTheta, reverseCosTheta: reverseCosTheta,
            startX: startX, startY: startY, moveToX: moveToX, moveToY: moveToY };
    };
    Tank.prototype.fireInternal = function (startX, startY, moveToX, moveToY) {
        // Get bullet.
        var bullet = this._bullets.getFirstDead();
        bullet.angle = this._guntower.angle;
        bullet.anchor.set(0.5, 0.5);
        bullet.reset(startX, startY);
        // bullet.body.angularVelocity = 5000;
        this._ownerGame.physics.arcade.moveToXY(bullet, moveToX, moveToY, BulletSpeed);
    };
    Tank.prototype.fire = function (firingTo) {
        if (firingTo === void 0) { firingTo = undefined; }
        if (!this.shouldFire(firingTo)) {
            return undefined;
        }
        // Set time.
        this.nextFireTime = this._ownerGame.time.now + FireRate;
        // Calculate the trajectory.
        var trajectory = this.calculateTrajectory();
        if (firingTo != undefined) {
            trajectory.theta = firingTo;
        }
        // Fire.
        this.fireInternal(trajectory.startX, trajectory.startY, trajectory.moveToX, trajectory.moveToY);
        // Let's shake it shake it.
        this._ownerGame.camera.shake(0.005, 50);
        return trajectory.theta;
    };
    Tank.prototype.getJson = function (firingTo) {
        // If already died, just return an useless message.
        if (this._gameOver) {
            return {
                tankId: this.id,
                x: -1,
                y: -1,
                gunAngle: 0,
                tankAngle: 0,
                firing: undefined,
                blood: 0
            };
        }
        return {
            tankId: this.id,
            x: this._tankbody.position.x,
            y: this._tankbody.position.y,
            gunAngle: this._guntower.angle,
            tankAngle: this._tankbody.angle,
            firing: firingTo,
            blood: this.blood
        };
    };
    Tank.prototype.updateAsPuppet = function (gunAngle, tankAngle, position, firing, blood) {
        // if already gameover, do nothing.
        if (this._gameOver) {
            return;
        }
        // if blood is less or equal to 0, set gameover tag, then explode.
        if (this.blood <= 0) {
            this._gameOver = true;
            Tank.onExplode(this);
            return;
        }
        this._guntower.angle = gunAngle;
        this._tankbody.angle = tankAngle;
        this._tankbody.body.velocity.x = 0;
        this._tankbody.body.velocity.y = 0;
        this._tankbody.position = position;
        this._guntower.position = position;
        this._bloodText.position = new Phaser.Point(position.x, position.y + BloodTextOffset);
        this.blood = blood;
        this._bloodText.text = blood;
        if (this.blood <= 0) {
            var self_1 = this;
            Tank.onExplode(self_1);
        }
        if (firing != undefined) {
            this.fire(firing);
        }
    };
    Tank.onExplode = function (self) {
        // Emit and destroy everything.
        var emitter = self._ownerGame.add.emitter(self._tankbody.body.position.x, self._tankbody.body.position.y);
        emitter.makeParticles(particleName, 0, 200, true, false);
        emitter.explode(2000, 200);
        self._tankbody.destroy();
        self._guntower.destroy();
        self._bloodText.destroy();
        self._bullets.destroy();
    };
    Tank.onHitVisual = function (bullet, tankBody, game) {
        // Now we are creating the particle emitter, centered to the world
        var hitX = (bullet.x + tankBody.body.x) / 2;
        var hitY = (bullet.y + tankBody.body.y) / 2;
        bullet.kill();
        // Get effect.
        var emitter = game.add.emitter(hitX, hitY);
        emitter.makeParticles(particleName, 0, 50, false, false);
        emitter.explode(1000, 50);
        return { hitX: hitX, hitY: hitY };
    };
    Tank.prototype.onHit = function (bullet) {
        this.blood -= Math.floor(Math.random() * Damage);
        var self = this;
        var result = Tank.onHitVisual(bullet, self._tankbody, this._ownerGame);
        return {
            tankId: this.id,
            hitX: result.hitX,
            hitY: result.hitY,
            blood: this.blood
        };
    };
    return Tank;
}());
/// ********************************************************** /// 
