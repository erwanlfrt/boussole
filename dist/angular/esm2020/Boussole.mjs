import { core } from './Core';
import { defaultConfiguration } from './types/Configuration';
import { Direction, directiontoString, getReverseDirection } from './types/Direction';
class Compass {
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
        if (!Compass.instance) {
            Compass.instance = new Compass();
        }
        return Compass.instance;
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
     * Remove listeners and reinitialize Compass attributes.
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
const sn = Compass.getInstance();
export { Compass, sn };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm91c3NvbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQm91c3NvbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFRLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNwQyxPQUFPLEVBQWlCLG9CQUFvQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBR3RGLE1BQU0sT0FBTztJQUFiO1FBRVUsV0FBTSxHQUFZLEtBQUssQ0FBQztRQUN4QixZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLGNBQVMsR0FBZ0MsRUFBRSxDQUFDO1FBQzVDLGtCQUFhLEdBQVcsQ0FBQyxDQUFDO1FBQzFCLHNCQUFpQixHQUFXLEVBQUUsQ0FBQztRQUMvQixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUM1Qix1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFDcEMsd0JBQW1CLEdBQWtCLG9CQUFvQixDQUFDO1FBQzFELFdBQU0sR0FBWSxLQUFLLENBQUM7UUFDeEIsU0FBSSxHQUFTLElBQUksQ0FBQztRQUNULG1CQUFjLEdBQUcsVUFBVSxDQUFDO1FBQzVCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzlCLDJCQUFzQixHQUFhLEVBQUUsQ0FBQztRQUN0QyxjQUFTLEdBQWtCLElBQUksQ0FBQztRQWc4QnhDLGFBQWE7SUFDZixDQUFDO0lBLzdCUSxNQUFNLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUNyQixPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7U0FDbEM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDMUIsQ0FBQztJQUVELDJCQUEyQjtJQUUzQjs7T0FFRztJQUNJLElBQUk7UUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDLE1B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c0IsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3pDLHVIQUF1SDtvQkFDdkgsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQzVDO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FFRjtBQUVELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNqQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSwgY29yZSB9IGZyb20gJy4vQ29yZSc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBkZWZhdWx0Q29uZmlndXJhdGlvbiB9IGZyb20gJy4vdHlwZXMvQ29uZmlndXJhdGlvbic7XG5pbXBvcnQgeyBEaXJlY3Rpb24sIGRpcmVjdGlvbnRvU3RyaW5nLCBnZXRSZXZlcnNlRGlyZWN0aW9uIH0gZnJvbSAnLi90eXBlcy9EaXJlY3Rpb24nO1xuaW1wb3J0IHsgU2VjdGlvbiB9IGZyb20gJy4vdHlwZXMvU2VjdGlvbic7XG5cbmNsYXNzIENvbXBhc3Mge1xuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogQ29tcGFzcztcbiAgcHJpdmF0ZSBfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfaWRQb29sOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIF9zZWN0aW9uczogeyBba2V5OiBzdHJpbmddOiBTZWN0aW9uOyB9ID0ge307XG4gIHByaXZhdGUgX3NlY3Rpb25Db3VudDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBfZGVmYXVsdFNlY3Rpb25JZDogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX2xhc3RTZWN0aW9uSWQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF9kdXJpbmdGb2N1c0NoYW5nZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGdsb2JhbENvbmZpZ3VyYXRpb246IENvbmZpZ3VyYXRpb24gPSBkZWZhdWx0Q29uZmlndXJhdGlvbjtcbiAgcHJpdmF0ZSBfcGF1c2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBjb3JlOiBDb3JlID0gY29yZTtcbiAgcHJpdmF0ZSByZWFkb25seSBJRF9QT09MX1BSRUZJWCA9ICdzZWN0aW9uLSc7XG4gIHByaXZhdGUgcmVhZG9ubHkgRVZFTlRfUFJFRklYID0gJ3NuOic7XG4gIHByaXZhdGUgZm9jdXNPbk1vdW50ZWRTZWN0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBfdGhyb3R0bGU6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UgKCk6IENvbXBhc3Mge1xuICAgIGlmICghQ29tcGFzcy5pbnN0YW5jZSkge1xuICAgICAgQ29tcGFzcy5pbnN0YW5jZSA9IG5ldyBDb21wYXNzKCk7XG4gICAgfVxuICAgIHJldHVybiBDb21wYXNzLmluc3RhbmNlO1xuICB9XG5cbiAgLy8gI3JlZ2lvbiBQVUJMSUMgRlVOQ1RJT05TXG5cbiAgLyoqXG4gICAqIEluaXQgbGlzdGVuZXJzXG4gICAqL1xuICBwdWJsaWMgaW5pdCAoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9yZWFkeSkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bi5iaW5kKHRoaXMpKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMub25LZXlVcC5iaW5kKHRoaXMpKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMub25Gb2N1cy5iaW5kKHRoaXMpLCB0cnVlKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5vbkJsdXIuYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgICAvLyBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25Cb2R5Q2xpY2spO1xuICAgICAgdGhpcy5fcmVhZHkgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgbGlzdGVuZXJzIGFuZCByZWluaXRpYWxpemUgQ29tcGFzcyBhdHRyaWJ1dGVzLlxuICAgKi9cbiAgcHVibGljIHVuaW5pdCAoKTogdm9pZCB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLm9uQmx1ciwgdHJ1ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5vbkZvY3VzLCB0cnVlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXApO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd24pO1xuICAgIC8vIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkJvZHlDbGljayk7XG4gICAgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMuX2lkUG9vbCA9IDA7XG4gICAgdGhpcy5fcmVhZHkgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBhdHRyaWJ1dGVzIHZhbHVlcy5cbiAgICovXG4gIHB1YmxpYyBjbGVhciAoKTogdm9pZCB7XG4gICAgdGhpcy5fc2VjdGlvbnMgPSB7fTtcbiAgICB0aGlzLl9zZWN0aW9uQ291bnQgPSAwO1xuICAgIHRoaXMuX2RlZmF1bHRTZWN0aW9uSWQgPSAnJztcbiAgICB0aGlzLl9sYXN0U2VjdGlvbklkID0gJyc7XG4gICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBhIGxhc3RGb2N1c2VkRWxlbWVudCBhbmQgcHJldmlvdXMgZWxlbWVudCBvZiBhIHNlY3Rpb24uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgLSBzZWN0aW9uIHRvIHJlc2V0XG4gICAqL1xuICBwdWJsaWMgcmVzZXQgKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5sYXN0Rm9jdXNlZEVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLnByZXZpb3VzID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLl9zZWN0aW9uc1tpZF07XG4gICAgICAgIHNlY3Rpb24ubGFzdEZvY3VzZWRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICBzZWN0aW9uLnByZXZpb3VzID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbmZpZ3VyYXRpb24gb2YgYSBzZWN0aW9uIG9yIHNldCB0aGUgZ2xvYmFsIGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIHNlY3Rpb24gdG8gY29uZmlndXJlLCB1bmRlZmluZWQgdG8gc2V0IHRoZSBnbG9iYWwgY29uZmlndXJhdGlvbi5cbiAgICogQHBhcmFtIGNvbmZpZyAtIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIHB1YmxpYyBzZXQgKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkLCBjb25maWc6IENvbmZpZ3VyYXRpb24pOiBib29sZWFuIHwgbmV2ZXIge1xuICAgIGNvbnN0IGZpbmFsQ29uZmlnID0ge307XG4gICAgT2JqZWN0LmFzc2lnbihmaW5hbENvbmZpZywgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uKTtcbiAgICBPYmplY3QuYXNzaWduKGZpbmFsQ29uZmlnLCBjb25maWcpO1xuXG4gICAgaWYgKHNlY3Rpb25JZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoIXRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZWN0aW9uIFwiJHtzZWN0aW9uSWR9XCIgZG9lc24ndCBleGlzdCFgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbiA9IGZpbmFsQ29uZmlnIGFzIENvbmZpZ3VyYXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbiA9IGZpbmFsQ29uZmlnIGFzIENvbmZpZ3VyYXRpb247XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIHNlY3Rpb24gaWQgdG8gYWRkXG4gICAqIEBwYXJhbSBjb25maWcgLSBjb25maWd1cmF0aW9uIG9mIHRoZSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIHNlY3Rpb25JZFxuICAgKi9cbiAgcHVibGljIGFkZCAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGNvbmZpZzogQ29uZmlndXJhdGlvbik6IHN0cmluZyB8IG5ldmVyIHtcbiAgICBpZiAoIXNlY3Rpb25JZCkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICBzZWN0aW9uSWQgPSB0aGlzLmdlbmVyYXRlSWQoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2VjdGlvbiBcIiR7c2VjdGlvbklkfVwiIGFscmVhZHkgZXhpc3QhYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gPSB7XG4gICAgICAgIGlkOiBzZWN0aW9uSWQsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246IGRlZmF1bHRDb25maWd1cmF0aW9uLFxuICAgICAgICBsYXN0Rm9jdXNlZEVsZW1lbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgcHJldmlvdXM6IHVuZGVmaW5lZFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2V0KHNlY3Rpb25JZCwgY29uZmlnKSkge1xuICAgICAgdGhpcy5fc2VjdGlvbkNvdW50Kys7XG4gICAgfVxuICAgIHJldHVybiBzZWN0aW9uSWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIHJlbW92ZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHNlY3Rpb24gaGFzIGJlZW4gcmVtb3ZlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlIChzZWN0aW9uSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICBpZiAoZGVsZXRlIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgICAgdGhpcy5fc2VjdGlvbkNvdW50LS07XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fbGFzdFNlY3Rpb25JZCA9PT0gc2VjdGlvbklkKSB7XG4gICAgICAgIHRoaXMuX2xhc3RTZWN0aW9uSWQgPSAnJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSBuYXZpZ2F0aW9uIG9uIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gaWQgb2YgdGhlIHNlY3Rpb24gdG8gZGlzYWJsZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHNlY3Rpb24gaGFzIGJlZW4gZGlzYWJsZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGRpc2FibGUgKHNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gJiYgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgbmF2aWdhdGlvbiBvbiBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIGlkIG9mIHRoZSBzZWN0aW9uIHRvIGVuYWJsZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHNlY3Rpb24gaGFzIGJlZW4gZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgZW5hYmxlIChzZWN0aW9uSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdICYmIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbikge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhdXNlIG5hdmlnYXRpb25cbiAgICovXG4gIHB1YmxpYyBwYXVzZSAoKTogdm9pZCB7XG4gICAgdGhpcy5fcGF1c2UgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3VtZSBuYXZpZ2F0aW9uXG4gICAqL1xuICBwdWJsaWMgcmVzdW1lICgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXVzZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIGFuIGVsZW1lbnRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBmb2N1cyAoc2VjdGlvbiBpZCBvciBzZWxlY3RvciksIChhbiBlbGVtZW50IG9yIGEgc2VjdGlvbilcbiAgICogQHBhcmFtIHNpbGVudCA/XG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gaW5jb21pbmcgZGlyZWN0aW9uXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZWxlbWVudCBoYXMgYmVlbiBmb2N1c2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyBmb2N1cyAoZWxlbWVudDogc3RyaW5nLCBzaWxlbnQ6IGJvb2xlYW4sIGRpcmVjdGlvbjogRGlyZWN0aW9uKTogYm9vbGVhbiB7XG4gICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgIGNvbnN0IGF1dG9QYXVzZSA9ICF0aGlzLl9wYXVzZSAmJiBzaWxlbnQ7XG4gICAgaWYgKGF1dG9QYXVzZSkgdGhpcy5wYXVzZSgpO1xuXG4gICAgLy8gVE8gRE8gLSBhZGQgZm9jdXNFeHRlbmRlZFNlbGVjdG9yIGFuZCBfZm9jdXNFbGVtZW50ID8/P1xuICAgIGlmICh0aGlzLmlzU2VjdGlvbihlbGVtZW50KSkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5mb2N1c1NlY3Rpb24oZWxlbWVudCwgZGlyZWN0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gdGhpcy5mb2N1c0V4dGVuZGVkU2VsZWN0b3IoZWxlbWVudCwgZGlyZWN0aW9uLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9QYXVzZSkgdGhpcy5yZXN1bWUoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmUgdG8gYW5vdGhlciBlbGVtZW50XG4gICAqL1xuICBwdWJsaWMgbW92ZSAoZGlyZWN0aW9uOiBEaXJlY3Rpb24sIHNlbGVjdG9yOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgICBsZXQgZWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHNlbGVjdG9yKSB7XG4gICAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGVsZW1lbnQgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihzZWxlY3RvcilbMF0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgIH1cblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGVsZW1lbnQpO1xuICAgIGlmICghc2VjdGlvbklkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lsbG1vdmVQcm9wZXJ0aWVzID0ge1xuICAgICAgZGlyZWN0aW9uLFxuICAgICAgc2VjdGlvbklkLFxuICAgICAgY2F1c2U6ICdhcGknXG4gICAgfTtcblxuICAgIGlmICghdGhpcy5maXJlRXZlbnQoZWxlbWVudCwgJ3dpbGxtb3ZlJywgd2lsbG1vdmVQcm9wZXJ0aWVzLCB1bmRlZmluZWQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvY3VzTmV4dChkaXJlY3Rpb24sIGVsZW1lbnQsIHNlY3Rpb25JZCk7XG4gIH1cblxuICAvKipcbiAgICogTWFrZSBhIHNlY3Rpb24gZm9jdXNhYmxlIChtb3JlIHByZWNpc2VseSwgYWxsIGl0cyBmb2N1c2FibGUgY2hpbGRyZW4gYXJlIG1hZGUgZm9jdXNhYmxlKVxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIG1ha2UgZm9jdXNhYmxlLCB1bmRlZmluZWQgaWYgeW91IHdhbnQgdG8gbWFrZSBhbGwgc2VjdGlvbnMgZm9jdXNhYmxlXG4gICAqL1xuICBwdWJsaWMgbWFrZUZvY3VzYWJsZSAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkIHwgbmV2ZXIge1xuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICAgIHRoaXMuZG9NYWtlRm9jdXNhYmxlKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBkb2Vzbid0IGV4aXN0IWApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBtYWtlIGZvY3VzYWJsZSBhbGwgc2VjdGlvbnMgKGluaXQgPylcbiAgICAgIGZvciAoY29uc3QgaWQgaW4gdGhpcy5fc2VjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5kb01ha2VGb2N1c2FibGUodGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGRlZmF1bHQgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIHNldCBhcyBkZWZhdWx0XG4gICAqL1xuICBwdWJsaWMgc2V0RGVmYXVsdFNlY3Rpb24gKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB8IG5ldmVyIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9kZWZhdWx0U2VjdGlvbklkID0gc2VjdGlvbklkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBkb2Vzbid0IGV4aXN0IWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyBhbiBlbGVtZW50XG4gICAqL1xuICBwdWJsaWMgZm9jdXNFbGVtZW50IChlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIGlmICghZWxlbWVudCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IG5leHRTZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChlbGVtZW50KTtcbiAgICBpZiAoIW5leHRTZWN0aW9uSWQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgIGxldCBlbnRlckludG9OZXdTZWN0aW9uID0gdHJ1ZTtcbiAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBjb25zdCBjdXJyZW50U2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQoY3VycmVudEZvY3VzZWRFbGVtZW50KTtcbiAgICAgIGVudGVySW50b05ld1NlY3Rpb24gPSBuZXh0U2VjdGlvbklkID09PSBjdXJyZW50U2VjdGlvbklkO1xuICAgIH1cbiAgICBpZiAodGhpcy5pc05hdmlnYWJsZShlbGVtZW50LCBuZXh0U2VjdGlvbklkLCBmYWxzZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQoZWxlbWVudCwgbmV4dFNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbiwgRGlyZWN0aW9uLlVQKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIHRoZSBzZWN0aW9uIG9uY2UgaXQgaGFzIGJlZW4gbW91bnRlZFxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIGZvY3VzXG4gICAqL1xuICBwdWJsaWMgZm9jdXNPbk1vdW50ZWQgKHNlY3Rpb25JZDogc3RyaW5nKSB7XG4gICAgdGhpcy5mb2N1c09uTW91bnRlZFNlY3Rpb25zLnB1c2goc2VjdGlvbklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBTcGF0aWFsIE5hdmlnYXRpb24gaXMgd2FpdGluZyB0aGlzIGVsZW1lbnQgdG8gYmUgbW91bnRlZCBiZWZvcmUgZm9jdXNpbmcgaXQuXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgdG8gY2hlY2tcbiAgICovXG4gIHB1YmxpYyBoYXNCZWVuV2FpdGluZ0Zvck1vdW50ZWQgKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZm9jdXNPbk1vdW50ZWRTZWN0aW9ucy5pbmNsdWRlcyhzZWN0aW9uSWQpKSB7XG4gICAgICB0aGlzLmZvY3VzU2VjdGlvbihzZWN0aW9uSWQsIERpcmVjdGlvbi5VUCk7XG4gICAgICB0aGlzLmZvY3VzT25Nb3VudGVkU2VjdGlvbnMgPSB0aGlzLmZvY3VzT25Nb3VudGVkU2VjdGlvbnMuZmlsdGVyKChmb21zKSA9PiBmb21zICE9PSBzZWN0aW9uSWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFBSSVZBVEUgRlVOQ1RJT05TXG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgdW5pcXVlIGlkIGZvciBhIHNlY3Rpb25cbiAgICogQHJldHVybnMgbmV3IGlkIHNlY3Rpb25cbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVJZCAoKTogc3RyaW5nIHtcbiAgICBsZXQgaWQ6IHN0cmluZztcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWQgPSB0aGlzLklEX1BPT0xfUFJFRklYICsgU3RyaW5nKCsrdGhpcy5faWRQb29sKTtcbiAgICAgIGlmICghdGhpcy5fc2VjdGlvbnNbaWRdKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBwcml2YXRlIGdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCAoKTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHsgYWN0aXZlRWxlbWVudCB9ID0gZG9jdW1lbnQ7XG4gICAgaWYgKGFjdGl2ZUVsZW1lbnQgJiYgYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgcmV0dXJuIGFjdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIGV4dGVuZCAob3V0OiBhbnksIC4uLmFyZ3M6IGFueSkge1xuICAgIG91dCA9IG91dCB8fCB7fTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghYXJnc1tpXSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGFyZ3NbaV0pIHtcbiAgICAgICAgaWYgKGFyZ3NbaV0uaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhcmdzW2ldW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG91dFtrZXldID0gYXJnc1tpXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBwcml2YXRlIGV4Y2x1ZGUgKGVsZW1MaXN0OiBhbnksIGV4Y2x1ZGVkRWxlbTogYW55KSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGV4Y2x1ZGVkRWxlbSkpIHtcbiAgICAgIGV4Y2x1ZGVkRWxlbSA9IFtleGNsdWRlZEVsZW1dO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMCwgaW5kZXg7IGkgPCBleGNsdWRlZEVsZW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGluZGV4ID0gZWxlbUxpc3QuaW5kZXhPZihleGNsdWRlZEVsZW1baV0pO1xuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgZWxlbUxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsZW1MaXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIGVsZW1lbnQgaXMgbmF2aWdhYmxlXG4gICAqIEBwYXJhbSBlbGVtIGVsZW1lbnQgdG8gY2hlY2tcbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgZWxlbWVudCdzIHNlY3Rpb25cbiAgICogQHBhcmFtIHZlcmlmeVNlY3Rpb25TZWxlY3RvciBpZiB0cnVlLCBjaGVjayB0aGUgc2VjdGlvbiBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGVsZW1lbnQgaXMgbmF2aWdhYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHByaXZhdGUgaXNOYXZpZ2FibGUgKGVsZW06IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgdmVyaWZ5U2VjdGlvblNlbGVjdG9yOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKCFlbGVtIHx8ICFzZWN0aW9uSWQgfHwgIXRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gfHwgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICgoZWxlbS5vZmZzZXRXaWR0aCA8PSAwICYmIGVsZW0ub2Zmc2V0SGVpZ2h0IDw9IDApIHx8IGVsZW0uaGFzQXR0cmlidXRlKCdkaXNhYmxlZCcpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh2ZXJpZnlTZWN0aW9uU2VsZWN0b3IgJiYgIXRoaXMuY29yZS5tYXRjaFNlbGVjdG9yKGVsZW0sIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5zZWxlY3RvciEpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubmF2aWdhYmxlRmlsdGVyICE9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLm5hdmlnYWJsZUZpbHRlciEoZWxlbSwgc2VjdGlvbklkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLm5hdmlnYWJsZUZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi5uYXZpZ2FibGVGaWx0ZXIhKGVsZW0sIHNlY3Rpb25JZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBlbGVtZW50J3Mgc2VjdGlvbiBpZFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50XG4gICAqIEByZXR1cm5zIHRoZSBlbGVtZW50J3Mgc2VjdGlvbiBpZFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTZWN0aW9uSWQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBzZWN0aW9uc0VsZW1lbnRzOiBhbnkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICBpZiAoIXRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkKSB7XG4gICAgICAgIGNvbnN0IHNlY3Rpb25FbGVtZW50ID0gdGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24uZWxlbWVudDtcbiAgICAgICAgaWYgKHNlY3Rpb25FbGVtZW50KSB7XG4gICAgICAgICAgc2VjdGlvbnNFbGVtZW50c1tpZF0gPSBzZWN0aW9uRWxlbWVudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24uc2VsZWN0b3IgIT09ICcnICYmIHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLnNlbGVjdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRXaXRoU2VsZWN0b3IgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihgW2RhdGEtc2VjdGlvbi1pZD1cIiR7aWR9XCJdYClbMF1cbiAgICAgICAgICAgIGlmIChlbGVtZW50V2l0aFNlbGVjdG9yKSB7XG4gICAgICAgICAgICAgIHNlY3Rpb25zRWxlbWVudHNbaWRdID0gZWxlbWVudFdpdGhTZWxlY3RvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGFyZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBlbGVtZW50O1xuICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgIGlmIChPYmplY3QudmFsdWVzKHNlY3Rpb25zRWxlbWVudHMpLmluZGV4T2YocGFyZW50KSA+IC0xKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhzZWN0aW9uc0VsZW1lbnRzKS5maW5kKChrZXkpID0+IHNlY3Rpb25zRWxlbWVudHNba2V5XSA9PT0gcGFyZW50KTtcbiAgICAgIH1cbiAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBuYXZpZ2FibGUgZWxlbWVudHMgaW50byBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMgKHNlY3Rpb25JZDogc3RyaW5nKTogbmV2ZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5zZWxlY3RvciEpXG4gICAgICAuZmlsdGVyKChlbGVtZW50KSA9PiB0aGlzLmlzTmF2aWdhYmxlKGVsZW1lbnQsIHNlY3Rpb25JZCwgZmFsc2UpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRlZmF1bHQgZWxlbWVudCBvZiBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvblxuICAgKiBAcmV0dXJucyB0aGUgZGVmYXVsdCBlbGVtZW50IG9mIGEgc2VjdGlvbiwgbnVsbCBpZiBubyBkZWZhdWx0IGVsZW1lbnQgZm91bmRcbiAgICovXG4gIHByaXZhdGUgZ2V0U2VjdGlvbkRlZmF1bHRFbGVtZW50IChzZWN0aW9uSWQ6IHN0cmluZyk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgeyBkZWZhdWx0RWxlbWVudCB9ID0gdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uO1xuICAgIGlmICghZGVmYXVsdEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKGRlZmF1bHRFbGVtZW50KTtcbiAgICAvLyBjaGVjayBlYWNoIGVsZW1lbnQgdG8gc2VlIGlmIGl0J3MgbmF2aWdhYmxlIGFuZCBzdG9wIHdoZW4gb25lIGhhcyBiZWVuIGZvdW5kXG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICBpZiAodGhpcy5pc05hdmlnYWJsZShlbGVtZW50LCBzZWN0aW9uSWQsIHRydWUpKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxhc3QgZm9jdXNlZCBlbGVtZW50IGludG8gYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb25cbiAgICogQHJldHVybnMgdGhlIGxhc3QgZm9jdXNlZCBlbGVtZW50LCBudWxsIGlmIG5vIGVsZW1lbnQgZm91bmRcbiAgICovXG4gIHByaXZhdGUgZ2V0U2VjdGlvbkxhc3RGb2N1c2VkRWxlbWVudCAoc2VjdGlvbklkOiBhbnkpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIGNvbnN0IHsgbGFzdEZvY3VzZWRFbGVtZW50IH0gPSB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdO1xuICAgIGlmIChsYXN0Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIGlmICghdGhpcy5pc05hdmlnYWJsZShsYXN0Rm9jdXNlZEVsZW1lbnQsIHNlY3Rpb25JZCwgdHJ1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGFzdEZvY3VzZWRFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBmaXJlIGFuIGV2ZW50XG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgc291cmNlXG4gICAqIEBwYXJhbSB0eXBlIHR5cGUgb2YgZXZlbnRcbiAgICogQHBhcmFtIGRldGFpbHMgP1xuICAgKiBAcGFyYW0gY2FuY2VsYWJsZSB0cnVlIGlmIGNhbmNlbGFibGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGV2ZW50IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBkaXNwYXRjaGVkXG4gICAqL1xuICBwcml2YXRlIGZpcmVFdmVudCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHR5cGU6IHN0cmluZywgZGV0YWlsczogYW55LCBjYW5jZWxhYmxlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgNCkge1xuICAgICAgY2FuY2VsYWJsZSA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQodGhpcy5FVkVOVF9QUkVGSVggKyB0eXBlLCB0cnVlLCBjYW5jZWxhYmxlLCBkZXRhaWxzKTtcbiAgICByZXR1cm4gZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gIH1cblxuICAvKipcbiAgICogZm9jdXMgYW5kIHNjcm9sbCBvbiBlbGVtZW50XG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgdG8gZm9jdXNcbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvbiBjb250YWluaW5nIHRoZSBlbGVtZW50XG4gICAqIEBwYXJhbSBlbnRlckludG9OZXdTZWN0aW9uIHRydWUgaWYgd2UgZW50ZXIgaW50byB0aGUgc2VjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwcml2YXRlIGZvY3VzTlNjcm9sbCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlY3Rpb25JZDogc3RyaW5nLCBlbnRlckludG9OZXdTZWN0aW9uOiBib29sZWFuKTogdm9pZCB7XG4gICAgbGV0IHNjcm9sbE9wdGlvbnMgPSBlbnRlckludG9OZXdTZWN0aW9uID8gdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLnNjcm9sbE9wdGlvbnNcbiAgICAgIDogdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLnNjcm9sbE9wdGlvbnNJbnRvU2VjdGlvbjtcbiAgICAvLyBpZiBuby1zY3JvbGwgZ2l2ZW4gYXMgc2Nyb2xsT3B0aW9ucywgdGhlbiBmb2N1cyB3aXRob3V0IHNjcm9sbGluZ1xuICAgIGlmIChzY3JvbGxPcHRpb25zID09PSAnbm8tc2Nyb2xsJykge1xuICAgICAgZWxlbWVudC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG4gICAgfSBlbHNlIGlmIChzY3JvbGxPcHRpb25zICE9PSB1bmRlZmluZWQgJiYgc2Nyb2xsT3B0aW9ucyAhPT0gJycgJiYgIShzY3JvbGxPcHRpb25zIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgZWxlbWVudC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG4gICAgICBlbGVtZW50LnNjcm9sbEludG9WaWV3KHNjcm9sbE9wdGlvbnMgYXMgU2Nyb2xsSW50b1ZpZXdPcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbikge1xuICAgICAgc2Nyb2xsT3B0aW9ucyA9IGVudGVySW50b05ld1NlY3Rpb24gPyB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24uc2Nyb2xsT3B0aW9ucyA6IHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi5zY3JvbGxPcHRpb25zSW50b1NlY3Rpb247XG4gICAgICBpZiAoc2Nyb2xsT3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9wdGlvbnMgIT09ICcnICYmIHNjcm9sbE9wdGlvbnMgIT09ICduby1zY3JvbGwnKSB7XG4gICAgICAgIGVsZW1lbnQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICAgICAgICBlbGVtZW50LnNjcm9sbEludG9WaWV3KHNjcm9sbE9wdGlvbnMgYXMgU2Nyb2xsSW50b1ZpZXdPcHRpb25zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtXG4gICAqIEBwYXJhbSBzZWN0aW9uSWRcbiAgICovXG4gIHByaXZhdGUgZm9jdXNDaGFuZ2VkIChlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcpIHtcbiAgICBsZXQgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHNlY3Rpb25JZDtcbiAgICBpZiAoIWlkKSB7XG4gICAgICBpZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGVsZW1lbnQpO1xuICAgIH1cbiAgICBpZiAoaWQpIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0ubGFzdEZvY3VzZWRFbGVtZW50ID0gZWxlbWVudDtcbiAgICAgIHRoaXMuX2xhc3RTZWN0aW9uSWQgPSBzZWN0aW9uSWQ7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaWxlbnRGb2N1cyAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlY3Rpb25JZDogc3RyaW5nLCBzY3JvbGxJbnRvTmV3U2VjdGlvbjogYm9vbGVhbikge1xuICAgIGNvbnN0IGN1cnJlbnRGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgIGlmIChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudC5ibHVyKCk7XG4gICAgfVxuICAgIHRoaXMuZm9jdXNOU2Nyb2xsKGVsZW1lbnQsIHNlY3Rpb25JZCwgc2Nyb2xsSW50b05ld1NlY3Rpb24pO1xuICAgIHRoaXMuZm9jdXNDaGFuZ2VkKGVsZW1lbnQsIHNlY3Rpb25JZCk7XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgYW4gZWxlbWVudFxuICAgKiBAcGFyYW0gZWxlbSBlbGVtZW50IHRvIGZvY3VzXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIGVsZW1lbnQncyBzZWN0aW9uXG4gICAqIEBwYXJhbSBlbnRlckludG9OZXdTZWN0aW9uIHRydWUgaWYgbmV3IHNlY3Rpb24gaXMgZm9jdXNlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gc291cmNlIGRpcmVjdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBfZm9jdXNFbGVtZW50IChlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcsIGVudGVySW50b05ld1NlY3Rpb246IGJvb2xlYW4sIGRpcmVjdGlvbj86IERpcmVjdGlvbikge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcblxuICAgIGlmICh0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSkge1xuICAgICAgdGhpcy5zaWxlbnRGb2N1cyhlbGVtZW50LCBzZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMuX3BhdXNlKSB7XG4gICAgICB0aGlzLnNpbGVudEZvY3VzKGVsZW1lbnQsIHNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbik7XG4gICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgY29uc3QgdW5mb2N1c1Byb3BlcnRpZXMgPSB7XG4gICAgICAgIG5leHRFbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBuZXh0U2VjdGlvbklkOiBzZWN0aW9uSWQsXG4gICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgbmF0aXZlOiBmYWxzZVxuICAgICAgfTtcbiAgICAgIGlmICghdGhpcy5maXJlRXZlbnQoY3VycmVudEZvY3VzZWRFbGVtZW50LCAnd2lsbHVuZm9jdXMnLCB1bmZvY3VzUHJvcGVydGllcywgdW5kZWZpbmVkKSkge1xuICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQuYmx1cigpO1xuICAgICAgdGhpcy5maXJlRXZlbnQoY3VycmVudEZvY3VzZWRFbGVtZW50LCAndW5mb2N1c2VkJywgdW5mb2N1c1Byb3BlcnRpZXMsIGZhbHNlKTtcbiAgICB9XG5cbiAgICBjb25zdCBmb2N1c1Byb3BlcnRpZXMgPSB7XG4gICAgICBwcmV2aW91c0VsZW1lbnQ6IGN1cnJlbnRGb2N1c2VkRWxlbWVudCxcbiAgICAgIHNlY3Rpb25JZCxcbiAgICAgIGRpcmVjdGlvbixcbiAgICAgIG5hdGl2ZTogZmFsc2VcbiAgICB9O1xuICAgIGlmICghdGhpcy5maXJlRXZlbnQoZWxlbWVudCwgJ3dpbGxmb2N1cycsIGZvY3VzUHJvcGVydGllcykpIHtcbiAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZm9jdXNOU2Nyb2xsKGVsZW1lbnQsIHNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbik7XG4gICAgdGhpcy5maXJlRXZlbnQoZWxlbWVudCwgJ2ZvY3VzZWQnLCBmb2N1c1Byb3BlcnRpZXMsIGZhbHNlKTtcblxuICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG5cbiAgICB0aGlzLmZvY3VzQ2hhbmdlZChlbGVtZW50LCBzZWN0aW9uSWQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHByaXZhdGUgZm9jdXNFeHRlbmRlZFNlbGVjdG9yIChzZWxlY3Rvcjogc3RyaW5nLCBkaXJlY3Rpb246IERpcmVjdGlvbiwgZW50ZXJJbnRvTmV3U2VjdGlvbjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIGlmIChzZWxlY3Rvci5jaGFyQXQoMCkgPT09ICdAJykge1xuICAgICAgaWYgKHNlbGVjdG9yLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5mb2N1c1NlY3Rpb24odW5kZWZpbmVkLCBkaXJlY3Rpb24pO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2VjdGlvbklkID0gc2VsZWN0b3Iuc3Vic3RyKDEpO1xuICAgICAgcmV0dXJuIHRoaXMuZm9jdXNTZWN0aW9uKHNlY3Rpb25JZCwgZGlyZWN0aW9uKTtcbiAgICB9XG4gICAgY29uc3QgbmV4dCA9IHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKVswXTtcbiAgICBpZiAobmV4dCkge1xuICAgICAgY29uc3QgbmV4dFNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKG5leHQpO1xuICAgICAgaWYgKG5leHRTZWN0aW9uSWQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNOYXZpZ2FibGUobmV4dCwgbmV4dFNlY3Rpb25JZCwgZmFsc2UpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2ZvY3VzRWxlbWVudChuZXh0LCBuZXh0U2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uLCBkaXJlY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkUmFuZ2UgKGlkOiBzdHJpbmcsIHJhbmdlOiBzdHJpbmcgW10pIHtcbiAgICBpZiAoaWQgJiYgcmFuZ2UuaW5kZXhPZihpZCkgPCAwICYmIHRoaXMuX3NlY3Rpb25zW2lkXSAmJiAhdGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24uZGlzYWJsZWQpIHtcbiAgICAgIHJhbmdlLnB1c2goaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvblxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIGRpcmVjdGlvblxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHNlY3Rpb24gaGFzIGJlZW4gZm9jdXNlZFxuICAgKi9cbiAgcHJpdmF0ZSBmb2N1c1NlY3Rpb24gKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkLCBkaXJlY3Rpb246IERpcmVjdGlvbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJhbmdlOiBzdHJpbmcgW10gPSBbXTtcblxuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIHRoaXMuYWRkUmFuZ2Uoc2VjdGlvbklkLCByYW5nZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWRkUmFuZ2UodGhpcy5fZGVmYXVsdFNlY3Rpb25JZCwgcmFuZ2UpO1xuICAgICAgdGhpcy5hZGRSYW5nZSh0aGlzLl9sYXN0U2VjdGlvbklkLCByYW5nZSk7XG4gICAgICBmb3IgKGNvbnN0IHNlY3Rpb24gaW4gdGhpcy5fc2VjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5hZGRSYW5nZShzZWN0aW9uLCByYW5nZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaWQgPSByYW5nZVtpXTtcbiAgICAgIGxldCBuZXh0O1xuXG4gICAgICBpZiAodGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24uZW50ZXJUbyA9PT0gJ2xhc3QtZm9jdXNlZCcpIHtcbiAgICAgICAgbmV4dCA9IHRoaXMuZ2V0U2VjdGlvbkxhc3RGb2N1c2VkRWxlbWVudChpZClcbiAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbkRlZmF1bHRFbGVtZW50KGlkKVxuICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMoaWQpWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dCA9IHRoaXMuZ2V0U2VjdGlvbkRlZmF1bHRFbGVtZW50KGlkKVxuICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50KGlkKVxuICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMoaWQpWzBdO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZm9jdXNFbGVtZW50KG5leHQsIGlkLCB0cnVlLCBkaXJlY3Rpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRmlyZSBldmVudCB3aGVuIG5hdmlnYXRlIGhhcyBmYWlsZWRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCBzb3VyY2VcbiAgICogQHBhcmFtIGRpcmVjdGlvbiBkaXJlY3Rpb24gc291cmNlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZXZlbnQgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IHJhaXNlZFxuICAgKi9cbiAgcHJpdmF0ZSBmaXJlTmF2aWdhdGVGYWlsZWQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBkaXJlY3Rpb246IERpcmVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLmZpcmVFdmVudChlbGVtZW50LCAnbmF2aWdhdGVmYWlsZWQnLCB7XG4gICAgICBkaXJlY3Rpb25cbiAgICB9LCBmYWxzZSk7XG4gIH1cblxuICBwcml2YXRlIGdvVG9MZWF2ZUZvciAoc2VjdGlvbklkOiBzdHJpbmcsIGRpcmVjdGlvbjogRGlyZWN0aW9uKSB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5sZWF2ZUZvclxuICAgICAgJiYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5sZWF2ZUZvciBhcyBhbnkpW2RpcmVjdGlvbnRvU3RyaW5nKGRpcmVjdGlvbildICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG5leHQgPSAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmxlYXZlRm9yIGFzIGFueSlbZGlyZWN0aW9udG9TdHJpbmcoZGlyZWN0aW9uKV07XG4gICAgICBpZiAobmV4dCA9PT0gJycgfHwgbmV4dCA9PT0gJ25vd2hlcmUnKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZm9jdXNFeHRlbmRlZFNlbGVjdG9yKG5leHQsIGRpcmVjdGlvbiwgdHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyBuZXh0IGVsZW1lbnRcbiAgICogQHBhcmFtIGRpcmVjdGlvbiBzb3VyY2UgZGlyZWN0aW9uXG4gICAqIEBwYXJhbSBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgY3VycmVudCBmb2N1c2VkIGVsZW1lbnRcbiAgICogQHBhcmFtIGN1cnJlbnRTZWN0aW9uSWQgY3VycmVudCBzZWN0aW9uIGlkXG4gICAqIEByZXR1cm5zIHRydWUgaWYgbmV4dCBoYXMgYmVlbiBmb2N1c2VkIHN1Y2Nlc3NmdWxseVxuICAgKi9cbiAgcHJpdmF0ZSBmb2N1c05leHQgKGRpcmVjdGlvbjogRGlyZWN0aW9uLCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjdXJyZW50U2VjdGlvbklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBleHRTZWxlY3RvciA9IGN1cnJlbnRGb2N1c2VkRWxlbWVudC5nZXRBdHRyaWJ1dGUoYGRhdGEtc24tJHtkaXJlY3Rpb259YCk7XG5cbiAgICAvLyBUTyBETyByZW1vdmUgdHlwZW9mXG4gICAgaWYgKHR5cGVvZiBleHRTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChleHRTZWxlY3RvciA9PT0gJydcbiAgICAgICAgICB8fCAhdGhpcy5mb2N1c0V4dGVuZGVkU2VsZWN0b3IoZXh0U2VsZWN0b3IsIGRpcmVjdGlvbiwgZmFsc2UpKSB7IC8vIHdoaGljaCB2YWx1ZSBmb3IgZW50ZXJJbnRvTmV3U2VjdGlvbiA/IHRydWUgb3IgZmFsc2UgPz8/XG4gICAgICAgIHRoaXMuZmlyZU5hdmlnYXRlRmFpbGVkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgZGlyZWN0aW9uKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzOiBhbnkgPSB7fTtcbiAgICBsZXQgYWxsTmF2aWdhYmxlRWxlbWVudHM6IGFueSA9IFtdO1xuICAgIGZvciAoY29uc3QgaWQgaW4gdGhpcy5fc2VjdGlvbnMpIHtcbiAgICAgIHNlY3Rpb25OYXZpZ2FibGVFbGVtZW50c1tpZF0gPSB0aGlzLmdldFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyhpZCkgYXMgSFRNTEVsZW1lbnRbXTtcbiAgICAgIGFsbE5hdmlnYWJsZUVsZW1lbnRzID0gYWxsTmF2aWdhYmxlRWxlbWVudHMuY29uY2F0KHNlY3Rpb25OYXZpZ2FibGVFbGVtZW50c1tpZF0pO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IGNvbmZpZzogQ29uZmlndXJhdGlvbiA9IHRoaXMuZXh0ZW5kKHt9LCB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24sIHRoaXMuX3NlY3Rpb25zW2N1cnJlbnRTZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24pO1xuICAgIGxldCBuZXh0OiBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgY29uc3QgY3VycmVudFNlY3Rpb24gPSB0aGlzLl9zZWN0aW9uc1tjdXJyZW50U2VjdGlvbklkXTtcblxuICAgIGlmIChjdXJyZW50U2VjdGlvbi5jb25maWd1cmF0aW9uLnJlc3RyaWN0ID09PSAnc2VsZi1vbmx5JyB8fCBjdXJyZW50U2VjdGlvbi5jb25maWd1cmF0aW9uLnJlc3RyaWN0ID09PSAnc2VsZi1maXJzdCcpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMgPSBzZWN0aW9uTmF2aWdhYmxlRWxlbWVudHNbY3VycmVudFNlY3Rpb25JZF07XG5cbiAgICAgIG5leHQgPSB0aGlzLmNvcmUubmF2aWdhdGUoXG4gICAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCxcbiAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICB0aGlzLmV4Y2x1ZGUoY3VycmVudFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cywgY3VycmVudEZvY3VzZWRFbGVtZW50KSxcbiAgICAgICAgY3VycmVudFNlY3Rpb25cbiAgICAgICk7XG5cbiAgICAgIGlmICghbmV4dCAmJiBjdXJyZW50U2VjdGlvbi5jb25maWd1cmF0aW9uLnJlc3RyaWN0ID09PSAnc2VsZi1maXJzdCcpIHtcbiAgICAgICAgbmV4dCA9IHRoaXMuY29yZS5uYXZpZ2F0ZShcbiAgICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICAgIHRoaXMuZXhjbHVkZShhbGxOYXZpZ2FibGVFbGVtZW50cywgY3VycmVudFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyksXG4gICAgICAgICAgY3VycmVudFNlY3Rpb25cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dCA9IHRoaXMuY29yZS5uYXZpZ2F0ZShcbiAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgIHRoaXMuZXhjbHVkZShhbGxOYXZpZ2FibGVFbGVtZW50cywgY3VycmVudEZvY3VzZWRFbGVtZW50KSxcbiAgICAgICAgY3VycmVudFNlY3Rpb25cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKG5leHQpIHtcbiAgICAgIGN1cnJlbnRTZWN0aW9uLnByZXZpb3VzID0ge1xuICAgICAgICB0YXJnZXQ6IGN1cnJlbnRGb2N1c2VkRWxlbWVudCxcbiAgICAgICAgZGVzdGluYXRpb246IG5leHQsXG4gICAgICAgIHJldmVyc2U6IGdldFJldmVyc2VEaXJlY3Rpb24oZGlyZWN0aW9uKVxuICAgICAgfTtcblxuICAgICAgY29uc3QgbmV4dFNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdGhpcy5nZXRTZWN0aW9uSWQobmV4dCk7XG4gICAgICBsZXQgZW50ZXJJbnRvTmV3U2VjdGlvbiA9IGZhbHNlO1xuICAgICAgaWYgKGN1cnJlbnRTZWN0aW9uSWQgIT09IG5leHRTZWN0aW9uSWQgJiYgbmV4dFNlY3Rpb25JZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIFdlIGVudGVyIGludG8gYW5vdGhlciBzZWN0aW9uXG4gICAgICAgIGVudGVySW50b05ld1NlY3Rpb24gPSB0cnVlO1xuICAgICAgICBjb25zdCByZXN1bHQ6IGJvb2xlYW4gfCBudWxsID0gdGhpcy5nb1RvTGVhdmVGb3IoY3VycmVudFNlY3Rpb25JZCwgZGlyZWN0aW9uKTtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmZpcmVOYXZpZ2F0ZUZhaWxlZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsIGRpcmVjdGlvbik7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGVudGVyVG9FbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgICAgICBzd2l0Y2ggKHRoaXMuX3NlY3Rpb25zW25leHRTZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uZW50ZXJUbykge1xuICAgICAgICAgIGNhc2UgJ2xhc3QtZm9jdXNlZCc6XG4gICAgICAgICAgICBlbnRlclRvRWxlbWVudCA9IHRoaXMuZ2V0U2VjdGlvbkxhc3RGb2N1c2VkRWxlbWVudChuZXh0U2VjdGlvbklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25EZWZhdWx0RWxlbWVudChuZXh0U2VjdGlvbklkKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2RlZmF1bHQtZWxlbWVudCc6XG4gICAgICAgICAgICBlbnRlclRvRWxlbWVudCA9IHRoaXMuZ2V0U2VjdGlvbkRlZmF1bHRFbGVtZW50KG5leHRTZWN0aW9uSWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbnRlclRvRWxlbWVudCkge1xuICAgICAgICAgIG5leHQgPSBlbnRlclRvRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobmV4dFNlY3Rpb25JZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZm9jdXNFbGVtZW50KG5leHQsIG5leHRTZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24sIGRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmdvVG9MZWF2ZUZvcihjdXJyZW50U2VjdGlvbklkLCBkaXJlY3Rpb24pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5maXJlTmF2aWdhdGVGYWlsZWQoY3VycmVudEZvY3VzZWRFbGVtZW50LCBkaXJlY3Rpb24pO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgcHJldmVudERlZmF1bHQgKGV2dDogRXZlbnQpOiBib29sZWFuIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBvbktleURvd24gKGV2dDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl90aHJvdHRsZSkge1xuICAgICAgdGhpcy5wcmV2ZW50RGVmYXVsdChldnQpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuX3Rocm90dGxlID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5fdGhyb3R0bGUgPSBudWxsO1xuICAgIH0sIHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi50aHJvdHRsZSk7XG5cbiAgICBpZiAoIXRoaXMuX3NlY3Rpb25Db3VudCB8fCB0aGlzLl9wYXVzZVxuICAgICAgfHwgZXZ0LmFsdEtleSB8fCBldnQuY3RybEtleSB8fCBldnQubWV0YUtleSB8fCBldnQuc2hpZnRLZXkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgY3VycmVudEZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBkaXJlY3Rpb246IERpcmVjdGlvbiA9IGV2dC5rZXlDb2RlIGFzIHVua25vd24gYXMgRGlyZWN0aW9uO1xuICAgIGlmICghZGlyZWN0aW9uKSB7XG4gICAgICBpZiAoZXZ0LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG4gICAgICAgIGlmIChjdXJyZW50Rm9jdXNlZEVsZW1lbnQgJiYgdGhpcy5nZXRTZWN0aW9uSWQoY3VycmVudEZvY3VzZWRFbGVtZW50KSkge1xuICAgICAgICAgIGlmICghdGhpcy5maXJlRXZlbnQoY3VycmVudEZvY3VzZWRFbGVtZW50LCAnZW50ZXItZG93bicsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJldmVudERlZmF1bHQoZXZ0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuXG4gICAgaWYgKCFjdXJyZW50Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIGlmICh0aGlzLl9sYXN0U2VjdGlvbklkKSB7XG4gICAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCA9IHRoaXMuZ2V0U2VjdGlvbkxhc3RGb2N1c2VkRWxlbWVudCh0aGlzLl9sYXN0U2VjdGlvbklkKTtcbiAgICAgIH1cbiAgICAgIGlmICghY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuZm9jdXNTZWN0aW9uKHVuZGVmaW5lZCwgZGlyZWN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJldmVudERlZmF1bHQoZXZ0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50U2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQoY3VycmVudEZvY3VzZWRFbGVtZW50KTtcbiAgICBpZiAoIWN1cnJlbnRTZWN0aW9uSWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB3aWxsbW92ZVByb3BlcnRpZXMgPSB7XG4gICAgICBkaXJlY3Rpb24sXG4gICAgICBzZWN0aW9uSWQ6IGN1cnJlbnRTZWN0aW9uSWQsXG4gICAgICBjYXVzZTogJ2tleWRvd24nXG4gICAgfTtcblxuICAgIGlmICh0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICd3aWxsbW92ZScsIHdpbGxtb3ZlUHJvcGVydGllcykpIHtcbiAgICAgIHRoaXMuZm9jdXNOZXh0KGRpcmVjdGlvbiwgY3VycmVudEZvY3VzZWRFbGVtZW50LCBjdXJyZW50U2VjdGlvbklkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5wcmV2ZW50RGVmYXVsdChldnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBvbktleVVwIChldnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoZXZ0LmFsdEtleSB8fCBldnQuY3RybEtleSB8fCBldnQubWV0YUtleSB8fCBldnQuc2hpZnRLZXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9wYXVzZSAmJiB0aGlzLl9zZWN0aW9uQ291bnQgJiYgZXZ0LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICBjb25zdCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCAmJiB0aGlzLmdldFNlY3Rpb25JZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpKSB7XG4gICAgICAgIGlmICghdGhpcy5maXJlRXZlbnQoY3VycmVudEZvY3VzZWRFbGVtZW50LCAnZW50ZXItdXAnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uRm9jdXMgKGV2dDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCB7IHRhcmdldCB9ID0gZXZ0O1xuICAgIGNvbnN0IGh0bWxUYXJnZXQ6IEhUTUxFbGVtZW50ID0gdGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIGlmICh0YXJnZXQgIT09IHdpbmRvdyAmJiB0YXJnZXQgIT09IGRvY3VtZW50XG4gICAgICAmJiB0aGlzLl9zZWN0aW9uQ291bnQgJiYgIXRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlICYmIHRhcmdldCkge1xuICAgICAgY29uc3Qgc2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQoaHRtbFRhcmdldCk7XG4gICAgICBpZiAoc2VjdGlvbklkKSB7XG4gICAgICAgIGlmICh0aGlzLl9wYXVzZSkge1xuICAgICAgICAgIHRoaXMuZm9jdXNDaGFuZ2VkKGh0bWxUYXJnZXQsIHNlY3Rpb25JZCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9jdXNQcm9wZXJ0aWVzID0ge1xuICAgICAgICAgIHNlY3Rpb25JZCxcbiAgICAgICAgICBuYXRpdmU6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGh0bWxUYXJnZXQsICd3aWxsZm9jdXMnLCBmb2N1c1Byb3BlcnRpZXMpKSB7XG4gICAgICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSB0cnVlO1xuICAgICAgICAgIGh0bWxUYXJnZXQuYmx1cigpO1xuICAgICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5maXJlRXZlbnQoaHRtbFRhcmdldCwgJ2ZvY3VzZWQnLCBmb2N1c1Byb3BlcnRpZXMsIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmZvY3VzQ2hhbmdlZChodG1sVGFyZ2V0LCBzZWN0aW9uSWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkJsdXIgKGV2dDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCB0YXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbCA9IGV2dC50YXJnZXQ7XG4gICAgY29uc3QgaHRtbFRhcmdldDogSFRNTEVsZW1lbnQgPSB0YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKHRhcmdldCAhPT0gd2luZG93ICYmIHRhcmdldCAhPT0gZG9jdW1lbnQgJiYgIXRoaXMuX3BhdXNlXG4gICAgICAmJiB0aGlzLl9zZWN0aW9uQ291bnQgJiYgIXRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlICYmIHRoaXMuZ2V0U2VjdGlvbklkKGh0bWxUYXJnZXQpKSB7XG4gICAgICBjb25zdCB1bmZvY3VzUHJvcGVydGllcyA9IHtcbiAgICAgICAgbmF0aXZlOiB0cnVlXG4gICAgICB9O1xuICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChodG1sVGFyZ2V0LCAnd2lsbHVuZm9jdXMnLCB1bmZvY3VzUHJvcGVydGllcykpIHtcbiAgICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBodG1sVGFyZ2V0LmZvY3VzKCk7XG4gICAgICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZpcmVFdmVudChodG1sVGFyZ2V0LCAndW5mb2N1c2VkJywgdW5mb2N1c1Byb3BlcnRpZXMsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzU2VjdGlvbiAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgICBpZiAoc2VjdGlvbklkKSB7XG4gICAgICByZXR1cm4gc2VjdGlvbklkIGluIHRoaXMuX3NlY3Rpb25zO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gVE8gUkVNT1ZFID8/P1xuICBwcml2YXRlIG9uQm9keUNsaWNrICgpIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbdGhpcy5fbGFzdFNlY3Rpb25JZF0pIHtcbiAgICAgIGNvbnN0IGxhc3RGb2N1c2VkRWxlbWVudCA9IHRoaXMuX3NlY3Rpb25zW3RoaXMuX2xhc3RTZWN0aW9uSWRdLmxhc3RGb2N1c2VkRWxlbWVudDtcbiAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBkb2N1bWVudC5ib2R5ICYmIHRoaXMuX2xhc3RTZWN0aW9uSWRcbiAgICAgICAgJiYgbGFzdEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX2ZvY3VzRWxlbWVudChsYXN0Rm9jdXNlZEVsZW1lbnQsIHRoaXMuX2xhc3RTZWN0aW9uSWQsIHRydWUsIHVuZGVmaW5lZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2UgZm9jdXNhYmxlIGVsZW1lbnRzIG9mIGEgc2VjdGlvbi5cbiAgICogQHBhcmFtIGNvbmZpZ3VyYXRpb24gY29uZmlndXJhdGlvbiBvZiB0aGUgc2VjdGlvbiB0byBtYWxlIGZvY3VzYWJsZSA/XG4gICAqL1xuICBwcml2YXRlIGRvTWFrZUZvY3VzYWJsZSAoY29uZmlndXJhdGlvbjogQ29uZmlndXJhdGlvbik6IHZvaWQge1xuICAgIGxldCB0YWJJbmRleElnbm9yZUxpc3Q6IHN0cmluZztcbiAgICBpZiAoY29uZmlndXJhdGlvbi50YWJJbmRleElnbm9yZUxpc3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFiSW5kZXhJZ25vcmVMaXN0ID0gY29uZmlndXJhdGlvbi50YWJJbmRleElnbm9yZUxpc3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhYkluZGV4SWdub3JlTGlzdCA9IHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi50YWJJbmRleElnbm9yZUxpc3QhO1xuICAgIH1cblxuICAgIHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKGNvbmZpZ3VyYXRpb24uc2VsZWN0b3IhKS5mb3JFYWNoKChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmNvcmUubWF0Y2hTZWxlY3RvcihlbGVtZW50LCB0YWJJbmRleElnbm9yZUxpc3QpKSB7XG4gICAgICAgIGNvbnN0IGh0bWxFbGVtZW50ID0gZWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgaWYgKCFodG1sRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JykpIHtcbiAgICAgICAgICAvLyBzZXQgdGhlIHRhYmluZGV4IHdpdGggYSBuZWdhdGl2ZSB2YWx1ZS4gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9HbG9iYWxfYXR0cmlidXRlcy90YWJpbmRleFxuICAgICAgICAgIGh0bWxFbGVtZW50LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIC8vICNlbmRyZWdpb25cbn1cblxuY29uc3Qgc24gPSBDb21wYXNzLmdldEluc3RhbmNlKCk7XG5leHBvcnQgeyBDb21wYXNzLCBzbiB9O1xuIl19