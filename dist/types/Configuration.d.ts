/**
 * Configuration interface, allows to configure Spatial Navigation behavior in a global or restricted way.
 */
interface Configuration {
    element?: HTMLElement;
    selector?: string;
    straightOnly?: boolean;
    straightOverlapThreshold?: number;
    rememberSource?: boolean;
    disabled?: boolean;
    defaultElement?: string;
    enterTo?: string;
    leaveFor?: {
        left?: string;
        right?: string;
        down?: string;
        up?: string;
    };
    restrict?: string;
    tabIndexIgnoreList?: string;
    navigableFilter?: null | Function;
    scrollOptions?: ScrollIntoViewOptions | string;
    scrollOptionsIntoSection?: ScrollIntoViewOptions | string;
    throttle?: number;
}
declare const defaultConfiguration: Configuration;
export { Configuration, defaultConfiguration };
