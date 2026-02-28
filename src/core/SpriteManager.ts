export class SpriteManager {
    private static instance: SpriteManager;
    private images: Map<string, HTMLImageElement> = new Map();
    private loaded: number = 0;
    private total: number = 0;
    private onReady: () => void = () => { };

    private constructor() { }

    public static getInstance(): SpriteManager {
        if (!SpriteManager.instance) {
            SpriteManager.instance = new SpriteManager();
        }
        return SpriteManager.instance;
    }

    public async loadAll(manifest: { [key: string]: string }): Promise<void> {
        this.total = Object.keys(manifest).length;
        this.loaded = 0;

        return new Promise((resolve) => {
            if (this.total === 0) resolve();

            for (const [key, src] of Object.entries(manifest)) {
                const img = new Image();
                img.onload = () => {
                    this.loaded++;
                    if (this.loaded === this.total) {
                        resolve();
                        this.onReady();
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load sprite: ${src}`);
                    this.loaded++;
                    if (this.loaded === this.total) {
                        resolve();
                        this.onReady();
                    }
                };
                img.src = src;
                this.images.set(key, img);
            }
        });
    }

    public get(key: string): HTMLImageElement {
        const img = this.images.get(key);
        if (!img) {
            console.error(`Sprite not found: ${key}`);
            const fallback = new Image();
            return fallback;
        }
        return img;
    }
}
