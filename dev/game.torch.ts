class Torch {
    _shadowTexture: Phaser.BitmapData;
    _torch: Phaser.Image;
    game: Phaser.Game;

    createTorch(game: Phaser.Game) {
        this.game = game;
        this._shadowTexture = game.add.bitmapData(this.game.width, this.game.height);
        this._torch = this.game.add.image(0, 0, this._shadowTexture);
        this._torch.fixedToCamera = true;
        this._torch.blendMode = Phaser.blendModes.MULTIPLY;
    }

    // TODO: Draw a torch instead of a circle.
    updateTorch(position: Phaser.Point, angle: number) {
        let truncatedX: number = position.x - this.game.camera.x;
        let truncatedY: number = position.y - this.game.camera.y;
        this._shadowTexture.context.fillStyle = 'rgb(80, 80, 80)';
        this._shadowTexture.context.fillRect(0, 0, this.game.width, this.game.height);

        // Draw circle of light with a soft edge
        let gradient = this._shadowTexture.context.createRadialGradient(
            truncatedX, truncatedY, ShadowRadius * 0.5,
            truncatedX, truncatedY, ShadowRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        this._shadowTexture.context.beginPath();
        this._shadowTexture.context.fillStyle = gradient;
        this._shadowTexture.context.arc(truncatedX, truncatedY,
            ShadowRadius, 0, Math.PI * 2);
        this._shadowTexture.context.fill();

        // This just tells the engine it should update the texture cache
        this._shadowTexture.dirty = true;
    }
}