import * as i0 from '@angular/core';
import { Injectable, Directive, Input, NgModule } from '@angular/core';

class BoussoleService {
    constructor() { }
}
BoussoleService.ɵfac = function BoussoleService_Factory(t) { return new (t || BoussoleService)(); };
BoussoleService.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: BoussoleService, factory: BoussoleService.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(BoussoleService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], function () { return []; }, null); })();

class FocusDirective {
    constructor(el) {
        this.el = el;
        this.disableElement = (element, focusable) => {
            // eslint-disable-next-line no-unneeded-ternary
            focusable = focusable === false ? false : true;
            if (!element.dataset['focusable'] || element.dataset['focusable'] !== `${focusable}`) {
                element.dataset['focusable'] = focusable;
                if (focusable)
                    element.tabIndex = -1;
            }
        };
        el.nativeElement.dataset['focusable'] = true;
        el.nativeElement.tabIndex = -1;
    }
}
FocusDirective.ɵfac = function FocusDirective_Factory(t) { return new (t || FocusDirective)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
FocusDirective.ɵdir = /*@__PURE__*/ i0.ɵɵdefineDirective({ type: FocusDirective, selectors: [["", "focus", ""]] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(FocusDirective, [{
        type: Directive,
        args: [{
                selector: '[focus]'
            }]
    }], function () { return [{ type: i0.ElementRef }]; }, null); })();

/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
var Direction;
(function (Direction) {
    Direction[Direction["LEFT"] = 37] = "LEFT";
    Direction[Direction["UP"] = 38] = "UP";
    Direction[Direction["RIGHT"] = 39] = "RIGHT";
    Direction[Direction["DOWN"] = 40] = "DOWN";
})(Direction || (Direction = {}));
var StringDirection;
(function (StringDirection) {
    StringDirection["LEFT"] = "left";
    StringDirection["UP"] = "up";
    StringDirection["RIGHT"] = "right";
    StringDirection["DOWN"] = "down";
})(StringDirection || (StringDirection = {}));
function getReverseDirection(direction) {
    if (direction === Direction.LEFT) {
        return Direction.RIGHT;
    }
    else if (direction === Direction.RIGHT) {
        return Direction.LEFT;
    }
    else if (direction === Direction.UP) {
        return Direction.DOWN;
    }
    else {
        return Direction.UP;
    }
}
function directiontoString(direction) {
    if (direction === Direction.LEFT) {
        return 'left';
    }
    else if (direction === Direction.RIGHT) {
        return 'right';
    }
    else if (direction === Direction.UP) {
        return 'up';
    }
    else {
        return 'down';
    }
}

class ElementRectangleImpl {
    constructor(rectangle) {
        this.x = rectangle.x;
        this.y = rectangle.y;
        this.left = rectangle.left;
        this.right = rectangle.right;
        this.bottom = rectangle.bottom;
        this.top = rectangle.top;
        this.element = rectangle.element;
        this.width = rectangle.width;
        this.height = rectangle.height;
        this.center = rectangle.center;
    }
    nearPlumbLineIsBetter(rect, targetRect) {
        let distance;
        if (rect.center.x < targetRect.center.x) {
            distance = targetRect.center.x - rect.right;
        }
        else {
            distance = rect.left - targetRect.center.x;
        }
        return distance < 0 ? 0 : distance;
    }
    nearHorizonIsBetter(rect, targetRect) {
        let distance;
        if (rect.center.y < targetRect.center.y) {
            distance = targetRect.center.y - rect.bottom;
        }
        else {
            distance = rect.top - targetRect.center.y;
        }
        return distance < 0 ? 0 : distance;
    }
    nearTargetLeftIsBetter(rect, targetRect) {
        let distance;
        if (rect.center.x < targetRect.center.x) {
            distance = targetRect.left - rect.right;
        }
        else {
            distance = rect.left - targetRect.left;
        }
        return distance < 0 ? 0 : distance;
    }
    nearTargetTopIsBetter(rect, targetRect) {
        let distance;
        if (rect.center.y < targetRect.center.y) {
            distance = targetRect.top - rect.bottom;
        }
        else {
            distance = rect.top - targetRect.top;
        }
        return distance < 0 ? 0 : distance;
    }
    topIsBetter(rect) {
        return rect.top;
    }
    bottomIsBetter(rect) {
        return -1 * rect.bottom;
    }
    leftIsBetter(rect) {
        return rect.left;
    }
    rightIsBetter(rect) {
        return -1 * rect.right;
    }
}

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.matchesSelector
        || Element.prototype.mozMatchesSelector
        || Element.prototype.msMatchesSelector
        || Element.prototype.oMatchesSelector
        || Element.prototype.webkitMatchesSelector
        || ((s) => {
            if (this) {
                const matches = (this.document || this.ownerDocument).querySelectorAll(s);
                let i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) { }
                return i > -1;
            }
            return false;
        });
}
class Core {
    static getInstance() {
        if (!Core.instance) {
            Core.instance = new Core();
        }
        return Core.instance;
    }
    /**
     * Get element rectangle
     * @param element element
     * @returns element rectangle
     */
    getRect(element) {
        const cr = element.getBoundingClientRect();
        const xCenter = cr.left + Math.floor(cr.width / 2);
        const yCenter = cr.top + Math.floor(cr.height / 2);
        const center = {
            x: xCenter,
            y: yCenter,
            left: xCenter,
            right: xCenter,
            top: yCenter,
            bottom: yCenter,
            width: 0,
            height: 0
        };
        return {
            element,
            x: cr.x,
            y: cr.y,
            left: cr.left,
            top: cr.top,
            right: cr.right,
            bottom: cr.bottom,
            width: cr.width,
            height: cr.height,
            center
        };
    }
    /**
     * Get the distribution of elements around a target element
     * This function returns a two-dimensional array, we first dimension = 9 of element rectangle.
     * Index of arrays corresponds to the position of elements.
     * Link between index and position : (for threshold = 0)
     *
     *    _______  -  _______  -  _______
     *   |       | - |       | - |       |
     *   |   0   | - |   1   | - |   2   |
     *   |_______| - |_______| - |_______|
     * -------------------------------------
     *    _______  -  _______  -  _______
     *   |       | - |       | - |       |
     *   |   3   | - | TARG. | - |   5   |
     *   |_______| - |_______| - |_______|
     *             -           -
     * -------------------------------------
     *    _______  -  _______  -  _______
     *   |       | - |       | - |       |
     *   |   6   | - |   7   | - |   8   |
     *   |_______| - |_______| - |_______|
     *             -           -
     * @param rects rectangle of elements around the target
     * @param targetRect rectangle of target element
     * @param straightOverlapThreshold threshold
     * @returns distribution of elements around a target element
     */
    partition(rects, targetRect, straightOverlapThreshold) {
        const groups = [[], [], [], [], [], [], [], [], []];
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const center = rect.center;
            let x, y;
            if (center.x < targetRect.left) {
                x = 0;
            }
            else if (center.x <= targetRect.right) {
                x = 1;
            }
            else {
                x = 2;
            }
            if (center.y < targetRect.top) {
                y = 0;
            }
            else if (center.y <= targetRect.bottom) {
                y = 1;
            }
            else {
                y = 2;
            }
            const groupId = y * 3 + x;
            groups[groupId].push(rect);
            if ([0, 2, 6, 8].indexOf(groupId) !== -1) {
                const threshold = straightOverlapThreshold;
                if (rect.left <= targetRect.right - targetRect.width * threshold) {
                    if (groupId === 2) {
                        groups[1].push(rect);
                    }
                    else if (groupId === 8) {
                        groups[7].push(rect);
                    }
                }
                if (rect.right >= targetRect.left + targetRect.width * threshold) {
                    if (groupId === 0) {
                        groups[1].push(rect);
                    }
                    else if (groupId === 6) {
                        groups[7].push(rect);
                    }
                }
                if (rect.top <= targetRect.bottom - targetRect.height * threshold) {
                    if (groupId === 6) {
                        groups[3].push(rect);
                    }
                    else if (groupId === 8) {
                        groups[5].push(rect);
                    }
                }
                if (rect.bottom >= targetRect.top + targetRect.height * threshold) {
                    if (groupId === 0) {
                        groups[3].push(rect);
                    }
                    else if (groupId === 2) {
                        groups[5].push(rect);
                    }
                }
            }
        }
        return groups;
    }
    prioritize(priorities) {
        let destPriority = null;
        for (let i = 0; i < priorities.length; i++) {
            if (priorities[i].group.length) {
                destPriority = priorities[i];
                break;
            }
        }
        if (!destPriority) {
            return null;
        }
        const destDistance = destPriority.distance;
        const target = destPriority.target;
        destPriority.group.sort((a, b) => {
            for (let i = 0; i < destDistance.length; i++) {
                const distance = destDistance[i];
                const delta = distance(a, target) - distance(b, target);
                if (delta) {
                    return delta;
                }
            }
            return 0;
        });
        return destPriority.group;
    }
    /**
     * Get next element to navigate to, from a target according to a direction
     * @param target target element
     * @param direction navigate to this direction
     * @param candidates candidates elements around target
     * @param section section of the target
     * @returns next element to navigate to, null if no next element found
     */
    navigate(target, direction, candidates, section) {
        if (!target || !direction || !candidates || !candidates.length) {
            return null;
        }
        const rects = [];
        for (let i = 0; i < candidates.length; i++) {
            const rect = this.getRect(candidates[i]);
            if (rect) {
                rects.push(rect);
            }
        }
        if (!rects.length)
            return null;
        const targetRect = this.getRect(target);
        if (!targetRect)
            return null;
        const targetRectImpl = new ElementRectangleImpl(targetRect);
        const groups = this.partition(rects, targetRect, section.configuration.straightOverlapThreshold);
        const internalGroups = this.partition(groups[4], targetRect.center, section.configuration.straightOverlapThreshold);
        let priorities;
        switch (direction) {
            case Direction.LEFT:
                priorities = [
                    {
                        group: internalGroups[0].concat(internalGroups[3])
                            .concat(internalGroups[6]),
                        distance: [
                            targetRectImpl.nearPlumbLineIsBetter,
                            targetRectImpl.topIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[3],
                        distance: [
                            targetRectImpl.nearPlumbLineIsBetter,
                            targetRectImpl.topIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[0].concat(groups[6]),
                        distance: [
                            targetRectImpl.nearHorizonIsBetter,
                            targetRectImpl.rightIsBetter,
                            targetRectImpl.nearTargetTopIsBetter
                        ],
                        target: targetRectImpl
                    }
                ];
                break;
            case Direction.RIGHT:
                priorities = [
                    {
                        group: internalGroups[2].concat(internalGroups[5])
                            .concat(internalGroups[8]),
                        distance: [
                            targetRectImpl.nearPlumbLineIsBetter,
                            targetRectImpl.topIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[5],
                        distance: [
                            targetRectImpl.nearPlumbLineIsBetter,
                            targetRectImpl.topIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[2].concat(groups[8]),
                        distance: [
                            targetRectImpl.nearHorizonIsBetter,
                            targetRectImpl.leftIsBetter,
                            targetRectImpl.nearTargetTopIsBetter
                        ],
                        target: targetRectImpl
                    }
                ];
                break;
            case Direction.UP:
                priorities = [
                    {
                        group: internalGroups[0].concat(internalGroups[1])
                            .concat(internalGroups[2]),
                        distance: [
                            targetRectImpl.nearHorizonIsBetter,
                            targetRectImpl.leftIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[1],
                        distance: [
                            targetRectImpl.nearHorizonIsBetter,
                            targetRectImpl.leftIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[0].concat(groups[2]),
                        distance: [
                            targetRectImpl.nearPlumbLineIsBetter,
                            targetRectImpl.bottomIsBetter,
                            targetRectImpl.nearTargetLeftIsBetter
                        ],
                        target: targetRectImpl
                    }
                ];
                break;
            case Direction.DOWN:
                priorities = [
                    {
                        group: internalGroups[6].concat(internalGroups[7])
                            .concat(internalGroups[8]),
                        distance: [
                            targetRectImpl.nearHorizonIsBetter,
                            targetRectImpl.leftIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[7],
                        distance: [
                            targetRectImpl.nearHorizonIsBetter,
                            targetRectImpl.leftIsBetter
                        ],
                        target: targetRectImpl
                    },
                    {
                        group: groups[6].concat(groups[8]),
                        distance: [
                            targetRectImpl.nearPlumbLineIsBetter,
                            targetRectImpl.topIsBetter,
                            targetRectImpl.nearTargetLeftIsBetter
                        ],
                        target: targetRectImpl
                    }
                ];
                break;
            default:
                return null;
        }
        if (section.configuration.straightOnly) {
            priorities.pop();
        }
        const destGroup = this.prioritize(priorities);
        if (!destGroup) {
            return null;
        }
        let dest = undefined;
        if (section.configuration.rememberSource
            && section.previous
            && section.previous.destination === target
            && section.previous.reverse === direction) {
            for (let j = 0; j < destGroup.length; j++) {
                if (destGroup[j].element === section.previous.target) {
                    dest = destGroup[j].element;
                    break;
                }
            }
        }
        if (!dest)
            dest = destGroup[0].element;
        return dest;
    }
    /**
     * Parse selector
     * @param selector
     * @returns nodes
     */
    parseSelector(selector) {
        // TO DO handle selector
        const result = [].slice.call(document.querySelectorAll(selector));
        return result;
    }
    /**
     * Check if an element match a selector
     */
    matchSelector(element, selector) {
        // TO DO selector as object N
        return element.matches(selector);
    }
}
const core = Core.getInstance();

const defaultConfiguration = {
    selector: '[data-focusable=true]',
    straightOnly: false,
    straightOverlapThreshold: 0.5,
    rememberSource: false,
    disabled: false,
    defaultElement: '',
    enterTo: '',
    leaveFor: {
        left: undefined,
        right: undefined,
        down: undefined,
        up: undefined
    },
    restrict: 'self-first',
    tabIndexIgnoreList: 'a, input, select, textarea, button, iframe, [contentEditable=true]',
    navigableFilter: null,
    scrollOptions: {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
    },
    scrollOptionsIntoSection: {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
    },
    throttle: 0
};

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

class FocusSectionDirective {
    constructor(el) {
        this.el = el;
        this.element = undefined;
        this.focusSection = {};
        this.assignConfig = (sectionId, config) => {
            const globalConfig = defaultConfiguration; // TO DO : integrate app.globalConfig given by developer
            const sectionConfig = ({ ...globalConfig });
            if (config) {
                Object.assign(sectionConfig, config);
            }
            sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;
            return sectionConfig;
        };
        this.element = el.nativeElement;
    }
    ngOnInit() {
        let sectionId = null;
        if (this.focusSection && this.focusSection.id && this.focusSection.conf) {
            sectionId = this.focusSection.id;
            const config = this.focusSection.conf;
            config.element = this.el.nativeElement;
            try {
                sn.add(sectionId, config);
            }
            catch (error) { }
        }
        else {
            sectionId = sn.add(undefined, defaultConfiguration);
        }
        // set sectionid to data set for removing when unbinding
        this.el.nativeElement.dataset.sectionId = sectionId;
        if (this.focusSection.conf) {
            sn.set(sectionId, this.assignConfig(sectionId, this.focusSection.conf));
        }
        // set default section
        // if (this.focusSection.modifiers.default) {
        // sn.setDefaultSection(sectionId);
        //   }
    }
}
FocusSectionDirective.ɵfac = function FocusSectionDirective_Factory(t) { return new (t || FocusSectionDirective)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
FocusSectionDirective.ɵdir = /*@__PURE__*/ i0.ɵɵdefineDirective({ type: FocusSectionDirective, selectors: [["", "focusSection", ""]], inputs: { focusSection: "focusSection" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(FocusSectionDirective, [{
        type: Directive,
        args: [{
                selector: '[focusSection]'
            }]
    }], function () { return [{ type: i0.ElementRef }]; }, { focusSection: [{
            type: Input
        }] }); })();

class BoussoleModule {
    constructor() {
        const globalConfig = defaultConfiguration;
        sn.init();
        sn.set(undefined, globalConfig);
    }
}
BoussoleModule.ɵfac = function BoussoleModule_Factory(t) { return new (t || BoussoleModule)(); };
BoussoleModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: BoussoleModule });
BoussoleModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({});
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(BoussoleModule, [{
        type: NgModule,
        args: [{
                declarations: [
                    FocusDirective,
                    FocusSectionDirective
                ],
                imports: [],
                exports: [
                    FocusDirective,
                    FocusSectionDirective
                ]
            }]
    }], function () { return []; }, null); })();
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(BoussoleModule, { declarations: [FocusDirective,
        FocusSectionDirective], exports: [FocusDirective,
        FocusSectionDirective] }); })();

/*
 * Public API Surface of boussole
 */

/**
 * Generated bundle index. Do not edit.
 */

export { BoussoleModule, BoussoleService, FocusDirective, FocusSectionDirective };
//# sourceMappingURL=boussole.mjs.map
