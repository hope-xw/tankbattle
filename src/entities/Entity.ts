import { Game } from '../core/Game';

export abstract class Entity {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public zIndex: number = 0;
    protected game: Game;

    constructor(game: Game, x: number, y: number, width: number, height: number) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    public abstract update(dt: number): void;
    public abstract draw(ctx: CanvasRenderingContext2D): void;

    public collidesWith(other: Entity): boolean {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }
}
