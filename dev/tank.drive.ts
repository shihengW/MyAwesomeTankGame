class Drive {
    direction: Directions = Directions.None;
    _gameOver: boolean = false;
    _bloodText: Phaser.Text;
   
    drive(d: Directions) {
        if (this._gameOver) {
            return;
        }
        
        this.direction = d;

        if (d == Directions.None) {
            (<Phaser.Sprite>this).body.velocity.set(0, 0);
            (<Phaser.Sprite>this).body.acceleration.set(0, 0);
            return;
        }
        
        let angle = Drive.directionToAngle(d);
        (<Phaser.Sprite>this).angle = angle;
        Drive.setAcceleration(angle, (<Phaser.Sprite>this).body.acceleration, (<Phaser.Sprite>this).body.maxVelocity);
        Drive.syncBloodTextPosition(angle, this._bloodText);
    }

    addDirection(addDirection: Directions) {
        let newDirection: Directions = Drive.addDirectionInternal(this.direction, addDirection);
        this.drive(newDirection);
    }

    removeDirection(removeDirection: Directions) {
        let newDirection: Directions = Drive.removeDirectionInternal(this.direction, removeDirection);
        this.drive(newDirection);
    }

    private static directionToAngle(direction: Directions): number {
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
    }

    private static addDirectionInternal(direction: Directions, addDirection: Directions): Directions {
        // If direction alread has the added direction, just return. This case may barely happen.
        if ((direction & addDirection) != 0) {
            return Directions.None;
        }

        let opsiteDirection = Drive.getOpsiteDirection(addDirection);
        if ((direction & opsiteDirection) != 0) {
            return direction = direction & (~opsiteDirection);
        }

        return direction | addDirection;
    }

    private static removeDirectionInternal(direction: Directions, removeDirection: Directions): Directions {
        return direction & (~removeDirection);
    }

    private static getOpsiteDirection(direction: Directions) : Directions {
        switch(direction) {
            case Directions.Up: return Directions.Down;
            case Directions.Down: return Directions.Up;
            case Directions.Left: return Directions.Right;
            case Directions.Right: return Directions.Left;
        }
        return Directions.None;
    }

    private static setAcceleration(angle: number, acceleration: Phaser.Point, maxVelocity: Phaser.Point) {
        let angleRad = Phaser.Math.degToRad(angle);
        let sinAngle = Math.sin(angleRad);
        let negCosAngle = 0 - Math.cos(angleRad);

        acceleration.setTo(Acceleration * sinAngle, Acceleration * negCosAngle);
        maxVelocity.setTo(Math.abs(MaxVelocity * sinAngle), Math.abs(MaxVelocity * negCosAngle));
    }

    private static syncBloodTextPosition(angle: number, bloodText: Phaser.Text) {
        let angleInRad = Phaser.Math.degToRad(angle);
        bloodText.position.setTo(Math.sin(angleInRad) * BloodTextOffset, Math.cos(angleInRad) * BloodTextOffset);
        bloodText.angle = -1 * angle;
    }
}