export class Module1 {
    constructor(private x: number) {
        this.x = x;
    }
    public sub(y: number): number {
        return this.x + y;
    }
}