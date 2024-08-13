import { ECPairInterface } from 'ecpair';
export declare function signMessageOfECDSA(privateKey: ECPairInterface, text: string): string;
export declare function verifyMessageOfECDSA(publicKey: string, text: string, sig: string): boolean;
