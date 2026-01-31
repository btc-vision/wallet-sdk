import { createNobleBackend, type NobleBackend } from '@btc-vision/ecpair';

let backend: NobleBackend | undefined;

export function getNobleBackend(): NobleBackend {
    backend ??= createNobleBackend();
    return backend;
}
