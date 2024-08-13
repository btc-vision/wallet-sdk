/// <reference types="node" />
declare function try_decode(buf: any): (string | number)[];
declare function encodeToVec(n: any, v: any): void;
declare function decode(buffer: any): {
    num: string | number;
    index: string | number;
};
declare function encode(n: any): Buffer;
export declare const varint: {
    encode: typeof encode;
    decode: typeof decode;
    try_decode: typeof try_decode;
    encodeToVec: typeof encodeToVec;
};
export {};
