export interface Rectangle {
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  width: number,
  height: number
}

export interface ElementRectangle extends Rectangle {
  element: HTMLElement

  center: Rectangle
}

export class ElementRectangleImpl implements ElementRectangle {
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

  constructor (rectangle: ElementRectangle) {
    this.x = rectangle.x;
    this.y = rectangle.y;
    this.left = rectangle.left;
    this.right = rectangle.right;
    this.bottom = rectangle.bottom;
    this.top = rectangle.top;
    this.element = rectangle.element;
    this.width = rectangle.width;
    this.height = rectangle.height;
    this.center = rectangle.center;
  }

  public nearPlumbLineIsBetter (rect: ElementRectangle, targetRect: ElementRectangle): number {
    let distance: number;
    if (rect.center.x < targetRect.center.x) {
      distance = targetRect.center.x - rect.right;
    } else {
      distance = rect.left - targetRect.center.x;
    }
    return distance < 0 ? 0 : distance;
  }

  public nearHorizonIsBetter (rect: ElementRectangle, targetRect: ElementRectangle): number {
    let distance: number;
    if (rect.center.y < targetRect.center.y) {
      distance = targetRect.center.y - rect.bottom;
    } else {
      distance = rect.top - targetRect.center.y;
    }
    return distance < 0 ? 0 : distance;
  }

  public nearTargetLeftIsBetter (rect: ElementRectangle, targetRect: ElementRectangle): number {
    let distance: number;
    if (rect.center.x < targetRect.center.x) {
      distance = targetRect.left - rect.right;
    } else {
      distance = rect.left - targetRect.left;
    }
    return distance < 0 ? 0 : distance;
  }

  public nearTargetTopIsBetter (rect: ElementRectangle, targetRect: ElementRectangle): number {
    let distance: number;
    if (rect.center.y < targetRect.center.y) {
      distance = targetRect.top - rect.bottom;
    } else {
      distance = rect.top - targetRect.top;
    }
    return distance < 0 ? 0 : distance;
  }

  public topIsBetter (rect: ElementRectangle): number {
    return rect.top;
  }

  public bottomIsBetter (rect: ElementRectangle): number {
    return -1 * rect.bottom;
  }

  public leftIsBetter (rect: ElementRectangle): number {
    return rect.left;
  }

  public rightIsBetter (rect: ElementRectangle): number {
    return -1 * rect.right;
  }
}
