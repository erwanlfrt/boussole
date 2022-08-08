export interface Rectangle {
    x: number;
    y: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}
export interface ElementRectangle extends Rectangle {
    element: HTMLElement;
    center: Rectangle;
}
export declare class ElementRectangleImpl implements ElementRectangle {
    x: number;
    y: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    element: HTMLElement;
    center: Rectangle;
    width: number;
    height: number;
    constructor(rectangle: ElementRectangle);
    nearPlumbLineIsBetter(rect: ElementRectangle, targetRect: ElementRectangle): number;
    nearHorizonIsBetter(rect: ElementRectangle, targetRect: ElementRectangle): number;
    nearTargetLeftIsBetter(rect: ElementRectangle, targetRect: ElementRectangle): number;
    nearTargetTopIsBetter(rect: ElementRectangle, targetRect: ElementRectangle): number;
    topIsBetter(rect: ElementRectangle): number;
    bottomIsBetter(rect: ElementRectangle): number;
    leftIsBetter(rect: ElementRectangle): number;
    rightIsBetter(rect: ElementRectangle): number;
}
