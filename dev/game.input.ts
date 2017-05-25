class Inputs {
    _player: Tank;
    game: Phaser.Game;

    setupKeys(self: TheGame) {
        for (let key of [ Phaser.Keyboard.W, Phaser.Keyboard.A, 
                          Phaser.Keyboard.S, Phaser.Keyboard.D, 
                          Phaser.Keyboard.UP, Phaser.Keyboard.LEFT, 
                          Phaser.Keyboard.DOWN, Phaser.Keyboard.RIGHT ]) {
            Inputs.prototype.registerKeyInputs.call(self, key, Inputs.prototype.onKeyDown, Inputs.prototype.onKeyUp);
        }
    }

    private onKeyDown(e: Phaser.Key) {
        let addDirection = Inputs.mapKeyToDirection(e.event.key);
        this._player.addDirection(addDirection);
    }

    private onKeyUp(e: Phaser.Key) {
        let removeDirection = Inputs.mapKeyToDirection(e.event.key);
        this._player.removeDirection(removeDirection);
    }
    
    private registerKeyInputs(key: number, keydownHandler: any, keyupHandler?: any) {
        let realKey = this.game.input.keyboard.addKey(key);
        if (keydownHandler != null) realKey.onDown.add(keydownHandler, this);
        if (keyupHandler != null) realKey.onUp.add(keyupHandler, this);
    }

    private static mapKeyToDirection(key: any) : Directions {
        let direction: Directions = Directions.None;
        switch (key) {
            case "w": 
            case "ArrowUp": direction = Directions.Up; break;
            case "a":
            case "ArrowLeft": direction = Directions.Left; break;
            case "s":
            case "ArrowDown": direction = Directions.Down; break;
            case "d":
            case "ArrowRight": direction = Directions.Right; break;
        }
        return direction;
    }
}