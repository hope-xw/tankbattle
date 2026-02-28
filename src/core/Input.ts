export class Input {
    public keys: { [key: string]: boolean } = {};

    private handleKeyDown = (e: KeyboardEvent) => {
        this.keys[e.code] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keys[e.code] = false;
    };

    public init() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    public destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.keys = {};
    }
}
