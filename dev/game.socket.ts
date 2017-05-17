class GameSocket {
    _socket: any;
    _enemies: Tank[];

    setupSocket(self: TheGame) {
        self._socket = io();
        // Add new -> show.
        self._socket.on(AddNewGlobalEventName, function(player: Message) {
            GameSocket.updateEnemyByJson(self, player);
        });

        // Update -> update.
        self._socket.on(TankUpdateGlobalEventName, function(player: Message) {
            GameSocket.updateEnemyByJson(self, player);
            if (player.firing != undefined) {
                self._miniMap.blinkEnemy(player.x, player.y);
            }
         });

        self._socket.on(GoneGlobalEventName, function(player: Message) {
            // If player has no blood, remove it from the list.
            let tank = GameSocket.removeEnemyByJson(self, player);
            tank.explode();
        });

        self._socket.emit(AddNewEventName, self._player.getJson(undefined));
    }

    static getOrAddEnemy(self: TheGame, enemy: IdMessage) : Tank {
        let tank: Tank = undefined;
        if (self._enemies == undefined) {
            tank = new Tank(self.game, enemy.tankId, 0, 0)
            self._enemies = [tank];
        }
        else {
            let exist: boolean = false;
            self._enemies.forEach(item => {
                if (enemy.tankId == item.id) {
                    tank = item;
                    exist = true;
                } 
            });
            if (!exist) {
                tank = new Tank(self.game, enemy.tankId, 0, 0);
                self._enemies.push(tank);
            }
        }
        return tank;
    }

    static updateEnemyByJson(self: TheGame, enemy: Message) {
        let tank = GameSocket.getOrAddEnemy(self, enemy);
        tank.updateAsPuppet(enemy)
    }

    static removeEnemyByJson(self: TheGame, enemy: IdMessage): Tank {
        // TODO: Refactor these ugly logic.
        let foundTank: Tank = undefined;
        self._enemies.forEach(item => {
            if (enemy.tankId == item.id) {
                foundTank = item;
            }});
        let index = self._enemies.indexOf(foundTank);
        if (index > -1) { 
            self._enemies.splice(index, 1); 
        }

        return foundTank;
    }
}