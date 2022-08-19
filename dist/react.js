(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("boussole", [], factory);
	else if(typeof exports === 'object')
		exports["boussole"] = factory();
	else
		root["boussole"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/react/cjs/react.development.js":
/*!*****************************************************!*\
  !*** ./node_modules/react/cjs/react.development.js ***!
  \*****************************************************/
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
/**
 * @license React
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



if (true) {
  (function() {

          'use strict';

/* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart ===
    'function'
) {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
}
          var ReactVersion = '18.2.0';

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for('react.element');
var REACT_PORTAL_TYPE = Symbol.for('react.portal');
var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
var REACT_CONTEXT_TYPE = Symbol.for('react.context');
var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
var REACT_MEMO_TYPE = Symbol.for('react.memo');
var REACT_LAZY_TYPE = Symbol.for('react.lazy');
var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator';
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }

  return null;
}

/**
 * Keeps track of the current dispatcher.
 */
var ReactCurrentDispatcher = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

/**
 * Keeps track of the current batch's configuration such as how long an update
 * should suspend for if it needs to.
 */
var ReactCurrentBatchConfig = {
  transition: null
};

var ReactCurrentActQueue = {
  current: null,
  // Used to reproduce behavior of `batchedUpdates` in legacy mode.
  isBatchingLegacy: false,
  didScheduleLegacyUpdate: false
};

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
var ReactCurrentOwner = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null
};

var ReactDebugCurrentFrame = {};
var currentExtraStackFrame = null;
function setExtraStackFrame(stack) {
  {
    currentExtraStackFrame = stack;
  }
}

{
  ReactDebugCurrentFrame.setExtraStackFrame = function (stack) {
    {
      currentExtraStackFrame = stack;
    }
  }; // Stack implementation injected by the current renderer.


  ReactDebugCurrentFrame.getCurrentStack = null;

  ReactDebugCurrentFrame.getStackAddendum = function () {
    var stack = ''; // Add an extra top frame while an element is being validated

    if (currentExtraStackFrame) {
      stack += currentExtraStackFrame;
    } // Delegate to the injected renderer-specific implementation


    var impl = ReactDebugCurrentFrame.getCurrentStack;

    if (impl) {
      stack += impl() || '';
    }

    return stack;
  };
}

// -----------------------------------------------------------------------------

var enableScopeAPI = false; // Experimental Create Event Handle API.
var enableCacheElement = false;
var enableTransitionTracing = false; // No known bugs, but needs performance testing

var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.

var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

var ReactSharedInternals = {
  ReactCurrentDispatcher: ReactCurrentDispatcher,
  ReactCurrentBatchConfig: ReactCurrentBatchConfig,
  ReactCurrentOwner: ReactCurrentOwner
};

{
  ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
  ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
}

// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.

function warn(format) {
  {
    {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      printWarning('warn', format, args);
    }
  }
}
function error(format) {
  {
    {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning('error', format, args);
    }
  }
}

function printWarning(level, format, args) {
  // When changing this logic, you might want to also
  // update consoleWithStackDev.www.js as well.
  {
    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    var stack = ReactDebugCurrentFrame.getStackAddendum();

    if (stack !== '') {
      format += '%s';
      args = args.concat([stack]);
    } // eslint-disable-next-line react-internal/safe-string-coercion


    var argsWithFormat = args.map(function (item) {
      return String(item);
    }); // Careful: RN currently depends on this prefix

    argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
    // breaks IE9: https://github.com/facebook/react/issues/13610
    // eslint-disable-next-line react-internal/no-production-logging

    Function.prototype.apply.call(console[level], console, argsWithFormat);
  }
}

var didWarnStateUpdateForUnmountedComponent = {};

function warnNoop(publicInstance, callerName) {
  {
    var _constructor = publicInstance.constructor;
    var componentName = _constructor && (_constructor.displayName || _constructor.name) || 'ReactClass';
    var warningKey = componentName + "." + callerName;

    if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
      return;
    }

    error("Can't call %s on a component that is not yet mounted. " + 'This is a no-op, but it might indicate a bug in your application. ' + 'Instead, assign to `this.state` directly or define a `state = {};` ' + 'class property with the desired state in the %s component.', callerName, componentName);

    didWarnStateUpdateForUnmountedComponent[warningKey] = true;
  }
}
/**
 * This is the abstract API for an update queue.
 */


var ReactNoopUpdateQueue = {
  /**
   * Checks whether or not this composite component is mounted.
   * @param {ReactClass} publicInstance The instance we want to test.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function (publicInstance) {
    return false;
  },

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldComponentUpdate`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
  enqueueForceUpdate: function (publicInstance, callback, callerName) {
    warnNoop(publicInstance, 'forceUpdate');
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} completeState Next state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} callerName name of the calling function in the public API.
   * @internal
   */
  enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
    warnNoop(publicInstance, 'replaceState');
  },

  /**
   * Sets a subset of the state. This only exists because _pendingState is
   * internal. This provides a merging strategy that is not available to deep
   * properties which is confusing. TODO: Expose pendingState or don't use it
   * during the merge.
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after component is updated.
   * @param {?string} Name of the calling function in the public API.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState, callback, callerName) {
    warnNoop(publicInstance, 'setState');
  }
};

var assign = Object.assign;

var emptyObject = {};

{
  Object.freeze(emptyObject);
}
/**
 * Base class helpers for the updating state of a component.
 */


function Component(props, context, updater) {
  this.props = props;
  this.context = context; // If a component has string refs, we will assign a different object later.

  this.refs = emptyObject; // We initialize the default updater but the real one gets injected by the
  // renderer.

  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};
/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */

Component.prototype.setState = function (partialState, callback) {
  if (typeof partialState !== 'object' && typeof partialState !== 'function' && partialState != null) {
    throw new Error('setState(...): takes an object of state variables to update or a ' + 'function which returns an object of state variables.');
  }

  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 *
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 *
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */


Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
/**
 * Deprecated APIs. These APIs used to exist on classic React classes but since
 * we would like to deprecate them, we're not going to move them over to this
 * modern base class. Instead, we define a getter that warns if it's accessed.
 */


{
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };

  var defineDeprecationWarning = function (methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function () {
        warn('%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]);

        return undefined;
      }
    });
  };

  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

function ComponentDummy() {}

ComponentDummy.prototype = Component.prototype;
/**
 * Convenience component with default shallow equality check for sCU.
 */

function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context; // If a component has string refs, we will assign a different object later.

  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
pureComponentPrototype.constructor = PureComponent; // Avoid an extra prototype jump for these methods.

assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;

// an immutable object with a single mutable value
function createRef() {
  var refObject = {
    current: null
  };

  {
    Object.seal(refObject);
  }

  return refObject;
}

var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

function isArray(a) {
  return isArrayImpl(a);
}

/*
 * The `'' + value` pattern (used in in perf-sensitive code) throws for Symbol
 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
 *
 * The functions in this module will throw an easier-to-understand,
 * easier-to-debug exception with a clear errors message message explaining the
 * problem. (Instead of a confusing exception thrown inside the implementation
 * of the `value` object).
 */
// $FlowFixMe only called in DEV, so void return is not possible.
function typeName(value) {
  {
    // toStringTag is needed for namespaced types like Temporal.Instant
    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object';
    return type;
  }
} // $FlowFixMe only called in DEV, so void return is not possible.


function willCoercionThrow(value) {
  {
    try {
      testStringCoercion(value);
      return false;
    } catch (e) {
      return true;
    }
  }
}

function testStringCoercion(value) {
  // If you ended up here by following an exception call stack, here's what's
  // happened: you supplied an object or symbol value to React (as a prop, key,
  // DOM attribute, CSS property, string ref, etc.) and when React tried to
  // coerce it to a string using `'' + value`, an exception was thrown.
  //
  // The most common types that will cause this exception are `Symbol` instances
  // and Temporal objects like `Temporal.Instant`. But any object that has a
  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
  // exception. (Library authors do this to prevent users from using built-in
  // numeric operators like `+` or comparison operators like `>=` because custom
  // methods are needed to perform accurate arithmetic or comparison.)
  //
  // To fix the problem, coerce this object or symbol value to a string before
  // passing it to React. The most reliable way is usually `String(value)`.
  //
  // To find which value is throwing, check the browser or debugger console.
  // Before this exception was thrown, there should be `console.error` output
  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
  // problem and how that type was used: key, atrribute, input value prop, etc.
  // In most cases, this console output also shows the component and its
  // ancestor components where the exception happened.
  //
  // eslint-disable-next-line react-internal/safe-string-coercion
  return '' + value;
}
function checkKeyStringCoercion(value) {
  {
    if (willCoercionThrow(value)) {
      error('The provided key is an unsupported type %s.' + ' This value must be coerced to a string before before using it here.', typeName(value));

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}

function getWrappedName(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;

  if (displayName) {
    return displayName;
  }

  var functionName = innerType.displayName || innerType.name || '';
  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
} // Keep in sync with react-reconciler/getComponentNameFromFiber


function getContextName(type) {
  return type.displayName || 'Context';
} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.


function getComponentNameFromType(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }

  {
    if (typeof type.tag === 'number') {
      error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
    }
  }

  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }

  if (typeof type === 'string') {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';

    case REACT_PORTAL_TYPE:
      return 'Portal';

    case REACT_PROFILER_TYPE:
      return 'Profiler';

    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';

    case REACT_SUSPENSE_TYPE:
      return 'Suspense';

    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';

  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        var context = type;
        return getContextName(context) + '.Consumer';

      case REACT_PROVIDER_TYPE:
        var provider = type;
        return getContextName(provider._context) + '.Provider';

      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, 'ForwardRef');

      case REACT_MEMO_TYPE:
        var outerName = type.displayName || null;

        if (outerName !== null) {
          return outerName;
        }

        return getComponentNameFromType(type.type) || 'Memo';

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            return getComponentNameFromType(init(payload));
          } catch (x) {
            return null;
          }
        }

      // eslint-disable-next-line no-fallthrough
    }
  }

  return null;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};
var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;

{
  didWarnAboutStringRefs = {};
}

function hasValidRef(config) {
  {
    if (hasOwnProperty.call(config, 'ref')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.ref !== undefined;
}

function hasValidKey(config) {
  {
    if (hasOwnProperty.call(config, 'key')) {
      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;

      if (getter && getter.isReactWarning) {
        return false;
      }
    }
  }

  return config.key !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  var warnAboutAccessingKey = function () {
    {
      if (!specialPropKeyWarningShown) {
        specialPropKeyWarningShown = true;

        error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
      }
    }
  };

  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function () {
    {
      if (!specialPropRefWarningShown) {
        specialPropRefWarningShown = true;

        error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
      }
    }
  };

  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true
  });
}

function warnIfStringRefCannotBeAutoConverted(config) {
  {
    if (typeof config.ref === 'string' && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
      var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);

      if (!didWarnAboutStringRefs[componentName]) {
        error('Component "%s" contains the string ref "%s". ' + 'Support for string refs will be removed in a future major release. ' + 'This case cannot be automatically converted to an arrow function. ' + 'We ask you to manually fix this case by using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);

        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * @internal
 */


var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,
    // Record the component responsible for creating this element.
    _owner: owner
  };

  {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.

    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    }); // self and source are DEV only properties.

    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    }); // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.

    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });

    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};
/**
 * Create and return a new ReactElement of the given type.
 * See https://reactjs.org/docs/react-api.html#createelement
 */

function createElement(type, config, children) {
  var propName; // Reserved names are extracted

  var props = {};
  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;

      {
        warnIfStringRefCannotBeAutoConverted(config);
      }
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source; // Remaining properties are added to a new props object

    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  } // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.


  var childrenLength = arguments.length - 2;

  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);

    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }

    {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }

    props.children = childArray;
  } // Resolve default props


  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;

    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  {
    if (key || ref) {
      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }

  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}
function cloneAndReplaceKey(oldElement, newKey) {
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
  return newElement;
}
/**
 * Clone and return a new ReactElement using element as the starting point.
 * See https://reactjs.org/docs/react-api.html#cloneelement
 */

function cloneElement(element, config, children) {
  if (element === null || element === undefined) {
    throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
  }

  var propName; // Original props are copied

  var props = assign({}, element.props); // Reserved names are extracted

  var key = element.key;
  var ref = element.ref; // Self is preserved since the owner is preserved.

  var self = element._self; // Source is preserved since cloneElement is unlikely to be targeted by a
  // transpiler, and the original source is probably a better indicator of the
  // true owner.

  var source = element._source; // Owner will be preserved, unless ref is overridden

  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      // Silently steal the ref from the parent.
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }

    if (hasValidKey(config)) {
      {
        checkKeyStringCoercion(config.key);
      }

      key = '' + config.key;
    } // Remaining properties override existing props


    var defaultProps;

    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }

    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  } // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.


  var childrenLength = arguments.length - 2;

  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);

    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }

    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
}
/**
 * Verifies the object is a ReactElement.
 * See https://reactjs.org/docs/react-api.html#isvalidelement
 * @param {?object} object
 * @return {boolean} True if `object` is a ReactElement.
 * @final
 */

function isValidElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}

var SEPARATOR = '.';
var SUBSEPARATOR = ':';
/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = key.replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });
  return '$' + escapedString;
}
/**
 * TODO: Test that a single child and an array with one item have the same key
 * pattern.
 */


var didWarnAboutMaps = false;
var userProvidedKeyEscapeRegex = /\/+/g;

function escapeUserProvidedKey(text) {
  return text.replace(userProvidedKeyEscapeRegex, '$&/');
}
/**
 * Generate a key string that identifies a element within a set.
 *
 * @param {*} element A element that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */


function getElementKey(element, index) {
  // Do some typechecking here since we call this blindly. We want to ensure
  // that we don't block potential future ES APIs.
  if (typeof element === 'object' && element !== null && element.key != null) {
    // Explicit key
    {
      checkKeyStringCoercion(element.key);
    }

    return escape('' + element.key);
  } // Implicit key determined by the index in the set


  return index.toString(36);
}

function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  var invokeCallback = false;

  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break;

      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
        }

    }
  }

  if (invokeCallback) {
    var _child = children;
    var mappedChild = callback(_child); // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows:

    var childKey = nameSoFar === '' ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;

    if (isArray(mappedChild)) {
      var escapedChildKey = '';

      if (childKey != null) {
        escapedChildKey = escapeUserProvidedKey(childKey) + '/';
      }

      mapIntoArray(mappedChild, array, escapedChildKey, '', function (c) {
        return c;
      });
    } else if (mappedChild != null) {
      if (isValidElement(mappedChild)) {
        {
          // The `if` statement here prevents auto-disabling of the safe
          // coercion ESLint rule, so we must manually disable it below.
          // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
          if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
            checkKeyStringCoercion(mappedChild.key);
          }
        }

        mappedChild = cloneAndReplaceKey(mappedChild, // Keep both the (mapped) and old keys if they differ, just as
        // traverseAllChildren used to do for objects as children
        escapedPrefix + ( // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
        mappedChild.key && (!_child || _child.key !== mappedChild.key) ? // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
        // eslint-disable-next-line react-internal/safe-string-coercion
        escapeUserProvidedKey('' + mappedChild.key) + '/' : '') + childKey);
      }

      array.push(mappedChild);
    }

    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // Count of children found in the current subtree.

  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getElementKey(child, i);
      subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
    }
  } else {
    var iteratorFn = getIteratorFn(children);

    if (typeof iteratorFn === 'function') {
      var iterableChildren = children;

      {
        // Warn about using Maps as children
        if (iteratorFn === iterableChildren.entries) {
          if (!didWarnAboutMaps) {
            warn('Using Maps as children is not supported. ' + 'Use an array of keyed ReactElements instead.');
          }

          didWarnAboutMaps = true;
        }
      }

      var iterator = iteratorFn.call(iterableChildren);
      var step;
      var ii = 0;

      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getElementKey(child, ii++);
        subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
      }
    } else if (type === 'object') {
      // eslint-disable-next-line react-internal/safe-string-coercion
      var childrenString = String(children);
      throw new Error("Objects are not valid as a React child (found: " + (childrenString === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : childrenString) + "). " + 'If you meant to render a collection of children, use an array ' + 'instead.');
    }
  }

  return subtreeCount;
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenmap
 *
 * The provided mapFunction(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} func The map function.
 * @param {*} context Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }

  var result = [];
  var count = 0;
  mapIntoArray(children, result, '', '', function (child) {
    return func.call(context, child, count++);
  });
  return result;
}
/**
 * Count the number of children that are typically specified as
 * `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrencount
 *
 * @param {?*} children Children tree container.
 * @return {number} The number of children.
 */


function countChildren(children) {
  var n = 0;
  mapChildren(children, function () {
    n++; // Don't return anything
  });
  return n;
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenforeach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  mapChildren(children, function () {
    forEachFunc.apply(this, arguments); // Don't return anything.
  }, forEachContext);
}
/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrentoarray
 */


function toArray(children) {
  return mapChildren(children, function (child) {
    return child;
  }) || [];
}
/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenonly
 *
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactElement} The first and only `ReactElement` contained in the
 * structure.
 */


function onlyChild(children) {
  if (!isValidElement(children)) {
    throw new Error('React.Children.only expected to receive a single React element child.');
  }

  return children;
}

function createContext(defaultValue) {
  // TODO: Second argument used to be an optional `calculateChangedBits`
  // function. Warn to reserve for future use?
  var context = {
    $$typeof: REACT_CONTEXT_TYPE,
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields.
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    _threadCount: 0,
    // These are circular
    Provider: null,
    Consumer: null,
    // Add these to use same hidden class in VM as ServerContext
    _defaultValue: null,
    _globalName: null
  };
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context
  };
  var hasWarnedAboutUsingNestedContextConsumers = false;
  var hasWarnedAboutUsingConsumerProvider = false;
  var hasWarnedAboutDisplayNameOnConsumer = false;

  {
    // A separate object, but proxies back to the original context object for
    // backwards compatibility. It has a different $$typeof, so we can properly
    // warn for the incorrect usage of Context as a Consumer.
    var Consumer = {
      $$typeof: REACT_CONTEXT_TYPE,
      _context: context
    }; // $FlowFixMe: Flow complains about not setting a value, which is intentional here

    Object.defineProperties(Consumer, {
      Provider: {
        get: function () {
          if (!hasWarnedAboutUsingConsumerProvider) {
            hasWarnedAboutUsingConsumerProvider = true;

            error('Rendering <Context.Consumer.Provider> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Provider> instead?');
          }

          return context.Provider;
        },
        set: function (_Provider) {
          context.Provider = _Provider;
        }
      },
      _currentValue: {
        get: function () {
          return context._currentValue;
        },
        set: function (_currentValue) {
          context._currentValue = _currentValue;
        }
      },
      _currentValue2: {
        get: function () {
          return context._currentValue2;
        },
        set: function (_currentValue2) {
          context._currentValue2 = _currentValue2;
        }
      },
      _threadCount: {
        get: function () {
          return context._threadCount;
        },
        set: function (_threadCount) {
          context._threadCount = _threadCount;
        }
      },
      Consumer: {
        get: function () {
          if (!hasWarnedAboutUsingNestedContextConsumers) {
            hasWarnedAboutUsingNestedContextConsumers = true;

            error('Rendering <Context.Consumer.Consumer> is not supported and will be removed in ' + 'a future major release. Did you mean to render <Context.Consumer> instead?');
          }

          return context.Consumer;
        }
      },
      displayName: {
        get: function () {
          return context.displayName;
        },
        set: function (displayName) {
          if (!hasWarnedAboutDisplayNameOnConsumer) {
            warn('Setting `displayName` on Context.Consumer has no effect. ' + "You should set it directly on the context with Context.displayName = '%s'.", displayName);

            hasWarnedAboutDisplayNameOnConsumer = true;
          }
        }
      }
    }); // $FlowFixMe: Flow complains about missing properties because it doesn't understand defineProperty

    context.Consumer = Consumer;
  }

  {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}

var Uninitialized = -1;
var Pending = 0;
var Resolved = 1;
var Rejected = 2;

function lazyInitializer(payload) {
  if (payload._status === Uninitialized) {
    var ctor = payload._result;
    var thenable = ctor(); // Transition to the next state.
    // This might throw either because it's missing or throws. If so, we treat it
    // as still uninitialized and try again next time. Which is the same as what
    // happens if the ctor or any wrappers processing the ctor throws. This might
    // end up fixing it if the resolution was a concurrency bug.

    thenable.then(function (moduleObject) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        // Transition to the next state.
        var resolved = payload;
        resolved._status = Resolved;
        resolved._result = moduleObject;
      }
    }, function (error) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        // Transition to the next state.
        var rejected = payload;
        rejected._status = Rejected;
        rejected._result = error;
      }
    });

    if (payload._status === Uninitialized) {
      // In case, we're still uninitialized, then we're waiting for the thenable
      // to resolve. Set it as pending in the meantime.
      var pending = payload;
      pending._status = Pending;
      pending._result = thenable;
    }
  }

  if (payload._status === Resolved) {
    var moduleObject = payload._result;

    {
      if (moduleObject === undefined) {
        error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
        'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))\n\n" + 'Did you accidentally put curly braces around the import?', moduleObject);
      }
    }

    {
      if (!('default' in moduleObject)) {
        error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
        'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))", moduleObject);
      }
    }

    return moduleObject.default;
  } else {
    throw payload._result;
  }
}

function lazy(ctor) {
  var payload = {
    // We use these fields to store the result.
    _status: Uninitialized,
    _result: ctor
  };
  var lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer
  };

  {
    // In production, this would just set it on the object.
    var defaultProps;
    var propTypes; // $FlowFixMe

    Object.defineProperties(lazyType, {
      defaultProps: {
        configurable: true,
        get: function () {
          return defaultProps;
        },
        set: function (newDefaultProps) {
          error('React.lazy(...): It is not supported to assign `defaultProps` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');

          defaultProps = newDefaultProps; // Match production behavior more closely:
          // $FlowFixMe

          Object.defineProperty(lazyType, 'defaultProps', {
            enumerable: true
          });
        }
      },
      propTypes: {
        configurable: true,
        get: function () {
          return propTypes;
        },
        set: function (newPropTypes) {
          error('React.lazy(...): It is not supported to assign `propTypes` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');

          propTypes = newPropTypes; // Match production behavior more closely:
          // $FlowFixMe

          Object.defineProperty(lazyType, 'propTypes', {
            enumerable: true
          });
        }
      }
    });
  }

  return lazyType;
}

function forwardRef(render) {
  {
    if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
      error('forwardRef requires a render function but received a `memo` ' + 'component. Instead of forwardRef(memo(...)), use ' + 'memo(forwardRef(...)).');
    } else if (typeof render !== 'function') {
      error('forwardRef requires a render function but was given %s.', render === null ? 'null' : typeof render);
    } else {
      if (render.length !== 0 && render.length !== 2) {
        error('forwardRef render functions accept exactly two parameters: props and ref. %s', render.length === 1 ? 'Did you forget to use the ref parameter?' : 'Any additional parameter will be undefined.');
      }
    }

    if (render != null) {
      if (render.defaultProps != null || render.propTypes != null) {
        error('forwardRef render functions do not support propTypes or defaultProps. ' + 'Did you accidentally pass a React component?');
      }
    }
  }

  var elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render: render
  };

  {
    var ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        return ownName;
      },
      set: function (name) {
        ownName = name; // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.forwardRef((props, ref) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.

        if (!render.name && !render.displayName) {
          render.displayName = name;
        }
      }
    });
  }

  return elementType;
}

var REACT_MODULE_REFERENCE;

{
  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
}

function isValidElementType(type) {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
    // types supported by any Flight configuration anywhere since
    // we don't know which Flight build this will end up being used
    // with.
    type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {
      return true;
    }
  }

  return false;
}

function memo(type, compare) {
  {
    if (!isValidElementType(type)) {
      error('memo: The first argument must be a component. Instead ' + 'received: %s', type === null ? 'null' : typeof type);
    }
  }

  var elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type: type,
    compare: compare === undefined ? null : compare
  };

  {
    var ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        return ownName;
      },
      set: function (name) {
        ownName = name; // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.memo((props) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.

        if (!type.name && !type.displayName) {
          type.displayName = name;
        }
      }
    });
  }

  return elementType;
}

function resolveDispatcher() {
  var dispatcher = ReactCurrentDispatcher.current;

  {
    if (dispatcher === null) {
      error('Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' + ' one of the following reasons:\n' + '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' + '2. You might be breaking the Rules of Hooks\n' + '3. You might have more than one copy of React in the same app\n' + 'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.');
    }
  } // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.


  return dispatcher;
}
function useContext(Context) {
  var dispatcher = resolveDispatcher();

  {
    // TODO: add a more generic warning for invalid values.
    if (Context._context !== undefined) {
      var realContext = Context._context; // Don't deduplicate because this legitimately causes bugs
      // and nobody should be using this in existing code.

      if (realContext.Consumer === Context) {
        error('Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be ' + 'removed in a future major release. Did you mean to call useContext(Context) instead?');
      } else if (realContext.Provider === Context) {
        error('Calling useContext(Context.Provider) is not supported. ' + 'Did you mean to call useContext(Context) instead?');
      }
    }
  }

  return dispatcher.useContext(Context);
}
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
function useRef(initialValue) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
function useEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}
function useInsertionEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useInsertionEffect(create, deps);
}
function useLayoutEffect(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}
function useCallback(callback, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
}
function useMemo(create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, deps);
}
function useImperativeHandle(ref, create, deps) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
}
function useDebugValue(value, formatterFn) {
  {
    var dispatcher = resolveDispatcher();
    return dispatcher.useDebugValue(value, formatterFn);
  }
}
function useTransition() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
}
function useDeferredValue(value) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value);
}
function useId() {
  var dispatcher = resolveDispatcher();
  return dispatcher.useId();
}
function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Helpers to patch console.logs to avoid logging during side-effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.
var disabledDepth = 0;
var prevLog;
var prevInfo;
var prevWarn;
var prevError;
var prevGroup;
var prevGroupCollapsed;
var prevGroupEnd;

function disabledLog() {}

disabledLog.__reactDisabledLog = true;
function disableLogs() {
  {
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      prevLog = console.log;
      prevInfo = console.info;
      prevWarn = console.warn;
      prevError = console.error;
      prevGroup = console.group;
      prevGroupCollapsed = console.groupCollapsed;
      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

      var props = {
        configurable: true,
        enumerable: true,
        value: disabledLog,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        info: props,
        log: props,
        warn: props,
        error: props,
        group: props,
        groupCollapsed: props,
        groupEnd: props
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    disabledDepth++;
  }
}
function reenableLogs() {
  {
    disabledDepth--;

    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      var props = {
        configurable: true,
        enumerable: true,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        log: assign({}, props, {
          value: prevLog
        }),
        info: assign({}, props, {
          value: prevInfo
        }),
        warn: assign({}, props, {
          value: prevWarn
        }),
        error: assign({}, props, {
          value: prevError
        }),
        group: assign({}, props, {
          value: prevGroup
        }),
        groupCollapsed: assign({}, props, {
          value: prevGroupCollapsed
        }),
        groupEnd: assign({}, props, {
          value: prevGroupEnd
        })
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    if (disabledDepth < 0) {
      error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
    }
  }
}

var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
var prefix;
function describeBuiltInComponentFrame(name, source, ownerFn) {
  {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        var match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = match && match[1] || '';
      }
    } // We use the prefix to ensure our stacks line up with native stack frames.


    return '\n' + prefix + name;
  }
}
var reentry = false;
var componentFrameCache;

{
  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap();
}

function describeNativeComponentFrame(fn, construct) {
  // If something asked for a stack inside a fake render, it should get ignored.
  if ( !fn || reentry) {
    return '';
  }

  {
    var frame = componentFrameCache.get(fn);

    if (frame !== undefined) {
      return frame;
    }
  }

  var control;
  reentry = true;
  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

  Error.prepareStackTrace = undefined;
  var previousDispatcher;

  {
    previousDispatcher = ReactCurrentDispatcher$1.current; // Set the dispatcher in DEV because this might be call in the render function
    // for warnings.

    ReactCurrentDispatcher$1.current = null;
    disableLogs();
  }

  try {
    // This should throw.
    if (construct) {
      // Something should be setting the props in the constructor.
      var Fake = function () {
        throw Error();
      }; // $FlowFixMe


      Object.defineProperty(Fake.prototype, 'props', {
        set: function () {
          // We use a throwing setter instead of frozen or non-writable props
          // because that won't throw in a non-strict mode function.
          throw Error();
        }
      });

      if (typeof Reflect === 'object' && Reflect.construct) {
        // We construct a different control for this case to include any extra
        // frames added by the construct call.
        try {
          Reflect.construct(Fake, []);
        } catch (x) {
          control = x;
        }

        Reflect.construct(fn, [], Fake);
      } else {
        try {
          Fake.call();
        } catch (x) {
          control = x;
        }

        fn.call(Fake.prototype);
      }
    } else {
      try {
        throw Error();
      } catch (x) {
        control = x;
      }

      fn();
    }
  } catch (sample) {
    // This is inlined manually because closure doesn't do it for us.
    if (sample && control && typeof sample.stack === 'string') {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      var sampleLines = sample.stack.split('\n');
      var controlLines = control.stack.split('\n');
      var s = sampleLines.length - 1;
      var c = controlLines.length - 1;

      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
        // We expect at least one stack frame to be shared.
        // Typically this will be the root most one. However, stack frames may be
        // cut off due to maximum stack limits. In this case, one maybe cut off
        // earlier than the other. We assume that the sample is longer or the same
        // and there for cut off earlier. So we should find the root most frame in
        // the sample somewhere in the control.
        c--;
      }

      for (; s >= 1 && c >= 0; s--, c--) {
        // Next we find the first one that isn't the same which should be the
        // frame that called our sample function and the control.
        if (sampleLines[s] !== controlLines[c]) {
          // In V8, the first line is describing the message but other VMs don't.
          // If we're about to return the first line, and the control is also on the same
          // line, that's a pretty good indicator that our sample threw at same line as
          // the control. I.e. before we entered the sample frame. So we ignore this result.
          // This can happen if you passed a class to function component, or non-function.
          if (s !== 1 || c !== 1) {
            do {
              s--;
              c--; // We may still have similar intermediate frames from the construct call.
              // The next one that isn't the same should be our match though.

              if (c < 0 || sampleLines[s] !== controlLines[c]) {
                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
                // but we have a user-provided "displayName"
                // splice it in to make the stack more readable.


                if (fn.displayName && _frame.includes('<anonymous>')) {
                  _frame = _frame.replace('<anonymous>', fn.displayName);
                }

                {
                  if (typeof fn === 'function') {
                    componentFrameCache.set(fn, _frame);
                  }
                } // Return the line we found.


                return _frame;
              }
            } while (s >= 1 && c >= 0);
          }

          break;
        }
      }
    }
  } finally {
    reentry = false;

    {
      ReactCurrentDispatcher$1.current = previousDispatcher;
      reenableLogs();
    }

    Error.prepareStackTrace = previousPrepareStackTrace;
  } // Fallback to just using the name if we couldn't make it throw.


  var name = fn ? fn.displayName || fn.name : '';
  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

  {
    if (typeof fn === 'function') {
      componentFrameCache.set(fn, syntheticFrame);
    }
  }

  return syntheticFrame;
}
function describeFunctionComponentFrame(fn, source, ownerFn) {
  {
    return describeNativeComponentFrame(fn, false);
  }
}

function shouldConstruct(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {

  if (type == null) {
    return '';
  }

  if (typeof type === 'function') {
    {
      return describeNativeComponentFrame(type, shouldConstruct(type));
    }
  }

  if (typeof type === 'string') {
    return describeBuiltInComponentFrame(type);
  }

  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame('Suspense');

    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame('SuspenseList');
  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeFunctionComponentFrame(type.render);

      case REACT_MEMO_TYPE:
        // Memo may contain any component type so we recursively resolve it.
        return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

      case REACT_LAZY_TYPE:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            // Lazy may contain any component type so we recursively resolve it.
            return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
          } catch (x) {}
        }
    }
  }

  return '';
}

var loggedTypeFailures = {};
var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
      ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
    } else {
      ReactDebugCurrentFrame$1.setExtraStackFrame(null);
    }
  }
}

function checkPropTypes(typeSpecs, values, location, componentName, element) {
  {
    // $FlowFixMe This is okay but Flow doesn't know it.
    var has = Function.call.bind(hasOwnProperty);

    for (var typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        var error$1 = void 0; // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.

        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            // eslint-disable-next-line react-internal/prod-error-codes
            var err = Error((componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' + 'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.');
            err.name = 'Invariant Violation';
            throw err;
          }

          error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED');
        } catch (ex) {
          error$1 = ex;
        }

        if (error$1 && !(error$1 instanceof Error)) {
          setCurrentlyValidatingElement(element);

          error('%s: type specification of %s' + ' `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error$1);

          setCurrentlyValidatingElement(null);
        }

        if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error$1.message] = true;
          setCurrentlyValidatingElement(element);

          error('Failed %s type: %s', location, error$1.message);

          setCurrentlyValidatingElement(null);
        }
      }
    }
  }
}

function setCurrentlyValidatingElement$1(element) {
  {
    if (element) {
      var owner = element._owner;
      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
      setExtraStackFrame(stack);
    } else {
      setExtraStackFrame(null);
    }
  }
}

var propTypesMisspellWarningShown;

{
  propTypesMisspellWarningShown = false;
}

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = getComponentNameFromType(ReactCurrentOwner.current.type);

    if (name) {
      return '\n\nCheck the render method of `' + name + '`.';
    }
  }

  return '';
}

function getSourceInfoErrorAddendum(source) {
  if (source !== undefined) {
    var fileName = source.fileName.replace(/^.*[\\\/]/, '');
    var lineNumber = source.lineNumber;
    return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
  }

  return '';
}

function getSourceInfoErrorAddendumForProps(elementProps) {
  if (elementProps !== null && elementProps !== undefined) {
    return getSourceInfoErrorAddendum(elementProps.__source);
  }

  return '';
}
/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */


var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;

    if (parentName) {
      info = "\n\nCheck the top-level render call using <" + parentName + ">.";
    }
  }

  return info;
}
/**
 * Warn if the element doesn't have an explicit key assigned to it.
 * This element is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it. Error statuses are cached so a warning
 * will only be shown once.
 *
 * @internal
 * @param {ReactElement} element Element that requires a key.
 * @param {*} parentType element's parent's type.
 */


function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }

  element._store.validated = true;
  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);

  if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
    return;
  }

  ownerHasKeyUseWarning[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.

  var childOwner = '';

  if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
    // Give the component that originally created this child.
    childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
  }

  {
    setCurrentlyValidatingElement$1(element);

    error('Each child in a list should have a unique "key" prop.' + '%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);

    setCurrentlyValidatingElement$1(null);
  }
}
/**
 * Ensure that every element either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {ReactNode} node Statically passed child of any type.
 * @param {*} parentType node's parent's type.
 */


function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }

  if (isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];

      if (isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (isValidElement(node)) {
    // This element was passed in a valid location.
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn = getIteratorFn(node);

    if (typeof iteratorFn === 'function') {
      // Entry iterators used to provide implicit keys,
      // but now we print a separate warning for them later.
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;

        while (!(step = iterator.next()).done) {
          if (isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    }
  }
}
/**
 * Given an element, validate that its props follow the propTypes definition,
 * provided by the type.
 *
 * @param {ReactElement} element
 */


function validatePropTypes(element) {
  {
    var type = element.type;

    if (type === null || type === undefined || typeof type === 'string') {
      return;
    }

    var propTypes;

    if (typeof type === 'function') {
      propTypes = type.propTypes;
    } else if (typeof type === 'object' && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
    // Inner props are checked in the reconciler.
    type.$$typeof === REACT_MEMO_TYPE)) {
      propTypes = type.propTypes;
    } else {
      return;
    }

    if (propTypes) {
      // Intentionally inside to avoid triggering lazy initializers:
      var name = getComponentNameFromType(type);
      checkPropTypes(propTypes, element.props, 'prop', name, element);
    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
      propTypesMisspellWarningShown = true; // Intentionally inside to avoid triggering lazy initializers:

      var _name = getComponentNameFromType(type);

      error('Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?', _name || 'Unknown');
    }

    if (typeof type.getDefaultProps === 'function' && !type.getDefaultProps.isReactClassApproved) {
      error('getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.');
    }
  }
}
/**
 * Given a fragment, validate that it can only be provided with fragment props
 * @param {ReactElement} fragment
 */


function validateFragmentProps(fragment) {
  {
    var keys = Object.keys(fragment.props);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (key !== 'children' && key !== 'key') {
        setCurrentlyValidatingElement$1(fragment);

        error('Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);

        setCurrentlyValidatingElement$1(null);
        break;
      }
    }

    if (fragment.ref !== null) {
      setCurrentlyValidatingElement$1(fragment);

      error('Invalid attribute `ref` supplied to `React.Fragment`.');

      setCurrentlyValidatingElement$1(null);
    }
  }
}
function createElementWithValidation(type, props, children) {
  var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
  // succeed and there will likely be errors in render.

  if (!validType) {
    var info = '';

    if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
      info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
    }

    var sourceInfo = getSourceInfoErrorAddendumForProps(props);

    if (sourceInfo) {
      info += sourceInfo;
    } else {
      info += getDeclarationErrorAddendum();
    }

    var typeString;

    if (type === null) {
      typeString = 'null';
    } else if (isArray(type)) {
      typeString = 'array';
    } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
      typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
      info = ' Did you accidentally export a JSX literal instead of a component?';
    } else {
      typeString = typeof type;
    }

    {
      error('React.createElement: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
    }
  }

  var element = createElement.apply(this, arguments); // The result can be nullish if a mock or a custom function is used.
  // TODO: Drop this when these are no longer allowed as the type argument.

  if (element == null) {
    return element;
  } // Skip key warning if the type isn't valid since our key validation logic
  // doesn't expect a non-string/function type and can throw confusing errors.
  // We don't want exception behavior to differ between dev and prod.
  // (Rendering will throw with a helpful message and as soon as the type is
  // fixed, the key warnings will appear.)


  if (validType) {
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], type);
    }
  }

  if (type === REACT_FRAGMENT_TYPE) {
    validateFragmentProps(element);
  } else {
    validatePropTypes(element);
  }

  return element;
}
var didWarnAboutDeprecatedCreateFactory = false;
function createFactoryWithValidation(type) {
  var validatedFactory = createElementWithValidation.bind(null, type);
  validatedFactory.type = type;

  {
    if (!didWarnAboutDeprecatedCreateFactory) {
      didWarnAboutDeprecatedCreateFactory = true;

      warn('React.createFactory() is deprecated and will be removed in ' + 'a future major release. Consider using JSX ' + 'or use React.createElement() directly instead.');
    } // Legacy hook: remove it


    Object.defineProperty(validatedFactory, 'type', {
      enumerable: false,
      get: function () {
        warn('Factory.type is deprecated. Access the class directly ' + 'before passing it to createFactory.');

        Object.defineProperty(this, 'type', {
          value: type
        });
        return type;
      }
    });
  }

  return validatedFactory;
}
function cloneElementWithValidation(element, props, children) {
  var newElement = cloneElement.apply(this, arguments);

  for (var i = 2; i < arguments.length; i++) {
    validateChildKeys(arguments[i], newElement.type);
  }

  validatePropTypes(newElement);
  return newElement;
}

function startTransition(scope, options) {
  var prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  var currentTransition = ReactCurrentBatchConfig.transition;

  {
    ReactCurrentBatchConfig.transition._updatedFibers = new Set();
  }

  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;

    {
      if (prevTransition === null && currentTransition._updatedFibers) {
        var updatedFibersCount = currentTransition._updatedFibers.size;

        if (updatedFibersCount > 10) {
          warn('Detected a large number of updates inside startTransition. ' + 'If this is due to a subscription please re-write it to use React provided hooks. ' + 'Otherwise concurrent mode guarantees are off the table.');
        }

        currentTransition._updatedFibers.clear();
      }
    }
  }
}

var didWarnAboutMessageChannel = false;
var enqueueTaskImpl = null;
function enqueueTask(task) {
  if (enqueueTaskImpl === null) {
    try {
      // read require off the module object to get around the bundlers.
      // we don't want them to detect a require and bundle a Node polyfill.
      var requireString = ('require' + Math.random()).slice(0, 7);
      var nodeRequire = module && module[requireString]; // assuming we're in node, let's try to get node's
      // version of setImmediate, bypassing fake timers if any.

      enqueueTaskImpl = nodeRequire.call(module, 'timers').setImmediate;
    } catch (_err) {
      // we're in a browser
      // we can't use regular timers because they may still be faked
      // so we try MessageChannel+postMessage instead
      enqueueTaskImpl = function (callback) {
        {
          if (didWarnAboutMessageChannel === false) {
            didWarnAboutMessageChannel = true;

            if (typeof MessageChannel === 'undefined') {
              error('This browser does not have a MessageChannel implementation, ' + 'so enqueuing tasks via await act(async () => ...) will fail. ' + 'Please file an issue at https://github.com/facebook/react/issues ' + 'if you encounter this warning.');
            }
          }
        }

        var channel = new MessageChannel();
        channel.port1.onmessage = callback;
        channel.port2.postMessage(undefined);
      };
    }
  }

  return enqueueTaskImpl(task);
}

var actScopeDepth = 0;
var didWarnNoAwaitAct = false;
function act(callback) {
  {
    // `act` calls can be nested, so we track the depth. This represents the
    // number of `act` scopes on the stack.
    var prevActScopeDepth = actScopeDepth;
    actScopeDepth++;

    if (ReactCurrentActQueue.current === null) {
      // This is the outermost `act` scope. Initialize the queue. The reconciler
      // will detect the queue and use it instead of Scheduler.
      ReactCurrentActQueue.current = [];
    }

    var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
    var result;

    try {
      // Used to reproduce behavior of `batchedUpdates` in legacy mode. Only
      // set to `true` while the given callback is executed, not for updates
      // triggered during an async event, because this is how the legacy
      // implementation of `act` behaved.
      ReactCurrentActQueue.isBatchingLegacy = true;
      result = callback(); // Replicate behavior of original `act` implementation in legacy mode,
      // which flushed updates immediately after the scope function exits, even
      // if it's an async function.

      if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
        var queue = ReactCurrentActQueue.current;

        if (queue !== null) {
          ReactCurrentActQueue.didScheduleLegacyUpdate = false;
          flushActQueue(queue);
        }
      }
    } catch (error) {
      popActScope(prevActScopeDepth);
      throw error;
    } finally {
      ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
    }

    if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
      var thenableResult = result; // The callback is an async function (i.e. returned a promise). Wait
      // for it to resolve before exiting the current scope.

      var wasAwaited = false;
      var thenable = {
        then: function (resolve, reject) {
          wasAwaited = true;
          thenableResult.then(function (returnValue) {
            popActScope(prevActScopeDepth);

            if (actScopeDepth === 0) {
              // We've exited the outermost act scope. Recursively flush the
              // queue until there's no remaining work.
              recursivelyFlushAsyncActWork(returnValue, resolve, reject);
            } else {
              resolve(returnValue);
            }
          }, function (error) {
            // The callback threw an error.
            popActScope(prevActScopeDepth);
            reject(error);
          });
        }
      };

      {
        if (!didWarnNoAwaitAct && typeof Promise !== 'undefined') {
          // eslint-disable-next-line no-undef
          Promise.resolve().then(function () {}).then(function () {
            if (!wasAwaited) {
              didWarnNoAwaitAct = true;

              error('You called act(async () => ...) without await. ' + 'This could lead to unexpected testing behaviour, ' + 'interleaving multiple act calls and mixing their ' + 'scopes. ' + 'You should - await act(async () => ...);');
            }
          });
        }
      }

      return thenable;
    } else {
      var returnValue = result; // The callback is not an async function. Exit the current scope
      // immediately, without awaiting.

      popActScope(prevActScopeDepth);

      if (actScopeDepth === 0) {
        // Exiting the outermost act scope. Flush the queue.
        var _queue = ReactCurrentActQueue.current;

        if (_queue !== null) {
          flushActQueue(_queue);
          ReactCurrentActQueue.current = null;
        } // Return a thenable. If the user awaits it, we'll flush again in
        // case additional work was scheduled by a microtask.


        var _thenable = {
          then: function (resolve, reject) {
            // Confirm we haven't re-entered another `act` scope, in case
            // the user does something weird like await the thenable
            // multiple times.
            if (ReactCurrentActQueue.current === null) {
              // Recursively flush the queue until there's no remaining work.
              ReactCurrentActQueue.current = [];
              recursivelyFlushAsyncActWork(returnValue, resolve, reject);
            } else {
              resolve(returnValue);
            }
          }
        };
        return _thenable;
      } else {
        // Since we're inside a nested `act` scope, the returned thenable
        // immediately resolves. The outer scope will flush the queue.
        var _thenable2 = {
          then: function (resolve, reject) {
            resolve(returnValue);
          }
        };
        return _thenable2;
      }
    }
  }
}

function popActScope(prevActScopeDepth) {
  {
    if (prevActScopeDepth !== actScopeDepth - 1) {
      error('You seem to have overlapping act() calls, this is not supported. ' + 'Be sure to await previous act() calls before making a new one. ');
    }

    actScopeDepth = prevActScopeDepth;
  }
}

function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
  {
    var queue = ReactCurrentActQueue.current;

    if (queue !== null) {
      try {
        flushActQueue(queue);
        enqueueTask(function () {
          if (queue.length === 0) {
            // No additional work was scheduled. Finish.
            ReactCurrentActQueue.current = null;
            resolve(returnValue);
          } else {
            // Keep flushing work until there's none left.
            recursivelyFlushAsyncActWork(returnValue, resolve, reject);
          }
        });
      } catch (error) {
        reject(error);
      }
    } else {
      resolve(returnValue);
    }
  }
}

var isFlushing = false;

function flushActQueue(queue) {
  {
    if (!isFlushing) {
      // Prevent re-entrance.
      isFlushing = true;
      var i = 0;

      try {
        for (; i < queue.length; i++) {
          var callback = queue[i];

          do {
            callback = callback(true);
          } while (callback !== null);
        }

        queue.length = 0;
      } catch (error) {
        // If something throws, leave the remaining callbacks on the queue.
        queue = queue.slice(i + 1);
        throw error;
      } finally {
        isFlushing = false;
      }
    }
  }
}

var createElement$1 =  createElementWithValidation ;
var cloneElement$1 =  cloneElementWithValidation ;
var createFactory =  createFactoryWithValidation ;
var Children = {
  map: mapChildren,
  forEach: forEachChildren,
  count: countChildren,
  toArray: toArray,
  only: onlyChild
};

exports.Children = Children;
exports.Component = Component;
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.Profiler = REACT_PROFILER_TYPE;
exports.PureComponent = PureComponent;
exports.StrictMode = REACT_STRICT_MODE_TYPE;
exports.Suspense = REACT_SUSPENSE_TYPE;
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
exports.cloneElement = cloneElement$1;
exports.createContext = createContext;
exports.createElement = createElement$1;
exports.createFactory = createFactory;
exports.createRef = createRef;
exports.forwardRef = forwardRef;
exports.isValidElement = isValidElement;
exports.lazy = lazy;
exports.memo = memo;
exports.startTransition = startTransition;
exports.unstable_act = act;
exports.useCallback = useCallback;
exports.useContext = useContext;
exports.useDebugValue = useDebugValue;
exports.useDeferredValue = useDeferredValue;
exports.useEffect = useEffect;
exports.useId = useId;
exports.useImperativeHandle = useImperativeHandle;
exports.useInsertionEffect = useInsertionEffect;
exports.useLayoutEffect = useLayoutEffect;
exports.useMemo = useMemo;
exports.useReducer = useReducer;
exports.useRef = useRef;
exports.useState = useState;
exports.useSyncExternalStore = useSyncExternalStore;
exports.useTransition = useTransition;
exports.version = ReactVersion;
          /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop ===
    'function'
) {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
}
        
  })();
}


/***/ }),

/***/ "./node_modules/react/index.js":
/*!*************************************!*\
  !*** ./node_modules/react/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (false) {} else {
  module.exports = __webpack_require__(/*! ./cjs/react.development.js */ "./node_modules/react/cjs/react.development.js");
}


/***/ }),

/***/ "./src/Core.ts":
/*!*********************!*\
  !*** ./src/Core.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Core": () => (/* binding */ Core),
/* harmony export */   "core": () => (/* binding */ core)
/* harmony export */ });
/* harmony import */ var _types_Direction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types/Direction */ "./src/types/Direction.ts");
/* harmony import */ var _types_ElementRectangle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types/ElementRectangle */ "./src/types/ElementRectangle.ts");


if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.matchesSelector
        || Element.prototype.mozMatchesSelector
        || Element.prototype.msMatchesSelector
        || Element.prototype.oMatchesSelector
        || Element.prototype.webkitMatchesSelector
        || ((s) => {
            if (undefined) {
                const matches = (undefined.document || undefined.ownerDocument).querySelectorAll(s);
                let i = matches.length;
                while (--i >= 0 && matches.item(i) !== undefined) { }
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
        const targetRectImpl = new _types_ElementRectangle__WEBPACK_IMPORTED_MODULE_1__.ElementRectangleImpl(targetRect);
        const groups = this.partition(rects, targetRect, section.configuration.straightOverlapThreshold);
        const internalGroups = this.partition(groups[4], targetRect.center, section.configuration.straightOverlapThreshold);
        let priorities;
        switch (direction) {
            case _types_Direction__WEBPACK_IMPORTED_MODULE_0__.Direction.LEFT:
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
            case _types_Direction__WEBPACK_IMPORTED_MODULE_0__.Direction.RIGHT:
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
            case _types_Direction__WEBPACK_IMPORTED_MODULE_0__.Direction.UP:
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
            case _types_Direction__WEBPACK_IMPORTED_MODULE_0__.Direction.DOWN:
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



/***/ }),

/***/ "./src/SpatialNavigation.ts":
/*!**********************************!*\
  !*** ./src/SpatialNavigation.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SpatialNavigation": () => (/* binding */ SpatialNavigation),
/* harmony export */   "sn": () => (/* binding */ sn)
/* harmony export */ });
/* harmony import */ var _Core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Core */ "./src/Core.ts");
/* harmony import */ var _types_Configuration__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types/Configuration */ "./src/types/Configuration.ts");
/* harmony import */ var _types_Direction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./types/Direction */ "./src/types/Direction.ts");



class SpatialNavigation {
    constructor() {
        this._ready = false;
        this._idPool = 0;
        this._sections = {};
        this._sectionCount = 0;
        this._defaultSectionId = '';
        this._lastSectionId = '';
        this._duringFocusChange = false;
        this.globalConfiguration = _types_Configuration__WEBPACK_IMPORTED_MODULE_1__.defaultConfiguration;
        this._pause = false;
        this.core = _Core__WEBPACK_IMPORTED_MODULE_0__.core;
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
                configuration: _types_Configuration__WEBPACK_IMPORTED_MODULE_1__.defaultConfiguration,
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
            return this._focusElement(element, nextSectionId, enterIntoNewSection, _types_Direction__WEBPACK_IMPORTED_MODULE_2__.Direction.UP);
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
            this.focusSection(sectionId, _types_Direction__WEBPACK_IMPORTED_MODULE_2__.Direction.UP);
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
            && this._sections[sectionId].configuration.leaveFor[(0,_types_Direction__WEBPACK_IMPORTED_MODULE_2__.directiontoString)(direction)] !== undefined) {
            const next = this._sections[sectionId].configuration.leaveFor[(0,_types_Direction__WEBPACK_IMPORTED_MODULE_2__.directiontoString)(direction)];
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
                reverse: (0,_types_Direction__WEBPACK_IMPORTED_MODULE_2__.getReverseDirection)(direction)
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



/***/ }),

/***/ "./src/react/BoussoleElement.tsx":
/*!***************************************!*\
  !*** ./src/react/BoussoleElement.tsx ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

const BoussoleElement = (0,react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)((props, ref) => {
    const child = react__WEBPACK_IMPORTED_MODULE_0___default().Children.map(props.children, child => {
        // Checking isValidElement is the safe way and avoids a typescript
        // error too.
        if (react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(child)) {
            return react__WEBPACK_IMPORTED_MODULE_0___default().cloneElement(child, { "data-focusable": true, tabIndex: -1 });
        }
        return child;
    });
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, child));
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BoussoleElement);


/***/ }),

/***/ "./src/react/BoussoleSection.tsx":
/*!***************************************!*\
  !*** ./src/react/BoussoleSection.tsx ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _SpatialNavigation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../SpatialNavigation */ "./src/SpatialNavigation.ts");
/* harmony import */ var _types_Configuration__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../types/Configuration */ "./src/types/Configuration.ts");



class ElementProps {
    constructor() {
        this.id = '';
        this.conf = {};
    }
}
const assignConfig = (sectionId, config) => {
    const globalConfig = _types_Configuration__WEBPACK_IMPORTED_MODULE_2__.defaultConfiguration; // TO DO : integrate app.globalConfig given by developer
    const sectionConfig = ({ ...globalConfig });
    if (config) {
        Object.assign(sectionConfig, config);
    }
    sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;
    return sectionConfig;
};
const BoussoleSection = (0,react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)((props, ref) => {
    let sectionId = '';
    let config = {};
    if (props.id && props.conf) {
        sectionId = props.id;
        config = props.conf;
        try {
            _SpatialNavigation__WEBPACK_IMPORTED_MODULE_1__.SpatialNavigation.getInstance().add(sectionId, config);
        }
        catch (error) { }
    }
    else {
        sectionId = _SpatialNavigation__WEBPACK_IMPORTED_MODULE_1__.SpatialNavigation.getInstance().add(undefined, _types_Configuration__WEBPACK_IMPORTED_MODULE_2__.defaultConfiguration);
    }
    // config.element = this.el.nativeElement;
    if (config) {
        _SpatialNavigation__WEBPACK_IMPORTED_MODULE_1__.SpatialNavigation.getInstance().set(sectionId, assignConfig(sectionId, config));
    }
    // set default section
    // if (this.focusSection.modifiers.default) {
    // SpatialNavigation.getInstance().setDefaultSection(sectionId);
    //   }
    const child = react__WEBPACK_IMPORTED_MODULE_0___default().Children.map(props.children, child => {
        // Checking isValidElement is the safe way and avoids a typescript
        // error too.
        if (react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(child)) {
            return react__WEBPACK_IMPORTED_MODULE_0___default().cloneElement(child, { "data-section-id": sectionId, tabIndex: -1 });
        }
        return child;
    });
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, child));
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BoussoleSection);


/***/ }),

/***/ "./src/types/Configuration.ts":
/*!************************************!*\
  !*** ./src/types/Configuration.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultConfiguration": () => (/* binding */ defaultConfiguration)
/* harmony export */ });
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



/***/ }),

/***/ "./src/types/Direction.ts":
/*!********************************!*\
  !*** ./src/types/Direction.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Direction": () => (/* binding */ Direction),
/* harmony export */   "StringDirection": () => (/* binding */ StringDirection),
/* harmony export */   "directiontoString": () => (/* binding */ directiontoString),
/* harmony export */   "getReverseDirection": () => (/* binding */ getReverseDirection)
/* harmony export */ });
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


/***/ }),

/***/ "./src/types/ElementRectangle.ts":
/*!***************************************!*\
  !*** ./src/types/ElementRectangle.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ElementRectangleImpl": () => (/* binding */ ElementRectangleImpl)
/* harmony export */ });
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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!****************************!*\
  !*** ./src/react/index.ts ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BoussoleElement": () => (/* reexport safe */ _BoussoleElement__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "BoussoleSection": () => (/* reexport safe */ _BoussoleSection__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "SpatialNavigation": () => (/* reexport safe */ _SpatialNavigation__WEBPACK_IMPORTED_MODULE_2__.SpatialNavigation)
/* harmony export */ });
/* harmony import */ var _BoussoleElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./BoussoleElement */ "./src/react/BoussoleElement.tsx");
/* harmony import */ var _BoussoleSection__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./BoussoleSection */ "./src/react/BoussoleSection.tsx");
/* harmony import */ var _SpatialNavigation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../SpatialNavigation */ "./src/SpatialNavigation.ts");





})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=react.js.map