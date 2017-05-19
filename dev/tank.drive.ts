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
        DriveHelpers.syncBloodTextPosition(angle, this._bloodText);
    }
}