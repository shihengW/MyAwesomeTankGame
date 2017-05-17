class Drive {
    direction: Directions = Directions.None;
    _tankbody: Phaser.Sprite;
    _gameOver: boolean = false;
    _bloodText: Phaser.Text;
    
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
        
        let angle = DriveHelpers.directionToAngle(d);
        this._tankbody.angle = angle;
        DriveHelpers.setAcceleration(angle, this._tankbody.body.acceleration, this._tankbody.body.maxVelocity);
        let angleInRad = Phaser.Math.degToRad(angle);
        this._bloodText.position.setTo(Math.sin(angleInRad) * BloodTextOffset, Math.cos(angleInRad) * BloodTextOffset);
        this._bloodText.angle = -1 * this._tankbody.angle;
    }
}