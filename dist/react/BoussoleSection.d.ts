import React from 'react';
import { Configuration } from '../types/Configuration';
declare class ElementProps implements React.HTMLProps<HTMLElement> {
    children?: React.ReactNode;
    id: string;
    conf: Configuration;
}
declare const BoussoleSection: React.ForwardRefExoticComponent<ElementProps & React.RefAttributes<HTMLElement>>;
export default BoussoleSection;
