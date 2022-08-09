import { NgModule } from '@angular/core';
import { BoussoleComponent } from './boussole.component';
import { FocusDirective } from './directives/focus.directive';
import { FocusSectionDirective } from './directives/focusSection.directive';
import { Configuration, defaultConfiguration } from '../../../types/Configuration';
import { sn } from '../../../SpatialNavigation'


@NgModule({
  declarations: [
    BoussoleComponent,
    FocusDirective,
    FocusSectionDirective
  ],
  imports: [
  ],
  exports: [
    BoussoleComponent,
    FocusDirective,
    FocusSectionDirective
  ]
})
export class BoussoleModule {

  constructor() {
    console.log('boussole module constructor');
    const globalConfig = defaultConfiguration;
    sn.init();
    sn.set(undefined, globalConfig as Configuration);
  }

 }
