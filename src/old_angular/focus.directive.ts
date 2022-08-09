import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[focus]'
})
export class FocusDirective {
  @Input() focus: boolean = false;

  private disableElement = (element: HTMLElement, focusable: any) => {
    // eslint-disable-next-line no-unneeded-ternary
    focusable = focusable === false ? false : true;
    if (!element.dataset.focusable || element.dataset.focusable !== `${focusable}`) {
      element.dataset.focusable = focusable;
      if (focusable) element.tabIndex = -1;
    }
  };
  
  constructor(private el: ElementRef) {
    this.disableElement(el.nativeElement, this.focus);
  }
}