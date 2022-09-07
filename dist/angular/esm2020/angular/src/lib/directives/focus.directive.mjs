import { Directive } from '@angular/core';
import * as i0 from "@angular/core";
export class FocusDirective {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FuZ3VsYXIvc3JjL2xpYi9kaXJlY3RpdmVzL2ZvY3VzLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFxQixNQUFNLGVBQWUsQ0FBQzs7QUFNN0QsTUFBTSxPQUFPLGNBQWM7SUFXekIsWUFBb0IsRUFBYztRQUFkLE9BQUUsR0FBRixFQUFFLENBQVk7UUFUMUIsbUJBQWMsR0FBRyxDQUFDLE9BQW9CLEVBQUUsU0FBYyxFQUFFLEVBQUU7WUFDaEUsK0NBQStDO1lBQy9DLFNBQVMsR0FBRyxTQUFTLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsU0FBUyxFQUFFLEVBQUU7Z0JBQ3BGLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsU0FBUyxDQUFDO2dCQUN6QyxJQUFJLFNBQVM7b0JBQUUsT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN0QztRQUNILENBQUMsQ0FBQztRQUdBLEVBQUUsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUM3QyxFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNqQyxDQUFDOzs0RUFkVSxjQUFjO2lFQUFkLGNBQWM7dUZBQWQsY0FBYztjQUgxQixTQUFTO2VBQUM7Z0JBQ1QsUUFBUSxFQUFFLFNBQVM7YUFDcEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIElucHV0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2ZvY3VzXSdcbn0pXG5leHBvcnQgY2xhc3MgRm9jdXNEaXJlY3RpdmUge1xuICBcbiAgcHJpdmF0ZSBkaXNhYmxlRWxlbWVudCA9IChlbGVtZW50OiBIVE1MRWxlbWVudCwgZm9jdXNhYmxlOiBhbnkpID0+IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5uZWVkZWQtdGVybmFyeVxuICAgIGZvY3VzYWJsZSA9IGZvY3VzYWJsZSA9PT0gZmFsc2UgPyBmYWxzZSA6IHRydWU7XG4gICAgaWYgKCFlbGVtZW50LmRhdGFzZXRbJ2ZvY3VzYWJsZSddIHx8IGVsZW1lbnQuZGF0YXNldFsnZm9jdXNhYmxlJ10gIT09IGAke2ZvY3VzYWJsZX1gKSB7XG4gICAgICBlbGVtZW50LmRhdGFzZXRbJ2ZvY3VzYWJsZSddID0gZm9jdXNhYmxlO1xuICAgICAgaWYgKGZvY3VzYWJsZSkgZWxlbWVudC50YWJJbmRleCA9IC0xO1xuICAgIH1cbiAgfTtcbiAgXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZWw6IEVsZW1lbnRSZWYpIHtcbiAgICBlbC5uYXRpdmVFbGVtZW50LmRhdGFzZXRbJ2ZvY3VzYWJsZSddID0gdHJ1ZTtcbiAgICBlbC5uYXRpdmVFbGVtZW50LnRhYkluZGV4ID0gLTE7XG4gIH1cbn0iXX0=