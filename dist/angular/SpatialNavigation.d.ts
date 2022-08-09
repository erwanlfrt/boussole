import { Configuration } from './types/Configuration';
import { Direction } from './types/Direction';
declare class SpatialNavigation {
    private static instance;
    private _ready;
    private _idPool;
    private _sections;
    private _sectionCount;
    private _defaultSectionId;
    private _lastSectionId;
    private _duringFocusChange;
    private globalConfiguration;
    private _pause;
    private core;
    private readonly ID_POOL_PREFIX;
    private readonly EVENT_PREFIX;
    private focusOnMountedSections;
    private _throttle;
    static getInstance(): SpatialNavigation;
    /**
     * Init listeners
     */
    init(): void;
    /**
     * Remove listeners and reinitialize SpatialNavigation attributes.
     */
    uninit(): void;
    /**
     * Clear attributes values.
     */
    clear(): void;
    /**
     * Reset a lastFocusedElement and previous element of a section.
     * @param sectionId - section to reset
     */
    reset(sectionId: string): void;
    /**
     * Set the configuration of a section or set the global configuration
     * @param sectionId - section to configure, undefined to set the global configuration.
     * @param config - configuration
     */
    set(sectionId: string | undefined, config: Configuration): boolean | never;
    /**
     * Add a section
     * @param sectionId - section id to add
     * @param config - configuration of the section
     * @returns sectionId
     */
    add(sectionId: string | undefined, config: Configuration): string | never;
    /**
     * Remove a section
     * @param sectionId id of the section to remove
     * @returns true if section has been removed, false otherwise
     */
    remove(sectionId: string): boolean;
    /**
     * Disable navigation on a section
     * @param sectionId - id of the section to disable
     * @returns true if section has been disabled, false otherwise
     */
    disable(sectionId: string): boolean;
    /**
     * Enable navigation on a section
     * @param sectionId - id of the section to enable
     * @returns true if section has been enabled, false otherwise
     */
    enable(sectionId: string): boolean;
    /**
     * Pause navigation
     */
    pause(): void;
    /**
     * Resume navigation
     */
    resume(): void;
    /**
     * Focus an element
     * @param element element to focus (section id or selector), (an element or a section)
     * @param silent ?
     * @param direction incoming direction
     * @returns true if element has been focused, false otherwise
     */
    focus(element: string, silent: boolean, direction: Direction): boolean;
    /**
     * Move to another element
     */
    move(direction: Direction, selector: string | undefined): boolean;
    /**
     * Make a section focusable (more precisely, all its focusable children are made focusable)
     * @param sectionId id of the section to make focusable, undefined if you want to make all sections focusable
     */
    makeFocusable(sectionId: string | undefined): void | never;
    /**
     * Set the default section
     * @param sectionId id of the section to set as default
     */
    setDefaultSection(sectionId: string): void | never;
    /**
     * Focus an element
     */
    focusElement(element: HTMLElement): boolean;
    /**
     * Focus the section once it has been mounted
     * @param sectionId id of the section to focus
     */
    focusOnMounted(sectionId: string): void;
    /**
     * Check if Spatial Navigation is waiting this element to be mounted before focusing it.
     * @param element element to check
     */
    hasBeenWaitingForMounted(sectionId: string): void;
    /**
     * Generate a unique id for a section
     * @returns new id section
     */
    private generateId;
    private getCurrentFocusedElement;
    private extend;
    private exclude;
    /**
     * Check if an element is navigable
     * @param elem element to check
     * @param sectionId id of the element's section
     * @param verifySectionSelector if true, check the section selector
     * @returns true if element is navigable, false otherwise
     */
    private isNavigable;
    /**
     * Get the element's section id
     * @param element element
     * @returns the element's section id
     */
    private getSectionId;
    /**
     * Get navigable elements into a section
     * @param sectionId id of the section
     */
    private getSectionNavigableElements;
    /**
     * Get the default element of a section
     * @param sectionId id of the section
     * @returns the default element of a section, null if no default element found
     */
    private getSectionDefaultElement;
    /**
     * Get the last focused element into a section
     * @param sectionId id of the section
     * @returns the last focused element, null if no element found
     */
    private getSectionLastFocusedElement;
    /**
     * fire an event
     * @param element element source
     * @param type type of event
     * @param details ?
     * @param cancelable true if cancelable, false otherwise
     * @returns true if event has been successfully dispatched
     */
    private fireEvent;
    /**
     * focus and scroll on element
     * @param element element to focus
     * @param sectionId id of the section containing the element
     * @param enterIntoNewSection true if we enter into the section, false otherwise
     */
    private focusNScroll;
    /**
     *
     * @param elem
     * @param sectionId
     */
    private focusChanged;
    private silentFocus;
    /**
     * Focus an element
     * @param elem element to focus
     * @param sectionId id of the element's section
     * @param enterIntoNewSection true if new section is focused, false otherwise
     * @param direction source direction
     */
    private _focusElement;
    private focusExtendedSelector;
    private addRange;
    /**
     * Focus a section
     * @param sectionId id of the section
     * @param direction direction
     * @returns true if section has been focused
     */
    private focusSection;
    /**
     * Fire event when navigate has failed
     * @param element element source
     * @param direction direction source
     * @returns true if event has been successfully raised
     */
    private fireNavigateFailed;
    private goToLeaveFor;
    /**
     * Focus next element
     * @param direction source direction
     * @param currentFocusedElement current focused element
     * @param currentSectionId current section id
     * @returns true if next has been focused successfully
     */
    private focusNext;
    private preventDefault;
    private onKeyDown;
    private onKeyUp;
    private onFocus;
    private onBlur;
    private isSection;
    private onBodyClick;
    /**
     * Make focusable elements of a section.
     * @param configuration configuration of the section to male focusable ?
     */
    private doMakeFocusable;
}
declare const sn: SpatialNavigation;
export { SpatialNavigation, sn };
//# sourceMappingURL=SpatialNavigation.d.ts.map