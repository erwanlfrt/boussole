import React, { forwardRef } from 'react';

type ElementProps =  React.HTMLProps<HTMLElement>

const BoussoleElement = forwardRef<HTMLElement, ElementProps>(
  (props, ref) => {

    const child= React.Children.map(props.children, child => {
      // Checking isValidElement is the safe way and avoids a typescript
      // error too.
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {"data-focusable": true, tabIndex: -1 });
      }
      return child;
    });

    return (
      <React.Fragment >
        { child }
      </React.Fragment>
    )
  }
)

export default BoussoleElement;
