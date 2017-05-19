class Inputs {
    _player: Tank;

    setupKeys(self: TheGame) {
        for (let key of [ Phaser.Keyboard.W, Phaser.Keyboard.A, 
                          Phaser.Keyboard.S, Phaser.Keyboard.D, 
                          Phaser.Keyboard.UP, Phaser.Keyboard.LEFT, 
                          Phaser.Keyboard.DOWN, Phaser.Keyboard.RIGHT ]) {
            Inputs.registerKeyInputs(self, key, Inputs.prototype.onKeyDown, Inputs.prototype.onKeyUp);
        }
    }

    onKeyDown(e: Phaser.Key) {
        let addDirection = Inputs.mapKeyToDirection(e.event.key);
        this._player.addDirection(addDirection);
    }

    onKeyUp(e: Phaser.Key) {
        let removeDirection = Inputs.mapKeyToDirection(e.event.key);
        this._player.removeDirection(removeDirection);
    }
    
    static registerKeyInputs(self: any, key: number, keydownHandler: any, keyupHandler?: any) {
        let realKey = self.game.input.keyboard.addKey(key);
        if (keydownHandler != null) realKey.onDown.add(keydownHandler, self);
        if (keyupHandler != null) realKey.onUp.add(keyupHandler, self);
    }

    static mapKeyToDirection(key: any) : Directions {
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