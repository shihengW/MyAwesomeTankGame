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
        
        let angle = DriveHelpers.directionToAngle(d);
        (<Phaser.Sprite>this).angle = angle;
        DriveHelpers.setAcceleration(angle, (<Phaser.Sprite>this).body.acceleration, (<Phaser.Sprite>this).body.maxVelocity);
        let angleInRad = Phaser.Math.degToRad(angle);
        this._bloodText.position.setTo(Math.sin(angleInRad) * BloodTextOffset, Math.cos(angleInRad) * BloodTextOffset);
        this._bloodText.angle = -1 * (<Phaser.Sprite>this).angle;
    }
}