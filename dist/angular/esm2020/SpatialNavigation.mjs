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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3BhdGlhbE5hdmlnYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvU3BhdGlhbE5hdmlnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFRLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNwQyxPQUFPLEVBQWlCLG9CQUFvQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBR3RGLE1BQU0saUJBQWlCO0lBQXZCO1FBRVUsV0FBTSxHQUFZLEtBQUssQ0FBQztRQUN4QixZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLGNBQVMsR0FBZ0MsRUFBRSxDQUFDO1FBQzVDLGtCQUFhLEdBQVcsQ0FBQyxDQUFDO1FBQzFCLHNCQUFpQixHQUFXLEVBQUUsQ0FBQztRQUMvQixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUM1Qix1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFDcEMsd0JBQW1CLEdBQWtCLG9CQUFvQixDQUFDO1FBQzFELFdBQU0sR0FBWSxLQUFLLENBQUM7UUFDeEIsU0FBSSxHQUFTLElBQUksQ0FBQztRQUNULG1CQUFjLEdBQUcsVUFBVSxDQUFDO1FBQzVCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzlCLDJCQUFzQixHQUFhLEVBQUUsQ0FBQztRQUN0QyxjQUFTLEdBQWtCLElBQUksQ0FBQztRQXk3QnhDLGFBQWE7SUFDZixDQUFDO0lBeDdCUSxNQUFNLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFO1lBQy9CLGlCQUFpQixDQUFDLFFBQVEsR0FBRyxJQUFJLGlCQUFpQixFQUFFLENBQUM7U0FDdEQ7UUFDRCxPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztJQUNwQyxDQUFDO0lBRUQsMkJBQTJCO0lBRTNCOztPQUVHO0lBQ0ksSUFB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fSBmcm9tICcuL0NvcmUnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGVmYXVsdENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL3R5cGVzL0NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgRGlyZWN0aW9uLCBkaXJlY3Rpb250b1N0cmluZywgZ2V0UmV2ZXJzZURpcmVjdGlvbiB9IGZyb20gJy4vdHlwZXMvRGlyZWN0aW9uJztcbmltcG9ydCB7IFNlY3Rpb24gfSBmcm9tICcuL3R5cGVzL1NlY3Rpb24nO1xuXG5jbGFzcyBTcGF0aWFsTmF2aWdhdGlvbiB7XG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBTcGF0aWFsTmF2aWdhdGlvbjtcbiAgcHJpdmF0ZSBfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfaWRQb29sOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIF9zZWN0aW9uczogeyBba2V5OiBzdHJpbmddOiBTZWN0aW9uOyB9ID0ge307XG4gIHByaXZhdGUgX3NlY3Rpb25Db3VudDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBfZGVmYXVsdFNlY3Rpb25JZDogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX2xhc3RTZWN0aW9uSWQ6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF9kdXJpbmdGb2N1c0NoYW5nZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGdsb2JhbENvbmZpZ3VyYXRpb246IENvbmZpZ3VyYXRpb24gPSBkZWZhdWx0Q29uZmlndXJhdGlvbjtcbiAgcHJpdmF0ZSBfcGF1c2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBjb3JlOiBDb3JlID0gY29yZTtcbiAgcHJpdmF0ZSByZWFkb25seSBJRF9QT09MX1BSRUZJWCA9ICdzZWN0aW9uLSc7XG4gIHByaXZhdGUgcmVhZG9ubHkgRVZFTlRfUFJFRklYID0gJ3NuOic7XG4gIHByaXZhdGUgZm9jdXNPbk1vdW50ZWRTZWN0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBfdGhyb3R0bGU6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UgKCk6IFNwYXRpYWxOYXZpZ2F0aW9uIHtcbiAgICBpZiAoIVNwYXRpYWxOYXZpZ2F0aW9uLmluc3RhbmNlKSB7XG4gICAgICBTcGF0aWFsTmF2aWdhdGlvbi5pbnN0YW5jZSA9IG5ldyBTcGF0aWFsTmF2aWdhdGlvbigpO1xuICAgIH1cbiAgICByZXR1cm4gU3BhdGlhbE5hdmlnYXRpb24uaW5zdGFuY2U7XG4gIH1cblxuICAvLyAjcmVnaW9uIFBVQkxJQyBGVU5DVElPTlNcblxuICAvKipcbiAgICogSW5pdCBsaXN0ZW5lcnNcbiAgICovXG4gIHB1YmxpYyBpbml0ICgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX3JlYWR5KSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duLmJpbmQodGhpcykpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5vbktleVVwLmJpbmQodGhpcykpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5vbkZvY3VzLmJpbmQodGhpcyksIHRydWUpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLm9uQmx1ci5iaW5kKHRoaXMpLCB0cnVlKTtcbiAgICAgIC8vIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkJvZHlDbGljayk7XG4gICAgICB0aGlzLl9yZWFkeSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBsaXN0ZW5lcnMgYW5kIHJlaW5pdGlhbGl6ZSBTcGF0aWFsTmF2aWdhdGlvbiBhdHRyaWJ1dGVzLlxuICAgKi9cbiAgcHVibGljIHVuaW5pdCAoKTogdm9pZCB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLm9uQmx1ciwgdHJ1ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5vbkZvY3VzLCB0cnVlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXApO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd24pO1xuICAgIC8vIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkJvZHlDbGljayk7XG4gICAgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMuX2lkUG9vbCA9IDA7XG4gICAgdGhpcy5fcmVhZHkgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBhdHRyaWJ1dGVzIHZhbHVlcy5cbiAgICovXG4gIHB1YmxpYyBjbGVhciAoKTogdm9pZCB7XG4gICAgdGhpcy5fc2VjdGlvbnMgPSB7fTtcbiAgICB0aGlzLl9zZWN0aW9uQ291bnQgPSAwO1xuICAgIHRoaXMuX2RlZmF1bHRTZWN0aW9uSWQgPSAnJztcbiAgICB0aGlzLl9sYXN0U2VjdGlvbklkID0gJyc7XG4gICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBhIGxhc3RGb2N1c2VkRWxlbWVudCBhbmQgcHJldmlvdXMgZWxlbWVudCBvZiBhIHNlY3Rpb24uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgLSBzZWN0aW9uIHRvIHJlc2V0XG4gICAqL1xuICBwdWJsaWMgcmVzZXQgKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5sYXN0Rm9jdXNlZEVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLnByZXZpb3VzID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLl9zZWN0aW9uc1tpZF07XG4gICAgICAgIHNlY3Rpb24ubGFzdEZvY3VzZWRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICBzZWN0aW9uLnByZXZpb3VzID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbmZpZ3VyYXRpb24gb2YgYSBzZWN0aW9uIG9yIHNldCB0aGUgZ2xvYmFsIGNvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIHNlY3Rpb24gdG8gY29uZmlndXJlLCB1bmRlZmluZWQgdG8gc2V0IHRoZSBnbG9iYWwgY29uZmlndXJhdGlvbi5cbiAgICogQHBhcmFtIGNvbmZpZyAtIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIHB1YmxpYyBzZXQgKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkLCBjb25maWc6IENvbmZpZ3VyYXRpb24pOiBib29sZWFuIHwgbmV2ZXIge1xuICAgIGNvbnN0IGZpbmFsQ29uZmlnID0ge307XG4gICAgT2JqZWN0LmFzc2lnbihmaW5hbENvbmZpZywgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uKTtcbiAgICBPYmplY3QuYXNzaWduKGZpbmFsQ29uZmlnLCBjb25maWcpO1xuXG4gICAgaWYgKHNlY3Rpb25JZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoIXRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZWN0aW9uIFwiJHtzZWN0aW9uSWR9XCIgZG9lc24ndCBleGlzdCFgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbiA9IGZpbmFsQ29uZmlnIGFzIENvbmZpZ3VyYXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbiA9IGZpbmFsQ29uZmlnIGFzIENvbmZpZ3VyYXRpb247XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIHNlY3Rpb24gaWQgdG8gYWRkXG4gICAqIEBwYXJhbSBjb25maWcgLSBjb25maWd1cmF0aW9uIG9mIHRoZSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIHNlY3Rpb25JZFxuICAgKi9cbiAgcHVibGljIGFkZCAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGNvbmZpZzogQ29uZmlndXJhdGlvbik6IHN0cmluZyB8IG5ldmVyIHtcbiAgICBpZiAoIXNlY3Rpb25JZCkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICBzZWN0aW9uSWQgPSB0aGlzLmdlbmVyYXRlSWQoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2VjdGlvbiBcIiR7c2VjdGlvbklkfVwiIGFscmVhZHkgZXhpc3QhYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gPSB7XG4gICAgICAgIGlkOiBzZWN0aW9uSWQsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246IGRlZmF1bHRDb25maWd1cmF0aW9uLFxuICAgICAgICBsYXN0Rm9jdXNlZEVsZW1lbnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgcHJldmlvdXM6IHVuZGVmaW5lZFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2V0KHNlY3Rpb25JZCwgY29uZmlnKSkge1xuICAgICAgdGhpcy5fc2VjdGlvbkNvdW50Kys7XG4gICAgfVxuICAgIHJldHVybiBzZWN0aW9uSWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIHJlbW92ZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHNlY3Rpb24gaGFzIGJlZW4gcmVtb3ZlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlIChzZWN0aW9uSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICBpZiAoZGVsZXRlIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgICAgdGhpcy5fc2VjdGlvbkNvdW50LS07XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fbGFzdFNlY3Rpb25JZCA9PT0gc2VjdGlvbklkKSB7XG4gICAgICAgIHRoaXMuX2xhc3RTZWN0aW9uSWQgPSAnJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZSBuYXZpZ2F0aW9uIG9uIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gaWQgb2YgdGhlIHNlY3Rpb24gdG8gZGlzYWJsZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHNlY3Rpb24gaGFzIGJlZW4gZGlzYWJsZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGRpc2FibGUgKHNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gJiYgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgbmF2aWdhdGlvbiBvbiBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIGlkIG9mIHRoZSBzZWN0aW9uIHRvIGVuYWJsZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIHNlY3Rpb24gaGFzIGJlZW4gZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgZW5hYmxlIChzZWN0aW9uSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdICYmIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbikge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhdXNlIG5hdmlnYXRpb25cbiAgICovXG4gIHB1YmxpYyBwYXVzZSAoKTogdm9pZCB7XG4gICAgdGhpcy5fcGF1c2UgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3VtZSBuYXZpZ2F0aW9uXG4gICAqL1xuICBwdWJsaWMgcmVzdW1lICgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXVzZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIGFuIGVsZW1lbnRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBmb2N1cyAoc2VjdGlvbiBpZCBvciBzZWxlY3RvciksIChhbiBlbGVtZW50IG9yIGEgc2VjdGlvbilcbiAgICogQHBhcmFtIHNpbGVudCA/XG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gaW5jb21pbmcgZGlyZWN0aW9uXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZWxlbWVudCBoYXMgYmVlbiBmb2N1c2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyBmb2N1cyAoZWxlbWVudDogc3RyaW5nLCBzaWxlbnQ6IGJvb2xlYW4sIGRpcmVjdGlvbjogRGlyZWN0aW9uKTogYm9vbGVhbiB7XG4gICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuICAgIGNvbnN0IGF1dG9QYXVzZSA9ICF0aGlzLl9wYXVzZSAmJiBzaWxlbnQ7XG4gICAgaWYgKGF1dG9QYXVzZSkgdGhpcy5wYXVzZSgpO1xuXG4gICAgLy8gVE8gRE8gLSBhZGQgZm9jdXNFeHRlbmRlZFNlbGVjdG9yIGFuZCBfZm9jdXNFbGVtZW50ID8/P1xuICAgIGlmICh0aGlzLmlzU2VjdGlvbihlbGVtZW50KSkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5mb2N1c1NlY3Rpb24oZWxlbWVudCwgZGlyZWN0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gdGhpcy5mb2N1c0V4dGVuZGVkU2VsZWN0b3IoZWxlbWVudCwgZGlyZWN0aW9uLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9QYXVzZSkgdGhpcy5yZXN1bWUoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIE1vdmUgdG8gYW5vdGhlciBlbGVtZW50XG4gICAqL1xuICBwdWJsaWMgbW92ZSAoZGlyZWN0aW9uOiBEaXJlY3Rpb24sIHNlbGVjdG9yOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgICBsZXQgZWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHNlbGVjdG9yKSB7XG4gICAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGVsZW1lbnQgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihzZWxlY3RvcilbMF0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgIH1cblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGVsZW1lbnQpO1xuICAgIGlmICghc2VjdGlvbklkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lsbG1vdmVQcm9wZXJ0aWVzID0ge1xuICAgICAgZGlyZWN0aW9uLFxuICAgICAgc2VjdGlvbklkLFxuICAgICAgY2F1c2U6ICdhcGknXG4gICAgfTtcblxuICAgIGlmICghdGhpcy5maXJlRXZlbnQoZWxlbWVudCwgJ3dpbGxtb3ZlJywgd2lsbG1vdmVQcm9wZXJ0aWVzLCB1bmRlZmluZWQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvY3VzTmV4dChkaXJlY3Rpb24sIGVsZW1lbnQsIHNlY3Rpb25JZCk7XG4gIH1cblxuICAvKipcbiAgICogTWFrZSBhIHNlY3Rpb24gZm9jdXNhYmxlIChtb3JlIHByZWNpc2VseSwgYWxsIGl0cyBmb2N1c2FibGUgY2hpbGRyZW4gYXJlIG1hZGUgZm9jdXNhYmxlKVxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIG1ha2UgZm9jdXNhYmxlLCB1bmRlZmluZWQgaWYgeW91IHdhbnQgdG8gbWFrZSBhbGwgc2VjdGlvbnMgZm9jdXNhYmxlXG4gICAqL1xuICBwdWJsaWMgbWFrZUZvY3VzYWJsZSAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkIHwgbmV2ZXIge1xuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICAgIHRoaXMuZG9NYWtlRm9jdXNhYmxlKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBkb2Vzbid0IGV4aXN0IWApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBtYWtlIGZvY3VzYWJsZSBhbGwgc2VjdGlvbnMgKGluaXQgPylcbiAgICAgIGZvciAoY29uc3QgaWQgaW4gdGhpcy5fc2VjdGlvbnMpIHtcbiAgICAgICAgdGhpcy5kb01ha2VGb2N1c2FibGUodGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGRlZmF1bHQgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIHNldCBhcyBkZWZhdWx0XG4gICAqL1xuICBwdWJsaWMgc2V0RGVmYXVsdFNlY3Rpb24gKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB8IG5ldmVyIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9kZWZhdWx0U2VjdGlvbklkID0gc2VjdGlvbklkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBkb2Vzbid0IGV4aXN0IWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyBhbiBlbGVtZW50XG4gICAqL1xuICBwdWJsaWMgZm9jdXNFbGVtZW50IChlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIGlmICghZWxlbWVudCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IG5leHRTZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChlbGVtZW50KTtcbiAgICBpZiAoIW5leHRTZWN0aW9uSWQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgIGxldCBlbnRlckludG9OZXdTZWN0aW9uID0gdHJ1ZTtcbiAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBjb25zdCBjdXJyZW50U2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQoY3VycmVudEZvY3VzZWRFbGVtZW50KTtcbiAgICAgIGVudGVySW50b05ld1NlY3Rpb24gPSBuZXh0U2VjdGlvbklkID09PSBjdXJyZW50U2VjdGlvbklkO1xuICAgIH1cbiAgICBpZiAodGhpcy5pc05hdmlnYWJsZShlbGVtZW50LCBuZXh0U2VjdGlvbklkLCBmYWxzZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQoZWxlbWVudCwgbmV4dFNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbiwgRGlyZWN0aW9uLlVQKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIHRoZSBzZWN0aW9uIG9uY2UgaXQgaGFzIGJlZW4gbW91bnRlZFxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIGZvY3VzXG4gICAqL1xuICBwdWJsaWMgZm9jdXNPbk1vdW50ZWQgKHNlY3Rpb25JZDogc3RyaW5nKSB7XG4gICAgdGhpcy5mb2N1c09uTW91bnRlZFNlY3Rpb25zLnB1c2goc2VjdGlvbklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBTcGF0aWFsIE5hdmlnYXRpb24gaXMgd2FpdGluZyB0aGlzIGVsZW1lbnQgdG8gYmUgbW91bnRlZCBiZWZvcmUgZm9jdXNpbmcgaXQuXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgdG8gY2hlY2tcbiAgICovXG4gIHB1YmxpYyBoYXNCZWVuV2FpdGluZ0Zvck1vdW50ZWQgKHNlY3Rpb25JZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZm9jdXNPbk1vdW50ZWRTZWN0aW9ucy5pbmNsdWRlcyhzZWN0aW9uSWQpKSB7XG4gICAgICB0aGlzLmZvY3VzU2VjdGlvbihzZWN0aW9uSWQsIERpcmVjdGlvbi5VUCk7XG4gICAgICB0aGlzLmZvY3VzT25Nb3VudGVkU2VjdGlvbnMgPSB0aGlzLmZvY3VzT25Nb3VudGVkU2VjdGlvbnMuZmlsdGVyKChmb21zKSA9PiBmb21zICE9PSBzZWN0aW9uSWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFBSSVZBVEUgRlVOQ1RJT05TXG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgdW5pcXVlIGlkIGZvciBhIHNlY3Rpb25cbiAgICogQHJldHVybnMgbmV3IGlkIHNlY3Rpb25cbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVJZCAoKTogc3RyaW5nIHtcbiAgICBsZXQgaWQ6IHN0cmluZztcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWQgPSB0aGlzLklEX1BPT0xfUFJFRklYICsgU3RyaW5nKCsrdGhpcy5faWRQb29sKTtcbiAgICAgIGlmICghdGhpcy5fc2VjdGlvbnNbaWRdKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBwcml2YXRlIGdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCAoKTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHsgYWN0aXZlRWxlbWVudCB9ID0gZG9jdW1lbnQ7XG4gICAgaWYgKGFjdGl2ZUVsZW1lbnQgJiYgYWN0aXZlRWxlbWVudCAhPT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgcmV0dXJuIGFjdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIGV4dGVuZCAob3V0OiBhbnksIC4uLmFyZ3M6IGFueSkge1xuICAgIG91dCA9IG91dCB8fCB7fTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghYXJnc1tpXSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGFyZ3NbaV0pIHtcbiAgICAgICAgaWYgKGFyZ3NbaV0uaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhcmdzW2ldW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG91dFtrZXldID0gYXJnc1tpXVtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBwcml2YXRlIGV4Y2x1ZGUgKGVsZW1MaXN0OiBhbnksIGV4Y2x1ZGVkRWxlbTogYW55KSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGV4Y2x1ZGVkRWxlbSkpIHtcbiAgICAgIGV4Y2x1ZGVkRWxlbSA9IFtleGNsdWRlZEVsZW1dO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMCwgaW5kZXg7IGkgPCBleGNsdWRlZEVsZW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGluZGV4ID0gZWxlbUxpc3QuaW5kZXhPZihleGNsdWRlZEVsZW1baV0pO1xuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgZWxlbUxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsZW1MaXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIGVsZW1lbnQgaXMgbmF2aWdhYmxlXG4gICAqIEBwYXJhbSBlbGVtIGVsZW1lbnQgdG8gY2hlY2tcbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgZWxlbWVudCdzIHNlY3Rpb25cbiAgICogQHBhcmFtIHZlcmlmeVNlY3Rpb25TZWxlY3RvciBpZiB0cnVlLCBjaGVjayB0aGUgc2VjdGlvbiBzZWxlY3RvclxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGVsZW1lbnQgaXMgbmF2aWdhYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHByaXZhdGUgaXNOYXZpZ2FibGUgKGVsZW06IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgdmVyaWZ5U2VjdGlvblNlbGVjdG9yOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKCFlbGVtIHx8ICFzZWN0aW9uSWQgfHwgIXRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gfHwgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICgoZWxlbS5vZmZzZXRXaWR0aCA8PSAwICYmIGVsZW0ub2Zmc2V0SGVpZ2h0IDw9IDApIHx8IGVsZW0uaGFzQXR0cmlidXRlKCdkaXNhYmxlZCcpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh2ZXJpZnlTZWN0aW9uU2VsZWN0b3IgJiYgIXRoaXMuY29yZS5tYXRjaFNlbGVjdG9yKGVsZW0sIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5zZWxlY3RvciEpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubmF2aWdhYmxlRmlsdGVyICE9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLm5hdmlnYWJsZUZpbHRlciEoZWxlbSwgc2VjdGlvbklkKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLm5hdmlnYWJsZUZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi5uYXZpZ2FibGVGaWx0ZXIhKGVsZW0sIHNlY3Rpb25JZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBlbGVtZW50J3Mgc2VjdGlvbiBpZFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50XG4gICAqIEByZXR1cm5zIHRoZSBlbGVtZW50J3Mgc2VjdGlvbiBpZFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTZWN0aW9uSWQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBzZWN0aW9uc0VsZW1lbnRzOiBhbnkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICBpZiAoIXRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkKSB7XG4gICAgICAgIGNvbnN0IHNlY3Rpb25FbGVtZW50ID0gdGhpcy5fc2VjdGlvbnNbaWRdLmNvbmZpZ3VyYXRpb24uZWxlbWVudDtcbiAgICAgICAgaWYgKHNlY3Rpb25FbGVtZW50KSB7XG4gICAgICAgICAgc2VjdGlvbnNFbGVtZW50c1tpZF0gPSBzZWN0aW9uRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwYXJlbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGVsZW1lbnQ7XG4gICAgd2hpbGUgKHBhcmVudCkge1xuICAgICAgaWYgKE9iamVjdC52YWx1ZXMoc2VjdGlvbnNFbGVtZW50cykuaW5kZXhPZihwYXJlbnQpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHNlY3Rpb25zRWxlbWVudHMpLmZpbmQoKGtleSkgPT4gc2VjdGlvbnNFbGVtZW50c1trZXldID09PSBwYXJlbnQpO1xuICAgICAgfVxuICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG5hdmlnYWJsZSBlbGVtZW50cyBpbnRvIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqL1xuICBwcml2YXRlIGdldFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyAoc2VjdGlvbklkOiBzdHJpbmcpOiBuZXZlcltdIHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLnNlbGVjdG9yISlcbiAgICAgIC5maWx0ZXIoKGVsZW1lbnQpID0+IHRoaXMuaXNOYXZpZ2FibGUoZWxlbWVudCwgc2VjdGlvbklkLCBmYWxzZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZGVmYXVsdCBlbGVtZW50IG9mIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIHRoZSBkZWZhdWx0IGVsZW1lbnQgb2YgYSBzZWN0aW9uLCBudWxsIGlmIG5vIGRlZmF1bHQgZWxlbWVudCBmb3VuZFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQgKHNlY3Rpb25JZDogc3RyaW5nKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB7IGRlZmF1bHRFbGVtZW50IH0gPSB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb247XG4gICAgaWYgKCFkZWZhdWx0RWxlbWVudCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGVsZW1lbnRzID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IoZGVmYXVsdEVsZW1lbnQpO1xuICAgIC8vIGNoZWNrIGVhY2ggZWxlbWVudCB0byBzZWUgaWYgaXQncyBuYXZpZ2FibGUgYW5kIHN0b3Agd2hlbiBvbmUgaGFzIGJlZW4gZm91bmRcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICAgIGlmICh0aGlzLmlzTmF2aWdhYmxlKGVsZW1lbnQsIHNlY3Rpb25JZCwgdHJ1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbGFzdCBmb2N1c2VkIGVsZW1lbnQgaW50byBhIHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvblxuICAgKiBAcmV0dXJucyB0aGUgbGFzdCBmb2N1c2VkIGVsZW1lbnQsIG51bGwgaWYgbm8gZWxlbWVudCBmb3VuZFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50IChzZWN0aW9uSWQ6IGFueSk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgeyBsYXN0Rm9jdXNlZEVsZW1lbnQgfSA9IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF07XG4gICAgaWYgKGxhc3RGb2N1c2VkRWxlbWVudCkge1xuICAgICAgaWYgKCF0aGlzLmlzTmF2aWdhYmxlKGxhc3RGb2N1c2VkRWxlbWVudCwgc2VjdGlvbklkLCB0cnVlKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsYXN0Rm9jdXNlZEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIGZpcmUgYW4gZXZlbnRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCBzb3VyY2VcbiAgICogQHBhcmFtIHR5cGUgdHlwZSBvZiBldmVudFxuICAgKiBAcGFyYW0gZGV0YWlscyA/XG4gICAqIEBwYXJhbSBjYW5jZWxhYmxlIHRydWUgaWYgY2FuY2VsYWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgZXZlbnQgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGRpc3BhdGNoZWRcbiAgICovXG4gIHByaXZhdGUgZmlyZUV2ZW50IChlbGVtZW50OiBIVE1MRWxlbWVudCwgdHlwZTogc3RyaW5nLCBkZXRhaWxzOiBhbnksIGNhbmNlbGFibGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCA0KSB7XG4gICAgICBjYW5jZWxhYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZXZ0LmluaXRDdXN0b21FdmVudCh0aGlzLkVWRU5UX1BSRUZJWCArIHR5cGUsIHRydWUsIGNhbmNlbGFibGUsIGRldGFpbHMpO1xuICAgIHJldHVybiBlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBmb2N1cyBhbmQgc2Nyb2xsIG9uIGVsZW1lbnRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBmb2N1c1xuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIGNvbnRhaW5pbmcgdGhlIGVsZW1lbnRcbiAgICogQHBhcmFtIGVudGVySW50b05ld1NlY3Rpb24gdHJ1ZSBpZiB3ZSBlbnRlciBpbnRvIHRoZSBzZWN0aW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHByaXZhdGUgZm9jdXNOU2Nyb2xsIChlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcsIGVudGVySW50b05ld1NlY3Rpb246IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBsZXQgc2Nyb2xsT3B0aW9ucyA9IGVudGVySW50b05ld1NlY3Rpb24gPyB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2Nyb2xsT3B0aW9uc1xuICAgICAgOiB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2Nyb2xsT3B0aW9uc0ludG9TZWN0aW9uO1xuICAgIC8vIGlmIG5vLXNjcm9sbCBnaXZlbiBhcyBzY3JvbGxPcHRpb25zLCB0aGVuIGZvY3VzIHdpdGhvdXQgc2Nyb2xsaW5nXG4gICAgaWYgKHNjcm9sbE9wdGlvbnMgPT09ICduby1zY3JvbGwnKSB7XG4gICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICB9IGVsc2UgaWYgKHNjcm9sbE9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPcHRpb25zICE9PSAnJyAmJiAhKHNjcm9sbE9wdGlvbnMgaW5zdGFuY2VvZiBTdHJpbmcpKSB7XG4gICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoc2Nyb2xsT3B0aW9ucyBhcyBTY3JvbGxJbnRvVmlld09wdGlvbnMpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5nbG9iYWxDb25maWd1cmF0aW9uKSB7XG4gICAgICBzY3JvbGxPcHRpb25zID0gZW50ZXJJbnRvTmV3U2VjdGlvbiA/IHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi5zY3JvbGxPcHRpb25zIDogdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnNjcm9sbE9wdGlvbnNJbnRvU2VjdGlvbjtcbiAgICAgIGlmIChzY3JvbGxPcHRpb25zICE9PSB1bmRlZmluZWQgJiYgc2Nyb2xsT3B0aW9ucyAhPT0gJycgJiYgc2Nyb2xsT3B0aW9ucyAhPT0gJ25vLXNjcm9sbCcpIHtcbiAgICAgICAgZWxlbWVudC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG4gICAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoc2Nyb2xsT3B0aW9ucyBhcyBTY3JvbGxJbnRvVmlld09wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudC5mb2N1cyh7IHByZXZlbnRTY3JvbGw6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGVsZW1cbiAgICogQHBhcmFtIHNlY3Rpb25JZFxuICAgKi9cbiAgcHJpdmF0ZSBmb2N1c0NoYW5nZWQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZykge1xuICAgIGxldCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gc2VjdGlvbklkO1xuICAgIGlmICghaWQpIHtcbiAgICAgIGlkID0gdGhpcy5nZXRTZWN0aW9uSWQoZWxlbWVudCk7XG4gICAgfVxuICAgIGlmIChpZCkge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5sYXN0Rm9jdXNlZEVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgdGhpcy5fbGFzdFNlY3Rpb25JZCA9IHNlY3Rpb25JZDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNpbGVudEZvY3VzIChlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcsIHNjcm9sbEludG9OZXdTZWN0aW9uOiBib29sZWFuKSB7XG4gICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG4gICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LmJsdXIoKTtcbiAgICB9XG4gICAgdGhpcy5mb2N1c05TY3JvbGwoZWxlbWVudCwgc2VjdGlvbklkLCBzY3JvbGxJbnRvTmV3U2VjdGlvbik7XG4gICAgdGhpcy5mb2N1c0NoYW5nZWQoZWxlbWVudCwgc2VjdGlvbklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1cyBhbiBlbGVtZW50XG4gICAqIEBwYXJhbSBlbGVtIGVsZW1lbnQgdG8gZm9jdXNcbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgZWxlbWVudCdzIHNlY3Rpb25cbiAgICogQHBhcmFtIGVudGVySW50b05ld1NlY3Rpb24gdHJ1ZSBpZiBuZXcgc2VjdGlvbiBpcyBmb2N1c2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHBhcmFtIGRpcmVjdGlvbiBzb3VyY2UgZGlyZWN0aW9uXG4gICAqL1xuICBwcml2YXRlIF9mb2N1c0VsZW1lbnQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgZW50ZXJJbnRvTmV3U2VjdGlvbjogYm9vbGVhbiwgZGlyZWN0aW9uPzogRGlyZWN0aW9uKSB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuXG4gICAgaWYgKHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlKSB7XG4gICAgICB0aGlzLnNpbGVudEZvY3VzKGVsZW1lbnQsIHNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5fcGF1c2UpIHtcbiAgICAgIHRoaXMuc2lsZW50Rm9jdXMoZWxlbWVudCwgc2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uKTtcbiAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBjb25zdCB1bmZvY3VzUHJvcGVydGllcyA9IHtcbiAgICAgICAgbmV4dEVsZW1lbnQ6IGVsZW1lbnQsXG4gICAgICAgIG5leHRTZWN0aW9uSWQ6IHNlY3Rpb25JZCxcbiAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICBuYXRpdmU6IGZhbHNlXG4gICAgICB9O1xuICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICd3aWxsdW5mb2N1cycsIHVuZm9jdXNQcm9wZXJ0aWVzLCB1bmRlZmluZWQpKSB7XG4gICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudC5ibHVyKCk7XG4gICAgICB0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICd1bmZvY3VzZWQnLCB1bmZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuICAgIH1cblxuICAgIGNvbnN0IGZvY3VzUHJvcGVydGllcyA9IHtcbiAgICAgIHByZXZpb3VzRWxlbWVudDogY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgc2VjdGlvbklkLFxuICAgICAgZGlyZWN0aW9uLFxuICAgICAgbmF0aXZlOiBmYWxzZVxuICAgIH07XG4gICAgaWYgKCF0aGlzLmZpcmVFdmVudChlbGVtZW50LCAnd2lsbGZvY3VzJywgZm9jdXNQcm9wZXJ0aWVzKSkge1xuICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5mb2N1c05TY3JvbGwoZWxlbWVudCwgc2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uKTtcbiAgICB0aGlzLmZpcmVFdmVudChlbGVtZW50LCAnZm9jdXNlZCcsIGZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuXG4gICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcblxuICAgIHRoaXMuZm9jdXNDaGFuZ2VkKGVsZW1lbnQsIHNlY3Rpb25JZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcHJpdmF0ZSBmb2N1c0V4dGVuZGVkU2VsZWN0b3IgKHNlbGVjdG9yOiBzdHJpbmcsIGRpcmVjdGlvbjogRGlyZWN0aW9uLCBlbnRlckludG9OZXdTZWN0aW9uOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKHNlbGVjdG9yLmNoYXJBdCgwKSA9PT0gJ0AnKSB7XG4gICAgICBpZiAoc2VsZWN0b3IubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvY3VzU2VjdGlvbih1bmRlZmluZWQsIGRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWN0aW9uSWQgPSBzZWxlY3Rvci5zdWJzdHIoMSk7XG4gICAgICByZXR1cm4gdGhpcy5mb2N1c1NlY3Rpb24oc2VjdGlvbklkLCBkaXJlY3Rpb24pO1xuICAgIH1cbiAgICBjb25zdCBuZXh0ID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpWzBdO1xuICAgIGlmIChuZXh0KSB7XG4gICAgICBjb25zdCBuZXh0U2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQobmV4dCk7XG4gICAgICBpZiAobmV4dFNlY3Rpb25JZCkge1xuICAgICAgICBpZiAodGhpcy5pc05hdmlnYWJsZShuZXh0LCBuZXh0U2VjdGlvbklkLCBmYWxzZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZm9jdXNFbGVtZW50KG5leHQsIG5leHRTZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24sIGRpcmVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRSYW5nZSAoaWQ6IHN0cmluZywgcmFuZ2U6IHN0cmluZyBbXSkge1xuICAgIGlmIChpZCAmJiByYW5nZS5pbmRleE9mKGlkKSA8IDAgJiYgdGhpcy5fc2VjdGlvbnNbaWRdICYmICF0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCkge1xuICAgICAgcmFuZ2UucHVzaChpZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gZGlyZWN0aW9uXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiBmb2N1c2VkXG4gICAqL1xuICBwcml2YXRlIGZvY3VzU2VjdGlvbiAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGRpcmVjdGlvbjogRGlyZWN0aW9uKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmFuZ2U6IHN0cmluZyBbXSA9IFtdO1xuXG4gICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgdGhpcy5hZGRSYW5nZShzZWN0aW9uSWQsIHJhbmdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hZGRSYW5nZSh0aGlzLl9kZWZhdWx0U2VjdGlvbklkLCByYW5nZSk7XG4gICAgICB0aGlzLmFkZFJhbmdlKHRoaXMuX2xhc3RTZWN0aW9uSWQsIHJhbmdlKTtcbiAgICAgIGZvciAoY29uc3Qgc2VjdGlvbiBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgICB0aGlzLmFkZFJhbmdlKHNlY3Rpb24sIHJhbmdlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhbmdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpZCA9IHJhbmdlW2ldO1xuICAgICAgbGV0IG5leHQ7XG5cbiAgICAgIGlmICh0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5lbnRlclRvID09PSAnbGFzdC1mb2N1c2VkJykge1xuICAgICAgICBuZXh0ID0gdGhpcy5nZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50KGlkKVxuICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyhpZClbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0ID0gdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyhpZClbMF07XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQobmV4dCwgaWQsIHRydWUsIGRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlIGV2ZW50IHdoZW4gbmF2aWdhdGUgaGFzIGZhaWxlZFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHNvdXJjZVxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIGRpcmVjdGlvbiBzb3VyY2VcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBldmVudCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgcmFpc2VkXG4gICAqL1xuICBwcml2YXRlIGZpcmVOYXZpZ2F0ZUZhaWxlZCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIGRpcmVjdGlvbjogRGlyZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZmlyZUV2ZW50KGVsZW1lbnQsICduYXZpZ2F0ZWZhaWxlZCcsIHtcbiAgICAgIGRpcmVjdGlvblxuICAgIH0sIGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgZ29Ub0xlYXZlRm9yIChzZWN0aW9uSWQ6IHN0cmluZywgZGlyZWN0aW9uOiBEaXJlY3Rpb24pIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmxlYXZlRm9yXG4gICAgICAmJiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmxlYXZlRm9yIGFzIGFueSlbZGlyZWN0aW9udG9TdHJpbmcoZGlyZWN0aW9uKV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV4dCA9ICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubGVhdmVGb3IgYXMgYW55KVtkaXJlY3Rpb250b1N0cmluZyhkaXJlY3Rpb24pXTtcbiAgICAgIGlmIChuZXh0ID09PSAnJyB8fCBuZXh0ID09PSAnbm93aGVyZScpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5mb2N1c0V4dGVuZGVkU2VsZWN0b3IobmV4dCwgZGlyZWN0aW9uLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIG5leHQgZWxlbWVudFxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIHNvdXJjZSBkaXJlY3Rpb25cbiAgICogQHBhcmFtIGN1cnJlbnRGb2N1c2VkRWxlbWVudCBjdXJyZW50IGZvY3VzZWQgZWxlbWVudFxuICAgKiBAcGFyYW0gY3VycmVudFNlY3Rpb25JZCBjdXJyZW50IHNlY3Rpb24gaWRcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBuZXh0IGhhcyBiZWVuIGZvY3VzZWQgc3VjY2Vzc2Z1bGx5XG4gICAqL1xuICBwcml2YXRlIGZvY3VzTmV4dCAoZGlyZWN0aW9uOiBEaXJlY3Rpb24sIGN1cnJlbnRGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQsIGN1cnJlbnRTZWN0aW9uSWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGV4dFNlbGVjdG9yID0gY3VycmVudEZvY3VzZWRFbGVtZW50LmdldEF0dHJpYnV0ZShgZGF0YS1zbi0ke2RpcmVjdGlvbn1gKTtcblxuICAgIC8vIFRPIERPIHJlbW92ZSB0eXBlb2ZcbiAgICBpZiAodHlwZW9mIGV4dFNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGV4dFNlbGVjdG9yID09PSAnJ1xuICAgICAgICAgIHx8ICF0aGlzLmZvY3VzRXh0ZW5kZWRTZWxlY3RvcihleHRTZWxlY3RvciwgZGlyZWN0aW9uLCBmYWxzZSkpIHsgLy8gd2hoaWNoIHZhbHVlIGZvciBlbnRlckludG9OZXdTZWN0aW9uID8gdHJ1ZSBvciBmYWxzZSA/Pz9cbiAgICAgICAgdGhpcy5maXJlTmF2aWdhdGVGYWlsZWQoY3VycmVudEZvY3VzZWRFbGVtZW50LCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWN0aW9uTmF2aWdhYmxlRWxlbWVudHM6IGFueSA9IHt9O1xuICAgIGxldCBhbGxOYXZpZ2FibGVFbGVtZW50czogYW55ID0gW107XG4gICAgZm9yIChjb25zdCBpZCBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgc2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzW2lkXSA9IHRoaXMuZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKGlkKSBhcyBIVE1MRWxlbWVudFtdO1xuICAgICAgYWxsTmF2aWdhYmxlRWxlbWVudHMgPSBhbGxOYXZpZ2FibGVFbGVtZW50cy5jb25jYXQoc2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzW2lkXSk7XG4gICAgfVxuXG4gICAgLy8gY29uc3QgY29uZmlnOiBDb25maWd1cmF0aW9uID0gdGhpcy5leHRlbmQoe30sIHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbiwgdGhpcy5fc2VjdGlvbnNbY3VycmVudFNlY3Rpb25JZF0uY29uZmlndXJhdGlvbik7XG4gICAgbGV0IG5leHQ6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBjb25zdCBjdXJyZW50U2VjdGlvbiA9IHRoaXMuX3NlY3Rpb25zW2N1cnJlbnRTZWN0aW9uSWRdO1xuXG4gICAgaWYgKGN1cnJlbnRTZWN0aW9uLmNvbmZpZ3VyYXRpb24ucmVzdHJpY3QgPT09ICdzZWxmLW9ubHknIHx8IGN1cnJlbnRTZWN0aW9uLmNvbmZpZ3VyYXRpb24ucmVzdHJpY3QgPT09ICdzZWxmLWZpcnN0Jykge1xuICAgICAgY29uc3QgY3VycmVudFNlY3Rpb25OYXZpZ2FibGVFbGVtZW50cyA9IHNlY3Rpb25OYXZpZ2FibGVFbGVtZW50c1tjdXJyZW50U2VjdGlvbklkXTtcblxuICAgICAgbmV4dCA9IHRoaXMuY29yZS5uYXZpZ2F0ZShcbiAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgIHRoaXMuZXhjbHVkZShjdXJyZW50U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzLCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQpLFxuICAgICAgICBjdXJyZW50U2VjdGlvblxuICAgICAgKTtcblxuICAgICAgaWYgKCFuZXh0ICYmIGN1cnJlbnRTZWN0aW9uLmNvbmZpZ3VyYXRpb24ucmVzdHJpY3QgPT09ICdzZWxmLWZpcnN0Jykge1xuICAgICAgICBuZXh0ID0gdGhpcy5jb3JlLm5hdmlnYXRlKFxuICAgICAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCxcbiAgICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgICAgdGhpcy5leGNsdWRlKGFsbE5hdmlnYWJsZUVsZW1lbnRzLCBjdXJyZW50U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKSxcbiAgICAgICAgICBjdXJyZW50U2VjdGlvblxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0ID0gdGhpcy5jb3JlLm5hdmlnYXRlKFxuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgdGhpcy5leGNsdWRlKGFsbE5hdmlnYWJsZUVsZW1lbnRzLCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQpLFxuICAgICAgICBjdXJyZW50U2VjdGlvblxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAobmV4dCkge1xuICAgICAgY3VycmVudFNlY3Rpb24ucHJldmlvdXMgPSB7XG4gICAgICAgIHRhcmdldDogY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgICBkZXN0aW5hdGlvbjogbmV4dCxcbiAgICAgICAgcmV2ZXJzZTogZ2V0UmV2ZXJzZURpcmVjdGlvbihkaXJlY3Rpb24pXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBuZXh0U2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB0aGlzLmdldFNlY3Rpb25JZChuZXh0KTtcbiAgICAgIGxldCBlbnRlckludG9OZXdTZWN0aW9uID0gZmFsc2U7XG4gICAgICBpZiAoY3VycmVudFNlY3Rpb25JZCAhPT0gbmV4dFNlY3Rpb25JZCAmJiBuZXh0U2VjdGlvbklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gV2UgZW50ZXIgaW50byBhbm90aGVyIHNlY3Rpb25cbiAgICAgICAgZW50ZXJJbnRvTmV3U2VjdGlvbiA9IHRydWU7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYm9vbGVhbiB8IG51bGwgPSB0aGlzLmdvVG9MZWF2ZUZvcihjdXJyZW50U2VjdGlvbklkLCBkaXJlY3Rpb24pO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuZmlyZU5hdmlnYXRlRmFpbGVkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZW50ZXJUb0VsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fc2VjdGlvbnNbbmV4dFNlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5lbnRlclRvKSB7XG4gICAgICAgICAgY2FzZSAnbGFzdC1mb2N1c2VkJzpcbiAgICAgICAgICAgIGVudGVyVG9FbGVtZW50ID0gdGhpcy5nZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50KG5leHRTZWN0aW9uSWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbkRlZmF1bHRFbGVtZW50KG5leHRTZWN0aW9uSWQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZGVmYXVsdC1lbGVtZW50JzpcbiAgICAgICAgICAgIGVudGVyVG9FbGVtZW50ID0gdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQobmV4dFNlY3Rpb25JZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVudGVyVG9FbGVtZW50KSB7XG4gICAgICAgICAgbmV4dCA9IGVudGVyVG9FbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0U2VjdGlvbklkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQobmV4dCwgbmV4dFNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbiwgZGlyZWN0aW9uKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZ29Ub0xlYXZlRm9yKGN1cnJlbnRTZWN0aW9uSWQsIGRpcmVjdGlvbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmZpcmVOYXZpZ2F0ZUZhaWxlZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsIGRpcmVjdGlvbik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBwcmV2ZW50RGVmYXVsdCAoZXZ0OiBFdmVudCk6IGJvb2xlYW4ge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIG9uS2V5RG93biAoZXZ0OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3Rocm90dGxlKSB7XG4gICAgICB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5fdGhyb3R0bGUgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLl90aHJvdHRsZSA9IG51bGw7XG4gICAgfSwgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnRocm90dGxlKTtcblxuICAgIGlmICghdGhpcy5fc2VjdGlvbkNvdW50IHx8IHRoaXMuX3BhdXNlXG4gICAgICB8fCBldnQuYWx0S2V5IHx8IGV2dC5jdHJsS2V5IHx8IGV2dC5tZXRhS2V5IHx8IGV2dC5zaGlmdEtleSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGRpcmVjdGlvbjogRGlyZWN0aW9uID0gZXZ0LmtleUNvZGUgYXMgdW5rbm93biBhcyBEaXJlY3Rpb247XG4gICAgaWYgKCFkaXJlY3Rpb24pIHtcbiAgICAgIGlmIChldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCAmJiB0aGlzLmdldFNlY3Rpb25JZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICdlbnRlci1kb3duJywgdW5kZWZpbmVkLCB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcmV2ZW50RGVmYXVsdChldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG5cbiAgICBpZiAoIWN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuX2xhc3RTZWN0aW9uSWQpIHtcbiAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRTZWN0aW9uTGFzdEZvY3VzZWRFbGVtZW50KHRoaXMuX2xhc3RTZWN0aW9uSWQpO1xuICAgICAgfVxuICAgICAgaWYgKCFjdXJyZW50Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5mb2N1c1NlY3Rpb24odW5kZWZpbmVkLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcy5wcmV2ZW50RGVmYXVsdChldnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRTZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpO1xuICAgIGlmICghY3VycmVudFNlY3Rpb25JZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHdpbGxtb3ZlUHJvcGVydGllcyA9IHtcbiAgICAgIGRpcmVjdGlvbixcbiAgICAgIHNlY3Rpb25JZDogY3VycmVudFNlY3Rpb25JZCxcbiAgICAgIGNhdXNlOiAna2V5ZG93bidcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ3dpbGxtb3ZlJywgd2lsbG1vdmVQcm9wZXJ0aWVzKSkge1xuICAgICAgdGhpcy5mb2N1c05leHQoZGlyZWN0aW9uLCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsIGN1cnJlbnRTZWN0aW9uSWQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gIH1cblxuICBwcml2YXRlIG9uS2V5VXAgKGV2dDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmIChldnQuYWx0S2V5IHx8IGV2dC5jdHJsS2V5IHx8IGV2dC5tZXRhS2V5IHx8IGV2dC5zaGlmdEtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX3BhdXNlICYmIHRoaXMuX3NlY3Rpb25Db3VudCAmJiBldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRGb2N1c2VkRWxlbWVudCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG4gICAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50ICYmIHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsICdlbnRlci11cCcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKSkge1xuICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25Gb2N1cyAoZXZ0OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHsgdGFyZ2V0IH0gPSBldnQ7XG4gICAgY29uc3QgaHRtbFRhcmdldDogSFRNTEVsZW1lbnQgPSB0YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKHRhcmdldCAhPT0gd2luZG93ICYmIHRhcmdldCAhPT0gZG9jdW1lbnRcbiAgICAgICYmIHRoaXMuX3NlY3Rpb25Db3VudCAmJiAhdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgJiYgdGFyZ2V0KSB7XG4gICAgICBjb25zdCBzZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChodG1sVGFyZ2V0KTtcbiAgICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgICAgaWYgKHRoaXMuX3BhdXNlKSB7XG4gICAgICAgICAgdGhpcy5mb2N1c0NoYW5nZWQoaHRtbFRhcmdldCwgc2VjdGlvbklkKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2N1c1Byb3BlcnRpZXMgPSB7XG4gICAgICAgICAgc2VjdGlvbklkLFxuICAgICAgICAgIG5hdGl2ZTogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdGhpcy5maXJlRXZlbnQoaHRtbFRhcmdldCwgJ3dpbGxmb2N1cycsIGZvY3VzUHJvcGVydGllcykpIHtcbiAgICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IHRydWU7XG4gICAgICAgICAgaHRtbFRhcmdldC5ibHVyKCk7XG4gICAgICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmZpcmVFdmVudChodG1sVGFyZ2V0LCAnZm9jdXNlZCcsIGZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuZm9jdXNDaGFuZ2VkKGh0bWxUYXJnZXQsIHNlY3Rpb25JZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQmx1ciAoZXZ0OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsID0gZXZ0LnRhcmdldDtcbiAgICBjb25zdCBodG1sVGFyZ2V0OiBIVE1MRWxlbWVudCA9IHRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0ICE9PSB3aW5kb3cgJiYgdGFyZ2V0ICE9PSBkb2N1bWVudCAmJiAhdGhpcy5fcGF1c2VcbiAgICAgICYmIHRoaXMuX3NlY3Rpb25Db3VudCAmJiAhdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgJiYgdGhpcy5nZXRTZWN0aW9uSWQoaHRtbFRhcmdldCkpIHtcbiAgICAgIGNvbnN0IHVuZm9jdXNQcm9wZXJ0aWVzID0ge1xuICAgICAgICBuYXRpdmU6IHRydWVcbiAgICAgIH07XG4gICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGh0bWxUYXJnZXQsICd3aWxsdW5mb2N1cycsIHVuZm9jdXNQcm9wZXJ0aWVzKSkge1xuICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGh0bWxUYXJnZXQuZm9jdXMoKTtcbiAgICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmlyZUV2ZW50KGh0bWxUYXJnZXQsICd1bmZvY3VzZWQnLCB1bmZvY3VzUHJvcGVydGllcywgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNTZWN0aW9uIChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIHJldHVybiBzZWN0aW9uSWQgaW4gdGhpcy5fc2VjdGlvbnM7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBUTyBSRU1PVkUgPz8/XG4gIHByaXZhdGUgb25Cb2R5Q2xpY2sgKCkge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1t0aGlzLl9sYXN0U2VjdGlvbklkXSkge1xuICAgICAgY29uc3QgbGFzdEZvY3VzZWRFbGVtZW50ID0gdGhpcy5fc2VjdGlvbnNbdGhpcy5fbGFzdFNlY3Rpb25JZF0ubGFzdEZvY3VzZWRFbGVtZW50O1xuICAgICAgaWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGRvY3VtZW50LmJvZHkgJiYgdGhpcy5fbGFzdFNlY3Rpb25JZFxuICAgICAgICAmJiBsYXN0Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5fZm9jdXNFbGVtZW50KGxhc3RGb2N1c2VkRWxlbWVudCwgdGhpcy5fbGFzdFNlY3Rpb25JZCwgdHJ1ZSwgdW5kZWZpbmVkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFrZSBmb2N1c2FibGUgZWxlbWVudHMgb2YgYSBzZWN0aW9uLlxuICAgKiBAcGFyYW0gY29uZmlndXJhdGlvbiBjb25maWd1cmF0aW9uIG9mIHRoZSBzZWN0aW9uIHRvIG1hbGUgZm9jdXNhYmxlID9cbiAgICovXG4gIHByaXZhdGUgZG9NYWtlRm9jdXNhYmxlIChjb25maWd1cmF0aW9uOiBDb25maWd1cmF0aW9uKTogdm9pZCB7XG4gICAgbGV0IHRhYkluZGV4SWdub3JlTGlzdDogc3RyaW5nO1xuICAgIGlmIChjb25maWd1cmF0aW9uLnRhYkluZGV4SWdub3JlTGlzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YWJJbmRleElnbm9yZUxpc3QgPSBjb25maWd1cmF0aW9uLnRhYkluZGV4SWdub3JlTGlzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFiSW5kZXhJZ25vcmVMaXN0ID0gdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnRhYkluZGV4SWdub3JlTGlzdCE7XG4gICAgfVxuXG4gICAgdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IoY29uZmlndXJhdGlvbi5zZWxlY3RvciEpLmZvckVhY2goKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBpZiAoIXRoaXMuY29yZS5tYXRjaFNlbGVjdG9yKGVsZW1lbnQsIHRhYkluZGV4SWdub3JlTGlzdCkpIHtcbiAgICAgICAgY29uc3QgaHRtbEVsZW1lbnQgPSBlbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAoIWh0bWxFbGVtZW50LmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgIC8vIHNldCB0aGUgdGFiaW5kZXggd2l0aCBhIG5lZ2F0aXZlIHZhbHVlLiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0dsb2JhbF9hdHRyaWJ1dGVzL3RhYmluZGV4XG4gICAgICAgICAgaHRtbEVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxufVxuXG5jb25zdCBzbiA9IFNwYXRpYWxOYXZpZ2F0aW9uLmdldEluc3RhbmNlKCk7XG5leHBvcnQgeyBTcGF0aWFsTmF2aWdhdGlvbiwgc24gfTtcbiJdfQ==