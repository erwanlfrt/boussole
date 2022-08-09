import { Directive, ElementRef, Input } from '@angular/core';


@Directive({
  selector: '[focus]'
})
export class FocusDirective {
  
  private disableElement = (element: HTMLElement, focusable: any) => {
    // eslint-disable-next-line no-unneeded-ternary
    focusable = focusable === false ? false : true;
    if (!element.dataset['focusable'] || element.dataset['focusable'] !== `${focusable}`) {
      element.dataset['focusable'] = focusable;
      if (focusable) element.tabIndex = -1;
    }
  };
  
  constructor(private el: ElementRef) {
    console.log('el = ', el.nativeElement);
    el.nativeElement.dataset['focusable'] = true;
    el.nativeElement.tabIndex = -1;
  }
}