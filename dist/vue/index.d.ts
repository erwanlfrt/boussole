import { App } from '@vue/runtime-core';
import 'focus-options-polyfill';
import 'scroll-behavior-polyfill';
import { Configuration } from '../types/Configuration';
declare const vueModule: {
    disable(): void;
    enable(): void;
    install(app: App, config: Configuration): void;
};
export { vueModule as compass };
