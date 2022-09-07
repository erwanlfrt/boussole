import React, { createRef, forwardRef } from 'react';
import { SpatialNavigation } from '../SpatialNavigation';
import { Configuration, defaultConfiguration } from '../types/Configuration';

class ElementProps implements React.HTMLProps<HTMLElement> {
  children?: React.ReactNode;
  id: string = '';
  conf: Configuration = {};
}

const assignConfig = (sectionId: string | undefined, config: Configuration): Configuration => {
  const globalConfig = defaultConfiguration; // TO DO : integrate app.globalConfig given by developer
  const sectionConfig = ({ ...globalConfig }) as Configuration;
  if (config) {
    Object.assign(sectionConfig, config);
  }
  sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;
  return sectionConfig;
};

const BoussoleSection = forwardRef<HTMLElement, ElementProps>(
  (props,ref) => {
    let sectionId = '';
    let config: Configuration = {};
    if (props.id && props.conf) {
      sectionId = props.id;
      config = props.conf as Configuration;
      try {
        SpatialNavigation.getInstance().add(sectionId, config);
      } catch (error) {}
    } else {
      sectionId = SpatialNavigation.getInstance().add(undefined, defaultConfiguration);
    }
    
    // config.element = this.el.nativeElement;
    if (config) {
      SpatialNavigation.getInstance().set(sectionId, assignConfig(sectionId, config));
    }
    // set default section
    // if (this.focusSection.modifiers.default) {
    // SpatialNavigation.getInstance().setDefaultSection(sectionId);
    //   }

    const child = React.Children.map(props.children, child => {
      // Checking isValidElement is the safe way and avoids a typescript
      // error too.
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {"data-section-id": sectionId, tabIndex: -1 } as any);
      }
      return child;
    });
    return(
      <React.Fragment>
        { child }
      </React.Fragment>
    )
  }
)

export default BoussoleSection;