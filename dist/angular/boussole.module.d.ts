import { NgModule } from '@angular/core';
import { FocusDirective } from './focus.directive';
import { FocusSectionDirective } from './focusSection.directive';
export declare class BoussoleModule extends NgModule {
    imports: never[];
    declarations: (typeof FocusDirective | typeof FocusSectionDirective)[];
    exports: (typeof FocusDirective | typeof FocusSectionDirective)[];
}
