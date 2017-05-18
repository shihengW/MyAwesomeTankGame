// class GunTower implements Shoot {
//     _tower: Phaser.Sprite;

//     constructor(game: Phaser.Game, x: number, y: number) {
//         this._ownerGame = game;
//         this._tower = game.add.sprite(x, y, )
//         this._guntower = game.add.sprite(x, y, )
//     }

//     update(player: Tank, ...enemies: Tank[]) {

//     }

//     collide(player: Tank, ...enemies: Tank[]) {

//     }

//     _bullets: Phaser.Group; 
//     _ownerGame: Phaser.Game;
//     _guntower: Phaser.Sprite;
//     blood: number;

//     fire: (firingTo: number) => number;
//     nextFireTime: number = 0;

//     shouldFire: (firingTo: number) => boolean;
//     calculateTrajectory: () => Trajectory;
//     fireInternal: (startX: number, startY: number, moveToX: number, moveToY: number) => void;
// }