import { Direction } from './types/Direction';
import { Rectangle, ElementRectangle, ElementRectangleImpl } from './types/ElementRectangle';
import { Priority } from './types/Priority';
import { Section } from './types/Section';

if (!Element.prototype.matches) {
  Element.prototype.matches = (Element.prototype as any).matchesSelector
    || (Element.prototype as any).mozMatchesSelector
    || (Element.prototype as any).msMatchesSelector
    || (Element.prototype as any).oMatchesSelector
    || (Element.prototype as any).webkitMatchesSelector
    || ((s) => {
      if (this) {
        const matches = ((this! as any).document || (this! as any).ownerDocument).querySelectorAll(s);
        let i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      }
      return false;
    });
}

class Core {
  private static instance: Core;

  public static getInstance (): Core {
    if (!Core.instance) {
      Core.instance = new Core();
    }
    return Core.instance;
  }

  /**
   * Get element rectangle
   * @param element element
   * @returns element rectangle
   */
  private getRect (element: HTMLElement): ElementRectangle {
    const cr: DOMRect = element.getBoundingClientRect();

    const xCenter = cr.left + Math.floor(cr.width / 2);
    const yCenter = cr.top + Math.floor(cr.height / 2);
    const center: Rectangle = {
      x: xCenter,
      y: yCenter,
      left: xCenter,
      right: xCenter,
      top: yCenter,
      bottom: yCenter,
      width: 0,
      height: 0
    };
    return {
      element,
      x: cr.x,
      y: cr.y,
      left: cr.left,
      top: cr.top,
      right: cr.right,
      bottom: cr.bottom,
      width: cr.width,
      height: cr.height,
      center
    };
  }

  /**
   * Get the distribution of elements around a target element
   * This function returns a two-dimensional array, we first dimension = 9 of element rectangle.
   * Index of arrays corresponds to the position of elements.
   * Link between index and position : (for threshold = 0)
   *
   *    _______  -  _______  -  _______
   *   |       | - |       | - |       |
   *   |   0   | - |   1   | - |   2   |
   *   |_______| - |_______| - |_______|
   * -------------------------------------
   *    _______  -  _______  -  _______
   *   |       | - |       | - |       |
   *   |   3   | - | TARG. | - |   5   |
   *   |_______| - |_______| - |_______|
   *             -           -
   * -------------------------------------
   *    _______  -  _______  -  _______
   *   |       | - |       | - |       |
   *   |   6   | - |   7   | - |   8   |
   *   |_______| - |_______| - |_______|
   *             -           -
   * @param rects rectangle of elements around the target
   * @param targetRect rectangle of target element
   * @param straightOverlapThreshold threshold
   * @returns distribution of elements around a target element
   */
  private partition (rects: ElementRectangle[], targetRect: Rectangle, straightOverlapThreshold: number): ElementRectangle[][] {
    const groups: ElementRectangle[][] = [[], [], [], [], [], [], [], [], []];

    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      const center = rect.center;
      let x, y;

      if (center.x < targetRect.left) {
        x = 0;
      } else if (center.x <= targetRect.right) {
        x = 1;
      } else {
        x = 2;
      }

      if (center.y < targetRect.top) {
        y = 0;
      } else if (center.y <= targetRect.bottom) {
        y = 1;
      } else {
        y = 2;
      }

      const groupId = y * 3 + x;
      groups[groupId].push(rect);

      if ([0, 2, 6, 8].indexOf(groupId) !== -1) {
        const threshold = straightOverlapThreshold;

        if (rect.left <= targetRect.right - targetRect.width * threshold) {
          if (groupId === 2) {
            groups[1].push(rect);
          } else if (groupId === 8) {
            groups[7].push(rect);
          }
        }

        if (rect.right >= targetRect.left + targetRect.width * threshold) {
          if (groupId === 0) {
            groups[1].push(rect);
          } else if (groupId === 6) {
            groups[7].push(rect);
          }
        }

        if (rect.top <= targetRect.bottom - targetRect.height * threshold) {
          if (groupId === 6) {
            groups[3].push(rect);
          } else if (groupId === 8) {
            groups[5].push(rect);
          }
        }

        if (rect.bottom >= targetRect.top + targetRect.height * threshold) {
          if (groupId === 0) {
            groups[3].push(rect);
          } else if (groupId === 2) {
            groups[5].push(rect);
          }
        }
      }
    }
    return groups;
  }

  private prioritize (priorities: Priority[]): ElementRectangle[] | null {
    let destPriority = null;
    for (let i = 0; i < priorities.length; i++) {
      if (priorities[i].group.length) {
        destPriority = priorities[i];
        break;
      }
    }

    if (!destPriority) {
      return null;
    }

    const destDistance = destPriority.distance;
    const target = destPriority.target;
    destPriority.group.sort((a: ElementRectangle, b: ElementRectangle) => {
      for (let i = 0; i < destDistance.length; i++) {
        const distance = destDistance[i];
        const delta = distance(a, target) - distance(b, target);
        if (delta) {
          return delta;
        }
      }
      return 0;
    });
    return destPriority.group;
  }

  /**
   * Get next element to navigate to, from a target according to a direction
   * @param target target element
   * @param direction navigate to this direction
   * @param candidates candidates elements around target
   * @param section section of the target
   * @returns next element to navigate to, null if no next element found
   */
  public navigate (target: HTMLElement, direction: Direction, candidates: HTMLElement[], section: Section): HTMLElement | null {
    if (!target || !direction || !candidates || !candidates.length) {
      return null;
    }

    const rects: ElementRectangle[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const rect = this.getRect(candidates[i]);
      if (rect) {
        rects.push(rect);
      }
    }
    if (!rects.length) return null;
    const targetRect: ElementRectangle = this.getRect(target);

    if (!targetRect) return null;
    const targetRectImpl: ElementRectangleImpl = new ElementRectangleImpl(targetRect);

    const groups = this.partition(rects, targetRect, section.configuration.straightOverlapThreshold!);
    const internalGroups = this.partition(groups[4], targetRect.center, section.configuration.straightOverlapThreshold!);

    let priorities: Priority[];

    switch (direction) {
      case Direction.LEFT:
        priorities = [
          {
            group: internalGroups[0].concat(internalGroups[3])
              .concat(internalGroups[6]),
            distance: [
              targetRectImpl.nearPlumbLineIsBetter,
              targetRectImpl.topIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[3],
            distance: [
              targetRectImpl.nearPlumbLineIsBetter,
              targetRectImpl.topIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[0].concat(groups[6]),
            distance: [
              targetRectImpl.nearHorizonIsBetter,
              targetRectImpl.rightIsBetter,
              targetRectImpl.nearTargetTopIsBetter
            ],
            target: targetRectImpl
          }
        ];
        break;
      case Direction.RIGHT:
        priorities = [
          {
            group: internalGroups[2].concat(internalGroups[5])
              .concat(internalGroups[8]),
            distance: [
              targetRectImpl.nearPlumbLineIsBetter,
              targetRectImpl.topIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[5],
            distance: [
              targetRectImpl.nearPlumbLineIsBetter,
              targetRectImpl.topIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[2].concat(groups[8]),
            distance: [
              targetRectImpl.nearHorizonIsBetter,
              targetRectImpl.leftIsBetter,
              targetRectImpl.nearTargetTopIsBetter
            ],
            target: targetRectImpl
          }
        ];
        break;
      case Direction.UP:
        priorities = [
          {
            group: internalGroups[0].concat(internalGroups[1])
              .concat(internalGroups[2]),
            distance: [
              targetRectImpl.nearHorizonIsBetter,
              targetRectImpl.leftIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[1],
            distance: [
              targetRectImpl.nearHorizonIsBetter,
              targetRectImpl.leftIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[0].concat(groups[2]),
            distance: [
              targetRectImpl.nearPlumbLineIsBetter,
              targetRectImpl.bottomIsBetter,
              targetRectImpl.nearTargetLeftIsBetter
            ],
            target: targetRectImpl
          }
        ];
        break;
      case Direction.DOWN:
        priorities = [
          {
            group: internalGroups[6].concat(internalGroups[7])
              .concat(internalGroups[8]),
            distance: [
              targetRectImpl.nearHorizonIsBetter,
              targetRectImpl.leftIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[7],
            distance: [
              targetRectImpl.nearHorizonIsBetter,
              targetRectImpl.leftIsBetter
            ],
            target: targetRectImpl
          },
          {
            group: groups[6].concat(groups[8]),
            distance: [
              targetRectImpl.nearPlumbLineIsBetter,
              targetRectImpl.topIsBetter,
              targetRectImpl.nearTargetLeftIsBetter
            ],
            target: targetRectImpl
          }
        ];
        break;
      default:
        return null;
    }

    if (section.configuration.straightOnly) {
      priorities.pop();
    }

    const destGroup = this.prioritize(priorities);
    if (!destGroup) {
      return null;
    }

    let dest: HTMLElement | undefined = undefined;
    if (section.configuration.rememberSource
        && section.previous
        && section.previous.destination === target
        && section.previous.reverse === direction) {
      for (let j = 0; j < destGroup.length; j++) {
        if (destGroup[j].element === section.previous.target) {
          dest = destGroup[j].element;
          break;
        }
      }
    }
    if (!dest) dest = destGroup[0].element;
    return dest;
  }

  /**
   * Parse selector
   * @param selector
   * @returns nodes
   */
  public parseSelector (selector: string): never[] {
    // TO DO handle selector
    const result = [].slice.call(document.querySelectorAll(selector));
    return result;
  }

  /**
   * Check if an element match a selector
   */
  public matchSelector (element: HTMLElement, selector: string): boolean {
    // TO DO selector as object N
    return element.matches(selector);
  }
}

const core = Core.getInstance();
export { Core, core };
