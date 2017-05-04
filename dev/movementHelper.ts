/// <reference path="../.ts_dependencies/phaser.d.ts" />
// TODO: Finish these logic when you have time.
class MovementHelper {
    static addDirectionIntegral(tank: Tank, addDirection: Directions) {
        let newDirection: Directions = MovementHelper.addDirection(tank.direction, addDirection);
        tank.drive(newDirection);
    }

    static removeDirectionIntegral(tank: Tank, removeDirection: Directions) {
        let newDirection: Directions = MovementHelper.removeDirection(tank.direction, removeDirection);
        tank.drive(newDirection);
    }

    static addDirection(direction: Directions, addDirection: Directions): Directions {
        // If direction alread has the added direction, just return. This case may barely happen.
        if ((direction & addDirection) != 0) {
            return Directions.None;
        }

        let opsiteDirection = MovementHelper.getOpsiteDirection(addDirection);
        if ((direction & opsiteDirection) != 0) {
            return direction = direction & (~opsiteDirection);
        }

        return direction | addDirection;
    }

    static removeDirection(direction: Directions, removeDirection: Directions): Directions {
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

    static directionToSpeed(direction: Directions) : {x: number, y: number} {
        if (direction == Directions.None) {
            return { x: 0, y: 0 };
        }

        let angle: number = MovementHelper.directionToAngle(direction);
        return MovementHelper.angleToSpeed(angle);
    }

    static angleToSpeed(angle: number) : {x: number, y: number} {
        if (angle == undefined) {
            return { x: 0, y: 0 };
        }

        let angleRad = Phaser.Math.degToRad(angle);
        return { x: Math.sin(angleRad) * tankSpeed, y: 0 - Math.cos(angleRad) * tankSpeed };
    }
}

/// ********************************************************** ///