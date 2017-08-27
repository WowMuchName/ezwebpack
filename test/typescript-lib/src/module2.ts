export class Module2 {
    constructor(private x: number) {
        this.x = x;
    }
    public add(y: number): number {
        return this.x + y;
    }
}