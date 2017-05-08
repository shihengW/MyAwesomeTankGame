/// <reference path="../.ts_dependencies/phaser.d.ts" />
class DrawHelpers {
    static drawGrids(graphics: any, width: number, height: number) {
        let hnum: number = Math.floor(width / GridWidth);
        let vnum: number = Math.floor(height / GridHeight);

        graphics.lineStyle(2, 0xE03F00, 1);
        for (let i = 2; i < hnum - 2; i++) {
            let x: number = i * GridWidth;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        graphics.lineStyle(2, 0x00E05E, 1);
        for (let i = 2; i < vnum - 2; i++) {
            let y: number = i * GridHeight;
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
    }
}