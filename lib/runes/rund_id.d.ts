export declare class RuneId {
    block: number;
    tx: number;
    constructor({ block, tx }: {
        block: number;
        tx: number;
    });
    static fromBigInt(n: any): RuneId;
    toString(): string;
    static fromString(s: string): RuneId;
}
