import { IKeyringBase, SimpleKeyringOptions } from './interfaces/SimpleKeyringOptions';
export declare class SimpleKeyring extends IKeyringBase<SimpleKeyringOptions> {
    static type: string;
    type: string;
    constructor(opts?: SimpleKeyringOptions);
    serialize(): SimpleKeyringOptions;
    deserialize(opts: SimpleKeyringOptions): void;
    addAccounts(n?: number): string[];
    getAccounts(): string[];
}
export declare function verifySignData(publicKey: string, hash: string, type: 'ecdsa' | 'schnorr', signature: string): boolean;
