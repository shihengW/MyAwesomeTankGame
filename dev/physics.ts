/// <reference path="../.ts_dependencies/phaser.d.ts" />
// TODO: Finish these logic when you have time.
class AdvancedPhysicsManager {
    // Just suppose this is right, we will test it anyway.
    static addDirection(sprite: Phaser.Sprite, direction: Directions) {
        let normalizedAngle = Phaser.Math.normalizeAngle(sprite.angle, false);

        switch (direction) {
        case Directions.Up:
            if (this.hasUpPortion(normalizedAngle)) {
                return;
                }
            if (this.hasDownPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.y = -1 * sprite.body.velocity.y;
            } else {
                sprite.angle = sprite.angle + (this.hasLeftPortion(normalizedAngle) ? 45 : -1 * 45);
                sprite.body.velocity.y = -1 * playerSpeed;
            }
            break;
        case Directions.Down:
            if (this.hasDownPortion(normalizedAngle)) {
                return;
            }
            if (this.hasUpPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.y = -1 * sprite.body.velocity.y;
            } else {
                sprite.angle = sprite.angle + (this.hasLeftPortion(normalizedAngle) ? -1 * 45 : 45);
                sprite.body.velocity.y = playerSpeed;
            }
            break;
        case Directions.Left:
            if (this.hasLeftPortion(normalizedAngle)) {
                return;
            }
            if (this.hasRightPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.x = -1 * sprite.body.velocity.x;
            } else {
                sprite.angle = sprite.angle + (this.hasUpPortion(normalizedAngle) ? -1 * 45 : 45);
                sprite.body.velocity.x = playerSpeed;
            }
            break;
        case Directions.Right:
            if (this.hasRightPortion(normalizedAngle)) {
                return;
            }
            if (this.hasLeftPortion(normalizedAngle)) {
                sprite.angle = sprite.angle + 180;
                sprite.body.velocity.x = -1 * sprite.body.velocity.x;
            } else {
                sprite.angle = sprite.angle + (this.hasUpPortion(normalizedAngle) ? 45 : -1 * 45);
                sprite.body.velocity.x = playerSpeed;
            }
            break;
        case Directions.None:
            break;
        default:
            break;
        }
    }

    static removeDirection(sprite: Phaser.Sprite, direction: Directions) {
    }

    static directionToAngle(direction: Directions): Number {
        switch (direction) {
        case Directions.Up:
            return 0;
        case Directions.Down:
            return 180;
        case Directions.Left:
            return -90;
        case Directions.Right:
            return 90;
        default:
            return -1;
        }
    }

    private static hasUpPortion(angle: Number) : boolean {
        return angle < 90 || angle > 270;
    }

    private static hasDownPortion(angle: Number) : boolean {
        return angle > 90 && angle < 270;
    }

    private static hasLeftPortion(angle: Number) : boolean {
        return angle > 180 && angle < 360;
    }

    private static hasRightPortion(angle: Number) : boolean {
        return angle > 0 && angle < 180;
    }
}

/// ********************************************************** ///