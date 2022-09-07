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
     * Init global listeners to listen for key, focus and blur events.
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
     * Remove global listeners, reset Compass context.
     */
    uninit() {
        window.removeEventListener('blur', this.onBlur, true);
        window.removeEventListener('focus', this.onFocus, true);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('keydown', this.onKeyDown);
        this.clear();
        this._idPool = 0;
        this._ready = false;
    }
    /**
     * Clear Compass context.
     */
    clear() {
        this._sections = {};
        this._sectionCount = 0;
        this._defaultSectionId = '';
        this._lastSectionId = '';
        this._duringFocusChange = false;
    }
    /**
     * Reset the last focused element and previous element of a section.
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
     * Set the configuration of a section.
     * @param sectionId - section to configure.
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
     * @param direction - incoming direction
     * @param selector - target element selector
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm91c3NvbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvQm91c3NvbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFRLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNwQyxPQUFPLEVBQWlCLG9CQUFvQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDNUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBR3RGLE1BQU0sT0FBTztJQUFiO1FBRVUsV0FBTSxHQUFZLEtBQUssQ0FBQztRQUN4QixZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLGNBQVMsR0FBZ0MsRUFBRSxDQUFDO1FBQzVDLGtCQUFhLEdBQVcsQ0FBQyxDQUFDO1FBQzFCLHNCQUFpQixHQUFXLEVBQUUsQ0FBQztRQUMvQixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUM1Qix1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFDcEMsd0JBQW1CLEdBQWtCLG9CQUFvQixDQUFDO1FBQzFELFdBQU0sR0FBWSxLQUFLLENBQUM7UUFDeEIsU0FBSSxHQUFTLElBQUksQ0FBQztRQUNULG1CQUFjLEdBQUcsVUFBVSxDQUFDO1FBQzVCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzlCLGNBQVMsR0FBa0IsSUFBSSxDQUFDO1FBNjZCeEMsYUFBYTtJQUNmLENBQUM7SUExNkJRLE1BQU0sQ0FBQyxXQUFXO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztTQUNsQztRQUNELE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQztJQUMxQixDQUFDO0lBRUQsMkJBQTJCO0lBRTNCOztPQUVHO0lBQ0ksSUFBSTtRQUNULElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hCLE1BQU0sQ0FBQyxnQkFB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LENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQzthQUM5RTtTQUNGO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNLLGVBQWUsQ0FBRSxhQUE0QjtRQUNuRCxJQUFJLGtCQUEwQixDQUFDO1FBQy9CLElBQUksYUFBYSxDQUFDLGtCQUFrQixLQUFLLFNBQVMsRUFBRTtZQUNsRCxrQkFBa0IsR0FBRyxhQUFhLENBQUMsa0JBQWtCLENBQUM7U0FDdkQ7YUFBTTtZQUNMLGtCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBbUIsQ0FBQztTQUNuRTtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxRQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFvQixFQUFFLEVBQUU7WUFDaEYsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxFQUFFO2dCQUN6RCxNQUFNLFdBQVcsR0FBRyxPQUFzQixDQUFDO2dCQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDekMsdUhBQXVIO29CQUN2SCxXQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDNUM7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUVGO0FBRUQsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2pDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlLCBjb3JlIH0gZnJvbSAnLi9Db3JlJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIGRlZmF1bHRDb25maWd1cmF0aW9uIH0gZnJvbSAnLi90eXBlcy9Db25maWd1cmF0aW9uJztcbmltcG9ydCB7IERpcmVjdGlvbiwgZGlyZWN0aW9udG9TdHJpbmcsIGdldFJldmVyc2VEaXJlY3Rpb24gfSBmcm9tICcuL3R5cGVzL0RpcmVjdGlvbic7XG5pbXBvcnQgeyBTZWN0aW9uIH0gZnJvbSAnLi90eXBlcy9TZWN0aW9uJztcblxuY2xhc3MgQ29tcGFzcyB7XG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBDb21wYXNzO1xuICBwcml2YXRlIF9yZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9pZFBvb2w6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgX3NlY3Rpb25zOiB7IFtrZXk6IHN0cmluZ106IFNlY3Rpb247IH0gPSB7fTtcbiAgcHJpdmF0ZSBfc2VjdGlvbkNvdW50OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIF9kZWZhdWx0U2VjdGlvbklkOiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBfbGFzdFNlY3Rpb25JZDogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX2R1cmluZ0ZvY3VzQ2hhbmdlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZ2xvYmFsQ29uZmlndXJhdGlvbjogQ29uZmlndXJhdGlvbiA9IGRlZmF1bHRDb25maWd1cmF0aW9uO1xuICBwcml2YXRlIF9wYXVzZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGNvcmU6IENvcmUgPSBjb3JlO1xuICBwcml2YXRlIHJlYWRvbmx5IElEX1BPT0xfUFJFRklYID0gJ3NlY3Rpb24tJztcbiAgcHJpdmF0ZSByZWFkb25seSBFVkVOVF9QUkVGSVggPSAnc246JztcbiAgcHJpdmF0ZSBfdGhyb3R0bGU6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG5cblxuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlICgpOiBDb21wYXNzIHtcbiAgICBpZiAoIUNvbXBhc3MuaW5zdGFuY2UpIHtcbiAgICAgIENvbXBhc3MuaW5zdGFuY2UgPSBuZXcgQ29tcGFzcygpO1xuICAgIH1cbiAgICByZXR1cm4gQ29tcGFzcy5pbnN0YW5jZTtcbiAgfVxuXG4gIC8vICNyZWdpb24gUFVCTElDIEZVTkNUSU9OU1xuXG4gIC8qKlxuICAgKiBJbml0IGdsb2JhbCBsaXN0ZW5lcnMgdG8gbGlzdGVuIGZvciBrZXksIGZvY3VzIGFuZCBibHVyIGV2ZW50cy5cbiAgICovXG4gIHB1YmxpYyBpbml0ICgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX3JlYWR5KSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duLmJpbmQodGhpcykpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5vbktleVVwLmJpbmQodGhpcykpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5vbkZvY3VzLmJpbmQodGhpcyksIHRydWUpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLm9uQmx1ci5iaW5kKHRoaXMpLCB0cnVlKTtcbiAgICAgIC8vIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkJvZHlDbGljayk7XG4gICAgICB0aGlzLl9yZWFkeSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBnbG9iYWwgbGlzdGVuZXJzLCByZXNldCBDb21wYXNzIGNvbnRleHQuXG4gICAqL1xuICBwdWJsaWMgdW5pbml0KCk6IHZvaWQge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5vbkJsdXIsIHRydWUpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMub25Gb2N1cywgdHJ1ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5vbktleVVwKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duKTtcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5faWRQb29sID0gMDtcbiAgICB0aGlzLl9yZWFkeSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFyIENvbXBhc3MgY29udGV4dC5cbiAgICovXG4gIHB1YmxpYyBjbGVhciAoKTogdm9pZCB7XG4gICAgdGhpcy5fc2VjdGlvbnMgPSB7fTtcbiAgICB0aGlzLl9zZWN0aW9uQ291bnQgPSAwO1xuICAgIHRoaXMuX2RlZmF1bHRTZWN0aW9uSWQgPSAnJztcbiAgICB0aGlzLl9sYXN0U2VjdGlvbklkID0gJyc7XG4gICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgbGFzdCBmb2N1c2VkIGVsZW1lbnQgYW5kIHByZXZpb3VzIGVsZW1lbnQgb2YgYSBzZWN0aW9uLlxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gc2VjdGlvbiB0byByZXNldFxuICAgKi9cbiAgcHVibGljIHJlc2V0IChzZWN0aW9uSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0ubGFzdEZvY3VzZWRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5wcmV2aW91cyA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBpZCBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5fc2VjdGlvbnNbaWRdO1xuICAgICAgICBzZWN0aW9uLmxhc3RGb2N1c2VkRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgc2VjdGlvbi5wcmV2aW91cyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb25maWd1cmF0aW9uIG9mIGEgc2VjdGlvbi5cbiAgICogQHBhcmFtIHNlY3Rpb25JZCAtIHNlY3Rpb24gdG8gY29uZmlndXJlLlxuICAgKiBAcGFyYW0gY29uZmlnIC0gY29uZmlndXJhdGlvblxuICAgKi9cbiAgcHVibGljIHNldCAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQsIGNvbmZpZzogQ29uZmlndXJhdGlvbik6IGJvb2xlYW4gfCBuZXZlciB7XG4gICAgY29uc3QgZmluYWxDb25maWcgPSB7fTtcbiAgICBPYmplY3QuYXNzaWduKGZpbmFsQ29uZmlnLCB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24pO1xuICAgIE9iamVjdC5hc3NpZ24oZmluYWxDb25maWcsIGNvbmZpZyk7XG5cbiAgICBpZiAoc2VjdGlvbklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBkb2Vzbid0IGV4aXN0IWApO1xuICAgICAgfVxuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uID0gZmluYWxDb25maWcgYXMgQ29uZmlndXJhdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uID0gZmluYWxDb25maWcgYXMgQ29uZmlndXJhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gc2VjdGlvbiBpZCB0byBhZGRcbiAgICogQHBhcmFtIGNvbmZpZyAtIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNlY3Rpb25cbiAgICogQHJldHVybnMgc2VjdGlvbklkXG4gICAqL1xuICBwdWJsaWMgYWRkIChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCwgY29uZmlnOiBDb25maWd1cmF0aW9uKTogc3RyaW5nIHwgbmV2ZXIge1xuICAgIGlmICghc2VjdGlvbklkKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgIHNlY3Rpb25JZCA9IHRoaXMuZ2VuZXJhdGVJZCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZWN0aW9uIFwiJHtzZWN0aW9uSWR9XCIgYWxyZWFkeSBleGlzdCFgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSA9IHtcbiAgICAgICAgaWQ6IHNlY3Rpb25JZCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogZGVmYXVsdENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGxhc3RGb2N1c2VkRWxlbWVudDogdW5kZWZpbmVkLFxuICAgICAgICBwcmV2aW91czogdW5kZWZpbmVkXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAodGhpcy5zZXQoc2VjdGlvbklkLCBjb25maWcpKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uQ291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIHNlY3Rpb25JZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb24gdG8gcmVtb3ZlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiByZW1vdmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyByZW1vdmUgKHNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0pIHtcbiAgICAgIGlmIChkZWxldGUgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSkge1xuICAgICAgICB0aGlzLl9zZWN0aW9uQ291bnQtLTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9sYXN0U2VjdGlvbklkID09PSBzZWN0aW9uSWQpIHtcbiAgICAgICAgdGhpcy5fbGFzdFNlY3Rpb25JZCA9ICcnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIG5hdmlnYXRpb24gb24gYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgLSBpZCBvZiB0aGUgc2VjdGlvbiB0byBkaXNhYmxlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiBkaXNhYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgZGlzYWJsZSAoc2VjdGlvbklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXSAmJiB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24pIHtcbiAgICAgIHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBuYXZpZ2F0aW9uIG9uIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIC0gaWQgb2YgdGhlIHNlY3Rpb24gdG8gZW5hYmxlXG4gICAqIEByZXR1cm5zIHRydWUgaWYgc2VjdGlvbiBoYXMgYmVlbiBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHB1YmxpYyBlbmFibGUgKHNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gJiYgdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUGF1c2UgbmF2aWdhdGlvblxuICAgKi9cbiAgcHVibGljIHBhdXNlICgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXVzZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUmVzdW1lIG5hdmlnYXRpb25cbiAgICovXG4gIHB1YmxpYyByZXN1bWUgKCk6IHZvaWQge1xuICAgIHRoaXMuX3BhdXNlID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgYW4gZWxlbWVudFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGZvY3VzIChzZWN0aW9uIGlkIG9yIHNlbGVjdG9yKSwgKGFuIGVsZW1lbnQgb3IgYSBzZWN0aW9uKVxuICAgKiBAcGFyYW0gc2lsZW50ID9cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBpbmNvbWluZyBkaXJlY3Rpb25cbiAgICogQHJldHVybnMgdHJ1ZSBpZiBlbGVtZW50IGhhcyBiZWVuIGZvY3VzZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGZvY3VzIChlbGVtZW50OiBzdHJpbmcsIHNpbGVudDogYm9vbGVhbiwgZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiBib29sZWFuIHtcbiAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG4gICAgY29uc3QgYXV0b1BhdXNlID0gIXRoaXMuX3BhdXNlICYmIHNpbGVudDtcbiAgICBpZiAoYXV0b1BhdXNlKSB0aGlzLnBhdXNlKCk7XG5cbiAgICBpZiAodGhpcy5pc1NlY3Rpb24oZWxlbWVudCkpIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuZm9jdXNTZWN0aW9uKGVsZW1lbnQsIGRpcmVjdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuZm9jdXNFeHRlbmRlZFNlbGVjdG9yKGVsZW1lbnQsIGRpcmVjdGlvbiwgZmFsc2UpO1xuICAgIH1cblxuICAgIGlmIChhdXRvUGF1c2UpIHRoaXMucmVzdW1lKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb3ZlIHRvIGFub3RoZXIgZWxlbWVudFxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIC0gaW5jb21pbmcgZGlyZWN0aW9uXG4gICAqIEBwYXJhbSBzZWxlY3RvciAtIHRhcmdldCBlbGVtZW50IHNlbGVjdG9yXG4gICAqL1xuICBwdWJsaWMgbW92ZSAoZGlyZWN0aW9uOiBEaXJlY3Rpb24sIHNlbGVjdG9yOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgICBsZXQgZWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHNlbGVjdG9yKSB7XG4gICAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuY29yZS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGVsZW1lbnQgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihzZWxlY3RvcilbMF0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgIH1cblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGVsZW1lbnQpO1xuICAgIGlmICghc2VjdGlvbklkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lsbG1vdmVQcm9wZXJ0aWVzID0ge1xuICAgICAgZGlyZWN0aW9uLFxuICAgICAgc2VjdGlvbklkLFxuICAgICAgY2F1c2U6ICdhcGknXG4gICAgfTtcblxuICAgIGlmICghdGhpcy5maXJlRXZlbnQoZWxlbWVudCwgJ3dpbGxtb3ZlJywgd2lsbG1vdmVQcm9wZXJ0aWVzLCB1bmRlZmluZWQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZvY3VzTmV4dChkaXJlY3Rpb24sIGVsZW1lbnQsIHNlY3Rpb25JZCk7XG4gIH1cblxuICAvKipcbiAgICogTWFrZSBhIHNlY3Rpb24gZm9jdXNhYmxlIChtb3JlIHByZWNpc2VseSwgYWxsIGl0cyBmb2N1c2FibGUgY2hpbGRyZW4gYXJlIG1hZGUgZm9jdXNhYmxlKVxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uIHRvIG1ha2UgZm9jdXNhYmxlLCB1bmRlZmluZWQgaWYgeW91IHdhbnQgdG8gbWFrZSBhbGwgc2VjdGlvbnMgZm9jdXNhYmxlXG4gICAqL1xuICBwdWJsaWMgbWFrZUZvY3VzYWJsZSAoc2VjdGlvbklkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkIHwgbmV2ZXIge1xuICAgIGlmIChzZWN0aW9uSWQpIHtcbiAgICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdKSB7XG4gICAgICAgIHRoaXMuZG9NYWtlRm9jdXNhYmxlKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3Rpb24gXCIke3NlY3Rpb25JZH1cIiBkb2Vzbid0IGV4aXN0IWApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICAgIHRoaXMuZG9NYWtlRm9jdXNhYmxlKHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBkZWZhdWx0IHNlY3Rpb25cbiAgICogQHBhcmFtIHNlY3Rpb25JZCBpZCBvZiB0aGUgc2VjdGlvbiB0byBzZXQgYXMgZGVmYXVsdFxuICAgKi9cbiAgcHVibGljIHNldERlZmF1bHRTZWN0aW9uIChzZWN0aW9uSWQ6IHN0cmluZyk6IHZvaWQgfCBuZXZlciB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fZGVmYXVsdFNlY3Rpb25JZCA9IHNlY3Rpb25JZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTZWN0aW9uIFwiJHtzZWN0aW9uSWR9XCIgZG9lc24ndCBleGlzdCFgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgYW4gZWxlbWVudFxuICAgKi9cbiAgcHVibGljIGZvY3VzRWxlbWVudCAoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBuZXh0U2VjdGlvbklkID0gdGhpcy5nZXRTZWN0aW9uSWQoZWxlbWVudCk7XG4gICAgaWYgKCFuZXh0U2VjdGlvbklkKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICBsZXQgZW50ZXJJbnRvTmV3U2VjdGlvbiA9IHRydWU7XG4gICAgaWYgKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgY29uc3QgY3VycmVudFNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCk7XG4gICAgICBlbnRlckludG9OZXdTZWN0aW9uID0gbmV4dFNlY3Rpb25JZCA9PT0gY3VycmVudFNlY3Rpb25JZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNOYXZpZ2FibGUoZWxlbWVudCwgbmV4dFNlY3Rpb25JZCwgZmFsc2UpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZm9jdXNFbGVtZW50KGVsZW1lbnQsIG5leHRTZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24sIERpcmVjdGlvbi5VUCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBQUklWQVRFIEZVTkNUSU9OU1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHVuaXF1ZSBpZCBmb3IgYSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIG5ldyBpZCBzZWN0aW9uXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlSWQgKCk6IHN0cmluZyB7XG4gICAgbGV0IGlkOiBzdHJpbmc7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlkID0gdGhpcy5JRF9QT09MX1BSRUZJWCArIFN0cmluZygrK3RoaXMuX2lkUG9vbCk7XG4gICAgICBpZiAoIXRoaXMuX3NlY3Rpb25zW2lkXSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQgKCk6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB7IGFjdGl2ZUVsZW1lbnQgfSA9IGRvY3VtZW50O1xuICAgIGlmIChhY3RpdmVFbGVtZW50ICYmIGFjdGl2ZUVsZW1lbnQgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIHJldHVybiBhY3RpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRlbmQgKG91dDogYW55LCAuLi5hcmdzOiBhbnkpIHtcbiAgICBvdXQgPSBvdXQgfHwge307XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIWFyZ3NbaV0pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBhcmdzW2ldKSB7XG4gICAgICAgIGlmIChhcmdzW2ldLmhhc093blByb3BlcnR5KGtleSkgJiYgYXJnc1tpXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBvdXRba2V5XSA9IGFyZ3NbaV1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgcHJpdmF0ZSBleGNsdWRlIChlbGVtTGlzdDogYW55LCBleGNsdWRlZEVsZW06IGFueSkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShleGNsdWRlZEVsZW0pKSB7XG4gICAgICBleGNsdWRlZEVsZW0gPSBbZXhjbHVkZWRFbGVtXTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDAsIGluZGV4OyBpIDwgZXhjbHVkZWRFbGVtLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpbmRleCA9IGVsZW1MaXN0LmluZGV4T2YoZXhjbHVkZWRFbGVtW2ldKTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIGVsZW1MaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbGVtTGlzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBlbGVtZW50IGlzIG5hdmlnYWJsZVxuICAgKiBAcGFyYW0gZWxlbSBlbGVtZW50IHRvIGNoZWNrXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIGVsZW1lbnQncyBzZWN0aW9uXG4gICAqIEBwYXJhbSB2ZXJpZnlTZWN0aW9uU2VsZWN0b3IgaWYgdHJ1ZSwgY2hlY2sgdGhlIHNlY3Rpb24gc2VsZWN0b3JcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBlbGVtZW50IGlzIG5hdmlnYWJsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBwcml2YXRlIGlzTmF2aWdhYmxlIChlbGVtOiBIVE1MRWxlbWVudCwgc2VjdGlvbklkOiBzdHJpbmcsIHZlcmlmeVNlY3Rpb25TZWxlY3RvcjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIGlmICghZWxlbSB8fCAhc2VjdGlvbklkIHx8ICF0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdIHx8IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoKGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwKSB8fCBlbGVtLmhhc0F0dHJpYnV0ZSgnZGlzYWJsZWQnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodmVyaWZ5U2VjdGlvblNlbGVjdG9yICYmICF0aGlzLmNvcmUubWF0Y2hTZWxlY3RvcihlbGVtLCB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2VsZWN0b3IhKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXS5jb25maWd1cmF0aW9uLm5hdmlnYWJsZUZpbHRlciAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5uYXZpZ2FibGVGaWx0ZXIhKGVsZW0sIHNlY3Rpb25JZCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZ2xvYmFsQ29uZmlndXJhdGlvbi5uYXZpZ2FibGVGaWx0ZXIgIT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24ubmF2aWdhYmxlRmlsdGVyIShlbGVtLCBzZWN0aW9uSWQpID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZWxlbWVudCdzIHNlY3Rpb24gaWRcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudFxuICAgKiBAcmV0dXJucyB0aGUgZWxlbWVudCdzIHNlY3Rpb24gaWRcbiAgICovXG4gIHByaXZhdGUgZ2V0U2VjdGlvbklkIChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc2VjdGlvbnNFbGVtZW50czogYW55ID0ge307XG4gICAgZm9yIChjb25zdCBpZCBpbiB0aGlzLl9zZWN0aW9ucykge1xuICAgICAgaWYgKCF0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5kaXNhYmxlZCkge1xuICAgICAgICBjb25zdCBzZWN0aW9uRWxlbWVudCA9IHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmVsZW1lbnQ7XG4gICAgICAgIGlmIChzZWN0aW9uRWxlbWVudCkge1xuICAgICAgICAgIHNlY3Rpb25zRWxlbWVudHNbaWRdID0gc2VjdGlvbkVsZW1lbnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLnNlbGVjdG9yICE9PSAnJyAmJiB0aGlzLl9zZWN0aW9uc1tpZF0uY29uZmlndXJhdGlvbi5zZWxlY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50V2l0aFNlbGVjdG9yID0gdGhpcy5jb3JlLnBhcnNlU2VsZWN0b3IoYFtkYXRhLXNlY3Rpb24taWQ9XCIke2lkfVwiXWApWzBdXG4gICAgICAgICAgICBpZiAoZWxlbWVudFdpdGhTZWxlY3Rvcikge1xuICAgICAgICAgICAgICBzZWN0aW9uc0VsZW1lbnRzW2lkXSA9IGVsZW1lbnRXaXRoU2VsZWN0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBhcmVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gZWxlbWVudDtcbiAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICBpZiAoT2JqZWN0LnZhbHVlcyhzZWN0aW9uc0VsZW1lbnRzKS5pbmRleE9mKHBhcmVudCkgPiAtMSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoc2VjdGlvbnNFbGVtZW50cykuZmluZCgoa2V5KSA9PiBzZWN0aW9uc0VsZW1lbnRzW2tleV0gPT09IHBhcmVudCk7XG4gICAgICB9XG4gICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbmF2aWdhYmxlIGVsZW1lbnRzIGludG8gYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb25cbiAgICovXG4gIHByaXZhdGUgZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzIChzZWN0aW9uSWQ6IHN0cmluZyk6IG5ldmVyW10ge1xuICAgIHJldHVybiB0aGlzLmNvcmUucGFyc2VTZWxlY3Rvcih0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24uc2VsZWN0b3IhKVxuICAgICAgLmZpbHRlcigoZWxlbWVudCkgPT4gdGhpcy5pc05hdmlnYWJsZShlbGVtZW50LCBzZWN0aW9uSWQsIGZhbHNlKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBkZWZhdWx0IGVsZW1lbnQgb2YgYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb25cbiAgICogQHJldHVybnMgdGhlIGRlZmF1bHQgZWxlbWVudCBvZiBhIHNlY3Rpb24sIG51bGwgaWYgbm8gZGVmYXVsdCBlbGVtZW50IGZvdW5kXG4gICAqL1xuICBwcml2YXRlIGdldFNlY3Rpb25EZWZhdWx0RWxlbWVudCAoc2VjdGlvbklkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIGNvbnN0IHsgZGVmYXVsdEVsZW1lbnQgfSA9IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbjtcbiAgICBpZiAoIWRlZmF1bHRFbGVtZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihkZWZhdWx0RWxlbWVudCk7XG4gICAgLy8gY2hlY2sgZWFjaCBlbGVtZW50IHRvIHNlZSBpZiBpdCdzIG5hdmlnYWJsZSBhbmQgc3RvcCB3aGVuIG9uZSBoYXMgYmVlbiBmb3VuZFxuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgaWYgKHRoaXMuaXNOYXZpZ2FibGUoZWxlbWVudCwgc2VjdGlvbklkLCB0cnVlKSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsYXN0IGZvY3VzZWQgZWxlbWVudCBpbnRvIGEgc2VjdGlvblxuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBzZWN0aW9uXG4gICAqIEByZXR1cm5zIHRoZSBsYXN0IGZvY3VzZWQgZWxlbWVudCwgbnVsbCBpZiBubyBlbGVtZW50IGZvdW5kXG4gICAqL1xuICBwcml2YXRlIGdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQgKHNlY3Rpb25JZDogYW55KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB7IGxhc3RGb2N1c2VkRWxlbWVudCB9ID0gdGhpcy5fc2VjdGlvbnNbc2VjdGlvbklkXTtcbiAgICBpZiAobGFzdEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBpZiAoIXRoaXMuaXNOYXZpZ2FibGUobGFzdEZvY3VzZWRFbGVtZW50LCBzZWN0aW9uSWQsIHRydWUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhc3RGb2N1c2VkRWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogZmlyZSBhbiBldmVudFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHNvdXJjZVxuICAgKiBAcGFyYW0gdHlwZSB0eXBlIG9mIGV2ZW50XG4gICAqIEBwYXJhbSBkZXRhaWxzID9cbiAgICogQHBhcmFtIGNhbmNlbGFibGUgdHJ1ZSBpZiBjYW5jZWxhYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybnMgdHJ1ZSBpZiBldmVudCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZGlzcGF0Y2hlZFxuICAgKi9cbiAgcHJpdmF0ZSBmaXJlRXZlbnQgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbHM6IGFueSwgY2FuY2VsYWJsZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDQpIHtcbiAgICAgIGNhbmNlbGFibGUgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBldnQuaW5pdEN1c3RvbUV2ZW50KHRoaXMuRVZFTlRfUFJFRklYICsgdHlwZSwgdHJ1ZSwgY2FuY2VsYWJsZSwgZGV0YWlscyk7XG4gICAgcmV0dXJuIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIGZvY3VzIGFuZCBzY3JvbGwgb24gZWxlbWVudFxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGZvY3VzXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb24gY29udGFpbmluZyB0aGUgZWxlbWVudFxuICAgKiBAcGFyYW0gZW50ZXJJbnRvTmV3U2VjdGlvbiB0cnVlIGlmIHdlIGVudGVyIGludG8gdGhlIHNlY3Rpb24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHJpdmF0ZSBmb2N1c05TY3JvbGwgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgZW50ZXJJbnRvTmV3U2VjdGlvbjogYm9vbGVhbik6IHZvaWQge1xuICAgIGxldCBzY3JvbGxPcHRpb25zID0gZW50ZXJJbnRvTmV3U2VjdGlvbiA/IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5zY3JvbGxPcHRpb25zXG4gICAgICA6IHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5zY3JvbGxPcHRpb25zSW50b1NlY3Rpb247XG4gICAgLy8gaWYgbm8tc2Nyb2xsIGdpdmVuIGFzIHNjcm9sbE9wdGlvbnMsIHRoZW4gZm9jdXMgd2l0aG91dCBzY3JvbGxpbmdcbiAgICBpZiAoc2Nyb2xsT3B0aW9ucyA9PT0gJ25vLXNjcm9sbCcpIHtcbiAgICAgIGVsZW1lbnQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICAgIH0gZWxzZSBpZiAoc2Nyb2xsT3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9wdGlvbnMgIT09ICcnICYmICEoc2Nyb2xsT3B0aW9ucyBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgIGVsZW1lbnQuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICAgICAgZWxlbWVudC5zY3JvbGxJbnRvVmlldyhzY3JvbGxPcHRpb25zIGFzIFNjcm9sbEludG9WaWV3T3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24pIHtcbiAgICAgIHNjcm9sbE9wdGlvbnMgPSBlbnRlckludG9OZXdTZWN0aW9uID8gdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLnNjcm9sbE9wdGlvbnMgOiB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24uc2Nyb2xsT3B0aW9uc0ludG9TZWN0aW9uO1xuICAgICAgaWYgKHNjcm9sbE9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPcHRpb25zICE9PSAnJyAmJiBzY3JvbGxPcHRpb25zICE9PSAnbm8tc2Nyb2xsJykge1xuICAgICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICAgICAgZWxlbWVudC5zY3JvbGxJbnRvVmlldyhzY3JvbGxPcHRpb25zIGFzIFNjcm9sbEludG9WaWV3T3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbVxuICAgKiBAcGFyYW0gc2VjdGlvbklkXG4gICAqL1xuICBwcml2YXRlIGZvY3VzQ2hhbmdlZCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlY3Rpb25JZDogc3RyaW5nKSB7XG4gICAgbGV0IGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBzZWN0aW9uSWQ7XG4gICAgaWYgKCFpZCkge1xuICAgICAgaWQgPSB0aGlzLmdldFNlY3Rpb25JZChlbGVtZW50KTtcbiAgICB9XG4gICAgaWYgKGlkKSB7XG4gICAgICB0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmxhc3RGb2N1c2VkRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLl9sYXN0U2VjdGlvbklkID0gc2VjdGlvbklkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2lsZW50Rm9jdXMgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzZWN0aW9uSWQ6IHN0cmluZywgc2Nyb2xsSW50b05ld1NlY3Rpb246IGJvb2xlYW4pIHtcbiAgICBjb25zdCBjdXJyZW50Rm9jdXNlZEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQuYmx1cigpO1xuICAgIH1cbiAgICB0aGlzLmZvY3VzTlNjcm9sbChlbGVtZW50LCBzZWN0aW9uSWQsIHNjcm9sbEludG9OZXdTZWN0aW9uKTtcbiAgICB0aGlzLmZvY3VzQ2hhbmdlZChlbGVtZW50LCBzZWN0aW9uSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzIGFuIGVsZW1lbnRcbiAgICogQHBhcmFtIGVsZW0gZWxlbWVudCB0byBmb2N1c1xuICAgKiBAcGFyYW0gc2VjdGlvbklkIGlkIG9mIHRoZSBlbGVtZW50J3Mgc2VjdGlvblxuICAgKiBAcGFyYW0gZW50ZXJJbnRvTmV3U2VjdGlvbiB0cnVlIGlmIG5ldyBzZWN0aW9uIGlzIGZvY3VzZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIHNvdXJjZSBkaXJlY3Rpb25cbiAgICovXG4gIHByaXZhdGUgX2ZvY3VzRWxlbWVudCAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlY3Rpb25JZDogc3RyaW5nLCBlbnRlckludG9OZXdTZWN0aW9uOiBib29sZWFuLCBkaXJlY3Rpb24/OiBEaXJlY3Rpb24pIHtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0Q3VycmVudEZvY3VzZWRFbGVtZW50KCk7XG5cbiAgICBpZiAodGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UpIHtcbiAgICAgIHRoaXMuc2lsZW50Rm9jdXMoZWxlbWVudCwgc2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLl9wYXVzZSkge1xuICAgICAgdGhpcy5zaWxlbnRGb2N1cyhlbGVtZW50LCBzZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24pO1xuICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50Rm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHVuZm9jdXNQcm9wZXJ0aWVzID0ge1xuICAgICAgICBuZXh0RWxlbWVudDogZWxlbWVudCxcbiAgICAgICAgbmV4dFNlY3Rpb25JZDogc2VjdGlvbklkLFxuICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgIG5hdGl2ZTogZmFsc2VcbiAgICAgIH07XG4gICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ3dpbGx1bmZvY3VzJywgdW5mb2N1c1Byb3BlcnRpZXMsIHVuZGVmaW5lZCkpIHtcbiAgICAgICAgdGhpcy5fZHVyaW5nRm9jdXNDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LmJsdXIoKTtcbiAgICAgIHRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ3VuZm9jdXNlZCcsIHVuZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgY29uc3QgZm9jdXNQcm9wZXJ0aWVzID0ge1xuICAgICAgcHJldmlvdXNFbGVtZW50OiBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICBzZWN0aW9uSWQsXG4gICAgICBkaXJlY3Rpb24sXG4gICAgICBuYXRpdmU6IGZhbHNlXG4gICAgfTtcbiAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGVsZW1lbnQsICd3aWxsZm9jdXMnLCBmb2N1c1Byb3BlcnRpZXMpKSB7XG4gICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmZvY3VzTlNjcm9sbChlbGVtZW50LCBzZWN0aW9uSWQsIGVudGVySW50b05ld1NlY3Rpb24pO1xuICAgIHRoaXMuZmlyZUV2ZW50KGVsZW1lbnQsICdmb2N1c2VkJywgZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG5cbiAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5mb2N1c0NoYW5nZWQoZWxlbWVudCwgc2VjdGlvbklkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBwcml2YXRlIGZvY3VzRXh0ZW5kZWRTZWxlY3RvciAoc2VsZWN0b3I6IHN0cmluZywgZGlyZWN0aW9uOiBEaXJlY3Rpb24sIGVudGVySW50b05ld1NlY3Rpb246IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBpZiAoc2VsZWN0b3IuY2hhckF0KDApID09PSAnQCcpIHtcbiAgICAgIGlmIChzZWxlY3Rvci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9jdXNTZWN0aW9uKHVuZGVmaW5lZCwgZGlyZWN0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNlY3Rpb25JZCA9IHNlbGVjdG9yLnN1YnN0cigxKTtcbiAgICAgIHJldHVybiB0aGlzLmZvY3VzU2VjdGlvbihzZWN0aW9uSWQsIGRpcmVjdGlvbik7XG4gICAgfVxuICAgIGNvbnN0IG5leHQgPSB0aGlzLmNvcmUucGFyc2VTZWxlY3RvcihzZWxlY3RvcilbMF07XG4gICAgaWYgKG5leHQpIHtcbiAgICAgIGNvbnN0IG5leHRTZWN0aW9uSWQgPSB0aGlzLmdldFNlY3Rpb25JZChuZXh0KTtcbiAgICAgIGlmIChuZXh0U2VjdGlvbklkKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTmF2aWdhYmxlKG5leHQsIG5leHRTZWN0aW9uSWQsIGZhbHNlKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9mb2N1c0VsZW1lbnQobmV4dCwgbmV4dFNlY3Rpb25JZCwgZW50ZXJJbnRvTmV3U2VjdGlvbiwgZGlyZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGFkZFJhbmdlIChpZDogc3RyaW5nLCByYW5nZTogc3RyaW5nIFtdKSB7XG4gICAgaWYgKGlkICYmIHJhbmdlLmluZGV4T2YoaWQpIDwgMCAmJiB0aGlzLl9zZWN0aW9uc1tpZF0gJiYgIXRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmRpc2FibGVkKSB7XG4gICAgICByYW5nZS5wdXNoKGlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgYSBzZWN0aW9uXG4gICAqIEBwYXJhbSBzZWN0aW9uSWQgaWQgb2YgdGhlIHNlY3Rpb25cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBkaXJlY3Rpb25cbiAgICogQHJldHVybnMgdHJ1ZSBpZiBzZWN0aW9uIGhhcyBiZWVuIGZvY3VzZWRcbiAgICovXG4gIHByaXZhdGUgZm9jdXNTZWN0aW9uIChzZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCwgZGlyZWN0aW9uOiBEaXJlY3Rpb24pOiBib29sZWFuIHtcbiAgICBjb25zdCByYW5nZTogc3RyaW5nIFtdID0gW107XG5cbiAgICBpZiAoc2VjdGlvbklkKSB7XG4gICAgICB0aGlzLmFkZFJhbmdlKHNlY3Rpb25JZCwgcmFuZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFkZFJhbmdlKHRoaXMuX2RlZmF1bHRTZWN0aW9uSWQsIHJhbmdlKTtcbiAgICAgIHRoaXMuYWRkUmFuZ2UodGhpcy5fbGFzdFNlY3Rpb25JZCwgcmFuZ2UpO1xuICAgICAgZm9yIChjb25zdCBzZWN0aW9uIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICAgIHRoaXMuYWRkUmFuZ2Uoc2VjdGlvbiwgcmFuZ2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGlkID0gcmFuZ2VbaV07XG4gICAgICBsZXQgbmV4dDtcblxuICAgICAgaWYgKHRoaXMuX3NlY3Rpb25zW2lkXS5jb25maWd1cmF0aW9uLmVudGVyVG8gPT09ICdsYXN0LWZvY3VzZWQnKSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQoaWQpXG4gICAgICAgICAgICAgICB8fCB0aGlzLmdldFNlY3Rpb25EZWZhdWx0RWxlbWVudChpZClcbiAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKGlkKVswXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmdldFNlY3Rpb25EZWZhdWx0RWxlbWVudChpZClcbiAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbkxhc3RGb2N1c2VkRWxlbWVudChpZClcbiAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzKGlkKVswXTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvY3VzRWxlbWVudChuZXh0LCBpZCwgdHJ1ZSwgZGlyZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpcmUgZXZlbnQgd2hlbiBuYXZpZ2F0ZSBoYXMgZmFpbGVkXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgc291cmNlXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gZGlyZWN0aW9uIHNvdXJjZVxuICAgKiBAcmV0dXJucyB0cnVlIGlmIGV2ZW50IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSByYWlzZWRcbiAgICovXG4gIHByaXZhdGUgZmlyZU5hdmlnYXRlRmFpbGVkIChlbGVtZW50OiBIVE1MRWxlbWVudCwgZGlyZWN0aW9uOiBEaXJlY3Rpb24pIHtcbiAgICByZXR1cm4gdGhpcy5maXJlRXZlbnQoZWxlbWVudCwgJ25hdmlnYXRlZmFpbGVkJywge1xuICAgICAgZGlyZWN0aW9uXG4gICAgfSwgZmFsc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBnb1RvTGVhdmVGb3IgKHNlY3Rpb25JZDogc3RyaW5nLCBkaXJlY3Rpb246IERpcmVjdGlvbikge1xuICAgIGlmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubGVhdmVGb3JcbiAgICAgICYmICh0aGlzLl9zZWN0aW9uc1tzZWN0aW9uSWRdLmNvbmZpZ3VyYXRpb24ubGVhdmVGb3IgYXMgYW55KVtkaXJlY3Rpb250b1N0cmluZyhkaXJlY3Rpb24pXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXh0ID0gKHRoaXMuX3NlY3Rpb25zW3NlY3Rpb25JZF0uY29uZmlndXJhdGlvbi5sZWF2ZUZvciBhcyBhbnkpW2RpcmVjdGlvbnRvU3RyaW5nKGRpcmVjdGlvbildO1xuICAgICAgaWYgKG5leHQgPT09ICcnIHx8IG5leHQgPT09ICdub3doZXJlJykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmZvY3VzRXh0ZW5kZWRTZWxlY3RvcihuZXh0LCBkaXJlY3Rpb24sIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRm9jdXMgbmV4dCBlbGVtZW50XG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gc291cmNlIGRpcmVjdGlvblxuICAgKiBAcGFyYW0gY3VycmVudEZvY3VzZWRFbGVtZW50IGN1cnJlbnQgZm9jdXNlZCBlbGVtZW50XG4gICAqIEBwYXJhbSBjdXJyZW50U2VjdGlvbklkIGN1cnJlbnQgc2VjdGlvbiBpZFxuICAgKiBAcmV0dXJucyB0cnVlIGlmIG5leHQgaGFzIGJlZW4gZm9jdXNlZCBzdWNjZXNzZnVsbHlcbiAgICovXG4gIHByaXZhdGUgZm9jdXNOZXh0IChkaXJlY3Rpb246IERpcmVjdGlvbiwgY3VycmVudEZvY3VzZWRFbGVtZW50OiBIVE1MRWxlbWVudCwgY3VycmVudFNlY3Rpb25JZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZXh0U2VsZWN0b3IgPSBjdXJyZW50Rm9jdXNlZEVsZW1lbnQuZ2V0QXR0cmlidXRlKGBkYXRhLXNuLSR7ZGlyZWN0aW9ufWApO1xuXG4gICAgLy8gVE8gRE8gcmVtb3ZlIHR5cGVvZlxuICAgIGlmICh0eXBlb2YgZXh0U2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoZXh0U2VsZWN0b3IgPT09ICcnXG4gICAgICAgICAgfHwgIXRoaXMuZm9jdXNFeHRlbmRlZFNlbGVjdG9yKGV4dFNlbGVjdG9yLCBkaXJlY3Rpb24sIGZhbHNlKSkgeyAvLyB3aGhpY2ggdmFsdWUgZm9yIGVudGVySW50b05ld1NlY3Rpb24gPyB0cnVlIG9yIGZhbHNlID8/P1xuICAgICAgICB0aGlzLmZpcmVOYXZpZ2F0ZUZhaWxlZChjdXJyZW50Rm9jdXNlZEVsZW1lbnQsIGRpcmVjdGlvbik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY3Rpb25OYXZpZ2FibGVFbGVtZW50czogYW55ID0ge307XG4gICAgbGV0IGFsbE5hdmlnYWJsZUVsZW1lbnRzOiBhbnkgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGlkIGluIHRoaXMuX3NlY3Rpb25zKSB7XG4gICAgICBzZWN0aW9uTmF2aWdhYmxlRWxlbWVudHNbaWRdID0gdGhpcy5nZXRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMoaWQpIGFzIEhUTUxFbGVtZW50W107XG4gICAgICBhbGxOYXZpZ2FibGVFbGVtZW50cyA9IGFsbE5hdmlnYWJsZUVsZW1lbnRzLmNvbmNhdChzZWN0aW9uTmF2aWdhYmxlRWxlbWVudHNbaWRdKTtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBjb25maWc6IENvbmZpZ3VyYXRpb24gPSB0aGlzLmV4dGVuZCh7fSwgdGhpcy5nbG9iYWxDb25maWd1cmF0aW9uLCB0aGlzLl9zZWN0aW9uc1tjdXJyZW50U2VjdGlvbklkXS5jb25maWd1cmF0aW9uKTtcbiAgICBsZXQgbmV4dDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIGNvbnN0IGN1cnJlbnRTZWN0aW9uID0gdGhpcy5fc2VjdGlvbnNbY3VycmVudFNlY3Rpb25JZF07XG5cbiAgICBpZiAoY3VycmVudFNlY3Rpb24uY29uZmlndXJhdGlvbi5yZXN0cmljdCA9PT0gJ3NlbGYtb25seScgfHwgY3VycmVudFNlY3Rpb24uY29uZmlndXJhdGlvbi5yZXN0cmljdCA9PT0gJ3NlbGYtZmlyc3QnKSB7XG4gICAgICBjb25zdCBjdXJyZW50U2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzID0gc2VjdGlvbk5hdmlnYWJsZUVsZW1lbnRzW2N1cnJlbnRTZWN0aW9uSWRdO1xuXG4gICAgICBuZXh0ID0gdGhpcy5jb3JlLm5hdmlnYXRlKFxuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgdGhpcy5leGNsdWRlKGN1cnJlbnRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMsIGN1cnJlbnRGb2N1c2VkRWxlbWVudCksXG4gICAgICAgIGN1cnJlbnRTZWN0aW9uXG4gICAgICApO1xuXG4gICAgICBpZiAoIW5leHQgJiYgY3VycmVudFNlY3Rpb24uY29uZmlndXJhdGlvbi5yZXN0cmljdCA9PT0gJ3NlbGYtZmlyc3QnKSB7XG4gICAgICAgIG5leHQgPSB0aGlzLmNvcmUubmF2aWdhdGUoXG4gICAgICAgICAgY3VycmVudEZvY3VzZWRFbGVtZW50LFxuICAgICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgICB0aGlzLmV4Y2x1ZGUoYWxsTmF2aWdhYmxlRWxlbWVudHMsIGN1cnJlbnRTZWN0aW9uTmF2aWdhYmxlRWxlbWVudHMpLFxuICAgICAgICAgIGN1cnJlbnRTZWN0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQgPSB0aGlzLmNvcmUubmF2aWdhdGUoXG4gICAgICAgIGN1cnJlbnRGb2N1c2VkRWxlbWVudCxcbiAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICB0aGlzLmV4Y2x1ZGUoYWxsTmF2aWdhYmxlRWxlbWVudHMsIGN1cnJlbnRGb2N1c2VkRWxlbWVudCksXG4gICAgICAgIGN1cnJlbnRTZWN0aW9uXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChuZXh0KSB7XG4gICAgICBjdXJyZW50U2VjdGlvbi5wcmV2aW91cyA9IHtcbiAgICAgICAgdGFyZ2V0OiBjdXJyZW50Rm9jdXNlZEVsZW1lbnQsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBuZXh0LFxuICAgICAgICByZXZlcnNlOiBnZXRSZXZlcnNlRGlyZWN0aW9uKGRpcmVjdGlvbilcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG5leHRTZWN0aW9uSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0U2VjdGlvbklkKG5leHQpO1xuICAgICAgbGV0IGVudGVySW50b05ld1NlY3Rpb24gPSBmYWxzZTtcbiAgICAgIGlmIChjdXJyZW50U2VjdGlvbklkICE9PSBuZXh0U2VjdGlvbklkICYmIG5leHRTZWN0aW9uSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBXZSBlbnRlciBpbnRvIGFub3RoZXIgc2VjdGlvblxuICAgICAgICBlbnRlckludG9OZXdTZWN0aW9uID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBib29sZWFuIHwgbnVsbCA9IHRoaXMuZ29Ub0xlYXZlRm9yKGN1cnJlbnRTZWN0aW9uSWQsIGRpcmVjdGlvbik7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5maXJlTmF2aWdhdGVGYWlsZWQoY3VycmVudEZvY3VzZWRFbGVtZW50LCBkaXJlY3Rpb24pO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBlbnRlclRvRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICAgICAgc3dpdGNoICh0aGlzLl9zZWN0aW9uc1tuZXh0U2VjdGlvbklkXS5jb25maWd1cmF0aW9uLmVudGVyVG8pIHtcbiAgICAgICAgICBjYXNlICdsYXN0LWZvY3VzZWQnOlxuICAgICAgICAgICAgZW50ZXJUb0VsZW1lbnQgPSB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQobmV4dFNlY3Rpb25JZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTZWN0aW9uRGVmYXVsdEVsZW1lbnQobmV4dFNlY3Rpb25JZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdkZWZhdWx0LWVsZW1lbnQnOlxuICAgICAgICAgICAgZW50ZXJUb0VsZW1lbnQgPSB0aGlzLmdldFNlY3Rpb25EZWZhdWx0RWxlbWVudChuZXh0U2VjdGlvbklkKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW50ZXJUb0VsZW1lbnQpIHtcbiAgICAgICAgICBuZXh0ID0gZW50ZXJUb0VsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5leHRTZWN0aW9uSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvY3VzRWxlbWVudChuZXh0LCBuZXh0U2VjdGlvbklkLCBlbnRlckludG9OZXdTZWN0aW9uLCBkaXJlY3Rpb24pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5nb1RvTGVhdmVGb3IoY3VycmVudFNlY3Rpb25JZCwgZGlyZWN0aW9uKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRoaXMuZmlyZU5hdmlnYXRlRmFpbGVkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgZGlyZWN0aW9uKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHByZXZlbnREZWZhdWx0IChldnQ6IEV2ZW50KTogYm9vbGVhbiB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgb25LZXlEb3duIChldnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fdGhyb3R0bGUpIHtcbiAgICAgIHRoaXMucHJldmVudERlZmF1bHQoZXZ0KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLl90aHJvdHRsZSA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX3Rocm90dGxlID0gbnVsbDtcbiAgICB9LCB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24udGhyb3R0bGUpO1xuXG4gICAgaWYgKCF0aGlzLl9zZWN0aW9uQ291bnQgfHwgdGhpcy5fcGF1c2VcbiAgICAgIHx8IGV2dC5hbHRLZXkgfHwgZXZ0LmN0cmxLZXkgfHwgZXZ0Lm1ldGFLZXkgfHwgZXZ0LnNoaWZ0S2V5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGN1cnJlbnRGb2N1c2VkRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSBldnQua2V5Q29kZSBhcyB1bmtub3duIGFzIERpcmVjdGlvbjtcbiAgICBpZiAoIWRpcmVjdGlvbikge1xuICAgICAgaWYgKGV2dC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldEN1cnJlbnRGb2N1c2VkRWxlbWVudCgpO1xuICAgICAgICBpZiAoY3VycmVudEZvY3VzZWRFbGVtZW50ICYmIHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCkpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ2VudGVyLWRvd24nLCB1bmRlZmluZWQsIHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcblxuICAgIGlmICghY3VycmVudEZvY3VzZWRFbGVtZW50KSB7XG4gICAgICBpZiAodGhpcy5fbGFzdFNlY3Rpb25JZCkge1xuICAgICAgICBjdXJyZW50Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLmdldFNlY3Rpb25MYXN0Rm9jdXNlZEVsZW1lbnQodGhpcy5fbGFzdFNlY3Rpb25JZCk7XG4gICAgICB9XG4gICAgICBpZiAoIWN1cnJlbnRGb2N1c2VkRWxlbWVudCkge1xuICAgICAgICB0aGlzLmZvY3VzU2VjdGlvbih1bmRlZmluZWQsIGRpcmVjdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzLnByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGN1cnJlbnRGb2N1c2VkRWxlbWVudCk7XG4gICAgaWYgKCFjdXJyZW50U2VjdGlvbklkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lsbG1vdmVQcm9wZXJ0aWVzID0ge1xuICAgICAgZGlyZWN0aW9uLFxuICAgICAgc2VjdGlvbklkOiBjdXJyZW50U2VjdGlvbklkLFxuICAgICAgY2F1c2U6ICdrZXlkb3duJ1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5maXJlRXZlbnQoY3VycmVudEZvY3VzZWRFbGVtZW50LCAnd2lsbG1vdmUnLCB3aWxsbW92ZVByb3BlcnRpZXMpKSB7XG4gICAgICB0aGlzLmZvY3VzTmV4dChkaXJlY3Rpb24sIGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgY3VycmVudFNlY3Rpb25JZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucHJldmVudERlZmF1bHQoZXZ0KTtcbiAgfVxuXG4gIHByaXZhdGUgb25LZXlVcCAoZXZ0OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgaWYgKGV2dC5hbHRLZXkgfHwgZXZ0LmN0cmxLZXkgfHwgZXZ0Lm1ldGFLZXkgfHwgZXZ0LnNoaWZ0S2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdGhpcy5fcGF1c2UgJiYgdGhpcy5fc2VjdGlvbkNvdW50ICYmIGV2dC5rZXlDb2RlID09PSAxMykge1xuICAgICAgY29uc3QgY3VycmVudEZvY3VzZWRFbGVtZW50ID0gdGhpcy5nZXRDdXJyZW50Rm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgIGlmIChjdXJyZW50Rm9jdXNlZEVsZW1lbnQgJiYgdGhpcy5nZXRTZWN0aW9uSWQoY3VycmVudEZvY3VzZWRFbGVtZW50KSkge1xuICAgICAgICBpZiAoIXRoaXMuZmlyZUV2ZW50KGN1cnJlbnRGb2N1c2VkRWxlbWVudCwgJ2VudGVyLXVwJywgdW5kZWZpbmVkLCB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkZvY3VzIChldnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgeyB0YXJnZXQgfSA9IGV2dDtcbiAgICBjb25zdCBodG1sVGFyZ2V0OiBIVE1MRWxlbWVudCA9IHRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0ICE9PSB3aW5kb3cgJiYgdGFyZ2V0ICE9PSBkb2N1bWVudFxuICAgICAgJiYgdGhpcy5fc2VjdGlvbkNvdW50ICYmICF0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSAmJiB0YXJnZXQpIHtcbiAgICAgIGNvbnN0IHNlY3Rpb25JZCA9IHRoaXMuZ2V0U2VjdGlvbklkKGh0bWxUYXJnZXQpO1xuICAgICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgICBpZiAodGhpcy5fcGF1c2UpIHtcbiAgICAgICAgICB0aGlzLmZvY3VzQ2hhbmdlZChodG1sVGFyZ2V0LCBzZWN0aW9uSWQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvY3VzUHJvcGVydGllcyA9IHtcbiAgICAgICAgICBzZWN0aW9uSWQsXG4gICAgICAgICAgbmF0aXZlOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF0aGlzLmZpcmVFdmVudChodG1sVGFyZ2V0LCAnd2lsbGZvY3VzJywgZm9jdXNQcm9wZXJ0aWVzKSkge1xuICAgICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICBodG1sVGFyZ2V0LmJsdXIoKTtcbiAgICAgICAgICB0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZmlyZUV2ZW50KGh0bWxUYXJnZXQsICdmb2N1c2VkJywgZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5mb2N1c0NoYW5nZWQoaHRtbFRhcmdldCwgc2VjdGlvbklkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25CbHVyIChldnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgdGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwgPSBldnQudGFyZ2V0O1xuICAgIGNvbnN0IGh0bWxUYXJnZXQ6IEhUTUxFbGVtZW50ID0gdGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIGlmICh0YXJnZXQgIT09IHdpbmRvdyAmJiB0YXJnZXQgIT09IGRvY3VtZW50ICYmICF0aGlzLl9wYXVzZVxuICAgICAgJiYgdGhpcy5fc2VjdGlvbkNvdW50ICYmICF0aGlzLl9kdXJpbmdGb2N1c0NoYW5nZSAmJiB0aGlzLmdldFNlY3Rpb25JZChodG1sVGFyZ2V0KSkge1xuICAgICAgY29uc3QgdW5mb2N1c1Byb3BlcnRpZXMgPSB7XG4gICAgICAgIG5hdGl2ZTogdHJ1ZVxuICAgICAgfTtcbiAgICAgIGlmICghdGhpcy5maXJlRXZlbnQoaHRtbFRhcmdldCwgJ3dpbGx1bmZvY3VzJywgdW5mb2N1c1Byb3BlcnRpZXMpKSB7XG4gICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaHRtbFRhcmdldC5mb2N1cygpO1xuICAgICAgICAgIHRoaXMuX2R1cmluZ0ZvY3VzQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5maXJlRXZlbnQoaHRtbFRhcmdldCwgJ3VuZm9jdXNlZCcsIHVuZm9jdXNQcm9wZXJ0aWVzLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc1NlY3Rpb24gKHNlY3Rpb25JZDogc3RyaW5nIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gICAgaWYgKHNlY3Rpb25JZCkge1xuICAgICAgcmV0dXJuIHNlY3Rpb25JZCBpbiB0aGlzLl9zZWN0aW9ucztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIFRPIFJFTU9WRSA/Pz9cbiAgcHJpdmF0ZSBvbkJvZHlDbGljayAoKSB7XG4gICAgaWYgKHRoaXMuX3NlY3Rpb25zW3RoaXMuX2xhc3RTZWN0aW9uSWRdKSB7XG4gICAgICBjb25zdCBsYXN0Rm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9zZWN0aW9uc1t0aGlzLl9sYXN0U2VjdGlvbklkXS5sYXN0Rm9jdXNlZEVsZW1lbnQ7XG4gICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gZG9jdW1lbnQuYm9keSAmJiB0aGlzLl9sYXN0U2VjdGlvbklkXG4gICAgICAgICYmIGxhc3RGb2N1c2VkRWxlbWVudCkge1xuICAgICAgICB0aGlzLl9mb2N1c0VsZW1lbnQobGFzdEZvY3VzZWRFbGVtZW50LCB0aGlzLl9sYXN0U2VjdGlvbklkLCB0cnVlLCB1bmRlZmluZWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlIGZvY3VzYWJsZSBlbGVtZW50cyBvZiBhIHNlY3Rpb24uXG4gICAqIEBwYXJhbSBjb25maWd1cmF0aW9uIGNvbmZpZ3VyYXRpb24gb2YgdGhlIHNlY3Rpb24gdG8gbWFsZSBmb2N1c2FibGUgP1xuICAgKi9cbiAgcHJpdmF0ZSBkb01ha2VGb2N1c2FibGUgKGNvbmZpZ3VyYXRpb246IENvbmZpZ3VyYXRpb24pOiB2b2lkIHtcbiAgICBsZXQgdGFiSW5kZXhJZ25vcmVMaXN0OiBzdHJpbmc7XG4gICAgaWYgKGNvbmZpZ3VyYXRpb24udGFiSW5kZXhJZ25vcmVMaXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhYkluZGV4SWdub3JlTGlzdCA9IGNvbmZpZ3VyYXRpb24udGFiSW5kZXhJZ25vcmVMaXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWJJbmRleElnbm9yZUxpc3QgPSB0aGlzLmdsb2JhbENvbmZpZ3VyYXRpb24udGFiSW5kZXhJZ25vcmVMaXN0ITtcbiAgICB9XG5cbiAgICB0aGlzLmNvcmUucGFyc2VTZWxlY3Rvcihjb25maWd1cmF0aW9uLnNlbGVjdG9yISkuZm9yRWFjaCgoZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgIGlmICghdGhpcy5jb3JlLm1hdGNoU2VsZWN0b3IoZWxlbWVudCwgdGFiSW5kZXhJZ25vcmVMaXN0KSkge1xuICAgICAgICBjb25zdCBodG1sRWxlbWVudCA9IGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmICghaHRtbEVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgLy8gc2V0IHRoZSB0YWJpbmRleCB3aXRoIGEgbmVnYXRpdmUgdmFsdWUuIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvR2xvYmFsX2F0dHJpYnV0ZXMvdGFiaW5kZXhcbiAgICAgICAgICBodG1sRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG59XG5cbmNvbnN0IHNuID0gQ29tcGFzcy5nZXRJbnN0YW5jZSgpO1xuZXhwb3J0IHsgQ29tcGFzcywgc24gfTtcbiJdfQ==