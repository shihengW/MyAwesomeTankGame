/// <reference path="../.ts_dependencies/phaser.d.ts" />
class DriveHelpers {
    static addDirectionIntegral(tank: Tank, addDirection: Directions) {
        let newDirection: Directions = DriveHelpers.addDirection(tank.direction, addDirection);
        tank.drive(newDirection);
    }

    static removeDirectionIntegral(tank: Tank, removeDirection: Directions) {
        let newDirection: Directions = DriveHelpers.removeDirection(tank.direction, removeDirection);
        tank.drive(newDirection);
    }

    static directionToAngle(direction: Directions): number {
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

    private static addDirection(direction: Directions, addDirection: Directions): Directions {
        // If direction alread has the added direction, just return. This case may barely happen.
        if ((direction & addDirection) != 0) {
            return Directions.None;
        }

        let opsiteDirection = DriveHelpers.getOpsiteDirection(addDirection);
        if ((direction & opsiteDirection) != 0) {
            return direction = direction & (~opsiteDirection);
        }

        return direction | addDirection;
    }

    private static removeDirection(direction: Directions, removeDirection: Directions): Directions {
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

    static setAcceleration(angle: number, acceleration: Phaser.Point, maxVelocity: Phaser.Point) {
        let angleRad = Phaser.Math.degToRad(angle);
        let sinAngle = Math.sin(angleRad);
        let negCosAngle = 0 - Math.cos(angleRad);

        acceleration.setTo(Acceleration * sinAngle, Acceleration * negCosAngle);
        maxVelocity.setTo(Math.abs(MaxVelocity * sinAngle), Math.abs(MaxVelocity * negCosAngle));
    }

    static syncBloodTextPosition(angle: number, bloodText: Phaser.Text) {
        let angleInRad = Phaser.Math.degToRad(angle);
        bloodText.position.setTo(Math.sin(angleInRad) * BloodTextOffset, Math.cos(angleInRad) * BloodTextOffset);
        bloodText.angle = -1 * angle;
    }
}