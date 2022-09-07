import { Core, core } from './Core';
import { Configuration, defaultConfiguration } from './types/Configuration';
import { Direction, directiontoString, getReverseDirection } from './types/Direction';
import { Section } from './types/Section';

class Boussole {
  private static instance: Boussole;
  private _ready: boolean = false;
  private _idPool: number = 0;
  private _sections: { [key: string]: Section; } = {};
  private _sectionCount: number = 0;
  private _defaultSectionId: string = '';
  private _lastSectionId: string = '';
  private _duringFocusChange: boolean = false;
  private globalConfiguration: Configuration = defaultConfiguration;
  private _pause: boolean = false;
  private core: Core = core;
  private readonly ID_POOL_PREFIX = 'section-';
  private readonly EVENT_PREFIX = 'sn:';
  private focusOnMountedSections: string[] = [];
  private _throttle: number | null = null;

  public static getInstance (): Boussole {
    if (!Boussole.instance) {
      Boussole.instance = new Boussole();
    }
    return Boussole.instance;
  }

  // #region PUBLIC FUNCTIONS

  /**
   * Init listeners
   */
  public init (): void {
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
   * Remove listeners and reinitialize Boussole attributes.
   */
  public uninit (): void {
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
  public clear (): void {
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
  public reset (sectionId: string): void {
    if (sectionId) {
      this._sections[sectionId].lastFocusedElement = undefined;
      this._sections[sectionId].previous = undefined;
    } else {
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
  public set (sectionId: string | undefined, config: Configuration): boolean | never {
    const finalConfig = {};
    Object.assign(finalConfig, this.globalConfiguration);
    Object.assign(finalConfig, config);

    if (sectionId !== undefined) {
      if (!this._sections[sectionId]) {
        throw new Error(`Section "${sectionId}" doesn't exist!`);
      }
      this._sections[sectionId].configuration = finalConfig as Configuration;
    } else {
      this.globalConfiguration = finalConfig as Configuration;
    }
    return true;
  }

  /**
   * Add a section
   * @param sectionId - section id to add
   * @param config - configuration of the section
   * @returns sectionId
   */
  public add (sectionId: string | undefined, config: Configuration): string | never {
    if (!sectionId) {
      // eslint-disable-next-line no-param-reassign
      sectionId = this.generateId();
    }
    if (this._sections[sectionId]) {
      throw new Error(`Section "${sectionId}" already exist!`);
    } else {
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
  public remove (sectionId: string): boolean {
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
  public disable (sectionId: string): boolean {
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
  public enable (sectionId: string): boolean {
    if (this._sections[sectionId] && this._sections[sectionId].configuration) {
      this._sections[sectionId].configuration.disabled = false;
      return true;
    }
    return false;
  }

  /**
   * Pause navigation
   */
  public pause (): void {
    this._pause = true;
  }

  /**
   * Resume navigation
   */
  public resume (): void {
    this._pause = false;
  }

  /**
   * Focus an element
   * @param element element to focus (section id or selector), (an element or a section)
   * @param silent ?
   * @param direction incoming direction
   * @returns true if element has been focused, false otherwise
   */
  public focus (element: string, silent: boolean, direction: Direction): boolean {
    let result = false;
    const autoPause = !this._pause && silent;
    if (autoPause) this.pause();

    // TO DO - add focusExtendedSelector and _focusElement ???
    if (this.isSection(element)) {
      result = this.focusSection(element, direction);
    } else {
      result = this.focusExtendedSelector(element, direction, false);
    }

    if (autoPause) this.resume();
    return result;
  }

  /**
   * Move to another element
   */
  public move (direction: Direction, selector: string | undefined): boolean {
    let element: HTMLElement | undefined = undefined;
    if (selector) {
      const elements = this.core.parseSelector(selector);
      if (elements.length > 0) {
        element = this.core.parseSelector(selector)[0] as HTMLElement;
      }
    } else {
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
  public makeFocusable (sectionId: string | undefined): void | never {
    if (sectionId) {
      if (this._sections[sectionId]) {
        this.doMakeFocusable(this._sections[sectionId].configuration);
      } else {
        throw new Error(`Section "${sectionId}" doesn't exist!`);
      }
    } else {
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
  public setDefaultSection (sectionId: string): void | never {
    if (this._sections[sectionId] !== undefined) {
      this._defaultSectionId = sectionId;
    } else {
      throw new Error(`Section "${sectionId}" doesn't exist!`);
    }
  }

  /**
   * Focus an element
   */
  public focusElement (element: HTMLElement): boolean {
    if (!element) return false;
    const nextSectionId = this.getSectionId(element);
    if (!nextSectionId) return false;
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
  public focusOnMounted (sectionId: string) {
    this.focusOnMountedSections.push(sectionId);
  }

  /**
   * Check if Spatial Navigation is waiting this element to be mounted before focusing it.
   * @param element element to check
   */
  public hasBeenWaitingForMounted (sectionId: string): void {
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
  private generateId (): string {
    let id: string;
    while (true) {
      id = this.ID_POOL_PREFIX + String(++this._idPool);
      if (!this._sections[id]) {
        break;
      }
    }
    return id;
  }

  private getCurrentFocusedElement (): HTMLElement | undefined {
    const { activeElement } = document;
    if (activeElement && activeElement !== document.body) {
      return activeElement as HTMLElement;
    }
    return undefined;
  }

  private extend (out: any, ...args: any) {
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

  private exclude (elemList: any, excludedElem: any) {
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
  private isNavigable (elem: HTMLElement, sectionId: string, verifySectionSelector: boolean): boolean {
    if (!elem || !sectionId || !this._sections[sectionId] || this._sections[sectionId].configuration.disabled) {
      return false;
    }
    if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0) || elem.hasAttribute('disabled')) {
      return false;
    }
    if (verifySectionSelector && !this.core.matchSelector(elem, this._sections[sectionId].configuration.selector!)) {
      return false;
    }
    if (this._sections[sectionId].configuration.navigableFilter !== null) {
      if (this._sections[sectionId].configuration.navigableFilter!(elem, sectionId) === false) {
        return false;
      }
    } else if (this.globalConfiguration.navigableFilter !== null) {
      if (this.globalConfiguration.navigableFilter!(elem, sectionId) === false) {
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
  private getSectionId (element: HTMLElement): string | undefined {
    const sectionsElements: any = {};
    for (const id in this._sections) {
      if (!this._sections[id].configuration.disabled) {
        const sectionElement = this._sections[id].configuration.element;
        if (sectionElement) {
          sectionsElements[id] = sectionElement;
        } else {
          if (this._sections[id].configuration.selector !== '' && this._sections[id].configuration.selector !== undefined) {
            const elementWithSelector = this.core.parseSelector(`[data-section-id="${id}"]`)[0]
            if (elementWithSelector) {
              sectionsElements[id] = elementWithSelector;
            }
          }
        }
      }
    }

    let parent: HTMLElement | null = element;
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
  private getSectionNavigableElements (sectionId: string): never[] {
    return this.core.parseSelector(this._sections[sectionId].configuration.selector!)
      .filter((element) => this.isNavigable(element, sectionId, false));
  }

  /**
   * Get the default element of a section
   * @param sectionId id of the section
   * @returns the default element of a section, null if no default element found
   */
  private getSectionDefaultElement (sectionId: string): HTMLElement | null {
    const { defaultElement } = this._sections[sectionId].configuration;
    if (!defaultElement) {
      return null;
    }
    const elements = this.core.parseSelector(defaultElement);
    // check each element to see if it's navigable and stop when one has been found
    for (const element of elements) {
      if (this.isNavigable(element, sectionId, true)) {
        return element as HTMLElement;
      }
    }
    return null;
  }

  /**
   * Get the last focused element into a section
   * @param sectionId id of the section
   * @returns the last focused element, null if no element found
   */
  private getSectionLastFocusedElement (sectionId: any): HTMLElement | null {
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
  private fireEvent (element: HTMLElement, type: string, details: any, cancelable?: boolean): boolean {
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
  private focusNScroll (element: HTMLElement, sectionId: string, enterIntoNewSection: boolean): void {
    let scrollOptions = enterIntoNewSection ? this._sections[sectionId].configuration.scrollOptions
      : this._sections[sectionId].configuration.scrollOptionsIntoSection;
    // if no-scroll given as scrollOptions, then focus without scrolling
    if (scrollOptions === 'no-scroll') {
      element.focus({ preventScroll: true });
    } else if (scrollOptions !== undefined && scrollOptions !== '' && !(scrollOptions instanceof String)) {
      element.focus({ preventScroll: true });
      element.scrollIntoView(scrollOptions as ScrollIntoViewOptions);
    } else if (this.globalConfiguration) {
      scrollOptions = enterIntoNewSection ? this.globalConfiguration.scrollOptions : this.globalConfiguration.scrollOptionsIntoSection;
      if (scrollOptions !== undefined && scrollOptions !== '' && scrollOptions !== 'no-scroll') {
        element.focus({ preventScroll: true });
        element.scrollIntoView(scrollOptions as ScrollIntoViewOptions);
      } else {
        element.focus({ preventScroll: true });
      }
    } else {
      element.focus();
    }
  }

  /**
   *
   * @param elem
   * @param sectionId
   */
  private focusChanged (element: HTMLElement, sectionId: string) {
    let id: string | undefined = sectionId;
    if (!id) {
      id = this.getSectionId(element);
    }
    if (id) {
      this._sections[sectionId].lastFocusedElement = element;
      this._lastSectionId = sectionId;
    }
  }

  private silentFocus (element: HTMLElement, sectionId: string, scrollIntoNewSection: boolean) {
    const currentFocusedElement: HTMLElement | undefined = this.getCurrentFocusedElement();
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
  private _focusElement (element: HTMLElement, sectionId: string, enterIntoNewSection: boolean, direction?: Direction) {
    if (!element) {
      return false;
    }
    const currentFocusedElement: HTMLElement | undefined = this.getCurrentFocusedElement();

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
  private focusExtendedSelector (selector: string, direction: Direction, enterIntoNewSection: boolean): boolean {
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
      } else {
        return false;
      }
    }
    return false;
  }

  private addRange (id: string, range: string []) {
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
  private focusSection (sectionId: string | undefined, direction: Direction): boolean {
    const range: string [] = [];

    if (sectionId) {
      this.addRange(sectionId, range);
    } else {
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
      } else {
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
  private fireNavigateFailed (element: HTMLElement, direction: Direction) {
    return this.fireEvent(element, 'navigatefailed', {
      direction
    }, false);
  }

  private goToLeaveFor (sectionId: string, direction: Direction) {
    if (this._sections[sectionId].configuration.leaveFor
      && (this._sections[sectionId].configuration.leaveFor as any)[directiontoString(direction)] !== undefined) {
      const next = (this._sections[sectionId].configuration.leaveFor as any)[directiontoString(direction)];
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
  private focusNext (direction: Direction, currentFocusedElement: HTMLElement, currentSectionId: string): boolean {
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

    const sectionNavigableElements: any = {};
    let allNavigableElements: any = [];
    for (const id in this._sections) {
      sectionNavigableElements[id] = this.getSectionNavigableElements(id) as HTMLElement[];
      allNavigableElements = allNavigableElements.concat(sectionNavigableElements[id]);
    }

    // const config: Configuration = this.extend({}, this.globalConfiguration, this._sections[currentSectionId].configuration);
    let next: HTMLElement | null;
    const currentSection = this._sections[currentSectionId];

    if (currentSection.configuration.restrict === 'self-only' || currentSection.configuration.restrict === 'self-first') {
      const currentSectionNavigableElements = sectionNavigableElements[currentSectionId];

      next = this.core.navigate(
        currentFocusedElement,
        direction,
        this.exclude(currentSectionNavigableElements, currentFocusedElement),
        currentSection
      );

      if (!next && currentSection.configuration.restrict === 'self-first') {
        next = this.core.navigate(
          currentFocusedElement,
          direction,
          this.exclude(allNavigableElements, currentSectionNavigableElements),
          currentSection
        );
      }
    } else {
      next = this.core.navigate(
        currentFocusedElement,
        direction,
        this.exclude(allNavigableElements, currentFocusedElement),
        currentSection
      );
    }

    if (next) {
      currentSection.previous = {
        target: currentFocusedElement,
        destination: next,
        reverse: getReverseDirection(direction)
      };

      const nextSectionId: string | undefined = this.getSectionId(next);
      let enterIntoNewSection = false;
      if (currentSectionId !== nextSectionId && nextSectionId !== undefined) {
        // We enter into another section
        enterIntoNewSection = true;
        const result: boolean | null = this.goToLeaveFor(currentSectionId, direction);
        if (result) {
          return true;
        }
        if (result === null) {
          this.fireNavigateFailed(currentFocusedElement, direction);
          return false;
        }

        let enterToElement: HTMLElement | null = null;
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

  private preventDefault (evt: Event): boolean {
    evt.preventDefault();
    evt.stopPropagation();
    return false;
  }

  private onKeyDown (evt: KeyboardEvent): boolean {
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

    let currentFocusedElement: HTMLElement | null | undefined;

    const direction: Direction = evt.keyCode as unknown as Direction;
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

  private onKeyUp (evt: KeyboardEvent): void {
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

  private onFocus (evt: Event): void {
    const { target } = evt;
    const htmlTarget: HTMLElement = target as HTMLElement;
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
        } else {
          this.fireEvent(htmlTarget, 'focused', focusProperties, false);
          this.focusChanged(htmlTarget, sectionId);
        }
      }
    }
  }

  private onBlur (evt: Event): void {
    const target: EventTarget | null = evt.target;
    const htmlTarget: HTMLElement = target as HTMLElement;
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
      } else {
        this.fireEvent(htmlTarget, 'unfocused', unfocusProperties, false);
      }
    }
  }

  private isSection (sectionId: string | undefined): boolean {
    if (sectionId) {
      return sectionId in this._sections;
    }
    return false;
  }
  // TO REMOVE ???
  private onBodyClick () {
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
  private doMakeFocusable (configuration: Configuration): void {
    let tabIndexIgnoreList: string;
    if (configuration.tabIndexIgnoreList !== undefined) {
      tabIndexIgnoreList = configuration.tabIndexIgnoreList;
    } else {
      tabIndexIgnoreList = this.globalConfiguration.tabIndexIgnoreList!;
    }

    this.core.parseSelector(configuration.selector!).forEach((element: HTMLElement) => {
      if (!this.core.matchSelector(element, tabIndexIgnoreList)) {
        const htmlElement = element as HTMLElement;
        if (!htmlElement.getAttribute('tabindex')) {
          // set the tabindex with a negative value. https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
          htmlElement.setAttribute('tabindex', '-1');
        }
      }
    });
  }
  // #endregion
}

const sn = Boussole.getInstance();
export { Boussole, sn };
