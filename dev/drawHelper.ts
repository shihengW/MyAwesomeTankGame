/// <reference path="../.ts_dependencies/phaser.d.ts" />
class DrawHelpers {
    static drawGrids(graphics: any, width: number, height: number) {
        let hnum: number = Math.floor(width / GridWidth);
        let vnum: number = Math.floor(height / GridHeight);

        // Draw vertical lines.
        graphics.beginFill(0xA03F00);
        graphics.lineStyle(1, 0xA03F00, 1);
        
        // draw a shape
        for (let i = 1; i < hnum; i++) {
            let x: number = i * GridWidth;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height - 1);
        }
        
        graphics.endFill();

        // Draw horizontal lines.
        graphics.beginFill(0x00A000);
        graphics.lineStyle(1, 0x00A000, 1);
        
        // draw a shape
        for (let i = 1; i < vnum; i++) {
            let y: number = i * GridHeight;
            graphics.moveTo(0, y);
            graphics.lineTo(width - 1, y);
        }
        
        graphics.endFill();
    }
}