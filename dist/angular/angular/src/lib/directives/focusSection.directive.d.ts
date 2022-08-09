import { ElementRef } from '@angular/core';
import { Configuration } from '../../../../types/Configuration';
import * as i0 from "@angular/core";
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
    static ɵfac: i0.ɵɵFactoryDeclaration<FocusSectionDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<FocusSectionDirective, "[focusSection]", never, { "focusSection": "focusSection"; }, {}, never, never, false>;
}
export {};
//# sourceMappingURL=focusSection.directive.d.ts.map