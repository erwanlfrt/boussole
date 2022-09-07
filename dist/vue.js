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
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/focus-options-polyfill/index.js":
/*!******************************************************!*\
  !*** ./node_modules/focus-options-polyfill/index.js ***!
  \******************************************************/
/***/ (() => {

// focus - focusOptions - preventScroll polyfill
(function() {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof HTMLElement === "undefined"
  ) {
    return;
  }

  var supportsPreventScrollOption = false;
  try {
    var focusElem = document.createElement("div");
    focusElem.addEventListener(
      "focus",
      function(event) {
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
    focusElem.focus(
      Object.defineProperty({}, "preventScroll", {
        get: function() {
          // Edge v18 gives a false positive for supporting inputs
          if (
            navigator &&
            typeof navigator.userAgent !== 'undefined' &&
            navigator.userAgent &&
            navigator.userAgent.match(/Edge\/1[7-8]/)) {
              return supportsPreventScrollOption = false
          }

          supportsPreventScrollOption = true;
        }
      })
    );
  } catch (e) {}

  if (
    HTMLElement.prototype.nativeFocus === undefined &&
    !supportsPreventScrollOption
  ) {
    HTMLElement.prototype.nativeFocus = HTMLElement.prototype.focus;

    var calcScrollableElements = function(element) {
      var parent = element.parentNode;
      var scrollableElements = [];
      var rootScrollingElement =
        document.scrollingElement || document.documentElement;

      while (parent && parent !== rootScrollingElement) {
        if (
          parent.offsetHeight < parent.scrollHeight ||
          parent.offsetWidth < parent.scrollWidth
        ) {
          scrollableElements.push([
            parent,
            parent.scrollTop,
            parent.scrollLeft
          ]);
        }
        parent = parent.parentNode;
      }
      parent = rootScrollingElement;
      scrollableElements.push([parent, parent.scrollTop, parent.scrollLeft]);

      return scrollableElements;
    };

    var restoreScrollPosition = function(scrollableElements) {
      for (var i = 0; i < scrollableElements.length; i++) {
        scrollableElements[i][0].scrollTop = scrollableElements[i][1];
        scrollableElements[i][0].scrollLeft = scrollableElements[i][2];
      }
      scrollableElements = [];
    };

    var patchedFocus = function(args) {
      if (args && args.preventScroll) {
        var evScrollableElements = calcScrollableElements(this);
        if (typeof setTimeout === 'function') {
          var thisElem = this;
          setTimeout(function () {
            thisElem.nativeFocus();
            restoreScrollPosition(evScrollableElements);
          }, 0);
        } else {
          this.nativeFocus();
          restoreScrollPosition(evScrollableElements);
        }
      }
      else {
        this.nativeFocus();
      }
    };

    HTMLElement.prototype.focus = patchedFocus;
  }
})();


/***/ }),

/***/ "./node_modules/scroll-behavior-polyfill/dist/index.js":
/*!*************************************************************!*\
  !*** ./node_modules/scroll-behavior-polyfill/dist/index.js ***!
  \*************************************************************/
/***/ (() => {

(function () {
    'use strict';

    var UNSUPPORTED_ENVIRONMENT = typeof window === "undefined";

    /**
     * Is true if the browser natively supports the 'scroll-behavior' CSS-property.
     * @type {boolean}
     */
    var SUPPORTS_SCROLL_BEHAVIOR = UNSUPPORTED_ENVIRONMENT ? false : "scrollBehavior" in document.documentElement.style;

    

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function getScrollingElement() {
        if (document.scrollingElement != null) {
            return document.scrollingElement;
        }
        else {
            return document.documentElement;
        }
    }

    var STYLE_ATTRIBUTE_PROPERTY_NAME = "scroll-behavior";
    var STYLE_ATTRIBUTE_PROPERTY_REGEXP = new RegExp(STYLE_ATTRIBUTE_PROPERTY_NAME + ":\\s*([^;]*)");
    /**
     * Given an Element, this function appends the given ScrollBehavior CSS property value to the elements' 'style' attribute.
     * If it doesnt already have one, it will add it.
     * @param {Element} element
     * @param {ScrollBehavior} behavior
     */
    function appendScrollBehaviorToStyleAttribute(element, behavior) {
        var addition = STYLE_ATTRIBUTE_PROPERTY_NAME + ":" + behavior;
        var attributeValue = element.getAttribute("style");
        if (attributeValue == null || attributeValue === "") {
            element.setAttribute("style", addition);
            return;
        }
        // The style attribute may already include a 'scroll-behavior:<something>' in which case that should be replaced
        var existingValueForProperty = parseScrollBehaviorFromStyleAttribute(element);
        if (existingValueForProperty != null) {
            var replacementProperty = STYLE_ATTRIBUTE_PROPERTY_NAME + ":" + existingValueForProperty;
            // Replace the variant that ends with a semi-colon which it may
            attributeValue = attributeValue.replace(replacementProperty + ";", "");
            // Replace the variant that *doesn't* end with a semi-colon
            attributeValue = attributeValue.replace(replacementProperty, "");
        }
        // Now, append the behavior to the string.
        element.setAttribute("style", attributeValue.endsWith(";") ? "" + attributeValue + addition : ";" + attributeValue + addition);
    }
    /**
     * Given an Element, this function attempts to parse its 'style' attribute (if it has one)' to extract
     * a value for the 'scroll-behavior' CSS property (if it is given within that style attribute)
     * @param {Element} element
     * @returns {ScrollBehavior?}
     */
    function parseScrollBehaviorFromStyleAttribute(element) {
        var styleAttributeValue = element.getAttribute("style");
        if (styleAttributeValue != null && styleAttributeValue.includes(STYLE_ATTRIBUTE_PROPERTY_NAME)) {
            var match = styleAttributeValue.match(STYLE_ATTRIBUTE_PROPERTY_REGEXP);
            if (match != null) {
                var _a = __read(match, 2), behavior = _a[1];
                if (behavior != null && behavior !== "") {
                    return behavior;
                }
            }
        }
        return undefined;
    }

    var styleDeclarationPropertyName = "scrollBehavior";
    /**
     * Determines the scroll behavior to use, depending on the given ScrollOptions and the position of the Element
     * within the DOM
     * @param {Element|HTMLElement|Window} inputTarget
     * @param {ScrollOptions} [options]
     * @returns {ScrollBehavior}
     */
    function getScrollBehavior(inputTarget, options) {
        // If the given 'behavior' is 'smooth', apply smooth scrolling no matter what
        if (options != null && options.behavior === "smooth")
            return "smooth";
        var target = "style" in inputTarget ? inputTarget : getScrollingElement();
        var value;
        if ("style" in target) {
            // Check if scroll-behavior is set as a property on the CSSStyleDeclaration
            var scrollBehaviorPropertyValue = target.style[styleDeclarationPropertyName];
            // Return it if it is given and has a proper value
            if (scrollBehaviorPropertyValue != null && scrollBehaviorPropertyValue !== "") {
                value = scrollBehaviorPropertyValue;
            }
        }
        if (value == null) {
            var attributeValue = target.getAttribute("scroll-behavior");
            if (attributeValue != null && attributeValue !== "") {
                value = attributeValue;
            }
        }
        if (value == null) {
            // Otherwise, check if it is set as an inline style
            value = parseScrollBehaviorFromStyleAttribute(target);
        }
        if (value == null) {
            // Take the computed style for the element and see if it contains a specific 'scroll-behavior' value
            var computedStyle = getComputedStyle(target);
            var computedStyleValue = computedStyle.getPropertyValue("scrollBehavior");
            if (computedStyleValue != null && computedStyleValue !== "") {
                value = computedStyleValue;
            }
        }
        // In all other cases, use the value from the CSSOM
        return value;
    }

    

    

    var HALF = 0.5;
    /**
     * The easing function to use when applying the smooth scrolling
     * @param {number} k
     * @returns {number}
     */
    function ease(k) {
        return HALF * (1 - Math.cos(Math.PI * k));
    }

    var NOOP = {
        reset: function () { }
    };
    var map = typeof WeakMap === "undefined" ? undefined : new WeakMap();
    function disableScrollSnap(scroller) {
        // If scroll-behavior is natively supported, or if there is no native WeakMap support, there's no need for this fix
        if (SUPPORTS_SCROLL_BEHAVIOR || map == null) {
            return NOOP;
        }
        var scrollingElement = getScrollingElement();
        var cachedScrollSnapValue;
        var cachedScrollBehaviorStyleAttributeValue;
        var secondaryScroller;
        var secondaryScrollerCachedScrollSnapValue;
        var secondaryScrollerCachedScrollBehaviorStyleAttributeValue;
        var existingResult = map.get(scroller);
        if (existingResult != null) {
            cachedScrollSnapValue = existingResult.cachedScrollSnapValue;
            cachedScrollBehaviorStyleAttributeValue = existingResult.cachedScrollBehaviorStyleAttributeValue;
            secondaryScroller = existingResult.secondaryScroller;
            secondaryScrollerCachedScrollSnapValue = existingResult.secondaryScrollerCachedScrollSnapValue;
            secondaryScrollerCachedScrollBehaviorStyleAttributeValue = existingResult.secondaryScrollerCachedScrollBehaviorStyleAttributeValue;
            existingResult.release();
        }
        else {
            cachedScrollSnapValue = scroller.style.scrollSnapType === "" ? null : scroller.style.scrollSnapType;
            cachedScrollBehaviorStyleAttributeValue = parseScrollBehaviorFromStyleAttribute(scroller);
            secondaryScroller = scroller === scrollingElement && scrollingElement !== document.body ? document.body : undefined;
            secondaryScrollerCachedScrollSnapValue =
                secondaryScroller == null ? undefined : secondaryScroller.style.scrollSnapType === "" ? null : secondaryScroller.style.scrollSnapType;
            secondaryScrollerCachedScrollBehaviorStyleAttributeValue =
                secondaryScroller == null ? undefined : parseScrollBehaviorFromStyleAttribute(secondaryScroller);
            var cachedComputedScrollSnapValue = getComputedStyle(scroller).getPropertyValue("scroll-snap-type");
            var secondaryScrollerCachedComputedScrollSnapValue = secondaryScroller == null ? undefined : getComputedStyle(secondaryScroller).getPropertyValue("scroll-snap-type");
            // If it just so happens that there actually isn't any scroll snapping going on, there's no point in performing any additional work here.
            if (cachedComputedScrollSnapValue === "none" && secondaryScrollerCachedComputedScrollSnapValue === "none") {
                return NOOP;
            }
        }
        scroller.style.scrollSnapType = "none";
        if (secondaryScroller !== undefined) {
            secondaryScroller.style.scrollSnapType = "none";
        }
        if (cachedScrollBehaviorStyleAttributeValue !== undefined) {
            appendScrollBehaviorToStyleAttribute(scroller, cachedScrollBehaviorStyleAttributeValue);
        }
        if (secondaryScroller !== undefined && secondaryScrollerCachedScrollBehaviorStyleAttributeValue !== undefined) {
            appendScrollBehaviorToStyleAttribute(secondaryScroller, secondaryScrollerCachedScrollBehaviorStyleAttributeValue);
        }
        var hasReleased = false;
        var eventTarget = scroller === scrollingElement ? window : scroller;
        function release() {
            eventTarget.removeEventListener("scroll", resetHandler);
            if (map != null) {
                map["delete"](scroller);
            }
            hasReleased = true;
        }
        function resetHandler() {
            scroller.style.scrollSnapType = cachedScrollSnapValue;
            if (secondaryScroller != null && secondaryScrollerCachedScrollSnapValue !== undefined) {
                secondaryScroller.style.scrollSnapType = secondaryScrollerCachedScrollSnapValue;
            }
            if (cachedScrollBehaviorStyleAttributeValue !== undefined) {
                appendScrollBehaviorToStyleAttribute(scroller, cachedScrollBehaviorStyleAttributeValue);
            }
            if (secondaryScroller !== undefined && secondaryScrollerCachedScrollBehaviorStyleAttributeValue !== undefined) {
                appendScrollBehaviorToStyleAttribute(secondaryScroller, secondaryScrollerCachedScrollBehaviorStyleAttributeValue);
            }
            release();
        }
        function reset() {
            setTimeout(function () {
                if (hasReleased)
                    return;
                eventTarget.addEventListener("scroll", resetHandler);
            });
        }
        map.set(scroller, {
            release: release,
            cachedScrollSnapValue: cachedScrollSnapValue,
            cachedScrollBehaviorStyleAttributeValue: cachedScrollBehaviorStyleAttributeValue,
            secondaryScroller: secondaryScroller,
            secondaryScrollerCachedScrollSnapValue: secondaryScrollerCachedScrollSnapValue,
            secondaryScrollerCachedScrollBehaviorStyleAttributeValue: secondaryScrollerCachedScrollBehaviorStyleAttributeValue
        });
        return {
            reset: reset
        };
    }

    /**
     * The duration of a smooth scroll
     * @type {number}
     */
    var SCROLL_TIME = 15000;
    /**
     * Performs a smooth repositioning of the scroll
     * @param {ISmoothScrollOptions} options
     */
    function smoothScroll(options) {
        var startTime = options.startTime, startX = options.startX, startY = options.startY, endX = options.endX, endY = options.endY, method = options.method, scroller = options.scroller;
        var timeLapsed = 0;
        var distanceX = endX - startX;
        var distanceY = endY - startY;
        var speed = Math.max(Math.abs((distanceX / 1000) * SCROLL_TIME), Math.abs((distanceY / 1000) * SCROLL_TIME));
        // Temporarily disables any scroll snapping that may be active since it fights for control over the scroller with this polyfill
        var scrollSnapFix = disableScrollSnap(scroller);
        requestAnimationFrame(function animate(timestamp) {
            timeLapsed += timestamp - startTime;
            var percentage = Math.max(0, Math.min(1, speed === 0 ? 0 : timeLapsed / speed));
            var positionX = Math.floor(startX + distanceX * ease(percentage));
            var positionY = Math.floor(startY + distanceY * ease(percentage));
            method(positionX, positionY);
            if (positionX !== endX || positionY !== endY) {
                requestAnimationFrame(animate);
            }
            else {
                if (scrollSnapFix != null) {
                    scrollSnapFix.reset();
                    scrollSnapFix = undefined;
                }
            }
        });
    }

    /**
     * Returns a High Resolution timestamp if possible, otherwise fallbacks to Date.now()
     * @returns {number}
     */
    function now() {
        if ("performance" in window)
            return performance.now();
        return Date.now();
    }

    

    var ELEMENT_ORIGINAL_SCROLL = UNSUPPORTED_ENVIRONMENT ? undefined : Element.prototype.scroll;

    var WINDOW_ORIGINAL_SCROLL = UNSUPPORTED_ENVIRONMENT ? undefined : window.scroll;

    var ELEMENT_ORIGINAL_SCROLL_BY = UNSUPPORTED_ENVIRONMENT ? undefined : Element.prototype.scrollBy;

    var WINDOW_ORIGINAL_SCROLL_BY = UNSUPPORTED_ENVIRONMENT ? undefined : window.scrollBy;

    var ELEMENT_ORIGINAL_SCROLL_TO = UNSUPPORTED_ENVIRONMENT ? undefined : Element.prototype.scrollTo;

    var WINDOW_ORIGINAL_SCROLL_TO = UNSUPPORTED_ENVIRONMENT ? undefined : window.scrollTo;

    /**
     * A fallback if Element.prototype.scroll is not defined
     * @param {number} x
     * @param {number} y
     */
    function elementPrototypeScrollFallback(x, y) {
        this.__adjustingScrollPosition = true;
        this.scrollLeft = x;
        this.scrollTop = y;
        delete this.__adjustingScrollPosition;
    }
    /**
     * A fallback if Element.prototype.scrollTo is not defined
     * @param {number} x
     * @param {number} y
     */
    function elementPrototypeScrollToFallback(x, y) {
        return elementPrototypeScrollFallback.call(this, x, y);
    }
    /**
     * A fallback if Element.prototype.scrollBy is not defined
     * @param {number} x
     * @param {number} y
     */
    function elementPrototypeScrollByFallback(x, y) {
        this.__adjustingScrollPosition = true;
        this.scrollLeft += x;
        this.scrollTop += y;
        delete this.__adjustingScrollPosition;
    }
    /**
     * Gets the original non-patched prototype method for the given kind
     * @param {ScrollMethodName} kind
     * @param {Element|Window} element
     * @return {Function}
     */
    function getOriginalScrollMethodForKind(kind, element) {
        switch (kind) {
            case "scroll":
                if (element instanceof Element) {
                    if (ELEMENT_ORIGINAL_SCROLL != null) {
                        return ELEMENT_ORIGINAL_SCROLL;
                    }
                    else {
                        return elementPrototypeScrollFallback;
                    }
                }
                else {
                    return WINDOW_ORIGINAL_SCROLL;
                }
            case "scrollBy":
                if (element instanceof Element) {
                    if (ELEMENT_ORIGINAL_SCROLL_BY != null) {
                        return ELEMENT_ORIGINAL_SCROLL_BY;
                    }
                    else {
                        return elementPrototypeScrollByFallback;
                    }
                }
                else {
                    return WINDOW_ORIGINAL_SCROLL_BY;
                }
            case "scrollTo":
                if (element instanceof Element) {
                    if (ELEMENT_ORIGINAL_SCROLL_TO != null) {
                        return ELEMENT_ORIGINAL_SCROLL_TO;
                    }
                    else {
                        return elementPrototypeScrollToFallback;
                    }
                }
                else {
                    return WINDOW_ORIGINAL_SCROLL_TO;
                }
        }
    }

    /**
     * Gets the Smooth Scroll Options to use for the step function
     * @param {Element|Window} element
     * @param {number} x
     * @param {number} y
     * @param {ScrollMethodName} kind
     * @returns {ISmoothScrollOptions}
     */
    function getSmoothScrollOptions(element, x, y, kind) {
        var startTime = now();
        if (!(element instanceof Element)) {
            // Use window as the scroll container
            var scrollX_1 = window.scrollX, pageXOffset_1 = window.pageXOffset, scrollY_1 = window.scrollY, pageYOffset_1 = window.pageYOffset;
            var startX = scrollX_1 == null || scrollX_1 === 0 ? pageXOffset_1 : scrollX_1;
            var startY = scrollY_1 == null || scrollY_1 === 0 ? pageYOffset_1 : scrollY_1;
            return {
                startTime: startTime,
                startX: startX,
                startY: startY,
                endX: Math.floor(kind === "scrollBy" ? startX + x : x),
                endY: Math.floor(kind === "scrollBy" ? startY + y : y),
                method: getOriginalScrollMethodForKind("scrollTo", window).bind(window),
                scroller: getScrollingElement()
            };
        }
        else {
            var scrollLeft = element.scrollLeft, scrollTop = element.scrollTop;
            var startX = scrollLeft;
            var startY = scrollTop;
            return {
                startTime: startTime,
                startX: startX,
                startY: startY,
                endX: Math.floor(kind === "scrollBy" ? startX + x : x),
                endY: Math.floor(kind === "scrollBy" ? startY + y : y),
                method: getOriginalScrollMethodForKind("scrollTo", element).bind(element),
                scroller: element
            };
        }
    }

    /**
     * Ensures that the given value is numeric
     * @param {number} value
     * @return {number}
     */
    function ensureNumeric(value) {
        if (value == null)
            return 0;
        else if (typeof value === "number") {
            return value;
        }
        else if (typeof value === "string") {
            return parseFloat(value);
        }
        else {
            return 0;
        }
    }

    /**
     * Returns true if the given value is some ScrollToOptions
     * @param {number | ScrollToOptions} value
     * @return {value is ScrollToOptions}
     */
    function isScrollToOptions(value) {
        return value != null && typeof value === "object";
    }

    /**
     * Handles a scroll method
     * @param {Element|Window} element
     * @param {ScrollMethodName} kind
     * @param {number | ScrollToOptions} optionsOrX
     * @param {number} y
     */
    function handleScrollMethod(element, kind, optionsOrX, y) {
        onScrollWithOptions(getScrollToOptionsWithValidation(optionsOrX, y), element, kind);
    }
    /**
     * Invoked when a 'ScrollToOptions' dict is provided to 'scroll()' as the first argument
     * @param {ScrollToOptions} options
     * @param {Element|Window} element
     * @param {ScrollMethodName} kind
     */
    function onScrollWithOptions(options, element, kind) {
        var behavior = getScrollBehavior(element, options);
        // If the behavior is 'auto' apply instantaneous scrolling
        if (behavior == null || behavior === "auto") {
            getOriginalScrollMethodForKind(kind, element).call(element, options.left, options.top);
        }
        else {
            smoothScroll(getSmoothScrollOptions(element, options.left, options.top, kind));
        }
    }
    /**
     * Normalizes the given scroll coordinates
     * @param {number?} x
     * @param {number?} y
     * @return {Required<Pick<ScrollToOptions, "top" | "left">>}
     */
    function normalizeScrollCoordinates(x, y) {
        return {
            left: ensureNumeric(x),
            top: ensureNumeric(y)
        };
    }
    /**
     * Gets ScrollToOptions based on the given arguments. Will throw if validation fails
     * @param {number | ScrollToOptions} optionsOrX
     * @param {number} y
     * @return {Required<ScrollToOptions>}
     */
    function getScrollToOptionsWithValidation(optionsOrX, y) {
        // If only one argument is given, and it isn't an options object, throw a TypeError
        if (y === undefined && !isScrollToOptions(optionsOrX)) {
            throw new TypeError("Failed to execute 'scroll' on 'Element': parameter 1 ('options') is not an object.");
        }
        // Scroll based on the primitive values given as arguments
        if (!isScrollToOptions(optionsOrX)) {
            return __assign(__assign({}, normalizeScrollCoordinates(optionsOrX, y)), { behavior: "auto" });
        }
        // Scroll based on the received options object
        else {
            return __assign(__assign({}, normalizeScrollCoordinates(optionsOrX.left, optionsOrX.top)), { behavior: optionsOrX.behavior == null ? "auto" : optionsOrX.behavior });
        }
    }

    /**
     * Patches the 'scroll' method on the Element prototype
     */
    function patchElementScroll() {
        Element.prototype.scroll = function (optionsOrX, y) {
            handleScrollMethod(this, "scroll", optionsOrX, y);
        };
    }

    /**
     * Patches the 'scrollBy' method on the Element prototype
     */
    function patchElementScrollBy() {
        Element.prototype.scrollBy = function (optionsOrX, y) {
            handleScrollMethod(this, "scrollBy", optionsOrX, y);
        };
    }

    /**
     * Patches the 'scrollTo' method on the Element prototype
     */
    function patchElementScrollTo() {
        Element.prototype.scrollTo = function (optionsOrX, y) {
            handleScrollMethod(this, "scrollTo", optionsOrX, y);
        };
    }

    /**
     * Patches the 'scroll' method on the Window prototype
     */
    function patchWindowScroll() {
        window.scroll = function (optionsOrX, y) {
            handleScrollMethod(this, "scroll", optionsOrX, y);
        };
    }

    /**
     * Patches the 'scrollBy' method on the Window prototype
     */
    function patchWindowScrollBy() {
        window.scrollBy = function (optionsOrX, y) {
            handleScrollMethod(this, "scrollBy", optionsOrX, y);
        };
    }

    /**
     * Patches the 'scrollTo' method on the Window prototype
     */
    function patchWindowScrollTo() {
        window.scrollTo = function (optionsOrX, y) {
            handleScrollMethod(this, "scrollTo", optionsOrX, y);
        };
    }

    // tslint:disable:no-any
    /**
     * Gets the parent of an element, taking into account DocumentFragments, ShadowRoots, as well as the root context (window)
     * @param {EventTarget} currentElement
     * @returns {EventTarget | null}
     */
    function getParent(currentElement) {
        if ("nodeType" in currentElement && currentElement.nodeType === 1) {
            return currentElement.parentNode;
        }
        if ("ShadowRoot" in window && currentElement instanceof window.ShadowRoot) {
            return currentElement.host;
        }
        else if (currentElement === document) {
            return window;
        }
        else if (currentElement instanceof Node)
            return currentElement.parentNode;
        return null;
    }

    /**
     * Returns true if the given overflow property represents a scrollable overflow value
     * @param {string | null} overflow
     * @return {boolean}
     */
    function canOverflow(overflow) {
        return overflow !== "visible" && overflow !== "clip";
    }
    /**
     * Returns true if the given element is scrollable
     * @param {Element} element
     * @return {boolean}
     */
    function isScrollable(element) {
        if (element.clientHeight < element.scrollHeight || element.clientWidth < element.scrollWidth) {
            var style = getComputedStyle(element, null);
            return canOverflow(style.overflowY) || canOverflow(style.overflowX);
        }
        return false;
    }
    /**
     * Finds the nearest ancestor of an element that can scroll
     * @param {Element} target
     * @returns {Element|Window?}
     */
    function findNearestAncestorsWithScrollBehavior(target) {
        var currentElement = target;
        var scrollingElement = getScrollingElement();
        while (currentElement != null) {
            var behavior = getScrollBehavior(currentElement);
            if (behavior != null && (currentElement === scrollingElement || isScrollable(currentElement))) {
                return [currentElement, behavior];
            }
            var parent_1 = getParent(currentElement);
            currentElement = parent_1;
        }
        // No such element could be found. Start over, but this time find the nearest ancestor that can simply scroll
        currentElement = target;
        while (currentElement != null) {
            if (currentElement === scrollingElement || isScrollable(currentElement)) {
                return [currentElement, "auto"];
            }
            var parent_2 = getParent(currentElement);
            currentElement = parent_2;
        }
        // Default to the scrolling element
        return [scrollingElement, "auto"];
    }

    // tslint:disable:no-any
    /**
     * Finds the nearest root from an element
     * @param {Element} target
     * @returns {Document|ShadowRoot}
     */
    function findNearestRoot(target) {
        var currentElement = target;
        while (currentElement != null) {
            if ("ShadowRoot" in window && currentElement instanceof window.ShadowRoot) {
                // Assume this is a ShadowRoot
                return currentElement;
            }
            var parent_1 = getParent(currentElement);
            if (parent_1 === currentElement) {
                return document;
            }
            currentElement = parent_1;
        }
        return document;
    }

    /**
     * Gets the origin of the given Location or HTMLAnchorElement if available in the runtime, and otherwise shims it. (it's a one-liner)
     * @returns {string}
     */
    function getLocationOrigin(locationLike) {
        if (locationLike === void 0) { locationLike = location; }
        if ("origin" in locationLike && locationLike.origin != null) {
            return locationLike.origin;
        }
        var port = locationLike.port != null && locationLike.port.length > 0 ? ":" + locationLike.port : "";
        if (locationLike.protocol === "http:" && port === ":80") {
            port = "";
        }
        else if (locationLike.protocol === "https:" && port === ":443") {
            port = "";
        }
        return locationLike.protocol + "//" + locationLike.hostname + port;
    }

    /**
     * A Regular expression that matches id's of the form "#[digit]"
     * @type {RegExp}
     */
    var ID_WITH_LEADING_DIGIT_REGEXP = /^#\d/;
    /**
     * Catches anchor navigation to IDs within the same root and ensures that they can be smooth-scrolled
     * if the scroll behavior is smooth in the first rooter within that context
     */
    function catchNavigation() {
        // Listen for 'click' events globally
        window.addEventListener("click", function (e) {
            // Only work with trusted events on HTMLAnchorElements
            if (!e.isTrusted || !(e.target instanceof HTMLAnchorElement))
                return;
            var _a = e.target, pathname = _a.pathname, search = _a.search, hash = _a.hash;
            var pointsToCurrentPage = getLocationOrigin(e.target) === getLocationOrigin(location) && pathname === location.pathname && search === location.search;
            // Only work with HTMLAnchorElements that navigates to a specific ID on the current page
            if (!pointsToCurrentPage || hash == null || hash.length < 1) {
                return;
            }
            // Find the nearest root, whether it be a ShadowRoot or the document itself
            var root = findNearestRoot(e.target);
            // Attempt to match the selector from that root. querySelector' doesn't support IDs that start with a digit, so work around that limitation
            var elementMatch = hash.match(ID_WITH_LEADING_DIGIT_REGEXP) != null ? root.getElementById(hash.slice(1)) : root.querySelector(hash);
            // If no selector could be found, don't proceed
            if (elementMatch == null)
                return;
            // Find the nearest ancestor that can be scrolled
            var _b = __read(findNearestAncestorsWithScrollBehavior(elementMatch), 2), behavior = _b[1];
            // If the behavior isn't smooth, don't proceed
            if (behavior !== "smooth")
                return;
            // Otherwise, first prevent the default action.
            e.preventDefault();
            // Now, scroll to the element with that ID
            elementMatch.scrollIntoView({
                behavior: behavior
            });
        });
    }

    var ELEMENT_ORIGINAL_SCROLL_INTO_VIEW = UNSUPPORTED_ENVIRONMENT ? undefined : Element.prototype.scrollIntoView;

    /**
     * The majority of this file is based on https://github.com/stipsan/compute-scroll-into-view (MIT license),
     * but has been rewritten to accept a scroller as an argument.
     */
    /**
     * Find out which edge to align against when logical scroll position is "nearest"
     * Interesting fact: "nearest" works similarly to "if-needed", if the element is fully visible it will not scroll it
     *
     * Legends:
     * ┌────────┐ ┏ ━ ━ ━ ┓
     * │ target │   frame
     * └────────┘ ┗ ━ ━ ━ ┛
     */
    function alignNearest(scrollingEdgeStart, scrollingEdgeEnd, scrollingSize, scrollingBorderStart, scrollingBorderEnd, elementEdgeStart, elementEdgeEnd, elementSize) {
        /**
         * If element edge A and element edge B are both outside scrolling box edge A and scrolling box edge B
         *
         *          ┌──┐
         *        ┏━│━━│━┓
         *          │  │
         *        ┃ │  │ ┃        do nothing
         *          │  │
         *        ┗━│━━│━┛
         *          └──┘
         *
         *  If element edge C and element edge D are both outside scrolling box edge C and scrolling box edge D
         *
         *    ┏ ━ ━ ━ ━ ┓
         *   ┌───────────┐
         *   │┃         ┃│        do nothing
         *   └───────────┘
         *    ┗ ━ ━ ━ ━ ┛
         */
        if ((elementEdgeStart < scrollingEdgeStart && elementEdgeEnd > scrollingEdgeEnd) ||
            (elementEdgeStart > scrollingEdgeStart && elementEdgeEnd < scrollingEdgeEnd)) {
            return 0;
        }
        /**
         * If element edge A is outside scrolling box edge A and element height is less than scrolling box height
         *
         *          ┌──┐
         *        ┏━│━━│━┓         ┏━┌━━┐━┓
         *          └──┘             │  │
         *  from  ┃      ┃     to  ┃ └──┘ ┃
         *
         *        ┗━ ━━ ━┛         ┗━ ━━ ━┛
         *
         * If element edge B is outside scrolling box edge B and element height is greater than scrolling box height
         *
         *        ┏━ ━━ ━┓         ┏━┌━━┐━┓
         *                           │  │
         *  from  ┃ ┌──┐ ┃     to  ┃ │  │ ┃
         *          │  │             │  │
         *        ┗━│━━│━┛         ┗━│━━│━┛
         *          │  │             └──┘
         *          │  │
         *          └──┘
         *
         * If element edge C is outside scrolling box edge C and element width is less than scrolling box width
         *
         *       from                 to
         *    ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *  ┌───┐                 ┌───┐
         *  │ ┃ │       ┃         ┃   │     ┃
         *  └───┘                 └───┘
         *    ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         *
         * If element edge D is outside scrolling box edge D and element width is greater than scrolling box width
         *
         *       from                 to
         *    ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *        ┌───────────┐   ┌───────────┐
         *    ┃   │     ┃     │   ┃         ┃ │
         *        └───────────┘   └───────────┘
         *    ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         */
        if ((elementEdgeStart <= scrollingEdgeStart && elementSize <= scrollingSize) ||
            (elementEdgeEnd >= scrollingEdgeEnd && elementSize >= scrollingSize)) {
            return elementEdgeStart - scrollingEdgeStart - scrollingBorderStart;
        }
        /**
         * If element edge B is outside scrolling box edge B and element height is less than scrolling box height
         *
         *        ┏━ ━━ ━┓         ┏━ ━━ ━┓
         *
         *  from  ┃      ┃     to  ┃ ┌──┐ ┃
         *          ┌──┐             │  │
         *        ┗━│━━│━┛         ┗━└━━┘━┛
         *          └──┘
         *
         * If element edge A is outside scrolling box edge A and element height is greater than scrolling box height
         *
         *          ┌──┐
         *          │  │
         *          │  │             ┌──┐
         *        ┏━│━━│━┓         ┏━│━━│━┓
         *          │  │             │  │
         *  from  ┃ └──┘ ┃     to  ┃ │  │ ┃
         *                           │  │
         *        ┗━ ━━ ━┛         ┗━└━━┘━┛
         *
         * If element edge C is outside scrolling box edge C and element width is greater than scrolling box width
         *
         *           from                 to
         *        ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *  ┌───────────┐           ┌───────────┐
         *  │     ┃     │   ┃       │ ┃         ┃
         *  └───────────┘           └───────────┘
         *        ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         *
         * If element edge D is outside scrolling box edge D and element width is less than scrolling box width
         *
         *           from                 to
         *        ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *                ┌───┐             ┌───┐
         *        ┃       │ ┃ │       ┃     │   ┃
         *                └───┘             └───┘
         *        ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         *
         */
        if ((elementEdgeEnd > scrollingEdgeEnd && elementSize < scrollingSize) || (elementEdgeStart < scrollingEdgeStart && elementSize > scrollingSize)) {
            return elementEdgeEnd - scrollingEdgeEnd + scrollingBorderEnd;
        }
        return 0;
    }
    function computeScrollIntoView(target, scroller, options) {
        var block = options.block, inline = options.inline;
        // Used to handle the top most element that can be scrolled
        var scrollingElement = getScrollingElement();
        // Support pinch-zooming properly, making sure elements scroll into the visual viewport
        // Browsers that don't support visualViewport will report the layout viewport dimensions on document.documentElement.clientWidth/Height
        // and viewport dimensions on window.innerWidth/Height
        // https://www.quirksmode.org/mobile/viewports2.html
        // https://bokand.github.io/viewport/index.html
        var viewportWidth = window.visualViewport != null ? visualViewport.width : innerWidth;
        var viewportHeight = window.visualViewport != null ? visualViewport.height : innerHeight;
        var viewportX = window.scrollX != null ? window.scrollX : window.pageXOffset;
        var viewportY = window.scrollY != null ? window.scrollY : window.pageYOffset;
        var _a = target.getBoundingClientRect(), targetHeight = _a.height, targetWidth = _a.width, targetTop = _a.top, targetRight = _a.right, targetBottom = _a.bottom, targetLeft = _a.left;
        // These values mutate as we loop through and generate scroll coordinates
        var targetBlock = block === "start" || block === "nearest" ? targetTop : block === "end" ? targetBottom : targetTop + targetHeight / 2; // block === 'center
        var targetInline = inline === "center" ? targetLeft + targetWidth / 2 : inline === "end" ? targetRight : targetLeft; // inline === 'start || inline === 'nearest
        var _b = scroller.getBoundingClientRect(), height = _b.height, width = _b.width, top = _b.top, right = _b.right, bottom = _b.bottom, left = _b.left;
        var frameStyle = getComputedStyle(scroller);
        var borderLeft = parseInt(frameStyle.borderLeftWidth, 10);
        var borderTop = parseInt(frameStyle.borderTopWidth, 10);
        var borderRight = parseInt(frameStyle.borderRightWidth, 10);
        var borderBottom = parseInt(frameStyle.borderBottomWidth, 10);
        var blockScroll = 0;
        var inlineScroll = 0;
        // The property existance checks for offset[Width|Height] is because only HTMLElement objects have them, but any Element might pass by here
        // @TODO find out if the "as HTMLElement" overrides can be dropped
        var scrollbarWidth = "offsetWidth" in scroller ? scroller.offsetWidth - scroller.clientWidth - borderLeft - borderRight : 0;
        var scrollbarHeight = "offsetHeight" in scroller ? scroller.offsetHeight - scroller.clientHeight - borderTop - borderBottom : 0;
        if (scrollingElement === scroller) {
            // Handle viewport logic (document.documentElement or document.body)
            if (block === "start") {
                blockScroll = targetBlock;
            }
            else if (block === "end") {
                blockScroll = targetBlock - viewportHeight;
            }
            else if (block === "nearest") {
                blockScroll = alignNearest(viewportY, viewportY + viewportHeight, viewportHeight, borderTop, borderBottom, viewportY + targetBlock, viewportY + targetBlock + targetHeight, targetHeight);
            }
            else {
                // block === 'center' is the default
                blockScroll = targetBlock - viewportHeight / 2;
            }
            if (inline === "start") {
                inlineScroll = targetInline;
            }
            else if (inline === "center") {
                inlineScroll = targetInline - viewportWidth / 2;
            }
            else if (inline === "end") {
                inlineScroll = targetInline - viewportWidth;
            }
            else {
                // inline === 'nearest' is the default
                inlineScroll = alignNearest(viewportX, viewportX + viewportWidth, viewportWidth, borderLeft, borderRight, viewportX + targetInline, viewportX + targetInline + targetWidth, targetWidth);
            }
            // Apply scroll position offsets and ensure they are within bounds
            // @TODO add more test cases to cover this 100%
            blockScroll = Math.max(0, blockScroll + viewportY);
            inlineScroll = Math.max(0, inlineScroll + viewportX);
        }
        else {
            // Handle each scrolling frame that might exist between the target and the viewport
            if (block === "start") {
                blockScroll = targetBlock - top - borderTop;
            }
            else if (block === "end") {
                blockScroll = targetBlock - bottom + borderBottom + scrollbarHeight;
            }
            else if (block === "nearest") {
                blockScroll = alignNearest(top, bottom, height, borderTop, borderBottom + scrollbarHeight, targetBlock, targetBlock + targetHeight, targetHeight);
            }
            else {
                // block === 'center' is the default
                blockScroll = targetBlock - (top + height / 2) + scrollbarHeight / 2;
            }
            if (inline === "start") {
                inlineScroll = targetInline - left - borderLeft;
            }
            else if (inline === "center") {
                inlineScroll = targetInline - (left + width / 2) + scrollbarWidth / 2;
            }
            else if (inline === "end") {
                inlineScroll = targetInline - right + borderRight + scrollbarWidth;
            }
            else {
                // inline === 'nearest' is the default
                inlineScroll = alignNearest(left, right, width, borderLeft, borderRight + scrollbarWidth, targetInline, targetInline + targetWidth, targetWidth);
            }
            var scrollLeft = scroller.scrollLeft, scrollTop = scroller.scrollTop;
            // Ensure scroll coordinates are not out of bounds while applying scroll offsets
            blockScroll = Math.max(0, Math.min(scrollTop + blockScroll, scroller.scrollHeight - height + scrollbarHeight));
            inlineScroll = Math.max(0, Math.min(scrollLeft + inlineScroll, scroller.scrollWidth - width + scrollbarWidth));
        }
        return {
            top: blockScroll,
            left: inlineScroll
        };
    }

    /**
     * Patches the 'scrollIntoView' method on the Element prototype
     */
    function patchElementScrollIntoView() {
        Element.prototype.scrollIntoView = function (arg) {
            var normalizedOptions = arg == null || arg === true
                ? {
                    block: "start",
                    inline: "nearest"
                }
                : arg === false
                    ? {
                        block: "end",
                        inline: "nearest"
                    }
                    : arg;
            // Find the nearest ancestor that can be scrolled
            var _a = __read(findNearestAncestorsWithScrollBehavior(this), 2), ancestorWithScroll = _a[0], ancestorWithScrollBehavior = _a[1];
            var behavior = normalizedOptions.behavior != null ? normalizedOptions.behavior : ancestorWithScrollBehavior;
            // If the behavior isn't smooth, simply invoke the original implementation and do no more
            if (behavior !== "smooth") {
                // Assert that 'scrollIntoView' is actually defined
                if (ELEMENT_ORIGINAL_SCROLL_INTO_VIEW != null) {
                    ELEMENT_ORIGINAL_SCROLL_INTO_VIEW.call(this, normalizedOptions);
                }
                // Otherwise, invoke 'scrollTo' instead and provide the scroll coordinates
                else {
                    var _b = computeScrollIntoView(this, ancestorWithScroll, normalizedOptions), top_1 = _b.top, left = _b.left;
                    getOriginalScrollMethodForKind("scrollTo", this).call(this, left, top_1);
                }
                return;
            }
            ancestorWithScroll.scrollTo(__assign({ behavior: behavior }, computeScrollIntoView(this, ancestorWithScroll, normalizedOptions)));
        };
        // On IE11, HTMLElement has its own declaration of scrollIntoView and does not inherit this from the prototype chain, so we'll need to patch that one too.
        if (HTMLElement.prototype.scrollIntoView != null && HTMLElement.prototype.scrollIntoView !== Element.prototype.scrollIntoView) {
            HTMLElement.prototype.scrollIntoView = Element.prototype.scrollIntoView;
        }
    }

    var ELEMENT_ORIGINAL_SCROLL_TOP_SET_DESCRIPTOR = UNSUPPORTED_ENVIRONMENT
        ? undefined
        : Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop").set;

    /**
     * Patches the 'scrollTop' property descriptor on the Element prototype
     */
    function patchElementScrollTop() {
        Object.defineProperty(Element.prototype, "scrollTop", {
            set: function (scrollTop) {
                if (this.__adjustingScrollPosition) {
                    return ELEMENT_ORIGINAL_SCROLL_TOP_SET_DESCRIPTOR.call(this, scrollTop);
                }
                handleScrollMethod(this, "scrollTo", this.scrollLeft, scrollTop);
                return scrollTop;
            }
        });
    }

    var ELEMENT_ORIGINAL_SCROLL_LEFT_SET_DESCRIPTOR = UNSUPPORTED_ENVIRONMENT
        ? undefined
        : Object.getOwnPropertyDescriptor(Element.prototype, "scrollLeft").set;

    /**
     * Patches the 'scrollLeft' property descriptor on the Element prototype
     */
    function patchElementScrollLeft() {
        Object.defineProperty(Element.prototype, "scrollLeft", {
            set: function (scrollLeft) {
                if (this.__adjustingScrollPosition) {
                    return ELEMENT_ORIGINAL_SCROLL_LEFT_SET_DESCRIPTOR.call(this, scrollLeft);
                }
                handleScrollMethod(this, "scrollTo", scrollLeft, this.scrollTop);
                return scrollLeft;
            }
        });
    }

    /**
     * Applies the polyfill
     */
    function patch() {
        // Element.prototype methods
        patchElementScroll();
        patchElementScrollBy();
        patchElementScrollTo();
        patchElementScrollIntoView();
        // Element.prototype descriptors
        patchElementScrollLeft();
        patchElementScrollTop();
        // window methods
        patchWindowScroll();
        patchWindowScrollBy();
        patchWindowScrollTo();
        // Navigation
        catchNavigation();
    }

    /**
     * Is true if the browser natively supports the Element.prototype.[scroll|scrollTo|scrollBy|scrollIntoView] methods
     * @type {boolean}
     */
    var SUPPORTS_ELEMENT_PROTOTYPE_SCROLL_METHODS = UNSUPPORTED_ENVIRONMENT
        ? false
        : "scroll" in Element.prototype && "scrollTo" in Element.prototype && "scrollBy" in Element.prototype && "scrollIntoView" in Element.prototype;

    if (!UNSUPPORTED_ENVIRONMENT && (!SUPPORTS_SCROLL_BEHAVIOR || !SUPPORTS_ELEMENT_PROTOTYPE_SCROLL_METHODS)) {
        patch();
    }

}());
//# sourceMappingURL=index.js.map


/***/ }),

/***/ "./src/Boussole.ts":
/*!*************************!*\
  !*** ./src/Boussole.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Compass": () => (/* binding */ Compass),
/* harmony export */   "sn": () => (/* binding */ sn)
/* harmony export */ });
/* harmony import */ var _Core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Core */ "./src/Core.ts");
/* harmony import */ var _types_Configuration__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types/Configuration */ "./src/types/Configuration.ts");
/* harmony import */ var _types_Direction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./types/Direction */ "./src/types/Direction.ts");



class Compass {
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
            return this._focusElement(element, nextSectionId, enterIntoNewSection, _types_Direction__WEBPACK_IMPORTED_MODULE_2__.Direction.UP);
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
const sn = Compass.getInstance();



/***/ }),

/***/ "./src/Core.ts":
/*!*********************!*\
  !*** ./src/Core.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

/***/ "./src/types/Configuration.ts":
/*!************************************!*\
  !*** ./src/types/Configuration.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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

"use strict";
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

"use strict";
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
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
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
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**************************!*\
  !*** ./src/vue/index.ts ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "compass": () => (/* binding */ vueModule)
/* harmony export */ });
/* harmony import */ var _Boussole__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../Boussole */ "./src/Boussole.ts");
/* harmony import */ var focus_options_polyfill__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! focus-options-polyfill */ "./node_modules/focus-options-polyfill/index.js");
/* harmony import */ var focus_options_polyfill__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(focus_options_polyfill__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var scroll_behavior_polyfill__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! scroll-behavior-polyfill */ "./node_modules/scroll-behavior-polyfill/dist/index.js");
/* harmony import */ var scroll_behavior_polyfill__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(scroll_behavior_polyfill__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _types_Configuration__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../types/Configuration */ "./src/types/Configuration.ts");




const vueModule = {
    disable() {
        _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.pause();
    },
    enable() {
        _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.resume();
    },
    install(app, config) {
        const globalConfig = _types_Configuration__WEBPACK_IMPORTED_MODULE_3__.defaultConfiguration;
        Object.assign(globalConfig, config);
        _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.init();
        _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.set(undefined, globalConfig);
        app.provide('$Compass', _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn);
        const assignConfig = (sectionId, config) => {
            const sectionConfig = ({ ...globalConfig });
            if (config) {
                Object.assign(sectionConfig, config);
            }
            sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;
            return sectionConfig;
        };
        const focusSectionDirective = {
            beforeMount(element, binding) {
                let sectionId = null;
                if (binding.value && binding.value.id && binding.value.conf) {
                    sectionId = binding.value.id;
                    const config = binding.value.conf;
                    config.element = element;
                    try {
                        _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.add(sectionId, config);
                    }
                    catch (error) { }
                }
                else {
                    sectionId = _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.add(undefined, _types_Configuration__WEBPACK_IMPORTED_MODULE_3__.defaultConfiguration);
                }
                // set sectionid to data set for removing when unbinding
                // set sectionid to data set for removing when unbinding
                element.dataset['sectionId'] = sectionId;
                _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.set(sectionId, assignConfig(sectionId, binding.value.conf));
                // set default section
                if (binding.modifiers['default']) {
                    _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.setDefaultSection(sectionId);
                }
            },
            mounted(element, binding) {
                let sectionId = element.dataset['sectionId'];
                if (binding.arg && sectionId !== binding.arg) {
                    sectionId = binding.arg;
                    element.dataset['sectionId'] = sectionId;
                }
            },
            unmounted(element) {
                if (element.dataset['sectionId']) {
                    _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.remove(element.dataset['sectionId']);
                }
            }
        };
        // focus section directive
        app.directive('focus-section', focusSectionDirective);
        const disableSection = (sectionId, disable) => {
            if (disable === false) {
                _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.enable(sectionId);
            }
            else {
                _Boussole__WEBPACK_IMPORTED_MODULE_0__.sn.disable(sectionId);
            }
        };
        // diasble focus section directive
        app.directive('disable-focus-section', {
            beforeMount(el, binding) {
                disableSection(el.dataset.sectionId, binding.value);
            },
            mounted(el, binding) {
                disableSection(el.dataset.sectionId, binding.value);
            }
        });
        const disableElement = (element, focusable) => {
            // eslint-disable-next-line no-unneeded-ternary
            focusable = focusable === false ? false : true;
            if (!element.dataset['focusable'] || element.dataset['focusable'] !== `${focusable}`) {
                element.dataset['focusable'] = focusable;
                if (focusable)
                    element.tabIndex = -1;
            }
        };
        // focusable directive
        app.directive('focus', {
            beforeMount(el, binding) {
                disableElement(el, binding.value);
            },
            mounted(el, binding) {
                disableElement(el, binding.value);
            },
            unmounted(el) {
                el.removeAttribute('data-focusable');
            }
        });
    }
};


})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=vue.js.map