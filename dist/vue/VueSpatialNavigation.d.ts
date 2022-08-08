import { App } from '@vue/runtime-core';
import 'focus-options-polyfill';
import 'scroll-behavior-polyfill';
import { Configuration } from '../types/Configuration';
declare const vueSpatialNavigation: {
    disable(): void;
    enable(): void;
    install(app: App, config: Configuration): void;
};
export default vueSpatialNavigation;
