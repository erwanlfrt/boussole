/**
 * Configuration interface, allows to configure Spatial Navigation behavior in a global or restricted way.
 */
interface Configuration {
  element?: HTMLElement,
  selector?: string,
  straightOnly?: boolean,
  straightOverlapThreshold?: number,
  rememberSource?: boolean,
  disabled?: boolean,
  defaultElement?: string,
  enterTo?: string, // '', 'last-focused', 'default-element'
  leaveFor?: {
    left?: string,
    right?: string,
    down?: string,
    up?: string
  },
  restrict?: string, // 'self-first', 'self-only', 'none'
  tabIndexIgnoreList?: string,
  navigableFilter?: null | Function,
  scrollOptions?: ScrollIntoViewOptions | string,
  scrollOptionsIntoSection?: ScrollIntoViewOptions | string,
  throttle?: number
}

const defaultConfiguration: Configuration = {
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

export { Configuration, defaultConfiguration };
