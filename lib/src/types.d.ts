interface BaseUserToSignInput {
    index: number;
    sighashTypes?: number[] | undefined;
    disableTweakSigner?: boolean;
}
export interface AddressUserToSignInput extends BaseUserToSignInput {
    address: string;
}
export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
    publicKey: string;
}
export type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput;
export interface SignPsbtOptions {
    autoFinalized?: boolean;
    toSignInputs?: UserToSignInput[];
}
export interface ToSignInput {
    index: number;
    publicKey: string;
    sighashTypes?: number[];
    disableTweakSigner?: boolean;
}
export interface UnspentOutput {
    txid: string;
    vout: number;
    satoshis: number;
    scriptPk: string;
    pubkey: string;
    addressType: AddressType;
    inscriptions: {
        inscriptionId: string;
        inscriptionNumber?: number;
        offset: number;
    }[];
    atomicals: {
        atomicalId: string;
        atomicalNumber: number;
        type: 'FT' | 'NFT';
        ticker?: string;
        atomicalValue?: number;
    }[];
    runes?: {
        runeid: string;
        amount: string;
    }[];
    rawtx?: string;
}
export declare enum AddressType {
    P2PKH = 0,
    P2WPKH = 1,
    P2TR = 2,
    P2SH_P2WPKH = 3,
    M44_P2WPKH = 4,
    M44_P2TR = 5,
    P2WSH = 6,
    P2SH = 7,
    UNKNOWN = 8
}
export {};
