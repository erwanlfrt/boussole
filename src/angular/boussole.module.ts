import { NgModule } from '@angular/core';
import { FocusDirective } from './focus.directive';
import { FocusSectionDirective } from './focusSection.directive';

// @NgModule({
//   imports: [],
//   declarations: [FocusDirective, FocusSectionDirective],
//   exports: [FocusDirective, FocusSectionDirective]
// })

export class BoussoleModule extends NgModule { 
  imports = [];
  declarations = [FocusDirective, FocusSectionDirective];
  exports = [FocusDirective, FocusSectionDirective]
}