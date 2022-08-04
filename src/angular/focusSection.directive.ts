import { Directive, ElementRef, Input } from '@angular/core';
import { sn } from '../SpatialNavigation';
import { Configuration, defaultConfiguration } from '../types/Configuration';
import { SectionDirective } from '../types/SectionDirective';

@Directive({
  selector: '[focusSection]'
})
export class FocusSectionDirective {
  @Input() focusSection: SectionDirective = {};

  private assignConfig = (sectionId: string | undefined, config: Configuration): Configuration => {
    const globalConfig = defaultConfiguration; // TO DO : integrate app.globalConfig given by developer
    const sectionConfig = ({ ...globalConfig }) as Configuration;
    if (config) {
      Object.assign(sectionConfig, config);
    }
    sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;
    return sectionConfig;
  };

  constructor(private el: ElementRef) {
    let sectionId = null;
    if (this.focusSection && this.focusSection.id && this.focusSection.conf) {
      sectionId = this.focusSection.id;
      const config = this.focusSection.conf as Configuration;
      config.element = el.nativeElement;
      try {
        sn.add(sectionId, config);
      } catch (error) {}
    } else {
      sectionId = sn.add(undefined, defaultConfiguration);
    }

    // set sectionid to data set for removing when unbinding
    el.nativeElement.dataset.sectionId = sectionId;
    if (this.focusSection.conf) {
      sn.set(sectionId, this.assignConfig(sectionId, this.focusSection.conf));
    }
    // set default section
    // if (this.focusSection.modifiers.default) {
    // sn.setDefaultSection(sectionId);
    //   }
  }
}