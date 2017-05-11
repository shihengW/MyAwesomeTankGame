class Drive {
    direction: Directions = Directions.None;
    _tankbody: Phaser.Sprite;
    _gameOver: boolean = false;
    
    drive(d: Directions) {
        if (this._gameOver) {
            return;
        }
        
        this.direction = d;

        if (d == Directions.None) {
            this._tankbody.body.velocity.set(0, 0);
            this._tankbody.body.acceleration.set(0, 0);
            return;
        }
        
        let angle = MovementHelpers.directionToAngle(d);
        this._tankbody.angle = angle;
        MovementHelpers.angleToAcceleration(angle, this._tankbody.body.acceleration, this._tankbody.body.maxVelocity);
    }
}