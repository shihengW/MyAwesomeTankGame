class Shoot {
    _bullets: Phaser.Group;
    _ownerGame: Phaser.Game;
    _guntower: Phaser.Sprite;

    updateAngle() {
        // First, move gun tower to point to mouse.
        const angle: number = this._ownerGame.physics.arcade.angleToPointer(this._guntower.parent);
        this._guntower.angle = Phaser.Math.radToDeg(angle) + 90 - (<Phaser.Sprite> this._guntower.parent).angle;
    }

    fire(firingTo: number = undefined) : number {
        if (!this.shouldFire(firingTo)) {
            return undefined;
        }

        // Calculate the trajectory.
        let trajectory: Trajectory = this.calculateTrajectory();

        // Force set direction?
        if (firingTo != undefined) {
            trajectory.theta = firingTo;
        }
        
        // Fire.
        this.fireInternal(trajectory.theta, trajectory.startX, trajectory.startY, trajectory.moveToX, trajectory.moveToY);

        // Let's shake it shake it.
        this._ownerGame.camera.shake(0.005, 50);
        return trajectory.theta;
    }

    nextFireTime: number = 0;

    shouldFire(firingTo: number): boolean {
        let result = firingTo != undefined
            || (this._ownerGame.time.now > this.nextFireTime && this._bullets.countDead() > 0);

        if (result) {
            // Set time.
            this.nextFireTime = this._ownerGame.time.now + FireRate;
        }

        return result;
    }

    calculateTrajectory(): Trajectory {
        // Get a random offset. I don't think I can support random offset since the current
        // comm system cannot do the coordinate if there is a offset.
        const randomAngleOffset: number = (Math.random() - 0.5) * AngleOffsetBase;
        const theta: number = Phaser.Math.degToRad(this._guntower.angle + (<Phaser.Sprite> this._guntower.parent).angle) + randomAngleOffset;

        // Set-up constants.
        const halfLength: number = this._guntower.height / 2 + 10 /*offset*/;
        const sinTheta = Math.sin(theta);
        const reverseCosTheta = -1 * Math.cos(theta);
        const position = (<Phaser.Sprite> this._guntower.parent).body.center;

        // Bullet start position and move to position.
        let startX: number = sinTheta * halfLength + position.x;
        let startY: number = reverseCosTheta * halfLength + position.y;
        let moveToX: number = startX + sinTheta * Number.MAX_VALUE;
        let moveToY: number = startY + reverseCosTheta * Number.MAX_VALUE;

        return { theta: theta, sinTheta: sinTheta, reverseCosTheta: reverseCosTheta, 
            startX: startX, startY: startY, moveToX: moveToX, moveToY: moveToY };
    }

    fireInternal(theta: number, startX: number, startY: number, moveToX: number, moveToY: number) {
        // Get bullet.
        const bullet: Phaser.Sprite = this._bullets.getFirstDead();
        bullet.rotation = theta;
        bullet.reset(startX, startY);

        this._ownerGame.physics.arcade.moveToXY(bullet, moveToX, moveToY, BulletSpeed);
    }   
}

interface Trajectory {
    // The angle of guntower in rad.
    theta: number,
    // sin(theta) for fast calculate.
    sinTheta: number,
    // -1*cos(theta) for fast calculate.
    reverseCosTheta: number,
    // start x position.
    startX: number,
    // start y position.
    startY: number,
    // move to x position.
    moveToX: number,
    // move to y position.
    moveToY: number
}