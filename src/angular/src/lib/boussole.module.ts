import { NgModule } from '@angular/core';
import { FocusDirective } from './directives/focus.directive';
import { FocusSectionDirective } from './directives/focusSection.directive';
import { Configuration, defaultConfiguration } from '../../../types/Configuration';
import { sn } from '../../../Compass'


@NgModule({
  declarations: [
    FocusDirective,
    FocusSectionDirective
  ],
  imports: [
  ],
  exports: [
    FocusDirective,
    FocusSectionDirective
  ]
})
export class BoussoleModule {

  constructor() {
    const globalConfig = defaultConfiguration;
    sn.init();
    sn.set(undefined, globalConfig as Configuration);
  }

 }
