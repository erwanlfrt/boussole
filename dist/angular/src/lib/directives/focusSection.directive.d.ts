import { ElementRef } from '@angular/core';
import { Configuration } from '../../../../types/Configuration';
interface SectionDirective {
    id?: string;
    conf?: Configuration;
}
export declare class FocusSectionDirective {
    private el;
    element: HTMLElement | undefined;
    focusSection: SectionDirective;
    private assignConfig;
    constructor(el: ElementRef);
    ngOnInit(): void;
}
export {};
