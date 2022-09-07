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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGFzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db21wYXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBUSxJQUFJLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDcEMsT0FBTyxFQUFpQixvQkFBb0IsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQzVFLE9BQU8sRUFBRSxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUd0RixNQUFNLE9BQU87SUFBYjtRQUVVLFdBQU0sR0FBWSxLQUFLLENBQUM7UUFDeEIsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUNwQixjQUFTLEdBQWdDLEVBQUUsQ0FBQztRQUM1QyxrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQixzQkFBaUIsR0FBVyxFQUFFLENBQUM7UUFDL0IsbUJBQWMsR0FBVyxFQUFFLENBQUM7UUFDNUIsdUJBQWtCLEdBQVksS0FBSyxDQUFDO1FBQ3BDLHdCQUFtQixHQUFrQixvQkFBb0IsQ0FBQztRQUMxRCxXQUFNLEdBQVksS0FBSyxDQUFDO1FBQ3hCLFNBQUksR0FBUyxJQUFJLENBQUM7UUFDVCxtQkFBYyxHQUFHLFVBQVUsQ0FBQztRQUM1QixpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUM5QiwyQkFBc0IsR0FBYSxFQUFFLENBQUM7UUFDdEMsY0FBUyxHQUFrQixJQUFJLENBQUM7UUFnOEJ4QyxhQUFhO0lBQ2YsQ0FBQztJQS83QlEsTUFBTSxDQUFDLFdBQVc7UUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7WUFDckIsT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1NBQ2xDO1FBQ0QsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQzFCLENBQUM7SUFFRCwyQkFBMkI7SUFFM0I7O09BRUc7SUFDSSxJQUFJO1FBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFN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LENBQUM7Z0JBQzNDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUN6Qyx1SEFBdUg7b0JBQ3ZILFdBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUM1QzthQUNGO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBRUY7QUFFRCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDakMsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUsIGNvcmUgfSBmcm9tICcuL0NvcmUnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGVmYXVsdENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL3R5cGVzL0NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgRGlyZWN0aW9uLCBkaXJlY3Rpb250b1N0cmluZywgZ2V0UmV2ZXJzZURpcmVjdGlvbiB9IGZyb20gJy4vdHlwZXMvRGlyZWN0aW9uJztcbmltcG9ydCB7IFNlY3Rpb24gfSBmcm9tICcuL3R5cGVzL1NlY3Rpb24nO1xuXG5jbGFzcyBDb21wYXNzIHtcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IENvbXBhc3M7XG4gIHByaXZhdGUgX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2lkUG9vbDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBfc2VjdGlvbnM6IHsgW2tleTogc3RyaW5nXTogU2VjdGlvbjsgfSA9IHt9O1xuICBwcml2YXRlIF9zZWN0aW9uQ291bnQ6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgX2RlZmF1bHRTZWN0aW9uSWQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF9sYXN0U2VjdGlvbklkOiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBfZHVyaW5nRm9jdXNDaGFuZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBnbG9iYWxDb25maWd1cmF0aW9uOiBDb25maWd1cmF0aW9uID0gZGVmYXVsdENvbmZpZ3VyYXRpb247XG4gIHByaXZhdGUgX3BhdXNlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgY29yZTogQ29yZSA9IGNvcmU7XG4gIHByaXZhdGUgcmVhZG9ubHkgSURfUE9PTF9QUkVGSVggPSAnc2VjdGlvbi0nO1xuICBwcml2YXRlIHJlYWRvbmx5IEVWRU5UX1BSRUZJWCA9ICdzbjonO1xuICBwcml2YXRlIGZvY3VzT25Nb3VudGVkU2VjdGlvbnM6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgX3Rocm90dGxlOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlICgpOiBDb21wYXNzIHtcbiAgICBpZiAoIUNvbXBhc3MuaW5zdGFuY2UpIHtcbiAgICAgIENvbXBhc3MuaW5zdGFuY2UgPSBuZXcgQ29tcGFzcygpO1xuICAgIH1cbiAgICByZXR1cm4gQ29tcGFzcy5pbnN0YW5jZTtcbiAgfVxuXG4gIC8vICNyZWdpb24gUFVCTElDIEZVTkNUSU9OU1xuXG4gIC8qKlxuICAgKiBJbml0IGxpc3RlbmVyc1xuICAgKi9cbiAgcHVibGljIGluaXQgKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fcmVhZHkpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd24uYmluZCh0aGlzKSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLm9uRm9jdXMuYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMub25CbHVyLmJpbmQodGhpcyksIHRydWUpO1xuICAgICAgLy8gZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uQm9keUNsaWNrKTtcbiAgICAgIHRoaXMuX3JlYWR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGxpc3RlbmVycyBhbmQgcmVpbml0aWFsaXplIENvbXBhc3MgYXR0cmlidXRlcy5cbiAgICovXG4gIHB1YmxpYyB1bmluaXQgKCk6IHZvaWQge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5vbkJsdXIsIHRydWUpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMub25Gb2N1cywgdHJ1ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5vbktleVVwKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duKTtcbiAgICAvLyBkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25Cb2R5Q2xpY2spO1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLl9pZFBvb2wgPSAwO1xuICAgIHRoaXMuX3JlYWR5ID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgYXR0cmlidXRlcyB2YWx1ZXMuXG4gICAqL1xuICBwdWJsaWMgY2xlYXIgKCk6IHZvaWQge1xuICAgIHRoaXMuX3NlY3Rpb25zID0ge307XG4gICAgdGhpcy5fc2VjdGlvbkNvdW50ID0gMDtcbiAgICB0aGlzLl9kZWZhdWx0U2VjdGlvbklkID0gJyc7XG4gICAgdGhpcy5fbGFzdFNlY3Rpb25JZCA9ICcnO1xuICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgYSBsYXN0Rm9jdXNlZEVsZW1lbnQgYW5kIHByZXZpb3VzIGVsZW1lbnQgb2YgYSBzZWN0aW9uLlxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gc2VjdGlvbiB0byByZXNldFxuICAgKi9cbiAgcHVibGljIHJlc2V0IChzZWN0aW9uSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0ubGFzdEZvY3VzZWRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5wcmV2aW91cyA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBpZCBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5fc2VjdGlvbnNbaWRdO1xuICAgICAgICBzZWN0aW9uLmxhc3RGb2N1c2VkRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgc2VjdGlvbi5wcmV2aW91cyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb25maWd1cmF0aW9uIG9mIGEgc2VjdGlvbiBvciBzZXQgdGhlIGdsb2JhbCBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgLSBzZWN0aW9uIHRvIGNvbmZpZ3VyZSwgdW5kZWZpbmVkIHRvIHNldCB0aGUgZ2xvYmFsIGNvbmZpZ3VyYXRpb24uXG4gICAqIEBwYXJhbSBjb25maWcgLSBjb25maWd1cmF0aW9uXG4gICAqL1xuICBwdWJsaWMgc2V0IChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCwgY29uZmlnOiBDb25maWd1cmF0aW9uKTogYm9vbGVhbiB8IG5ldmVyIHtcbiAgICBjb25zdCBmaW5hbENvbmZpZyA9IHt9O1xuICAgIE9iamVjdC5hc3NpZ24oZmluYWxDb25maWcsIHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbik7XG4gICAgT2JqZWN0LmFzc2lnbihmaW5hbENvbmZpZywgY29uZmlnKTtcblxuICAgIGlmIChzZWN0aW9uSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCF0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU2VjdGlvbiBcIiR7c2VjdGlvbklkfVwiIGRvZXNuJ3QgZXhpc3QhYCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24gPSBmaW5hbENvbmZpZyBhcyBDb25maWd1cmF0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24gPSBmaW5hbENvbmZpZyBhcyBDb25maWd1cmF0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgLSBzZWN0aW9uIGlkIHRvIGFkZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gY29uZmlndXJhdGlvbiBvZiB0aGUgc2VjdGlvblxuICAgKiBAcmV0dXJucyBzZWN0aW9uSWRcbiAgICovXG4gIHB1YmxpYyBhZGQgKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkLCBjb25maWc6IENvbmZpZ3VyYXRpb24pOiBzdHJpbmcgfCBuZXZlciB7XG4gICAgaWYgKCFzZWN0aW9uSWQpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgc2VjdGlvbklkID0gdGhpcy5nZW5lcmF0ZUlkKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBhbHJlYWR5IGV4aXN0IWApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdID0ge1xuICAgICAgICBpZDogc2VjdGlvbklkLFxuICAgICAgICBjb25maWd1cmF0aW9uOiBkZWZhdWx0Q29uZmlndXJhdGlvbixcbiAgICAgICAgbGFzdEZvY3VzZWRFbGVtZW50OiB1bmRlZmluZWQsXG4gICAgICAgIHByZXZpb3VzOiB1bmRlZmluZWRcbiAgICAgIH07XG4gICAgfVxuICAgIGlmICh0aGlzLnNldChzZWN0aW9uSWQsIGNvbmZpZykpIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25Db3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gc2VjdGlvbklkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvbiB0byByZW1vdmVcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBzZWN0aW9uIGhhcyBiZWVuIHJlbW92ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIHJlbW92ZSAoc2VjdGlvbklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgaWYgKGRlbGV0ZSB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICAgIHRoaXMuX3NlY3Rpb25Db3VudC0tO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2xhc3RTZWN0aW9uSWQgPT09IHNlY3Rpb25JZCkge1xuICAgICAgICB0aGlzLl9sYXN0U2VjdGlvbklkID0gJyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGUgbmF2aWdhdGlvbiBvbiBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIGlkIG9mIHRoZSBzZWN0aW9uIHRvIGRpc2FibGVcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBzZWN0aW9uIGhhcyBiZWVuIGRpc2FibGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyBkaXNhYmxlIChzZWN0aW9uSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdICYmIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbikge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIG5hdmlnYXRpb24gb24gYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgLSBpZCBvZiB0aGUgc2VjdGlvbiB0byBlbmFibGVcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBzZWN0aW9uIGhhcyBiZWVuIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGVuYWJsZSAoc2VjdGlvbklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSAmJiB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24pIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXVzZSBuYXZpZ2F0aW9uXG4gICAqL1xuICBwdWJsaWMgcGF1c2UgKCk6IHZvaWQge1xuICAgIHRoaXMuX3BhdXNlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN1bWUgbmF2aWdhdGlvblxuICAgKi9cbiAgcHVibGljIHJlc3VtZSAoKTogdm9pZCB7XG4gICAgdGhpcy5fcGF1c2UgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyBhbiBlbGVtZW50XG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgdG8gZm9jdXMgKHNlY3Rpb24gaWQgb3Igc2VsZWN0b3IpLCAoYW4gZWxlbWVudCBvciBhIHNlY3Rpb24pXG4gICAqIEBwYXJhbSBzaWxlbnQgP1xuICAgKiBAcGFyYW0gZGlyZWN0aW9uIGluY29taW5nIGRpcmVjdGlvblxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGVsZW1lbnQgaGFzIGJlZW4gZm9jdXNlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgZm9jdXMgKGVsZW1lbnQ6IHN0cmluZywgc2lsZW50OiBib29sZWFuLCBkaXJlY3Rpb246IERpcmVjdGlvbik6IGJvb2xlYW4ge1xuICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICBjb25zdCBhdXRvUGF1c2UgPSAhdGhpcy5fcGF1c2UgJiYgc2lsZW50O1xuICAgIGlmIChhdXRvUGF1c2UpIHRoaXMucGF1c2UoKTtcblxuICAgIC8vIFRPIERPIC0gYWRkIGZvY3VzRXh0ZW5kZWRTZWxlY3RvciBhbmQgX2ZvY3VzRWxlbWVudCA/Pz9cbiAgICBpZiAodGhpcy5pc1NlY3Rpb24oZWxlbWVudCkpIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuZm9jdXNTZWN0aW9uKGVsZW1lbnQsIGRpcmVjdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuZm9jdXNFeHRlbmRlZFNlbGVjdG9yKGVsZW1lbnQsIGRpcmVjdGlvbiwgZmFsc2UpO1xuICAgIH1cblxuICAgIGlmIChhdXRvUGF1c2UpIHRoaXMucmVzdW1lKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlIHRvIGFub3RoZXIgZWxlbWVudFxuICAgKi9cbiAgcHVibGljIG1vdmUgKGRpcmVjdGlvbjogRGlyZWN0aW9uLCBzZWxlY3Rvcjogc3RyaW5nIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gICAgbGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChzZWxlY3Rvcikge1xuICAgICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICBpZiAoZWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICBlbGVtZW50ID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpWzBdIGFzIEhUTUxFbGVtZW50O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICB9XG5cbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChlbGVtZW50KTtcbiAgICBpZiAoIXNlY3Rpb25JZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHdpbGxtb3ZlUHJvcGVydGllcyA9IHtcbiAgICAgIGRpcmVjdGlvbixcbiAgICAgIHNlY3Rpb25JZCxcbiAgICAgIGNhdXNlOiAnYXBpJ1xuICAgIH07XG5cbiAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGVsZW1lbnQsICd3aWxsbW92ZScsIHdpbGxtb3ZlUHJvcGVydGllcywgdW5kZWZpbmVkKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mb2N1c05leHQoZGlyZWN0aW9uLCBlbGVtZW50LCBzZWN0aW9uSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1ha2UgYSBzZWN0aW9uIGZvY3VzYWJsZSAobW9yZSBwcmVjaXNlbHksIGFsbCBpdHMgZm9jdXNhYmxlIGNoaWxkcmVuIGFyZSBtYWRlIGZvY3VzYWJsZSlcbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvbiB0byBtYWtlIGZvY3VzYWJsZSwgdW5kZWZpbmVkIGlmIHlvdSB3YW50IHRvIG1ha2UgYWxsIHNlY3Rpb25zIGZvY3VzYWJsZVxuICAgKi9cbiAgcHVibGljIG1ha2VGb2N1c2FibGUgKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCB8IG5ldmVyIHtcbiAgICBpZiAoc2VjdGlvbklkKSB7XG4gICAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgICB0aGlzLmRvTWFrZUZvY3VzYWJsZSh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZWN0aW9uIFwiJHtzZWN0aW9uSWR9XCIgZG9lc24ndCBleGlzdCFgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbWFrZSBmb2N1c2FibGUgYWxsIHNlY3Rpb25zIChpbml0ID8pXG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICAgIHRoaXMuZG9NYWtlRm9jdXNhYmxlKHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBkZWZhdWx0IHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvbiB0byBzZXQgYXMgZGVmYXVsdFxuICAgKi9cbiAgcHVibGljIHNldERlZmF1bHRTZWN0aW9uIChzZWN0aW9uSWQ6IHN0cmluZyk6IHZvaWQgfCBuZXZlciB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fZGVmYXVsdFNlY3Rpb25JZCA9IHNlY3Rpb25JZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZWN0aW9uIFwiJHtzZWN0aW9uSWR9XCIgZG9lc24ndCBleGlzdCFgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgYW4gZWxlbWVudFxuICAgKi9cbiAgcHVibGljIGZvY3VzRWxlbWVudCAoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBuZXh0U2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQoZWxlbWVudCk7XG4gICAgaWYgKCFuZXh0U2VjdGlvbklkKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICBsZXQgZW50ZXJJbnRvTmV3U2VjdGlvbiA9IHRydWU7XG4gICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgY29uc3QgY3VycmVudFNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCk7XG4gICAgICBlbnRlckludG9OZXdTZWN0aW9uID0gbmV4dFNlY3Rpb25JZCA9PT0gY3VycmVudFNlY3Rpb25JZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNOYXZpZ2FibGUoZWxlbWVudCwgbmV4dFNlY3Rpb25JZCwgZmFsc2UpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZm9jdXNFbGVtZW50KGVsZW1lbnQsIG5leHRTZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24sIERpcmVjdGlvbi5VUCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyB0aGUgc2VjdGlvbiBvbmNlIGl0IGhhcyBiZWVuIG1vdW50ZWRcbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvbiB0byBmb2N1c1xuICAgKi9cbiAgcHVibGljIGZvY3VzT25Nb3VudGVkIChzZWN0aW9uSWQ6IHN0cmluZykge1xuICAgIHRoaXMuZm9jdXNPbk1vdW50ZWRTZWN0aW9ucy5wdXNoKHNlY3Rpb25JZCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgU3BhdGlhbCBOYXZpZ2F0aW9uIGlzIHdhaXRpbmcgdGhpcyBlbGVtZW50IHRvIGJlIG1vdW50ZWQgYmVmb3JlIGZvY3VzaW5nIGl0LlxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGNoZWNrXG4gICAqL1xuICBwdWJsaWMgaGFzQmVlbldhaXRpbmdGb3JNb3VudGVkIChzZWN0aW9uSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLmZvY3VzT25Nb3VudGVkU2VjdGlvbnMuaW5jbHVkZXMoc2VjdGlvbklkKSkge1xuICAgICAgdGhpcy5mb2N1c1NlY3Rpb24oc2VjdGlvbklkLCBEaXJlY3Rpb24uVVApO1xuICAgICAgdGhpcy5mb2N1c09uTW91bnRlZFNlY3Rpb25zID0gdGhpcy5mb2N1c09uTW91bnRlZFNlY3Rpb25zLmZpbHRlcigoZm9tcykgPT4gZm9tcyAhPT0gc2VjdGlvbklkKTtcbiAgICB9XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBQUklWQVRFIEZVTkNUSU9OU1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHVuaXF1ZSBpZCBmb3IgYSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIG5ldyBpZCBzZWN0aW9uXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlSWQgKCk6IHN0cmluZyB7XG4gICAgbGV0IGlkOiBzdHJpbmc7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlkID0gdGhpcy5JRF9QT09MX1BSRUZJWCArIFN0cmluZygrK3RoaXMuX2lkUG9vbCk7XG4gICAgICBpZiAoIXRoaXMuX3NlY3Rpb25zW2lkXSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQgKCk6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB7IGFjdGl2ZUVsZW1lbnQgfSA9IGRvY3VtZW50O1xuICAgIGlmIChhY3RpdmVFbGVtZW50ICYmIGFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIHJldHVybiBhY3RpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRlbmQgKG91dDogYW55LCAuLi5hcmdzOiBhbnkpIHtcbiAgICBvdXQgPSBvdXQgfHwge307XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIWFyZ3NbaV0pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBhcmdzW2ldKSB7XG4gICAgICAgIGlmIChhcmdzW2ldLmhhc093blByb3BlcnR5KGtleSkgJiYgYXJnc1tpXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBvdXRba2V5XSA9IGFyZ3NbaV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgcHJpdmF0ZSBleGNsdWRlIChlbGVtTGlzdDogYW55LCBleGNsdWRlZEVsZW06IGFueSkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShleGNsdWRlZEVsZW0pKSB7XG4gICAgICBleGNsdWRlZEVsZW0gPSBbZXhjbHVkZWRFbGVtXTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDAsIGluZGV4OyBpIDwgZXhjbHVkZWRFbGVtLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpbmRleCA9IGVsZW1MaXN0LmluZGV4T2YoZXhjbHVkZWRFbGVtW2ldKTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIGVsZW1MaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbGVtTGlzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBlbGVtZW50IGlzIG5hdmlnYWJsZVxuICAgKiBAcGFyYW0gZWxlbSBlbGVtZW50IHRvIGNoZWNrXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIGVsZW1lbnQncyBzZWN0aW9uXG4gICAqIEBwYXJhbSB2ZXJpZnlTZWN0aW9uU2VsZWN0b3IgaWYgdHJ1ZSwgY2hlY2sgdGhlIHNlY3Rpb24gc2VsZWN0b3JcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBlbGVtZW50IGlzIG5hdmlnYWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwcml2YXRlIGlzTmF2aWdhYmxlIChlbGVtOiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcsIHZlcmlmeVNlY3Rpb25TZWxlY3RvcjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIGlmICghZWxlbSB8fCAhc2VjdGlvbklkIHx8ICF0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdIHx8IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoKGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwKSB8fCBlbGVtLmhhc0F0dHJpYnV0ZSgnZGlzYWJsZWQnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodmVyaWZ5U2VjdGlvblNlbGVjdG9yICYmICF0aGlzLmNvcmUubWF0Y2hTZWxlY3RvcihlbGVtLCB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2VsZWN0b3IhKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLm5hdmlnYWJsZUZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5uYXZpZ2FibGVGaWx0ZXIhKGVsZW0sIHNlY3Rpb25JZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi5uYXZpZ2FibGVGaWx0ZXIgIT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24ubmF2aWdhYmxlRmlsdGVyIShlbGVtLCBzZWN0aW9uSWQpID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZWxlbWVudCdzIHNlY3Rpb24gaWRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudFxuICAgKiBAcmV0dXJucyB0aGUgZWxlbWVudCdzIHNlY3Rpb24gaWRcbiAgICovXG4gIHByaXZhdGUgZ2V0U2VjdGlvbklkIChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc2VjdGlvbnNFbGVtZW50czogYW55ID0ge307XG4gICAgZm9yIChjb25zdCBpZCBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgaWYgKCF0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCkge1xuICAgICAgICBjb25zdCBzZWN0aW9uRWxlbWVudCA9IHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmVsZW1lbnQ7XG4gICAgICAgIGlmIChzZWN0aW9uRWxlbWVudCkge1xuICAgICAgICAgIHNlY3Rpb25zRWxlbWVudHNbaWRdID0gc2VjdGlvbkVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLnNlbGVjdG9yICE9PSAnJyAmJiB0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5zZWxlY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50V2l0aFNlbGVjdG9yID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IoYFtkYXRhLXNlY3Rpb24taWQ9XCIke2lkfVwiXWApWzBdXG4gICAgICAgICAgICBpZiAoZWxlbWVudFdpdGhTZWxlY3Rvcikge1xuICAgICAgICAgICAgICBzZWN0aW9uc0VsZW1lbnRzW2lkXSA9IGVsZW1lbnRXaXRoU2VsZWN0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBhcmVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gZWxlbWVudDtcbiAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICBpZiAoT2JqZWN0LnZhbHVlcyhzZWN0aW9uc0VsZW1lbnRzKS5pbmRleE9mKHBhcmVudCkgPiAtMSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoc2VjdGlvbnNFbGVtZW50cykuZmluZCgoa2V5KSA9PiBzZWN0aW9uc0VsZW1lbnRzW2tleV0gPT09IHBhcmVudCk7XG4gICAgICB9XG4gICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbmF2aWdhYmxlIGVsZW1lbnRzIGludG8gYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb25cbiAgICovXG4gIHByaXZhdGUgZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzIChzZWN0aW9uSWQ6IHN0cmluZyk6IG5ldmVyW10ge1xuICAgIHJldHVybiB0aGlzLmNvcmUucGFyc2VTZWxlY3Rvcih0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2VsZWN0b3IhKVxuICAgICAgLmZpbHRlcigoZWxlbWVudCkgPT4gdGhpcy5pc05hdmlnYWJsZShlbGVtZW50LCBzZWN0aW9uSWQsIGZhbHNlKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBkZWZhdWx0IGVsZW1lbnQgb2YgYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb25cbiAgICogQHJldHVybnMgdGhlIGRlZmF1bHQgZWxlbWVudCBvZiBhIHNlY3Rpb24sIG51bGwgaWYgbm8gZGVmYXVsdCBlbGVtZW50IGZvdW5kXG4gICAqL1xuICBwcml2YXRlIGdldFNlY3Rpb25EZWZhdWx0RWxlbWVudCAoc2VjdGlvbklkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIGNvbnN0IHsgZGVmYXVsdEVsZW1lbnQgfSA9IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbjtcbiAgICBpZiAoIWRlZmF1bHRFbGVtZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihkZWZhdWx0RWxlbWVudCk7XG4gICAgLy8gY2hlY2sgZWFjaCBlbGVtZW50IHRvIHNlZSBpZiBpdCdzIG5hdmlnYWJsZSBhbmQgc3RvcCB3aGVuIG9uZSBoYXMgYmVlbiBmb3VuZFxuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgaWYgKHRoaXMuaXNOYXZpZ2FibGUoZWxlbWVudCwgc2VjdGlvbklkLCB0cnVlKSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsYXN0IGZvY3VzZWQgZWxlbWVudCBpbnRvIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIHRoZSBsYXN0IGZvY3VzZWQgZWxlbWVudCwgbnVsbCBpZiBubyBlbGVtZW50IGZvdW5kXG4gICAqL1xuICBwcml2YXRlIGdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQgKHNlY3Rpb25JZDogYW55KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB7IGxhc3RGb2N1c2VkRWxlbWVudCB9ID0gdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXTtcbiAgICBpZiAobGFzdEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBpZiAoIXRoaXMuaXNOYXZpZ2FibGUobGFzdEZvY3VzZWRFbGVtZW50LCBzZWN0aW9uSWQsIHRydWUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhc3RGb2N1c2VkRWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogZmlyZSBhbiBldmVudFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHNvdXJjZVxuICAgKiBAcGFyYW0gdHlwZSB0eXBlIG9mIGV2ZW50XG4gICAqIEBwYXJhbSBkZXRhaWxzID9cbiAgICogQHBhcmFtIGNhbmNlbGFibGUgdHJ1ZSBpZiBjYW5jZWxhYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBldmVudCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZGlzcGF0Y2hlZFxuICAgKi9cbiAgcHJpdmF0ZSBmaXJlRXZlbnQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbHM6IGFueSwgY2FuY2VsYWJsZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDQpIHtcbiAgICAgIGNhbmNlbGFibGUgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBldnQuaW5pdEN1c3RvbUV2ZW50KHRoaXMuRVZFTlRfUFJFRklYICsgdHlwZSwgdHJ1ZSwgY2FuY2VsYWJsZSwgZGV0YWlscyk7XG4gICAgcmV0dXJuIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIGZvY3VzIGFuZCBzY3JvbGwgb24gZWxlbWVudFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGZvY3VzXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb24gY29udGFpbmluZyB0aGUgZWxlbWVudFxuICAgKiBAcGFyYW0gZW50ZXJJbnRvTmV3U2VjdGlvbiB0cnVlIGlmIHdlIGVudGVyIGludG8gdGhlIHNlY3Rpb24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHJpdmF0ZSBmb2N1c05TY3JvbGwgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgZW50ZXJJbnRvTmV3U2VjdGlvbjogYm9vbGVhbik6IHZvaWQge1xuICAgIGxldCBzY3JvbGxPcHRpb25zID0gZW50ZXJJbnRvTmV3U2VjdGlvbiA/IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5zY3JvbGxPcHRpb25zXG4gICAgICA6IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5zY3JvbGxPcHRpb25zSW50b1NlY3Rpb247XG4gICAgLy8gaWYgbm8tc2Nyb2xsIGdpdmVuIGFzIHNjcm9sbE9wdGlvbnMsIHRoZW4gZm9jdXMgd2l0aG91dCBzY3JvbGxpbmdcbiAgICBpZiAoc2Nyb2xsT3B0aW9ucyA9PT0gJ25vLXNjcm9sbCcpIHtcbiAgICAgIGVsZW1lbnQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICAgIH0gZWxzZSBpZiAoc2Nyb2xsT3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9wdGlvbnMgIT09ICcnICYmICEoc2Nyb2xsT3B0aW9ucyBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgIGVsZW1lbnQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICAgICAgZWxlbWVudC5zY3JvbGxJbnRvVmlldyhzY3JvbGxPcHRpb25zIGFzIFNjcm9sbEludG9WaWV3T3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24pIHtcbiAgICAgIHNjcm9sbE9wdGlvbnMgPSBlbnRlckludG9OZXdTZWN0aW9uID8gdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnNjcm9sbE9wdGlvbnMgOiB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24uc2Nyb2xsT3B0aW9uc0ludG9TZWN0aW9uO1xuICAgICAgaWYgKHNjcm9sbE9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPcHRpb25zICE9PSAnJyAmJiBzY3JvbGxPcHRpb25zICE9PSAnbm8tc2Nyb2xsJykge1xuICAgICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICAgICAgZWxlbWVudC5zY3JvbGxJbnRvVmlldyhzY3JvbGxPcHRpb25zIGFzIFNjcm9sbEludG9WaWV3T3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbVxuICAgKiBAcGFyYW0gc2VjdGlvbklkXG4gICAqL1xuICBwcml2YXRlIGZvY3VzQ2hhbmdlZCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlY3Rpb25JZDogc3RyaW5nKSB7XG4gICAgbGV0IGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBzZWN0aW9uSWQ7XG4gICAgaWYgKCFpZCkge1xuICAgICAgaWQgPSB0aGlzLmdldFNlY3Rpb25JZChlbGVtZW50KTtcbiAgICB9XG4gICAgaWYgKGlkKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmxhc3RGb2N1c2VkRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLl9sYXN0U2VjdGlvbklkID0gc2VjdGlvbklkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2lsZW50Rm9jdXMgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgc2Nyb2xsSW50b05ld1NlY3Rpb246IGJvb2xlYW4pIHtcbiAgICBjb25zdCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQuYmx1cigpO1xuICAgIH1cbiAgICB0aGlzLmZvY3VzTlNjcm9sbChlbGVtZW50LCBzZWN0aW9uSWQsIHNjcm9sbEludG9OZXdTZWN0aW9uKTtcbiAgICB0aGlzLmZvY3VzQ2hhbmdlZChlbGVtZW50LCBzZWN0aW9uSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIGFuIGVsZW1lbnRcbiAgICogQHBhcmFtIGVsZW0gZWxlbWVudCB0byBmb2N1c1xuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBlbGVtZW50J3Mgc2VjdGlvblxuICAgKiBAcGFyYW0gZW50ZXJJbnRvTmV3U2VjdGlvbiB0cnVlIGlmIG5ldyBzZWN0aW9uIGlzIGZvY3VzZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIHNvdXJjZSBkaXJlY3Rpb25cbiAgICovXG4gIHByaXZhdGUgX2ZvY3VzRWxlbWVudCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlY3Rpb25JZDogc3RyaW5nLCBlbnRlckludG9OZXdTZWN0aW9uOiBib29sZWFuLCBkaXJlY3Rpb24/OiBEaXJlY3Rpb24pIHtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG5cbiAgICBpZiAodGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UpIHtcbiAgICAgIHRoaXMuc2lsZW50Rm9jdXMoZWxlbWVudCwgc2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLl9wYXVzZSkge1xuICAgICAgdGhpcy5zaWxlbnRGb2N1cyhlbGVtZW50LCBzZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24pO1xuICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHVuZm9jdXNQcm9wZXJ0aWVzID0ge1xuICAgICAgICBuZXh0RWxlbWVudDogZWxlbWVudCxcbiAgICAgICAgbmV4dFNlY3Rpb25JZDogc2VjdGlvbklkLFxuICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgIG5hdGl2ZTogZmFsc2VcbiAgICAgIH07XG4gICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ3dpbGx1bmZvY3VzJywgdW5mb2N1c1Byb3BlcnRpZXMsIHVuZGVmaW5lZCkpIHtcbiAgICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LmJsdXIoKTtcbiAgICAgIHRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ3VuZm9jdXNlZCcsIHVuZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgY29uc3QgZm9jdXNQcm9wZXJ0aWVzID0ge1xuICAgICAgcHJldmlvdXNFbGVtZW50OiBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICBzZWN0aW9uSWQsXG4gICAgICBkaXJlY3Rpb24sXG4gICAgICBuYXRpdmU6IGZhbHNlXG4gICAgfTtcbiAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGVsZW1lbnQsICd3aWxsZm9jdXMnLCBmb2N1c1Byb3BlcnRpZXMpKSB7XG4gICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmZvY3VzTlNjcm9sbChlbGVtZW50LCBzZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24pO1xuICAgIHRoaXMuZmlyZUV2ZW50KGVsZW1lbnQsICdmb2N1c2VkJywgZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG5cbiAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5mb2N1c0NoYW5nZWQoZWxlbWVudCwgc2VjdGlvbklkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBwcml2YXRlIGZvY3VzRXh0ZW5kZWRTZWxlY3RvciAoc2VsZWN0b3I6IHN0cmluZywgZGlyZWN0aW9uOiBEaXJlY3Rpb24sIGVudGVySW50b05ld1NlY3Rpb246IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBpZiAoc2VsZWN0b3IuY2hhckF0KDApID09PSAnQCcpIHtcbiAgICAgIGlmIChzZWxlY3Rvci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9jdXNTZWN0aW9uKHVuZGVmaW5lZCwgZGlyZWN0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNlY3Rpb25JZCA9IHNlbGVjdG9yLnN1YnN0cigxKTtcbiAgICAgIHJldHVybiB0aGlzLmZvY3VzU2VjdGlvbihzZWN0aW9uSWQsIGRpcmVjdGlvbik7XG4gICAgfVxuICAgIGNvbnN0IG5leHQgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihzZWxlY3RvcilbMF07XG4gICAgaWYgKG5leHQpIHtcbiAgICAgIGNvbnN0IG5leHRTZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChuZXh0KTtcbiAgICAgIGlmIChuZXh0U2VjdGlvbklkKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTmF2aWdhYmxlKG5leHQsIG5leHRTZWN0aW9uSWQsIGZhbHNlKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQobmV4dCwgbmV4dFNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbiwgZGlyZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGFkZFJhbmdlIChpZDogc3RyaW5nLCByYW5nZTogc3RyaW5nIFtdKSB7XG4gICAgaWYgKGlkICYmIHJhbmdlLmluZGV4T2YoaWQpIDwgMCAmJiB0aGlzLl9zZWN0aW9uc1tpZF0gJiYgIXRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkKSB7XG4gICAgICByYW5nZS5wdXNoKGlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb25cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBkaXJlY3Rpb25cbiAgICogQHJldHVybnMgdHJ1ZSBpZiBzZWN0aW9uIGhhcyBiZWVuIGZvY3VzZWRcbiAgICovXG4gIHByaXZhdGUgZm9jdXNTZWN0aW9uIChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCwgZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiBib29sZWFuIHtcbiAgICBjb25zdCByYW5nZTogc3RyaW5nIFtdID0gW107XG5cbiAgICBpZiAoc2VjdGlvbklkKSB7XG4gICAgICB0aGlzLmFkZFJhbmdlKHNlY3Rpb25JZCwgcmFuZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFkZFJhbmdlKHRoaXMuX2RlZmF1bHRTZWN0aW9uSWQsIHJhbmdlKTtcbiAgICAgIHRoaXMuYWRkUmFuZ2UodGhpcy5fbGFzdFNlY3Rpb25JZCwgcmFuZ2UpO1xuICAgICAgZm9yIChjb25zdCBzZWN0aW9uIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICAgIHRoaXMuYWRkUmFuZ2Uoc2VjdGlvbiwgcmFuZ2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGlkID0gcmFuZ2VbaV07XG4gICAgICBsZXQgbmV4dDtcblxuICAgICAgaWYgKHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmVudGVyVG8gPT09ICdsYXN0LWZvY3VzZWQnKSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25EZWZhdWx0RWxlbWVudChpZClcbiAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKGlkKVswXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmdldFNlY3Rpb25EZWZhdWx0RWxlbWVudChpZClcbiAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbkxhc3RGb2N1c2VkRWxlbWVudChpZClcbiAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKGlkKVswXTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvY3VzRWxlbWVudChuZXh0LCBpZCwgdHJ1ZSwgZGlyZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpcmUgZXZlbnQgd2hlbiBuYXZpZ2F0ZSBoYXMgZmFpbGVkXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgc291cmNlXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gZGlyZWN0aW9uIHNvdXJjZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGV2ZW50IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSByYWlzZWRcbiAgICovXG4gIHByaXZhdGUgZmlyZU5hdmlnYXRlRmFpbGVkIChlbGVtZW50OiBIVE1MRWxlbWVudCwgZGlyZWN0aW9uOiBEaXJlY3Rpb24pIHtcbiAgICByZXR1cm4gdGhpcy5maXJlRXZlbnQoZWxlbWVudCwgJ25hdmlnYXRlZmFpbGVkJywge1xuICAgICAgZGlyZWN0aW9uXG4gICAgfSwgZmFsc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBnb1RvTGVhdmVGb3IgKHNlY3Rpb25JZDogc3RyaW5nLCBkaXJlY3Rpb246IERpcmVjdGlvbikge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubGVhdmVGb3JcbiAgICAgICYmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubGVhdmVGb3IgYXMgYW55KVtkaXJlY3Rpb250b1N0cmluZyhkaXJlY3Rpb24pXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXh0ID0gKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5sZWF2ZUZvciBhcyBhbnkpW2RpcmVjdGlvbnRvU3RyaW5nKGRpcmVjdGlvbildO1xuICAgICAgaWYgKG5leHQgPT09ICcnIHx8IG5leHQgPT09ICdub3doZXJlJykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmZvY3VzRXh0ZW5kZWRTZWxlY3RvcihuZXh0LCBkaXJlY3Rpb24sIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgbmV4dCBlbGVtZW50XG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gc291cmNlIGRpcmVjdGlvblxuICAgKiBAcGFyYW0gY3VycmVudEZvY3VzZWRFbGVtZW50IGN1cnJlbnQgZm9jdXNlZCBlbGVtZW50XG4gICAqIEBwYXJhbSBjdXJyZW50U2VjdGlvbklkIGN1cnJlbnQgc2VjdGlvbiBpZFxuICAgKiBAcmV0dXJucyB0cnVlIGlmIG5leHQgaGFzIGJlZW4gZm9jdXNlZCBzdWNjZXNzZnVsbHlcbiAgICovXG4gIHByaXZhdGUgZm9jdXNOZXh0IChkaXJlY3Rpb246IERpcmVjdGlvbiwgY3VycmVudEZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCwgY3VycmVudFNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZXh0U2VsZWN0b3IgPSBjdXJyZW50Rm9jdXNlZEVsZW1lbnQuZ2V0QXR0cmlidXRlKGBkYXRhLXNuLSR7ZGlyZWN0aW9ufWApO1xuXG4gICAgLy8gVE8gRE8gcmVtb3ZlIHR5cGVvZlxuICAgIGlmICh0eXBlb2YgZXh0U2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoZXh0U2VsZWN0b3IgPT09ICcnXG4gICAgICAgICAgfHwgIXRoaXMuZm9jdXNFeHRlbmRlZFNlbGVjdG9yKGV4dFNlbGVjdG9yLCBkaXJlY3Rpb24sIGZhbHNlKSkgeyAvLyB3aGhpY2ggdmFsdWUgZm9yIGVudGVySW50b05ld1NlY3Rpb24gPyB0cnVlIG9yIGZhbHNlID8/P1xuICAgICAgICB0aGlzLmZpcmVOYXZpZ2F0ZUZhaWxlZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsIGRpcmVjdGlvbik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb25OYXZpZ2FibGVFbGVtZW50czogYW55ID0ge307XG4gICAgbGV0IGFsbE5hdmlnYWJsZUVsZW1lbnRzOiBhbnkgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICBzZWN0aW9uTmF2aWdhYmxlRWxlbWVudHNbaWRdID0gdGhpcy5nZXRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMoaWQpIGFzIEhUTUxFbGVtZW50W107XG4gICAgICBhbGxOYXZpZ2FibGVFbGVtZW50cyA9IGFsbE5hdmlnYWJsZUVsZW1lbnRzLmNvbmNhdChzZWN0aW9uTmF2aWdhYmxlRWxlbWVudHNbaWRdKTtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBjb25maWc6IENvbmZpZ3VyYXRpb24gPSB0aGlzLmV4dGVuZCh7fSwgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLCB0aGlzLl9zZWN0aW9uc1tjdXJyZW50U2VjdGlvbklkXS5jb25maWd1cmF0aW9uKTtcbiAgICBsZXQgbmV4dDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIGNvbnN0IGN1cnJlbnRTZWN0aW9uID0gdGhpcy5fc2VjdGlvbnNbY3VycmVudFNlY3Rpb25JZF07XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24uY29uZmlndXJhdGlvbi5yZXN0cmljdCA9PT0gJ3NlbGYtb25seScgfHwgY3VycmVudFNlY3Rpb24uY29uZmlndXJhdGlvbi5yZXN0cmljdCA9PT0gJ3NlbGYtZmlyc3QnKSB7XG4gICAgICBjb25zdCBjdXJyZW50U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzID0gc2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzW2N1cnJlbnRTZWN0aW9uSWRdO1xuXG4gICAgICBuZXh0ID0gdGhpcy5jb3JlLm5hdmlnYXRlKFxuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgdGhpcy5leGNsdWRlKGN1cnJlbnRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMsIGN1cnJlbnRGb2N1c2VkRWxlbWVudCksXG4gICAgICAgIGN1cnJlbnRTZWN0aW9uXG4gICAgICApO1xuXG4gICAgICBpZiAoIW5leHQgJiYgY3VycmVudFNlY3Rpb24uY29uZmlndXJhdGlvbi5yZXN0cmljdCA9PT0gJ3NlbGYtZmlyc3QnKSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmNvcmUubmF2aWdhdGUoXG4gICAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgICB0aGlzLmV4Y2x1ZGUoYWxsTmF2aWdhYmxlRWxlbWVudHMsIGN1cnJlbnRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMpLFxuICAgICAgICAgIGN1cnJlbnRTZWN0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQgPSB0aGlzLmNvcmUubmF2aWdhdGUoXG4gICAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCxcbiAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICB0aGlzLmV4Y2x1ZGUoYWxsTmF2aWdhYmxlRWxlbWVudHMsIGN1cnJlbnRGb2N1c2VkRWxlbWVudCksXG4gICAgICAgIGN1cnJlbnRTZWN0aW9uXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChuZXh0KSB7XG4gICAgICBjdXJyZW50U2VjdGlvbi5wcmV2aW91cyA9IHtcbiAgICAgICAgdGFyZ2V0OiBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBuZXh0LFxuICAgICAgICByZXZlcnNlOiBnZXRSZXZlcnNlRGlyZWN0aW9uKGRpcmVjdGlvbilcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG5leHRTZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0U2VjdGlvbklkKG5leHQpO1xuICAgICAgbGV0IGVudGVySW50b05ld1NlY3Rpb24gPSBmYWxzZTtcbiAgICAgIGlmIChjdXJyZW50U2VjdGlvbklkICE9PSBuZXh0U2VjdGlvbklkICYmIG5leHRTZWN0aW9uSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBXZSBlbnRlciBpbnRvIGFub3RoZXIgc2VjdGlvblxuICAgICAgICBlbnRlckludG9OZXdTZWN0aW9uID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBib29sZWFuIHwgbnVsbCA9IHRoaXMuZ29Ub0xlYXZlRm9yKGN1cnJlbnRTZWN0aW9uSWQsIGRpcmVjdGlvbik7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5maXJlTmF2aWdhdGVGYWlsZWQoY3VycmVudEZvY3VzZWRFbGVtZW50LCBkaXJlY3Rpb24pO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBlbnRlclRvRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgc3dpdGNoICh0aGlzLl9zZWN0aW9uc1tuZXh0U2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmVudGVyVG8pIHtcbiAgICAgICAgICBjYXNlICdsYXN0LWZvY3VzZWQnOlxuICAgICAgICAgICAgZW50ZXJUb0VsZW1lbnQgPSB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQobmV4dFNlY3Rpb25JZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQobmV4dFNlY3Rpb25JZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdkZWZhdWx0LWVsZW1lbnQnOlxuICAgICAgICAgICAgZW50ZXJUb0VsZW1lbnQgPSB0aGlzLmdldFNlY3Rpb25EZWZhdWx0RWxlbWVudChuZXh0U2VjdGlvbklkKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW50ZXJUb0VsZW1lbnQpIHtcbiAgICAgICAgICBuZXh0ID0gZW50ZXJUb0VsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5leHRTZWN0aW9uSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvY3VzRWxlbWVudChuZXh0LCBuZXh0U2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uLCBkaXJlY3Rpb24pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5nb1RvTGVhdmVGb3IoY3VycmVudFNlY3Rpb25JZCwgZGlyZWN0aW9uKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRoaXMuZmlyZU5hdmlnYXRlRmFpbGVkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgZGlyZWN0aW9uKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHByZXZlbnREZWZhdWx0IChldnQ6IEV2ZW50KTogYm9vbGVhbiB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgb25LZXlEb3duIChldnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fdGhyb3R0bGUpIHtcbiAgICAgIHRoaXMucHJldmVudERlZmF1bHQoZXZ0KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLl90aHJvdHRsZSA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX3Rocm90dGxlID0gbnVsbDtcbiAgICB9LCB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24udGhyb3R0bGUpO1xuXG4gICAgaWYgKCF0aGlzLl9zZWN0aW9uQ291bnQgfHwgdGhpcy5fcGF1c2VcbiAgICAgIHx8IGV2dC5hbHRLZXkgfHwgZXZ0LmN0cmxLZXkgfHwgZXZ0Lm1ldGFLZXkgfHwgZXZ0LnNoaWZ0S2V5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGN1cnJlbnRGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSBldnQua2V5Q29kZSBhcyB1bmtub3duIGFzIERpcmVjdGlvbjtcbiAgICBpZiAoIWRpcmVjdGlvbikge1xuICAgICAgaWYgKGV2dC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgICAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50ICYmIHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ2VudGVyLWRvd24nLCB1bmRlZmluZWQsIHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcblxuICAgIGlmICghY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBpZiAodGhpcy5fbGFzdFNlY3Rpb25JZCkge1xuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQodGhpcy5fbGFzdFNlY3Rpb25JZCk7XG4gICAgICB9XG4gICAgICBpZiAoIWN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgICB0aGlzLmZvY3VzU2VjdGlvbih1bmRlZmluZWQsIGRpcmVjdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCk7XG4gICAgaWYgKCFjdXJyZW50U2VjdGlvbklkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lsbG1vdmVQcm9wZXJ0aWVzID0ge1xuICAgICAgZGlyZWN0aW9uLFxuICAgICAgc2VjdGlvbklkOiBjdXJyZW50U2VjdGlvbklkLFxuICAgICAgY2F1c2U6ICdrZXlkb3duJ1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5maXJlRXZlbnQoY3VycmVudEZvY3VzZWRFbGVtZW50LCAnd2lsbG1vdmUnLCB3aWxsbW92ZVByb3BlcnRpZXMpKSB7XG4gICAgICB0aGlzLmZvY3VzTmV4dChkaXJlY3Rpb24sIGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgY3VycmVudFNlY3Rpb25JZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucHJldmVudERlZmF1bHQoZXZ0KTtcbiAgfVxuXG4gIHByaXZhdGUgb25LZXlVcCAoZXZ0OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgaWYgKGV2dC5hbHRLZXkgfHwgZXZ0LmN0cmxLZXkgfHwgZXZ0Lm1ldGFLZXkgfHwgZXZ0LnNoaWZ0S2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdGhpcy5fcGF1c2UgJiYgdGhpcy5fc2VjdGlvbkNvdW50ICYmIGV2dC5rZXlDb2RlID09PSAxMykge1xuICAgICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgIGlmIChjdXJyZW50Rm9jdXNlZEVsZW1lbnQgJiYgdGhpcy5nZXRTZWN0aW9uSWQoY3VycmVudEZvY3VzZWRFbGVtZW50KSkge1xuICAgICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ2VudGVyLXVwJywgdW5kZWZpbmVkLCB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkZvY3VzIChldnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgeyB0YXJnZXQgfSA9IGV2dDtcbiAgICBjb25zdCBodG1sVGFyZ2V0OiBIVE1MRWxlbWVudCA9IHRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0ICE9PSB3aW5kb3cgJiYgdGFyZ2V0ICE9PSBkb2N1bWVudFxuICAgICAgJiYgdGhpcy5fc2VjdGlvbkNvdW50ICYmICF0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSAmJiB0YXJnZXQpIHtcbiAgICAgIGNvbnN0IHNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGh0bWxUYXJnZXQpO1xuICAgICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgICBpZiAodGhpcy5fcGF1c2UpIHtcbiAgICAgICAgICB0aGlzLmZvY3VzQ2hhbmdlZChodG1sVGFyZ2V0LCBzZWN0aW9uSWQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvY3VzUHJvcGVydGllcyA9IHtcbiAgICAgICAgICBzZWN0aW9uSWQsXG4gICAgICAgICAgbmF0aXZlOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChodG1sVGFyZ2V0LCAnd2lsbGZvY3VzJywgZm9jdXNQcm9wZXJ0aWVzKSkge1xuICAgICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICBodG1sVGFyZ2V0LmJsdXIoKTtcbiAgICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZmlyZUV2ZW50KGh0bWxUYXJnZXQsICdmb2N1c2VkJywgZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5mb2N1c0NoYW5nZWQoaHRtbFRhcmdldCwgc2VjdGlvbklkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25CbHVyIChldnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgdGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwgPSBldnQudGFyZ2V0O1xuICAgIGNvbnN0IGh0bWxUYXJnZXQ6IEhUTUxFbGVtZW50ID0gdGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIGlmICh0YXJnZXQgIT09IHdpbmRvdyAmJiB0YXJnZXQgIT09IGRvY3VtZW50ICYmICF0aGlzLl9wYXVzZVxuICAgICAgJiYgdGhpcy5fc2VjdGlvbkNvdW50ICYmICF0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSAmJiB0aGlzLmdldFNlY3Rpb25JZChodG1sVGFyZ2V0KSkge1xuICAgICAgY29uc3QgdW5mb2N1c1Byb3BlcnRpZXMgPSB7XG4gICAgICAgIG5hdGl2ZTogdHJ1ZVxuICAgICAgfTtcbiAgICAgIGlmICghdGhpcy5maXJlRXZlbnQoaHRtbFRhcmdldCwgJ3dpbGx1bmZvY3VzJywgdW5mb2N1c1Byb3BlcnRpZXMpKSB7XG4gICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaHRtbFRhcmdldC5mb2N1cygpO1xuICAgICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5maXJlRXZlbnQoaHRtbFRhcmdldCwgJ3VuZm9jdXNlZCcsIHVuZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc1NlY3Rpb24gKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgcmV0dXJuIHNlY3Rpb25JZCBpbiB0aGlzLl9zZWN0aW9ucztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIFRPIFJFTU9WRSA/Pz9cbiAgcHJpdmF0ZSBvbkJvZHlDbGljayAoKSB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3RoaXMuX2xhc3RTZWN0aW9uSWRdKSB7XG4gICAgICBjb25zdCBsYXN0Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9zZWN0aW9uc1t0aGlzLl9sYXN0U2VjdGlvbklkXS5sYXN0Rm9jdXNlZEVsZW1lbnQ7XG4gICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gZG9jdW1lbnQuYm9keSAmJiB0aGlzLl9sYXN0U2VjdGlvbklkXG4gICAgICAgICYmIGxhc3RGb2N1c2VkRWxlbWVudCkge1xuICAgICAgICB0aGlzLl9mb2N1c0VsZW1lbnQobGFzdEZvY3VzZWRFbGVtZW50LCB0aGlzLl9sYXN0U2VjdGlvbklkLCB0cnVlLCB1bmRlZmluZWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlIGZvY3VzYWJsZSBlbGVtZW50cyBvZiBhIHNlY3Rpb24uXG4gICAqIEBwYXJhbSBjb25maWd1cmF0aW9uIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNlY3Rpb24gdG8gbWFsZSBmb2N1c2FibGUgP1xuICAgKi9cbiAgcHJpdmF0ZSBkb01ha2VGb2N1c2FibGUgKGNvbmZpZ3VyYXRpb246IENvbmZpZ3VyYXRpb24pOiB2b2lkIHtcbiAgICBsZXQgdGFiSW5kZXhJZ25vcmVMaXN0OiBzdHJpbmc7XG4gICAgaWYgKGNvbmZpZ3VyYXRpb24udGFiSW5kZXhJZ25vcmVMaXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhYkluZGV4SWdub3JlTGlzdCA9IGNvbmZpZ3VyYXRpb24udGFiSW5kZXhJZ25vcmVMaXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWJJbmRleElnbm9yZUxpc3QgPSB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24udGFiSW5kZXhJZ25vcmVMaXN0ITtcbiAgICB9XG5cbiAgICB0aGlzLmNvcmUucGFyc2VTZWxlY3Rvcihjb25maWd1cmF0aW9uLnNlbGVjdG9yISkuZm9yRWFjaCgoZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgIGlmICghdGhpcy5jb3JlLm1hdGNoU2VsZWN0b3IoZWxlbWVudCwgdGFiSW5kZXhJZ25vcmVMaXN0KSkge1xuICAgICAgICBjb25zdCBodG1sRWxlbWVudCA9IGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmICghaHRtbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgLy8gc2V0IHRoZSB0YWJpbmRleCB3aXRoIGEgbmVnYXRpdmUgdmFsdWUuIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvR2xvYmFsX2F0dHJpYnV0ZXMvdGFiaW5kZXhcbiAgICAgICAgICBodG1sRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG59XG5cbmNvbnN0IHNuID0gQ29tcGFzcy5nZXRJbnN0YW5jZSgpO1xuZXhwb3J0IHsgQ29tcGFzcywgc24gfTtcbiJdfQ==