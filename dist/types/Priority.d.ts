import { ElementRectangle } from './ElementRectangle';
export interface Priority {
    group: ElementRectangle[];
    distance: Function[];
    target: ElementRectangle;
}
