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
        console.log('el = ', el.nativeElement);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2FuZ3VsYXIvc3JjL2xpYi9kaXJlY3RpdmVzL2ZvY3VzLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFxQixNQUFNLGVBQWUsQ0FBQzs7QUFNN0QsTUFBTSxPQUFPLGNBQWM7SUFXekIsWUFBb0IsRUFBYztRQUFkLE9BQUUsR0FBRixFQUFFLENBQVk7UUFUMUIsbUJBQWMsR0FBRyxDQUFDLE9BQW9CLEVBQUUsU0FBYyxFQUFFLEVBQUU7WUFDaEUsK0NBQStDO1lBQy9DLFNBQVMsR0FBRyxTQUFTLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsU0FBUyxFQUFFLEVBQUU7Z0JBQ3BGLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsU0FBUyxDQUFDO2dCQUN6QyxJQUFJLFNBQVM7b0JBQUUsT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN0QztRQUNILENBQUMsQ0FBQztRQUdBLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN2QyxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDN0MsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDakMsQ0FBQzs7NEVBZlUsY0FBYztpRUFBZCxjQUFjO3VGQUFkLGNBQWM7Y0FIMUIsU0FBUztlQUFDO2dCQUNULFFBQVEsRUFBRSxTQUFTO2FBQ3BCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tmb2N1c10nXG59KVxuZXhwb3J0IGNsYXNzIEZvY3VzRGlyZWN0aXZlIHtcbiAgXG4gIHByaXZhdGUgZGlzYWJsZUVsZW1lbnQgPSAoZWxlbWVudDogSFRNTEVsZW1lbnQsIGZvY3VzYWJsZTogYW55KSA9PiB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVubmVlZGVkLXRlcm5hcnlcbiAgICBmb2N1c2FibGUgPSBmb2N1c2FibGUgPT09IGZhbHNlID8gZmFsc2UgOiB0cnVlO1xuICAgIGlmICghZWxlbWVudC5kYXRhc2V0Wydmb2N1c2FibGUnXSB8fCBlbGVtZW50LmRhdGFzZXRbJ2ZvY3VzYWJsZSddICE9PSBgJHtmb2N1c2FibGV9YCkge1xuICAgICAgZWxlbWVudC5kYXRhc2V0Wydmb2N1c2FibGUnXSA9IGZvY3VzYWJsZTtcbiAgICAgIGlmIChmb2N1c2FibGUpIGVsZW1lbnQudGFiSW5kZXggPSAtMTtcbiAgICB9XG4gIH07XG4gIFxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVsOiBFbGVtZW50UmVmKSB7XG4gICAgY29uc29sZS5sb2coJ2VsID0gJywgZWwubmF0aXZlRWxlbWVudCk7XG4gICAgZWwubmF0aXZlRWxlbWVudC5kYXRhc2V0Wydmb2N1c2FibGUnXSA9IHRydWU7XG4gICAgZWwubmF0aXZlRWxlbWVudC50YWJJbmRleCA9IC0xO1xuICB9XG59Il19