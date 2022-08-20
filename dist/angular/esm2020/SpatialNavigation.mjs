import { core } from './Core';
import { defaultConfiguration } from './types/Configuration';
import { Direction, directiontoString, getReverseDirection } from './types/Direction';
class SpatialNavigation {
    constructor() {
        this._ready = false;
        this._idPool = 0;
        this._sections = {};
        this._sectionCount = 0;
        this._defaultSectionId = '';
        this._lastSectionId = '';
        this._duringFocusChange = false;
        this.globalConfiguration = defaultConfiguration;
        this._pause = false;
        this.core = core;
        this.ID_POOL_PREFIX = 'section-';
        this.EVENT_PREFIX = 'sn:';
        this.focusOnMountedSections = [];
        this._throttle = null;
        // #endregion
    }
    static getInstance() {
        if (!SpatialNavigation.instance) {
            SpatialNavigation.instance = new SpatialNavigation();
        }
        return SpatialNavigation.instance;
    }
    // #region PUBLIC FUNCTIONS
    /**
     * Init listeners
     */
    init() {
        if (!this._ready) {
            window.addEventListener('keydown', this.onKeyDown.bind(this));
            window.addEventListener('keyup', this.onKeyUp.bind(this));
            window.addEventListener('focus', this.onFocus.bind(this), true);
            window.addEventListener('blur', this.onBlur.bind(this), true);
            // document.body.addEventListener('click', onBodyClick);
            this._ready = true;
        }
    }
    /**
     * Remove listeners and reinitialize SpatialNavigation attributes.
     */
    uninit() {
        window.removeEventListener('blur', this.onBlur, true);
        window.removeEventListener('focus', this.onFocus, true);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('keydown', this.onKeyDown);
        // document.body.removeEventListener('click', onBodyClick);
        this.clear();
        this._idPool = 0;
        this._ready = false;
    }
    /**
     * Clear attributes values.
     */
    clear() {
        this._sections = {};
        this._sectionCount = 0;
        this._defaultSectionId = '';
        this._lastSectionId = '';
        this._duringFocusChange = false;
    }
    /**
     * Reset a lastFocusedElement and previous element of a section.
     * @param sectionId - section to reset
     */
    reset(sectionId) {
        if (sectionId) {
            this._sections[sectionId].lastFocusedElement = undefined;
            this._sections[sectionId].previous = undefined;
        }
        else {
            for (const id in this._sections) {
                const section = this._sections[id];
                section.lastFocusedElement = undefined;
                section.previous = undefined;
            }
        }
    }
    /**
     * Set the configuration of a section or set the global configuration
     * @param sectionId - section to configure, undefined to set the global configuration.
     * @param config - configuration
     */
    set(sectionId, config) {
        const finalConfig = {};
        Object.assign(finalConfig, this.globalConfiguration);
        Object.assign(finalConfig, config);
        if (sectionId !== undefined) {
            if (!this._sections[sectionId]) {
                throw new Error(`Section "${sectionId}" doesn't exist!`);
            }
            this._sections[sectionId].configuration = finalConfig;
        }
        else {
            this.globalConfiguration = finalConfig;
        }
        return true;
    }
    /**
     * Add a section
     * @param sectionId - section id to add
     * @param config - configuration of the section
     * @returns sectionId
     */
    add(sectionId, config) {
        if (!sectionId) {
            // eslint-disable-next-line no-param-reassign
            sectionId = this.generateId();
        }
        if (this._sections[sectionId]) {
            throw new Error(`Section "${sectionId}" already exist!`);
        }
        else {
            this._sections[sectionId] = {
                id: sectionId,
                configuration: defaultConfiguration,
                lastFocusedElement: undefined,
                previous: undefined
            };
        }
        if (this.set(sectionId, config)) {
            this._sectionCount++;
        }
        return sectionId;
    }
    /**
     * Remove a section
     * @param sectionId id of the section to remove
     * @returns true if section has been removed, false otherwise
     */
    remove(sectionId) {
        if (this._sections[sectionId]) {
            if (delete this._sections[sectionId]) {
                this._sectionCount--;
            }
            if (this._lastSectionId === sectionId) {
                this._lastSectionId = '';
            }
            return true;
        }
        return false;
    }
    /**
     * Disable navigation on a section
     * @param sectionId - id of the section to disable
     * @returns true if section has been disabled, false otherwise
     */
    disable(sectionId) {
        if (this._sections[sectionId] && this._sections[sectionId].configuration) {
            this._sections[sectionId].configuration.disabled = true;
            return true;
        }
        return false;
    }
    /**
     * Enable navigation on a section
     * @param sectionId - id of the section to enable
     * @returns true if section has been enabled, false otherwise
     */
    enable(sectionId) {
        if (this._sections[sectionId] && this._sections[sectionId].configuration) {
            this._sections[sectionId].configuration.disabled = false;
            return true;
        }
        return false;
    }
    /**
     * Pause navigation
     */
    pause() {
        this._pause = true;
    }
    /**
     * Resume navigation
     */
    resume() {
        this._pause = false;
    }
    /**
     * Focus an element
     * @param element element to focus (section id or selector), (an element or a section)
     * @param silent ?
     * @param direction incoming direction
     * @returns true if element has been focused, false otherwise
     */
    focus(element, silent, direction) {
        let result = false;
        const autoPause = !this._pause && silent;
        if (autoPause)
            this.pause();
        // TO DO - add focusExtendedSelector and _focusElement ???
        if (this.isSection(element)) {
            result = this.focusSection(element, direction);
        }
        else {
            result = this.focusExtendedSelector(element, direction, false);
        }
        if (autoPause)
            this.resume();
        return result;
    }
    /**
     * Move to another element
     */
    move(direction, selector) {
        let element = undefined;
        if (selector) {
            const elements = this.core.parseSelector(selector);
            if (elements.length > 0) {
                element = this.core.parseSelector(selector)[0];
            }
        }
        else {
            element = this.getCurrentFocusedElement();
        }
        if (!element) {
            return false;
        }
        const sectionId = this.getSectionId(element);
        if (!sectionId) {
            return false;
        }
        const willmoveProperties = {
            direction,
            sectionId,
            cause: 'api'
        };
        if (!this.fireEvent(element, 'willmove', willmoveProperties, undefined)) {
            return false;
        }
        return this.focusNext(direction, element, sectionId);
    }
    /**
     * Make a section focusable (more precisely, all its focusable children are made focusable)
     * @param sectionId id of the section to make focusable, undefined if you want to make all sections focusable
     */
    makeFocusable(sectionId) {
        if (sectionId) {
            if (this._sections[sectionId]) {
                this.doMakeFocusable(this._sections[sectionId].configuration);
            }
            else {
                throw new Error(`Section "${sectionId}" doesn't exist!`);
            }
        }
        else {
            // make focusable all sections (init ?)
            for (const id in this._sections) {
                this.doMakeFocusable(this._sections[id].configuration);
            }
        }
    }
    /**
     * Set the default section
     * @param sectionId id of the section to set as default
     */
    setDefaultSection(sectionId) {
        if (this._sections[sectionId] !== undefined) {
            this._defaultSectionId = sectionId;
        }
        else {
            throw new Error(`Section "${sectionId}" doesn't exist!`);
        }
    }
    /**
     * Focus an element
     */
    focusElement(element) {
        if (!element)
            return false;
        const nextSectionId = this.getSectionId(element);
        if (!nextSectionId)
            return false;
        const currentFocusedElement = this.getCurrentFocusedElement();
        let enterIntoNewSection = true;
        if (currentFocusedElement) {
            const currentSectionId = this.getSectionId(currentFocusedElement);
            enterIntoNewSection = nextSectionId === currentSectionId;
        }
        if (this.isNavigable(element, nextSectionId, false)) {
            return this._focusElement(element, nextSectionId, enterIntoNewSection, Direction.UP);
        }
        return false;
    }
    /**
     * Focus the section once it has been mounted
     * @param sectionId id of the section to focus
     */
    focusOnMounted(sectionId) {
        this.focusOnMountedSections.push(sectionId);
    }
    /**
     * Check if Spatial Navigation is waiting this element to be mounted before focusing it.
     * @param element element to check
     */
    hasBeenWaitingForMounted(sectionId) {
        if (this.focusOnMountedSections.includes(sectionId)) {
            this.focusSection(sectionId, Direction.UP);
            this.focusOnMountedSections = this.focusOnMountedSections.filter((foms) => foms !== sectionId);
        }
    }
    // #endregion
    // #region PRIVATE FUNCTIONS
    /**
     * Generate a unique id for a section
     * @returns new id section
     */
    generateId() {
        let id;
        while (true) {
            id = this.ID_POOL_PREFIX + String(++this._idPool);
            if (!this._sections[id]) {
                break;
            }
        }
        return id;
    }
    getCurrentFocusedElement() {
        const { activeElement } = document;
        if (activeElement && activeElement !== document.body) {
            return activeElement;
        }
        return undefined;
    }
    extend(out, ...args) {
        out = out || {};
        for (let i = 1; i < args.length; i++) {
            if (!args[i]) {
                continue;
            }
            for (const key in args[i]) {
                if (args[i].hasOwnProperty(key) && args[i][key] !== undefined) {
                    out[key] = args[i][key];
                }
            }
        }
        return out;
    }
    exclude(elemList, excludedElem) {
        if (!Array.isArray(excludedElem)) {
            excludedElem = [excludedElem];
        }
        for (let i = 0, index; i < excludedElem.length; i++) {
            index = elemList.indexOf(excludedElem[i]);
            if (index >= 0) {
                elemList.splice(index, 1);
            }
        }
        return elemList;
    }
    /**
     * Check if an element is navigable
     * @param elem element to check
     * @param sectionId id of the element's section
     * @param verifySectionSelector if true, check the section selector
     * @returns true if element is navigable, false otherwise
     */
    isNavigable(elem, sectionId, verifySectionSelector) {
        if (!elem || !sectionId || !this._sections[sectionId] || this._sections[sectionId].configuration.disabled) {
            return false;
        }
        if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0) || elem.hasAttribute('disabled')) {
            return false;
        }
        if (verifySectionSelector && !this.core.matchSelector(elem, this._sections[sectionId].configuration.selector)) {
            return false;
        }
        if (this._sections[sectionId].configuration.navigableFilter !== null) {
            if (this._sections[sectionId].configuration.navigableFilter(elem, sectionId) === false) {
                return false;
            }
        }
        else if (this.globalConfiguration.navigableFilter !== null) {
            if (this.globalConfiguration.navigableFilter(elem, sectionId) === false) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get the element's section id
     * @param element element
     * @returns the element's section id
     */
    getSectionId(element) {
        const sectionsElements = {};
        for (const id in this._sections) {
            if (!this._sections[id].configuration.disabled) {
                const sectionElement = this._sections[id].configuration.element;
                if (sectionElement) {
                    sectionsElements[id] = sectionElement;
                }
                else {
                    if (this._sections[id].configuration.selector !== '' && this._sections[id].configuration.selector !== undefined) {
                        const elementWithSelector = this.core.parseSelector(`[data-section-id="${id}"]`)[0];
                        if (elementWithSelector) {
                            sectionsElements[id] = elementWithSelector;
                        }
                    }
                }
            }
        }
        let parent = element;
        while (parent) {
            if (Object.values(sectionsElements).indexOf(parent) > -1) {
                return Object.keys(sectionsElements).find((key) => sectionsElements[key] === parent);
            }
            parent = parent.parentElement;
        }
        return undefined;
    }
    /**
     * Get navigable elements into a section
     * @param sectionId id of the section
     */
    getSectionNavigableElements(sectionId) {
        return this.core.parseSelector(this._sections[sectionId].configuration.selector)
            .filter((element) => this.isNavigable(element, sectionId, false));
    }
    /**
     * Get the default element of a section
     * @param sectionId id of the section
     * @returns the default element of a section, null if no default element found
     */
    getSectionDefaultElement(sectionId) {
        const { defaultElement } = this._sections[sectionId].configuration;
        if (!defaultElement) {
            return null;
        }
        const elements = this.core.parseSelector(defaultElement);
        // check each element to see if it's navigable and stop when one has been found
        for (const element of elements) {
            if (this.isNavigable(element, sectionId, true)) {
                return element;
            }
        }
        return null;
    }
    /**
     * Get the last focused element into a section
     * @param sectionId id of the section
     * @returns the last focused element, null if no element found
     */
    getSectionLastFocusedElement(sectionId) {
        const { lastFocusedElement } = this._sections[sectionId];
        if (lastFocusedElement) {
            if (!this.isNavigable(lastFocusedElement, sectionId, true)) {
                return null;
            }
            return lastFocusedElement;
        }
        return null;
    }
    /**
     * fire an event
     * @param element element source
     * @param type type of event
     * @param details ?
     * @param cancelable true if cancelable, false otherwise
     * @returns true if event has been successfully dispatched
     */
    fireEvent(element, type, details, cancelable) {
        if (arguments.length < 4) {
            cancelable = true;
        }
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(this.EVENT_PREFIX + type, true, cancelable, details);
        return element.dispatchEvent(evt);
    }
    /**
     * focus and scroll on element
     * @param element element to focus
     * @param sectionId id of the section containing the element
     * @param enterIntoNewSection true if we enter into the section, false otherwise
     */
    focusNScroll(element, sectionId, enterIntoNewSection) {
        let scrollOptions = enterIntoNewSection ? this._sections[sectionId].configuration.scrollOptions
            : this._sections[sectionId].configuration.scrollOptionsIntoSection;
        // if no-scroll given as scrollOptions, then focus without scrolling
        if (scrollOptions === 'no-scroll') {
            element.focus({ preventScroll: true });
        }
        else if (scrollOptions !== undefined && scrollOptions !== '' && !(scrollOptions instanceof String)) {
            element.focus({ preventScroll: true });
            element.scrollIntoView(scrollOptions);
        }
        else if (this.globalConfiguration) {
            scrollOptions = enterIntoNewSection ? this.globalConfiguration.scrollOptions : this.globalConfiguration.scrollOptionsIntoSection;
            if (scrollOptions !== undefined && scrollOptions !== '' && scrollOptions !== 'no-scroll') {
                element.focus({ preventScroll: true });
                element.scrollIntoView(scrollOptions);
            }
            else {
                element.focus({ preventScroll: true });
            }
        }
        else {
            element.focus();
        }
    }
    /**
     *
     * @param elem
     * @param sectionId
     */
    focusChanged(element, sectionId) {
        let id = sectionId;
        if (!id) {
            id = this.getSectionId(element);
        }
        if (id) {
            this._sections[sectionId].lastFocusedElement = element;
            this._lastSectionId = sectionId;
        }
    }
    silentFocus(element, sectionId, scrollIntoNewSection) {
        const currentFocusedElement = this.getCurrentFocusedElement();
        if (currentFocusedElement) {
            currentFocusedElement.blur();
        }
        this.focusNScroll(element, sectionId, scrollIntoNewSection);
        this.focusChanged(element, sectionId);
    }
    /**
     * Focus an element
     * @param elem element to focus
     * @param sectionId id of the element's section
     * @param enterIntoNewSection true if new section is focused, false otherwise
     * @param direction source direction
     */
    _focusElement(element, sectionId, enterIntoNewSection, direction) {
        if (!element) {
            return false;
        }
        const currentFocusedElement = this.getCurrentFocusedElement();
        if (this._duringFocusChange) {
            this.silentFocus(element, sectionId, enterIntoNewSection);
            return true;
        }
        this._duringFocusChange = true;
        if (this._pause) {
            this.silentFocus(element, sectionId, enterIntoNewSection);
            this._duringFocusChange = false;
            return true;
        }
        if (currentFocusedElement) {
            const unfocusProperties = {
                nextElement: element,
                nextSectionId: sectionId,
                direction,
                native: false
            };
            if (!this.fireEvent(currentFocusedElement, 'willunfocus', unfocusProperties, undefined)) {
                this._duringFocusChange = false;
                return false;
            }
            currentFocusedElement.blur();
            this.fireEvent(currentFocusedElement, 'unfocused', unfocusProperties, false);
        }
        const focusProperties = {
            previousElement: currentFocusedElement,
            sectionId,
            direction,
            native: false
        };
        if (!this.fireEvent(element, 'willfocus', focusProperties)) {
            this._duringFocusChange = false;
            return false;
        }
        this.focusNScroll(element, sectionId, enterIntoNewSection);
        this.fireEvent(element, 'focused', focusProperties, false);
        this._duringFocusChange = false;
        this.focusChanged(element, sectionId);
        return true;
    }
    focusExtendedSelector(selector, direction, enterIntoNewSection) {
        if (selector.charAt(0) === '@') {
            if (selector.length === 1) {
                return this.focusSection(undefined, direction);
            }
            const sectionId = selector.substr(1);
            return this.focusSection(sectionId, direction);
        }
        const next = this.core.parseSelector(selector)[0];
        if (next) {
            const nextSectionId = this.getSectionId(next);
            if (nextSectionId) {
                if (this.isNavigable(next, nextSectionId, false)) {
                    return this._focusElement(next, nextSectionId, enterIntoNewSection, direction);
                }
            }
            else {
                return false;
            }
        }
        return false;
    }
    addRange(id, range) {
        if (id && range.indexOf(id) < 0 && this._sections[id] && !this._sections[id].configuration.disabled) {
            range.push(id);
        }
    }
    /**
     * Focus a section
     * @param sectionId id of the section
     * @param direction direction
     * @returns true if section has been focused
     */
    focusSection(sectionId, direction) {
        const range = [];
        if (sectionId) {
            this.addRange(sectionId, range);
        }
        else {
            this.addRange(this._defaultSectionId, range);
            this.addRange(this._lastSectionId, range);
            for (const section in this._sections) {
                this.addRange(section, range);
            }
        }
        for (let i = 0; i < range.length; i++) {
            const id = range[i];
            let next;
            if (this._sections[id].configuration.enterTo === 'last-focused') {
                next = this.getSectionLastFocusedElement(id)
                    || this.getSectionDefaultElement(id)
                    || this.getSectionNavigableElements(id)[0];
            }
            else {
                next = this.getSectionDefaultElement(id)
                    || this.getSectionLastFocusedElement(id)
                    || this.getSectionNavigableElements(id)[0];
            }
            if (next) {
                return this._focusElement(next, id, true, direction);
            }
        }
        return false;
    }
    /**
     * Fire event when navigate has failed
     * @param element element source
     * @param direction direction source
     * @returns true if event has been successfully raised
     */
    fireNavigateFailed(element, direction) {
        return this.fireEvent(element, 'navigatefailed', {
            direction
        }, false);
    }
    goToLeaveFor(sectionId, direction) {
        if (this._sections[sectionId].configuration.leaveFor
            && this._sections[sectionId].configuration.leaveFor[directiontoString(direction)] !== undefined) {
            const next = this._sections[sectionId].configuration.leaveFor[directiontoString(direction)];
            if (next === '' || next === 'nowhere') {
                return null;
            }
            return this.focusExtendedSelector(next, direction, true);
        }
        return false;
    }
    /**
     * Focus next element
     * @param direction source direction
     * @param currentFocusedElement current focused element
     * @param currentSectionId current section id
     * @returns true if next has been focused successfully
     */
    focusNext(direction, currentFocusedElement, currentSectionId) {
        const extSelector = currentFocusedElement.getAttribute(`data-sn-${direction}`);
        // TO DO remove typeof
        if (typeof extSelector === 'string') {
            if (extSelector === ''
                || !this.focusExtendedSelector(extSelector, direction, false)) { // whhich value for enterIntoNewSection ? true or false ???
                this.fireNavigateFailed(currentFocusedElement, direction);
                return false;
            }
            return true;
        }
        const sectionNavigableElements = {};
        let allNavigableElements = [];
        for (const id in this._sections) {
            sectionNavigableElements[id] = this.getSectionNavigableElements(id);
            allNavigableElements = allNavigableElements.concat(sectionNavigableElements[id]);
        }
        // const config: Configuration = this.extend({}, this.globalConfiguration, this._sections[currentSectionId].configuration);
        let next;
        const currentSection = this._sections[currentSectionId];
        if (currentSection.configuration.restrict === 'self-only' || currentSection.configuration.restrict === 'self-first') {
            const currentSectionNavigableElements = sectionNavigableElements[currentSectionId];
            next = this.core.navigate(currentFocusedElement, direction, this.exclude(currentSectionNavigableElements, currentFocusedElement), currentSection);
            if (!next && currentSection.configuration.restrict === 'self-first') {
                next = this.core.navigate(currentFocusedElement, direction, this.exclude(allNavigableElements, currentSectionNavigableElements), currentSection);
            }
        }
        else {
            next = this.core.navigate(currentFocusedElement, direction, this.exclude(allNavigableElements, currentFocusedElement), currentSection);
        }
        if (next) {
            currentSection.previous = {
                target: currentFocusedElement,
                destination: next,
                reverse: getReverseDirection(direction)
            };
            const nextSectionId = this.getSectionId(next);
            let enterIntoNewSection = false;
            if (currentSectionId !== nextSectionId && nextSectionId !== undefined) {
                // We enter into another section
                enterIntoNewSection = true;
                const result = this.goToLeaveFor(currentSectionId, direction);
                if (result) {
                    return true;
                }
                if (result === null) {
                    this.fireNavigateFailed(currentFocusedElement, direction);
                    return false;
                }
                let enterToElement = null;
                switch (this._sections[nextSectionId].configuration.enterTo) {
                    case 'last-focused':
                        enterToElement = this.getSectionLastFocusedElement(nextSectionId)
                            || this.getSectionDefaultElement(nextSectionId);
                        break;
                    case 'default-element':
                        enterToElement = this.getSectionDefaultElement(nextSectionId);
                        break;
                    default:
                        break;
                }
                if (enterToElement) {
                    next = enterToElement;
                }
            }
            if (nextSectionId) {
                return this._focusElement(next, nextSectionId, enterIntoNewSection, direction);
            }
            return false;
        }
        if (this.goToLeaveFor(currentSectionId, direction)) {
            return true;
        }
        this.fireNavigateFailed(currentFocusedElement, direction);
        return false;
    }
    preventDefault(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        return false;
    }
    onKeyDown(evt) {
        if (this._throttle) {
            this.preventDefault(evt);
            return false;
        }
        this._throttle = window.setTimeout(() => {
            this._throttle = null;
        }, this.globalConfiguration.throttle);
        if (!this._sectionCount || this._pause
            || evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
            return false;
        }
        let currentFocusedElement;
        const direction = evt.keyCode;
        if (!direction) {
            if (evt.keyCode === 13) {
                currentFocusedElement = this.getCurrentFocusedElement();
                if (currentFocusedElement && this.getSectionId(currentFocusedElement)) {
                    if (!this.fireEvent(currentFocusedElement, 'enter-down', undefined, undefined)) {
                        return this.preventDefault(evt);
                    }
                }
            }
            return false;
        }
        currentFocusedElement = this.getCurrentFocusedElement();
        if (!currentFocusedElement) {
            if (this._lastSectionId) {
                currentFocusedElement = this.getSectionLastFocusedElement(this._lastSectionId);
            }
            if (!currentFocusedElement) {
                this.focusSection(undefined, direction);
                return this.preventDefault(evt);
            }
        }
        const currentSectionId = this.getSectionId(currentFocusedElement);
        if (!currentSectionId) {
            return false;
        }
        const willmoveProperties = {
            direction,
            sectionId: currentSectionId,
            cause: 'keydown'
        };
        if (this.fireEvent(currentFocusedElement, 'willmove', willmoveProperties)) {
            this.focusNext(direction, currentFocusedElement, currentSectionId);
        }
        return this.preventDefault(evt);
    }
    onKeyUp(evt) {
        if (evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
            return;
        }
        if (!this._pause && this._sectionCount && evt.keyCode === 13) {
            const currentFocusedElement = this.getCurrentFocusedElement();
            if (currentFocusedElement && this.getSectionId(currentFocusedElement)) {
                if (!this.fireEvent(currentFocusedElement, 'enter-up', undefined, undefined)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            }
        }
    }
    onFocus(evt) {
        const { target } = evt;
        const htmlTarget = target;
        if (target !== window && target !== document
            && this._sectionCount && !this._duringFocusChange && target) {
            const sectionId = this.getSectionId(htmlTarget);
            if (sectionId) {
                if (this._pause) {
                    this.focusChanged(htmlTarget, sectionId);
                    return;
                }
                const focusProperties = {
                    sectionId,
                    native: true
                };
                if (!this.fireEvent(htmlTarget, 'willfocus', focusProperties)) {
                    this._duringFocusChange = true;
                    htmlTarget.blur();
                    this._duringFocusChange = false;
                }
                else {
                    this.fireEvent(htmlTarget, 'focused', focusProperties, false);
                    this.focusChanged(htmlTarget, sectionId);
                }
            }
        }
    }
    onBlur(evt) {
        const target = evt.target;
        const htmlTarget = target;
        if (target !== window && target !== document && !this._pause
            && this._sectionCount && !this._duringFocusChange && this.getSectionId(htmlTarget)) {
            const unfocusProperties = {
                native: true
            };
            if (!this.fireEvent(htmlTarget, 'willunfocus', unfocusProperties)) {
                this._duringFocusChange = true;
                setTimeout(() => {
                    htmlTarget.focus();
                    this._duringFocusChange = false;
                });
            }
            else {
                this.fireEvent(htmlTarget, 'unfocused', unfocusProperties, false);
            }
        }
    }
    isSection(sectionId) {
        if (sectionId) {
            return sectionId in this._sections;
        }
        return false;
    }
    // TO REMOVE ???
    onBodyClick() {
        if (this._sections[this._lastSectionId]) {
            const lastFocusedElement = this._sections[this._lastSectionId].lastFocusedElement;
            if (document.activeElement === document.body && this._lastSectionId
                && lastFocusedElement) {
                this._focusElement(lastFocusedElement, this._lastSectionId, true, undefined);
            }
        }
    }
    /**
     * Make focusable elements of a section.
     * @param configuration configuration of the section to male focusable ?
     */
    doMakeFocusable(configuration) {
        let tabIndexIgnoreList;
        if (configuration.tabIndexIgnoreList !== undefined) {
            tabIndexIgnoreList = configuration.tabIndexIgnoreList;
        }
        else {
            tabIndexIgnoreList = this.globalConfiguration.tabIndexIgnoreList;
        }
        this.core.parseSelector(configuration.selector).forEach((element) => {
            if (!this.core.matchSelector(element, tabIndexIgnoreList)) {
                const htmlElement = element;
                if (!htmlElement.getAttribute('tabindex')) {
                    // set the tabindex with a negative value. https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
                    htmlElement.setAttribute('tabindex', '-1');
                }
            }
        });
    }
}
const sn = SpatialNavigation.getInstance();
export { SpatialNavigation, sn };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3BhdGlhbE5hdmlnYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvU3BhdGlhbE5hdmlnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFRLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNwQyxPQUFPLEVBQWlCLG9CQUFvQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBR3RGLE1BQU0saUJBQWlCO0lBQXZCO1FBRVUsV0FBTSxHQUFZLEtBQUssQ0FBQztRQUN4QixZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLGNBQVMsR0FBZ0MsRUFBRSxDQUFDO1FBQzVDLGtCQUFhLEdBQVcsQ0FBQyxDQUFDO1FBQzFCLHNCQUFpQixHQUFXLEVBQUUsQ0FBQztRQUMvQixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUM1Qix1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFDcEMsd0JBQW1CLEdBQWtCLG9CQUFvQixDQUFDO1FBQzFELFdBQU0sR0FBWSxLQUFLLENBQUM7UUFDeEIsU0FBSSxHQUFTLElBQUksQ0FBQztRQUNULG1CQUFjLEdBQUcsVUFBVSxDQUFDO1FBQzVCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzlCLDJCQUFzQixHQUFhLEVBQUUsQ0FBQztRQUN0QyxjQUFTLEdBQWtCLElBQUksQ0FBQztRQWc4QnhDLGFBQWE7SUFDZixDQUFDO0lBLzdCUSxNQUFNLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFO1lBQy9CLGlCQUFpQixDQUFDLFFBQVEsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7U0FDdEQ7UUFDRCxPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztJQUNwQyxDQUFDO0lBRUQsMkJBQTJCO0lBRTNCOztPQUVHO0lBQ0ksSUFB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QUFFO2dCQUN6RCxNQUFNLFdBQVcsR0FBRyxPQUFzQixDQUFDO2dCQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDekMsdUhBQXVIO29CQUN2SCxXQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDNUM7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUVGO0FBRUQsTUFBTSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDM0MsT0FBTyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSwgY29yZSB9IGZyb20gJy4vQ29yZSc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBkZWZhdWx0Q29uZmlndXJhdGlvbiB9IGZyb20gJy4vdHlwZXMvQ29uZmlndXJhdGlvbic7XG5pbXBvcnQgeyBEaXJlY3Rpb24sIGRpcmVjdGlvbnRvU3RyaW5nLCBnZXRSZXZlcnNlRGlyZWN0aW9uIH0gZnJvbSAnLi90eXBlcy9EaXJlY3Rpb24nO1xuaW1wb3J0IHsgU2VjdGlvbiB9IGZyb20gJy4vdHlwZXMvU2VjdGlvbic7XG5cbmNsYXNzIFNwYXRpYWxOYXZpZ2F0aW9uIHtcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IFNwYXRpYWxOYXZpZ2F0aW9uO1xuICBwcml2YXRlIF9yZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9pZFBvb2w6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgX3NlY3Rpb25zOiB7IFtrZXk6IHN0cmluZ106IFNlY3Rpb247IH0gPSB7fTtcbiAgcHJpdmF0ZSBfc2VjdGlvbkNvdW50OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIF9kZWZhdWx0U2VjdGlvbklkOiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBfbGFzdFNlY3Rpb25JZDogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX2R1cmluZ0ZvY3VzQ2hhbmdlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZ2xvYmFsQ29uZmlndXJhdGlvbjogQ29uZmlndXJhdGlvbiA9IGRlZmF1bHRDb25maWd1cmF0aW9uO1xuICBwcml2YXRlIF9wYXVzZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGNvcmU6IENvcmUgPSBjb3JlO1xuICBwcml2YXRlIHJlYWRvbmx5IElEX1BPT0xfUFJFRklYID0gJ3NlY3Rpb24tJztcbiAgcHJpdmF0ZSByZWFkb25seSBFVkVOVF9QUkVGSVggPSAnc246JztcbiAgcHJpdmF0ZSBmb2N1c09uTW91bnRlZFNlY3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIF90aHJvdHRsZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSAoKTogU3BhdGlhbE5hdmlnYXRpb24ge1xuICAgIGlmICghU3BhdGlhbE5hdmlnYXRpb24uaW5zdGFuY2UpIHtcbiAgICAgIFNwYXRpYWxOYXZpZ2F0aW9uLmluc3RhbmNlID0gbmV3IFNwYXRpYWxOYXZpZ2F0aW9uKCk7XG4gICAgfVxuICAgIHJldHVybiBTcGF0aWFsTmF2aWdhdGlvbi5pbnN0YW5jZTtcbiAgfVxuXG4gIC8vICNyZWdpb24gUFVCTElDIEZVTkNUSU9OU1xuXG4gIC8qKlxuICAgKiBJbml0IGxpc3RlbmVyc1xuICAgKi9cbiAgcHVibGljIGluaXQgKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fcmVhZHkpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd24uYmluZCh0aGlzKSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLm9uRm9jdXMuYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMub25CbHVyLmJpbmQodGhpcyksIHRydWUpO1xuICAgICAgLy8gZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uQm9keUNsaWNrKTtcbiAgICAgIHRoaXMuX3JlYWR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGxpc3RlbmVycyBhbmQgcmVpbml0aWFsaXplIFNwYXRpYWxOYXZpZ2F0aW9uIGF0dHJpYnV0ZXMuXG4gICAqL1xuICBwdWJsaWMgdW5pbml0ICgpOiB2b2lkIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMub25CbHVyLCB0cnVlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLm9uRm9jdXMsIHRydWUpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMub25LZXlVcCk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bik7XG4gICAgLy8gZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIG9uQm9keUNsaWNrKTtcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5faWRQb29sID0gMDtcbiAgICB0aGlzLl9yZWFkeSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFyIGF0dHJpYnV0ZXMgdmFsdWVzLlxuICAgKi9cbiAgcHVibGljIGNsZWFyICgpOiB2b2lkIHtcbiAgICB0aGlzLl9zZWN0aW9ucyA9IHt9O1xuICAgIHRoaXMuX3NlY3Rpb25Db3VudCA9IDA7XG4gICAgdGhpcy5fZGVmYXVsdFNlY3Rpb25JZCA9ICcnO1xuICAgIHRoaXMuX2xhc3RTZWN0aW9uSWQgPSAnJztcbiAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IGEgbGFzdEZvY3VzZWRFbGVtZW50IGFuZCBwcmV2aW91cyBlbGVtZW50IG9mIGEgc2VjdGlvbi5cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIHNlY3Rpb24gdG8gcmVzZXRcbiAgICovXG4gIHB1YmxpYyByZXNldCAoc2VjdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoc2VjdGlvbklkKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmxhc3RGb2N1c2VkRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0ucHJldmlvdXMgPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoY29uc3QgaWQgaW4gdGhpcy5fc2VjdGlvbnMpIHtcbiAgICAgICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuX3NlY3Rpb25zW2lkXTtcbiAgICAgICAgc2VjdGlvbi5sYXN0Rm9jdXNlZEVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHNlY3Rpb24ucHJldmlvdXMgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY29uZmlndXJhdGlvbiBvZiBhIHNlY3Rpb24gb3Igc2V0IHRoZSBnbG9iYWwgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gc2VjdGlvbiB0byBjb25maWd1cmUsIHVuZGVmaW5lZCB0byBzZXQgdGhlIGdsb2JhbCBjb25maWd1cmF0aW9uLlxuICAgKiBAcGFyYW0gY29uZmlnIC0gY29uZmlndXJhdGlvblxuICAgKi9cbiAgcHVibGljIHNldCAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGNvbmZpZzogQ29uZmlndXJhdGlvbik6IGJvb2xlYW4gfCBuZXZlciB7XG4gICAgY29uc3QgZmluYWxDb25maWcgPSB7fTtcbiAgICBPYmplY3QuYXNzaWduKGZpbmFsQ29uZmlnLCB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24pO1xuICAgIE9iamVjdC5hc3NpZ24oZmluYWxDb25maWcsIGNvbmZpZyk7XG5cbiAgICBpZiAoc2VjdGlvbklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBkb2Vzbid0IGV4aXN0IWApO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uID0gZmluYWxDb25maWcgYXMgQ29uZmlndXJhdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uID0gZmluYWxDb25maWcgYXMgQ29uZmlndXJhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gc2VjdGlvbiBpZCB0byBhZGRcbiAgICogQHBhcmFtIGNvbmZpZyAtIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNlY3Rpb25cbiAgICogQHJldHVybnMgc2VjdGlvbklkXG4gICAqL1xuICBwdWJsaWMgYWRkIChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCwgY29uZmlnOiBDb25maWd1cmF0aW9uKTogc3RyaW5nIHwgbmV2ZXIge1xuICAgIGlmICghc2VjdGlvbklkKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgIHNlY3Rpb25JZCA9IHRoaXMuZ2VuZXJhdGVJZCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZWN0aW9uIFwiJHtzZWN0aW9uSWR9XCIgYWxyZWFkeSBleGlzdCFgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSA9IHtcbiAgICAgICAgaWQ6IHNlY3Rpb25JZCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogZGVmYXVsdENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGxhc3RGb2N1c2VkRWxlbWVudDogdW5kZWZpbmVkLFxuICAgICAgICBwcmV2aW91czogdW5kZWZpbmVkXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAodGhpcy5zZXQoc2VjdGlvbklkLCBjb25maWcpKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uQ291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIHNlY3Rpb25JZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb24gdG8gcmVtb3ZlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiByZW1vdmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyByZW1vdmUgKHNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgIGlmIChkZWxldGUgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgICB0aGlzLl9zZWN0aW9uQ291bnQtLTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9sYXN0U2VjdGlvbklkID09PSBzZWN0aW9uSWQpIHtcbiAgICAgICAgdGhpcy5fbGFzdFNlY3Rpb25JZCA9ICcnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIG5hdmlnYXRpb24gb24gYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgLSBpZCBvZiB0aGUgc2VjdGlvbiB0byBkaXNhYmxlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiBkaXNhYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgZGlzYWJsZSAoc2VjdGlvbklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSAmJiB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24pIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBuYXZpZ2F0aW9uIG9uIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gaWQgb2YgdGhlIHNlY3Rpb24gdG8gZW5hYmxlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyBlbmFibGUgKHNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gJiYgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUGF1c2UgbmF2aWdhdGlvblxuICAgKi9cbiAgcHVibGljIHBhdXNlICgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXVzZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUmVzdW1lIG5hdmlnYXRpb25cbiAgICovXG4gIHB1YmxpYyByZXN1bWUgKCk6IHZvaWQge1xuICAgIHRoaXMuX3BhdXNlID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgYW4gZWxlbWVudFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGZvY3VzIChzZWN0aW9uIGlkIG9yIHNlbGVjdG9yKSwgKGFuIGVsZW1lbnQgb3IgYSBzZWN0aW9uKVxuICAgKiBAcGFyYW0gc2lsZW50ID9cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBpbmNvbWluZyBkaXJlY3Rpb25cbiAgICogQHJldHVybnMgdHJ1ZSBpZiBlbGVtZW50IGhhcyBiZWVuIGZvY3VzZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGZvY3VzIChlbGVtZW50OiBzdHJpbmcsIHNpbGVudDogYm9vbGVhbiwgZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiBib29sZWFuIHtcbiAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG4gICAgY29uc3QgYXV0b1BhdXNlID0gIXRoaXMuX3BhdXNlICYmIHNpbGVudDtcbiAgICBpZiAoYXV0b1BhdXNlKSB0aGlzLnBhdXNlKCk7XG5cbiAgICAvLyBUTyBETyAtIGFkZCBmb2N1c0V4dGVuZGVkU2VsZWN0b3IgYW5kIF9mb2N1c0VsZW1lbnQgPz8/XG4gICAgaWYgKHRoaXMuaXNTZWN0aW9uKGVsZW1lbnQpKSB7XG4gICAgICByZXN1bHQgPSB0aGlzLmZvY3VzU2VjdGlvbihlbGVtZW50LCBkaXJlY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSB0aGlzLmZvY3VzRXh0ZW5kZWRTZWxlY3RvcihlbGVtZW50LCBkaXJlY3Rpb24sIGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZiAoYXV0b1BhdXNlKSB0aGlzLnJlc3VtZSgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogTW92ZSB0byBhbm90aGVyIGVsZW1lbnRcbiAgICovXG4gIHB1YmxpYyBtb3ZlIChkaXJlY3Rpb246IERpcmVjdGlvbiwgc2VsZWN0b3I6IHN0cmluZyB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICAgIGxldCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoc2VsZWN0b3IpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZWxlbWVudCA9IHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKVswXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG4gICAgfVxuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQoZWxlbWVudCk7XG4gICAgaWYgKCFzZWN0aW9uSWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB3aWxsbW92ZVByb3BlcnRpZXMgPSB7XG4gICAgICBkaXJlY3Rpb24sXG4gICAgICBzZWN0aW9uSWQsXG4gICAgICBjYXVzZTogJ2FwaSdcbiAgICB9O1xuXG4gICAgaWYgKCF0aGlzLmZpcmVFdmVudChlbGVtZW50LCAnd2lsbG1vdmUnLCB3aWxsbW92ZVByb3BlcnRpZXMsIHVuZGVmaW5lZCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZm9jdXNOZXh0KGRpcmVjdGlvbiwgZWxlbWVudCwgc2VjdGlvbklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlIGEgc2VjdGlvbiBmb2N1c2FibGUgKG1vcmUgcHJlY2lzZWx5LCBhbGwgaXRzIGZvY3VzYWJsZSBjaGlsZHJlbiBhcmUgbWFkZSBmb2N1c2FibGUpXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb24gdG8gbWFrZSBmb2N1c2FibGUsIHVuZGVmaW5lZCBpZiB5b3Ugd2FudCB0byBtYWtlIGFsbCBzZWN0aW9ucyBmb2N1c2FibGVcbiAgICovXG4gIHB1YmxpYyBtYWtlRm9jdXNhYmxlIChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQgfCBuZXZlciB7XG4gICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgICAgdGhpcy5kb01ha2VGb2N1c2FibGUodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU2VjdGlvbiBcIiR7c2VjdGlvbklkfVwiIGRvZXNuJ3QgZXhpc3QhYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG1ha2UgZm9jdXNhYmxlIGFsbCBzZWN0aW9ucyAoaW5pdCA/KVxuICAgICAgZm9yIChjb25zdCBpZCBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgICB0aGlzLmRvTWFrZUZvY3VzYWJsZSh0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgZGVmYXVsdCBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb24gdG8gc2V0IGFzIGRlZmF1bHRcbiAgICovXG4gIHB1YmxpYyBzZXREZWZhdWx0U2VjdGlvbiAoc2VjdGlvbklkOiBzdHJpbmcpOiB2b2lkIHwgbmV2ZXIge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX2RlZmF1bHRTZWN0aW9uSWQgPSBzZWN0aW9uSWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2VjdGlvbiBcIiR7c2VjdGlvbklkfVwiIGRvZXNuJ3QgZXhpc3QhYCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIGFuIGVsZW1lbnRcbiAgICovXG4gIHB1YmxpYyBmb2N1c0VsZW1lbnQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgaWYgKCFlbGVtZW50KSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgbmV4dFNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGVsZW1lbnQpO1xuICAgIGlmICghbmV4dFNlY3Rpb25JZCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGN1cnJlbnRGb2N1c2VkRWxlbWVudCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG4gICAgbGV0IGVudGVySW50b05ld1NlY3Rpb24gPSB0cnVlO1xuICAgIGlmIChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpO1xuICAgICAgZW50ZXJJbnRvTmV3U2VjdGlvbiA9IG5leHRTZWN0aW9uSWQgPT09IGN1cnJlbnRTZWN0aW9uSWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzTmF2aWdhYmxlKGVsZW1lbnQsIG5leHRTZWN0aW9uSWQsIGZhbHNlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ZvY3VzRWxlbWVudChlbGVtZW50LCBuZXh0U2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uLCBEaXJlY3Rpb24uVVApO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgdGhlIHNlY3Rpb24gb25jZSBpdCBoYXMgYmVlbiBtb3VudGVkXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb24gdG8gZm9jdXNcbiAgICovXG4gIHB1YmxpYyBmb2N1c09uTW91bnRlZCAoc2VjdGlvbklkOiBzdHJpbmcpIHtcbiAgICB0aGlzLmZvY3VzT25Nb3VudGVkU2VjdGlvbnMucHVzaChzZWN0aW9uSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIFNwYXRpYWwgTmF2aWdhdGlvbiBpcyB3YWl0aW5nIHRoaXMgZWxlbWVudCB0byBiZSBtb3VudGVkIGJlZm9yZSBmb2N1c2luZyBpdC5cbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBjaGVja1xuICAgKi9cbiAgcHVibGljIGhhc0JlZW5XYWl0aW5nRm9yTW91bnRlZCAoc2VjdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5mb2N1c09uTW91bnRlZFNlY3Rpb25zLmluY2x1ZGVzKHNlY3Rpb25JZCkpIHtcbiAgICAgIHRoaXMuZm9jdXNTZWN0aW9uKHNlY3Rpb25JZCwgRGlyZWN0aW9uLlVQKTtcbiAgICAgIHRoaXMuZm9jdXNPbk1vdW50ZWRTZWN0aW9ucyA9IHRoaXMuZm9jdXNPbk1vdW50ZWRTZWN0aW9ucy5maWx0ZXIoKGZvbXMpID0+IGZvbXMgIT09IHNlY3Rpb25JZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUFJJVkFURSBGVU5DVElPTlNcblxuICAvKipcbiAgICogR2VuZXJhdGUgYSB1bmlxdWUgaWQgZm9yIGEgc2VjdGlvblxuICAgKiBAcmV0dXJucyBuZXcgaWQgc2VjdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkICgpOiBzdHJpbmcge1xuICAgIGxldCBpZDogc3RyaW5nO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZCA9IHRoaXMuSURfUE9PTF9QUkVGSVggKyBTdHJpbmcoKyt0aGlzLl9pZFBvb2wpO1xuICAgICAgaWYgKCF0aGlzLl9zZWN0aW9uc1tpZF0pIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50ICgpOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgeyBhY3RpdmVFbGVtZW50IH0gPSBkb2N1bWVudDtcbiAgICBpZiAoYWN0aXZlRWxlbWVudCAmJiBhY3RpdmVFbGVtZW50ICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICByZXR1cm4gYWN0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgZXh0ZW5kIChvdXQ6IGFueSwgLi4uYXJnczogYW55KSB7XG4gICAgb3V0ID0gb3V0IHx8IHt9O1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFhcmdzW2ldKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gYXJnc1tpXSkge1xuICAgICAgICBpZiAoYXJnc1tpXS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGFyZ3NbaV1ba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgb3V0W2tleV0gPSBhcmdzW2ldW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHByaXZhdGUgZXhjbHVkZSAoZWxlbUxpc3Q6IGFueSwgZXhjbHVkZWRFbGVtOiBhbnkpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhjbHVkZWRFbGVtKSkge1xuICAgICAgZXhjbHVkZWRFbGVtID0gW2V4Y2x1ZGVkRWxlbV07XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwLCBpbmRleDsgaSA8IGV4Y2x1ZGVkRWxlbS5sZW5ndGg7IGkrKykge1xuICAgICAgaW5kZXggPSBlbGVtTGlzdC5pbmRleE9mKGV4Y2x1ZGVkRWxlbVtpXSk7XG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBlbGVtTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWxlbUxpc3Q7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYW4gZWxlbWVudCBpcyBuYXZpZ2FibGVcbiAgICogQHBhcmFtIGVsZW0gZWxlbWVudCB0byBjaGVja1xuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBlbGVtZW50J3Mgc2VjdGlvblxuICAgKiBAcGFyYW0gdmVyaWZ5U2VjdGlvblNlbGVjdG9yIGlmIHRydWUsIGNoZWNrIHRoZSBzZWN0aW9uIHNlbGVjdG9yXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZWxlbWVudCBpcyBuYXZpZ2FibGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHJpdmF0ZSBpc05hdmlnYWJsZSAoZWxlbTogSFRNTEVsZW1lbnQsIHNlY3Rpb25JZDogc3RyaW5nLCB2ZXJpZnlTZWN0aW9uU2VsZWN0b3I6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBpZiAoIWVsZW0gfHwgIXNlY3Rpb25JZCB8fCAhdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSB8fCB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKChlbGVtLm9mZnNldFdpZHRoIDw9IDAgJiYgZWxlbS5vZmZzZXRIZWlnaHQgPD0gMCkgfHwgZWxlbS5oYXNBdHRyaWJ1dGUoJ2Rpc2FibGVkJykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHZlcmlmeVNlY3Rpb25TZWxlY3RvciAmJiAhdGhpcy5jb3JlLm1hdGNoU2VsZWN0b3IoZWxlbSwgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLnNlbGVjdG9yISkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5uYXZpZ2FibGVGaWx0ZXIgIT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubmF2aWdhYmxlRmlsdGVyIShlbGVtLCBzZWN0aW9uSWQpID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24ubmF2aWdhYmxlRmlsdGVyICE9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLm5hdmlnYWJsZUZpbHRlciEoZWxlbSwgc2VjdGlvbklkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVsZW1lbnQncyBzZWN0aW9uIGlkXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnRcbiAgICogQHJldHVybnMgdGhlIGVsZW1lbnQncyBzZWN0aW9uIGlkXG4gICAqL1xuICBwcml2YXRlIGdldFNlY3Rpb25JZCAoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHNlY3Rpb25zRWxlbWVudHM6IGFueSA9IHt9O1xuICAgIGZvciAoY29uc3QgaWQgaW4gdGhpcy5fc2VjdGlvbnMpIHtcbiAgICAgIGlmICghdGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24uZGlzYWJsZWQpIHtcbiAgICAgICAgY29uc3Qgc2VjdGlvbkVsZW1lbnQgPSB0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5lbGVtZW50O1xuICAgICAgICBpZiAoc2VjdGlvbkVsZW1lbnQpIHtcbiAgICAgICAgICBzZWN0aW9uc0VsZW1lbnRzW2lkXSA9IHNlY3Rpb25FbGVtZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5zZWxlY3RvciAhPT0gJycgJiYgdGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24uc2VsZWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudFdpdGhTZWxlY3RvciA9IHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKGBbZGF0YS1zZWN0aW9uLWlkPVwiJHtpZH1cIl1gKVswXVxuICAgICAgICAgICAgaWYgKGVsZW1lbnRXaXRoU2VsZWN0b3IpIHtcbiAgICAgICAgICAgICAgc2VjdGlvbnNFbGVtZW50c1tpZF0gPSBlbGVtZW50V2l0aFNlbGVjdG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwYXJlbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGVsZW1lbnQ7XG4gICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgaWYgKE9iamVjdC52YWx1ZXMoc2VjdGlvbnNFbGVtZW50cykuaW5kZXhPZihwYXJlbnQpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHNlY3Rpb25zRWxlbWVudHMpLmZpbmQoKGtleSkgPT4gc2VjdGlvbnNFbGVtZW50c1trZXldID09PSBwYXJlbnQpO1xuICAgICAgfVxuICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG5hdmlnYWJsZSBlbGVtZW50cyBpbnRvIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqL1xuICBwcml2YXRlIGdldFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyAoc2VjdGlvbklkOiBzdHJpbmcpOiBuZXZlcltdIHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLnNlbGVjdG9yISlcbiAgICAgIC5maWx0ZXIoKGVsZW1lbnQpID0+IHRoaXMuaXNOYXZpZ2FibGUoZWxlbWVudCwgc2VjdGlvbklkLCBmYWxzZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZGVmYXVsdCBlbGVtZW50IG9mIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIHRoZSBkZWZhdWx0IGVsZW1lbnQgb2YgYSBzZWN0aW9uLCBudWxsIGlmIG5vIGRlZmF1bHQgZWxlbWVudCBmb3VuZFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQgKHNlY3Rpb25JZDogc3RyaW5nKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB7IGRlZmF1bHRFbGVtZW50IH0gPSB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb247XG4gICAgaWYgKCFkZWZhdWx0RWxlbWVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGVsZW1lbnRzID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IoZGVmYXVsdEVsZW1lbnQpO1xuICAgIC8vIGNoZWNrIGVhY2ggZWxlbWVudCB0byBzZWUgaWYgaXQncyBuYXZpZ2FibGUgYW5kIHN0b3Agd2hlbiBvbmUgaGFzIGJlZW4gZm91bmRcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICAgIGlmICh0aGlzLmlzTmF2aWdhYmxlKGVsZW1lbnQsIHNlY3Rpb25JZCwgdHJ1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbGFzdCBmb2N1c2VkIGVsZW1lbnQgaW50byBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvblxuICAgKiBAcmV0dXJucyB0aGUgbGFzdCBmb2N1c2VkIGVsZW1lbnQsIG51bGwgaWYgbm8gZWxlbWVudCBmb3VuZFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50IChzZWN0aW9uSWQ6IGFueSk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgeyBsYXN0Rm9jdXNlZEVsZW1lbnQgfSA9IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF07XG4gICAgaWYgKGxhc3RGb2N1c2VkRWxlbWVudCkge1xuICAgICAgaWYgKCF0aGlzLmlzTmF2aWdhYmxlKGxhc3RGb2N1c2VkRWxlbWVudCwgc2VjdGlvbklkLCB0cnVlKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsYXN0Rm9jdXNlZEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIGZpcmUgYW4gZXZlbnRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCBzb3VyY2VcbiAgICogQHBhcmFtIHR5cGUgdHlwZSBvZiBldmVudFxuICAgKiBAcGFyYW0gZGV0YWlscyA/XG4gICAqIEBwYXJhbSBjYW5jZWxhYmxlIHRydWUgaWYgY2FuY2VsYWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZXZlbnQgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGRpc3BhdGNoZWRcbiAgICovXG4gIHByaXZhdGUgZmlyZUV2ZW50IChlbGVtZW50OiBIVE1MRWxlbWVudCwgdHlwZTogc3RyaW5nLCBkZXRhaWxzOiBhbnksIGNhbmNlbGFibGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCA0KSB7XG4gICAgICBjYW5jZWxhYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZXZ0LmluaXRDdXN0b21FdmVudCh0aGlzLkVWRU5UX1BSRUZJWCArIHR5cGUsIHRydWUsIGNhbmNlbGFibGUsIGRldGFpbHMpO1xuICAgIHJldHVybiBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBmb2N1cyBhbmQgc2Nyb2xsIG9uIGVsZW1lbnRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBmb2N1c1xuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIGNvbnRhaW5pbmcgdGhlIGVsZW1lbnRcbiAgICogQHBhcmFtIGVudGVySW50b05ld1NlY3Rpb24gdHJ1ZSBpZiB3ZSBlbnRlciBpbnRvIHRoZSBzZWN0aW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHByaXZhdGUgZm9jdXNOU2Nyb2xsIChlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcsIGVudGVySW50b05ld1NlY3Rpb246IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBsZXQgc2Nyb2xsT3B0aW9ucyA9IGVudGVySW50b05ld1NlY3Rpb24gPyB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2Nyb2xsT3B0aW9uc1xuICAgICAgOiB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2Nyb2xsT3B0aW9uc0ludG9TZWN0aW9uO1xuICAgIC8vIGlmIG5vLXNjcm9sbCBnaXZlbiBhcyBzY3JvbGxPcHRpb25zLCB0aGVuIGZvY3VzIHdpdGhvdXQgc2Nyb2xsaW5nXG4gICAgaWYgKHNjcm9sbE9wdGlvbnMgPT09ICduby1zY3JvbGwnKSB7XG4gICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICB9IGVsc2UgaWYgKHNjcm9sbE9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPcHRpb25zICE9PSAnJyAmJiAhKHNjcm9sbE9wdGlvbnMgaW5zdGFuY2VvZiBTdHJpbmcpKSB7XG4gICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoc2Nyb2xsT3B0aW9ucyBhcyBTY3JvbGxJbnRvVmlld09wdGlvbnMpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5nbG9iYWxDb25maWd1cmF0aW9uKSB7XG4gICAgICBzY3JvbGxPcHRpb25zID0gZW50ZXJJbnRvTmV3U2VjdGlvbiA/IHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi5zY3JvbGxPcHRpb25zIDogdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnNjcm9sbE9wdGlvbnNJbnRvU2VjdGlvbjtcbiAgICAgIGlmIChzY3JvbGxPcHRpb25zICE9PSB1bmRlZmluZWQgJiYgc2Nyb2xsT3B0aW9ucyAhPT0gJycgJiYgc2Nyb2xsT3B0aW9ucyAhPT0gJ25vLXNjcm9sbCcpIHtcbiAgICAgICAgZWxlbWVudC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG4gICAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoc2Nyb2xsT3B0aW9ucyBhcyBTY3JvbGxJbnRvVmlld09wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIHNlY3Rpb25JZFxuICAgKi9cbiAgcHJpdmF0ZSBmb2N1c0NoYW5nZWQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZykge1xuICAgIGxldCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gc2VjdGlvbklkO1xuICAgIGlmICghaWQpIHtcbiAgICAgIGlkID0gdGhpcy5nZXRTZWN0aW9uSWQoZWxlbWVudCk7XG4gICAgfVxuICAgIGlmIChpZCkge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5sYXN0Rm9jdXNlZEVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgdGhpcy5fbGFzdFNlY3Rpb25JZCA9IHNlY3Rpb25JZDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNpbGVudEZvY3VzIChlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcsIHNjcm9sbEludG9OZXdTZWN0aW9uOiBib29sZWFuKSB7XG4gICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG4gICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LmJsdXIoKTtcbiAgICB9XG4gICAgdGhpcy5mb2N1c05TY3JvbGwoZWxlbWVudCwgc2VjdGlvbklkLCBzY3JvbGxJbnRvTmV3U2VjdGlvbik7XG4gICAgdGhpcy5mb2N1c0NoYW5nZWQoZWxlbWVudCwgc2VjdGlvbklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyBhbiBlbGVtZW50XG4gICAqIEBwYXJhbSBlbGVtIGVsZW1lbnQgdG8gZm9jdXNcbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgZWxlbWVudCdzIHNlY3Rpb25cbiAgICogQHBhcmFtIGVudGVySW50b05ld1NlY3Rpb24gdHJ1ZSBpZiBuZXcgc2VjdGlvbiBpcyBmb2N1c2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHBhcmFtIGRpcmVjdGlvbiBzb3VyY2UgZGlyZWN0aW9uXG4gICAqL1xuICBwcml2YXRlIF9mb2N1c0VsZW1lbnQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgZW50ZXJJbnRvTmV3U2VjdGlvbjogYm9vbGVhbiwgZGlyZWN0aW9uPzogRGlyZWN0aW9uKSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuXG4gICAgaWYgKHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlKSB7XG4gICAgICB0aGlzLnNpbGVudEZvY3VzKGVsZW1lbnQsIHNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5fcGF1c2UpIHtcbiAgICAgIHRoaXMuc2lsZW50Rm9jdXMoZWxlbWVudCwgc2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uKTtcbiAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBjb25zdCB1bmZvY3VzUHJvcGVydGllcyA9IHtcbiAgICAgICAgbmV4dEVsZW1lbnQ6IGVsZW1lbnQsXG4gICAgICAgIG5leHRTZWN0aW9uSWQ6IHNlY3Rpb25JZCxcbiAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICBuYXRpdmU6IGZhbHNlXG4gICAgICB9O1xuICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICd3aWxsdW5mb2N1cycsIHVuZm9jdXNQcm9wZXJ0aWVzLCB1bmRlZmluZWQpKSB7XG4gICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudC5ibHVyKCk7XG4gICAgICB0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICd1bmZvY3VzZWQnLCB1bmZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuICAgIH1cblxuICAgIGNvbnN0IGZvY3VzUHJvcGVydGllcyA9IHtcbiAgICAgIHByZXZpb3VzRWxlbWVudDogY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgc2VjdGlvbklkLFxuICAgICAgZGlyZWN0aW9uLFxuICAgICAgbmF0aXZlOiBmYWxzZVxuICAgIH07XG4gICAgaWYgKCF0aGlzLmZpcmVFdmVudChlbGVtZW50LCAnd2lsbGZvY3VzJywgZm9jdXNQcm9wZXJ0aWVzKSkge1xuICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5mb2N1c05TY3JvbGwoZWxlbWVudCwgc2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uKTtcbiAgICB0aGlzLmZpcmVFdmVudChlbGVtZW50LCAnZm9jdXNlZCcsIGZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuXG4gICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcblxuICAgIHRoaXMuZm9jdXNDaGFuZ2VkKGVsZW1lbnQsIHNlY3Rpb25JZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcHJpdmF0ZSBmb2N1c0V4dGVuZGVkU2VsZWN0b3IgKHNlbGVjdG9yOiBzdHJpbmcsIGRpcmVjdGlvbjogRGlyZWN0aW9uLCBlbnRlckludG9OZXdTZWN0aW9uOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKHNlbGVjdG9yLmNoYXJBdCgwKSA9PT0gJ0AnKSB7XG4gICAgICBpZiAoc2VsZWN0b3IubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvY3VzU2VjdGlvbih1bmRlZmluZWQsIGRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWN0aW9uSWQgPSBzZWxlY3Rvci5zdWJzdHIoMSk7XG4gICAgICByZXR1cm4gdGhpcy5mb2N1c1NlY3Rpb24oc2VjdGlvbklkLCBkaXJlY3Rpb24pO1xuICAgIH1cbiAgICBjb25zdCBuZXh0ID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpWzBdO1xuICAgIGlmIChuZXh0KSB7XG4gICAgICBjb25zdCBuZXh0U2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQobmV4dCk7XG4gICAgICBpZiAobmV4dFNlY3Rpb25JZCkge1xuICAgICAgICBpZiAodGhpcy5pc05hdmlnYWJsZShuZXh0LCBuZXh0U2VjdGlvbklkLCBmYWxzZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZm9jdXNFbGVtZW50KG5leHQsIG5leHRTZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24sIGRpcmVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRSYW5nZSAoaWQ6IHN0cmluZywgcmFuZ2U6IHN0cmluZyBbXSkge1xuICAgIGlmIChpZCAmJiByYW5nZS5pbmRleE9mKGlkKSA8IDAgJiYgdGhpcy5fc2VjdGlvbnNbaWRdICYmICF0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCkge1xuICAgICAgcmFuZ2UucHVzaChpZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gZGlyZWN0aW9uXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiBmb2N1c2VkXG4gICAqL1xuICBwcml2YXRlIGZvY3VzU2VjdGlvbiAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGRpcmVjdGlvbjogRGlyZWN0aW9uKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmFuZ2U6IHN0cmluZyBbXSA9IFtdO1xuXG4gICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgdGhpcy5hZGRSYW5nZShzZWN0aW9uSWQsIHJhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRSYW5nZSh0aGlzLl9kZWZhdWx0U2VjdGlvbklkLCByYW5nZSk7XG4gICAgICB0aGlzLmFkZFJhbmdlKHRoaXMuX2xhc3RTZWN0aW9uSWQsIHJhbmdlKTtcbiAgICAgIGZvciAoY29uc3Qgc2VjdGlvbiBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgICB0aGlzLmFkZFJhbmdlKHNlY3Rpb24sIHJhbmdlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpZCA9IHJhbmdlW2ldO1xuICAgICAgbGV0IG5leHQ7XG5cbiAgICAgIGlmICh0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5lbnRlclRvID09PSAnbGFzdC1mb2N1c2VkJykge1xuICAgICAgICBuZXh0ID0gdGhpcy5nZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50KGlkKVxuICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyhpZClbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0ID0gdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyhpZClbMF07XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQobmV4dCwgaWQsIHRydWUsIGRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlIGV2ZW50IHdoZW4gbmF2aWdhdGUgaGFzIGZhaWxlZFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHNvdXJjZVxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIGRpcmVjdGlvbiBzb3VyY2VcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBldmVudCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgcmFpc2VkXG4gICAqL1xuICBwcml2YXRlIGZpcmVOYXZpZ2F0ZUZhaWxlZCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIGRpcmVjdGlvbjogRGlyZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZmlyZUV2ZW50KGVsZW1lbnQsICduYXZpZ2F0ZWZhaWxlZCcsIHtcbiAgICAgIGRpcmVjdGlvblxuICAgIH0sIGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgZ29Ub0xlYXZlRm9yIChzZWN0aW9uSWQ6IHN0cmluZywgZGlyZWN0aW9uOiBEaXJlY3Rpb24pIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmxlYXZlRm9yXG4gICAgICAmJiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmxlYXZlRm9yIGFzIGFueSlbZGlyZWN0aW9udG9TdHJpbmcoZGlyZWN0aW9uKV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV4dCA9ICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubGVhdmVGb3IgYXMgYW55KVtkaXJlY3Rpb250b1N0cmluZyhkaXJlY3Rpb24pXTtcbiAgICAgIGlmIChuZXh0ID09PSAnJyB8fCBuZXh0ID09PSAnbm93aGVyZScpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5mb2N1c0V4dGVuZGVkU2VsZWN0b3IobmV4dCwgZGlyZWN0aW9uLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIG5leHQgZWxlbWVudFxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIHNvdXJjZSBkaXJlY3Rpb25cbiAgICogQHBhcmFtIGN1cnJlbnRGb2N1c2VkRWxlbWVudCBjdXJyZW50IGZvY3VzZWQgZWxlbWVudFxuICAgKiBAcGFyYW0gY3VycmVudFNlY3Rpb25JZCBjdXJyZW50IHNlY3Rpb24gaWRcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBuZXh0IGhhcyBiZWVuIGZvY3VzZWQgc3VjY2Vzc2Z1bGx5XG4gICAqL1xuICBwcml2YXRlIGZvY3VzTmV4dCAoZGlyZWN0aW9uOiBEaXJlY3Rpb24sIGN1cnJlbnRGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQsIGN1cnJlbnRTZWN0aW9uSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGV4dFNlbGVjdG9yID0gY3VycmVudEZvY3VzZWRFbGVtZW50LmdldEF0dHJpYnV0ZShgZGF0YS1zbi0ke2RpcmVjdGlvbn1gKTtcblxuICAgIC8vIFRPIERPIHJlbW92ZSB0eXBlb2ZcbiAgICBpZiAodHlwZW9mIGV4dFNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGV4dFNlbGVjdG9yID09PSAnJ1xuICAgICAgICAgIHx8ICF0aGlzLmZvY3VzRXh0ZW5kZWRTZWxlY3RvcihleHRTZWxlY3RvciwgZGlyZWN0aW9uLCBmYWxzZSkpIHsgLy8gd2hoaWNoIHZhbHVlIGZvciBlbnRlckludG9OZXdTZWN0aW9uID8gdHJ1ZSBvciBmYWxzZSA/Pz9cbiAgICAgICAgdGhpcy5maXJlTmF2aWdhdGVGYWlsZWQoY3VycmVudEZvY3VzZWRFbGVtZW50LCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWN0aW9uTmF2aWdhYmxlRWxlbWVudHM6IGFueSA9IHt9O1xuICAgIGxldCBhbGxOYXZpZ2FibGVFbGVtZW50czogYW55ID0gW107XG4gICAgZm9yIChjb25zdCBpZCBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgc2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzW2lkXSA9IHRoaXMuZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKGlkKSBhcyBIVE1MRWxlbWVudFtdO1xuICAgICAgYWxsTmF2aWdhYmxlRWxlbWVudHMgPSBhbGxOYXZpZ2FibGVFbGVtZW50cy5jb25jYXQoc2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzW2lkXSk7XG4gICAgfVxuXG4gICAgLy8gY29uc3QgY29uZmlnOiBDb25maWd1cmF0aW9uID0gdGhpcy5leHRlbmQoe30sIHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbiwgdGhpcy5fc2VjdGlvbnNbY3VycmVudFNlY3Rpb25JZF0uY29uZmlndXJhdGlvbik7XG4gICAgbGV0IG5leHQ6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBjb25zdCBjdXJyZW50U2VjdGlvbiA9IHRoaXMuX3NlY3Rpb25zW2N1cnJlbnRTZWN0aW9uSWRdO1xuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uLmNvbmZpZ3VyYXRpb24ucmVzdHJpY3QgPT09ICdzZWxmLW9ubHknIHx8IGN1cnJlbnRTZWN0aW9uLmNvbmZpZ3VyYXRpb24ucmVzdHJpY3QgPT09ICdzZWxmLWZpcnN0Jykge1xuICAgICAgY29uc3QgY3VycmVudFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyA9IHNlY3Rpb25OYXZpZ2FibGVFbGVtZW50c1tjdXJyZW50U2VjdGlvbklkXTtcblxuICAgICAgbmV4dCA9IHRoaXMuY29yZS5uYXZpZ2F0ZShcbiAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgIHRoaXMuZXhjbHVkZShjdXJyZW50U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzLCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQpLFxuICAgICAgICBjdXJyZW50U2VjdGlvblxuICAgICAgKTtcblxuICAgICAgaWYgKCFuZXh0ICYmIGN1cnJlbnRTZWN0aW9uLmNvbmZpZ3VyYXRpb24ucmVzdHJpY3QgPT09ICdzZWxmLWZpcnN0Jykge1xuICAgICAgICBuZXh0ID0gdGhpcy5jb3JlLm5hdmlnYXRlKFxuICAgICAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCxcbiAgICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgICAgdGhpcy5leGNsdWRlKGFsbE5hdmlnYWJsZUVsZW1lbnRzLCBjdXJyZW50U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKSxcbiAgICAgICAgICBjdXJyZW50U2VjdGlvblxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0ID0gdGhpcy5jb3JlLm5hdmlnYXRlKFxuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgdGhpcy5leGNsdWRlKGFsbE5hdmlnYWJsZUVsZW1lbnRzLCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQpLFxuICAgICAgICBjdXJyZW50U2VjdGlvblxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAobmV4dCkge1xuICAgICAgY3VycmVudFNlY3Rpb24ucHJldmlvdXMgPSB7XG4gICAgICAgIHRhcmdldDogY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgICBkZXN0aW5hdGlvbjogbmV4dCxcbiAgICAgICAgcmV2ZXJzZTogZ2V0UmV2ZXJzZURpcmVjdGlvbihkaXJlY3Rpb24pXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBuZXh0U2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB0aGlzLmdldFNlY3Rpb25JZChuZXh0KTtcbiAgICAgIGxldCBlbnRlckludG9OZXdTZWN0aW9uID0gZmFsc2U7XG4gICAgICBpZiAoY3VycmVudFNlY3Rpb25JZCAhPT0gbmV4dFNlY3Rpb25JZCAmJiBuZXh0U2VjdGlvbklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gV2UgZW50ZXIgaW50byBhbm90aGVyIHNlY3Rpb25cbiAgICAgICAgZW50ZXJJbnRvTmV3U2VjdGlvbiA9IHRydWU7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYm9vbGVhbiB8IG51bGwgPSB0aGlzLmdvVG9MZWF2ZUZvcihjdXJyZW50U2VjdGlvbklkLCBkaXJlY3Rpb24pO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuZmlyZU5hdmlnYXRlRmFpbGVkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZW50ZXJUb0VsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fc2VjdGlvbnNbbmV4dFNlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5lbnRlclRvKSB7XG4gICAgICAgICAgY2FzZSAnbGFzdC1mb2N1c2VkJzpcbiAgICAgICAgICAgIGVudGVyVG9FbGVtZW50ID0gdGhpcy5nZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50KG5leHRTZWN0aW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbkRlZmF1bHRFbGVtZW50KG5leHRTZWN0aW9uSWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZGVmYXVsdC1lbGVtZW50JzpcbiAgICAgICAgICAgIGVudGVyVG9FbGVtZW50ID0gdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQobmV4dFNlY3Rpb25JZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVudGVyVG9FbGVtZW50KSB7XG4gICAgICAgICAgbmV4dCA9IGVudGVyVG9FbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0U2VjdGlvbklkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQobmV4dCwgbmV4dFNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbiwgZGlyZWN0aW9uKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZ29Ub0xlYXZlRm9yKGN1cnJlbnRTZWN0aW9uSWQsIGRpcmVjdGlvbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmZpcmVOYXZpZ2F0ZUZhaWxlZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsIGRpcmVjdGlvbik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBwcmV2ZW50RGVmYXVsdCAoZXZ0OiBFdmVudCk6IGJvb2xlYW4ge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIG9uS2V5RG93biAoZXZ0OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3Rocm90dGxlKSB7XG4gICAgICB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5fdGhyb3R0bGUgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLl90aHJvdHRsZSA9IG51bGw7XG4gICAgfSwgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnRocm90dGxlKTtcblxuICAgIGlmICghdGhpcy5fc2VjdGlvbkNvdW50IHx8IHRoaXMuX3BhdXNlXG4gICAgICB8fCBldnQuYWx0S2V5IHx8IGV2dC5jdHJsS2V5IHx8IGV2dC5tZXRhS2V5IHx8IGV2dC5zaGlmdEtleSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGRpcmVjdGlvbjogRGlyZWN0aW9uID0gZXZ0LmtleUNvZGUgYXMgdW5rbm93biBhcyBEaXJlY3Rpb247XG4gICAgaWYgKCFkaXJlY3Rpb24pIHtcbiAgICAgIGlmIChldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCAmJiB0aGlzLmdldFNlY3Rpb25JZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICdlbnRlci1kb3duJywgdW5kZWZpbmVkLCB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcmV2ZW50RGVmYXVsdChldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG5cbiAgICBpZiAoIWN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuX2xhc3RTZWN0aW9uSWQpIHtcbiAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50KHRoaXMuX2xhc3RTZWN0aW9uSWQpO1xuICAgICAgfVxuICAgICAgaWYgKCFjdXJyZW50Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5mb2N1c1NlY3Rpb24odW5kZWZpbmVkLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcy5wcmV2ZW50RGVmYXVsdChldnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRTZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpO1xuICAgIGlmICghY3VycmVudFNlY3Rpb25JZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHdpbGxtb3ZlUHJvcGVydGllcyA9IHtcbiAgICAgIGRpcmVjdGlvbixcbiAgICAgIHNlY3Rpb25JZDogY3VycmVudFNlY3Rpb25JZCxcbiAgICAgIGNhdXNlOiAna2V5ZG93bidcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ3dpbGxtb3ZlJywgd2lsbG1vdmVQcm9wZXJ0aWVzKSkge1xuICAgICAgdGhpcy5mb2N1c05leHQoZGlyZWN0aW9uLCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsIGN1cnJlbnRTZWN0aW9uSWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gIH1cblxuICBwcml2YXRlIG9uS2V5VXAgKGV2dDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmIChldnQuYWx0S2V5IHx8IGV2dC5jdHJsS2V5IHx8IGV2dC5tZXRhS2V5IHx8IGV2dC5zaGlmdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX3BhdXNlICYmIHRoaXMuX3NlY3Rpb25Db3VudCAmJiBldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRGb2N1c2VkRWxlbWVudCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG4gICAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50ICYmIHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICdlbnRlci11cCcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKSkge1xuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25Gb2N1cyAoZXZ0OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHsgdGFyZ2V0IH0gPSBldnQ7XG4gICAgY29uc3QgaHRtbFRhcmdldDogSFRNTEVsZW1lbnQgPSB0YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKHRhcmdldCAhPT0gd2luZG93ICYmIHRhcmdldCAhPT0gZG9jdW1lbnRcbiAgICAgICYmIHRoaXMuX3NlY3Rpb25Db3VudCAmJiAhdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgJiYgdGFyZ2V0KSB7XG4gICAgICBjb25zdCBzZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChodG1sVGFyZ2V0KTtcbiAgICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BhdXNlKSB7XG4gICAgICAgICAgdGhpcy5mb2N1c0NoYW5nZWQoaHRtbFRhcmdldCwgc2VjdGlvbklkKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2N1c1Byb3BlcnRpZXMgPSB7XG4gICAgICAgICAgc2VjdGlvbklkLFxuICAgICAgICAgIG5hdGl2ZTogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdGhpcy5maXJlRXZlbnQoaHRtbFRhcmdldCwgJ3dpbGxmb2N1cycsIGZvY3VzUHJvcGVydGllcykpIHtcbiAgICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IHRydWU7XG4gICAgICAgICAgaHRtbFRhcmdldC5ibHVyKCk7XG4gICAgICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmZpcmVFdmVudChodG1sVGFyZ2V0LCAnZm9jdXNlZCcsIGZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuZm9jdXNDaGFuZ2VkKGh0bWxUYXJnZXQsIHNlY3Rpb25JZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQmx1ciAoZXZ0OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsID0gZXZ0LnRhcmdldDtcbiAgICBjb25zdCBodG1sVGFyZ2V0OiBIVE1MRWxlbWVudCA9IHRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0ICE9PSB3aW5kb3cgJiYgdGFyZ2V0ICE9PSBkb2N1bWVudCAmJiAhdGhpcy5fcGF1c2VcbiAgICAgICYmIHRoaXMuX3NlY3Rpb25Db3VudCAmJiAhdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgJiYgdGhpcy5nZXRTZWN0aW9uSWQoaHRtbFRhcmdldCkpIHtcbiAgICAgIGNvbnN0IHVuZm9jdXNQcm9wZXJ0aWVzID0ge1xuICAgICAgICBuYXRpdmU6IHRydWVcbiAgICAgIH07XG4gICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGh0bWxUYXJnZXQsICd3aWxsdW5mb2N1cycsIHVuZm9jdXNQcm9wZXJ0aWVzKSkge1xuICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGh0bWxUYXJnZXQuZm9jdXMoKTtcbiAgICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmlyZUV2ZW50KGh0bWxUYXJnZXQsICd1bmZvY3VzZWQnLCB1bmZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNTZWN0aW9uIChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIHJldHVybiBzZWN0aW9uSWQgaW4gdGhpcy5fc2VjdGlvbnM7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBUTyBSRU1PVkUgPz8/XG4gIHByaXZhdGUgb25Cb2R5Q2xpY2sgKCkge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1t0aGlzLl9sYXN0U2VjdGlvbklkXSkge1xuICAgICAgY29uc3QgbGFzdEZvY3VzZWRFbGVtZW50ID0gdGhpcy5fc2VjdGlvbnNbdGhpcy5fbGFzdFNlY3Rpb25JZF0ubGFzdEZvY3VzZWRFbGVtZW50O1xuICAgICAgaWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGRvY3VtZW50LmJvZHkgJiYgdGhpcy5fbGFzdFNlY3Rpb25JZFxuICAgICAgICAmJiBsYXN0Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5fZm9jdXNFbGVtZW50KGxhc3RGb2N1c2VkRWxlbWVudCwgdGhpcy5fbGFzdFNlY3Rpb25JZCwgdHJ1ZSwgdW5kZWZpbmVkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFrZSBmb2N1c2FibGUgZWxlbWVudHMgb2YgYSBzZWN0aW9uLlxuICAgKiBAcGFyYW0gY29uZmlndXJhdGlvbiBjb25maWd1cmF0aW9uIG9mIHRoZSBzZWN0aW9uIHRvIG1hbGUgZm9jdXNhYmxlID9cbiAgICovXG4gIHByaXZhdGUgZG9NYWtlRm9jdXNhYmxlIChjb25maWd1cmF0aW9uOiBDb25maWd1cmF0aW9uKTogdm9pZCB7XG4gICAgbGV0IHRhYkluZGV4SWdub3JlTGlzdDogc3RyaW5nO1xuICAgIGlmIChjb25maWd1cmF0aW9uLnRhYkluZGV4SWdub3JlTGlzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YWJJbmRleElnbm9yZUxpc3QgPSBjb25maWd1cmF0aW9uLnRhYkluZGV4SWdub3JlTGlzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFiSW5kZXhJZ25vcmVMaXN0ID0gdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnRhYkluZGV4SWdub3JlTGlzdCE7XG4gICAgfVxuXG4gICAgdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IoY29uZmlndXJhdGlvbi5zZWxlY3RvciEpLmZvckVhY2goKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBpZiAoIXRoaXMuY29yZS5tYXRjaFNlbGVjdG9yKGVsZW1lbnQsIHRhYkluZGV4SWdub3JlTGlzdCkpIHtcbiAgICAgICAgY29uc3QgaHRtbEVsZW1lbnQgPSBlbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAoIWh0bWxFbGVtZW50LmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgIC8vIHNldCB0aGUgdGFiaW5kZXggd2l0aCBhIG5lZ2F0aXZlIHZhbHVlLiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0dsb2JhbF9hdHRyaWJ1dGVzL3RhYmluZGV4XG4gICAgICAgICAgaHRtbEVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxufVxuXG5jb25zdCBzbiA9IFNwYXRpYWxOYXZpZ2F0aW9uLmdldEluc3RhbmNlKCk7XG5leHBvcnQgeyBTcGF0aWFsTmF2aWdhdGlvbiwgc24gfTtcbiJdfQ==