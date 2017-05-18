class TankHelper {
    
    static onExplode(self: Tank) {
        // If already exploded, return.
        if (self._tankbody.body == null) {
            return;
        }

        // Emit and destroy everything.
        let emitter = self._ownerGame.add.emitter(self._tankbody.body.position.x, self._tankbody.body.position.y);
        emitter.makeParticles(ParticleName, 0, 200, true, false);
        emitter.explode(2000, 200);
        
        self._tankbody.destroy();
        self._guntower.destroy();
        self._bloodText.destroy();
        self._bullets.destroy();
    }

    static onHitVisual(bullet: Phaser.Sprite, tankBody: Phaser.Sprite, game: Phaser.Game) : { hitX: number, hitY: number } {
        // Now we are creating the particle emitter, centered to the world
        let hitX: number = (bullet.x + tankBody.body.x) / 2;
        let hitY: number =  (bullet.y + tankBody.body.y) / 2;
        bullet.kill();

        // Get effect.
        let emitter = game.add.emitter(hitX, hitY);
        emitter.makeParticles(ParticleName, 0, 50, false, false);
        emitter.explode(1000, 50);
        return { hitX: hitX, hitY: hitY };
    }
}