import { Direction } from './types/Direction';
import { ElementRectangleImpl } from './types/ElementRectangle';
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.matchesSelector
        || Element.prototype.mozMatchesSelector
        || Element.prototype.msMatchesSelector
        || Element.prototype.oMatchesSelector
        || Element.prototype.webkitMatchesSelector
        || ((s) => {
            if (this) {
                const matches = (this.document || this.ownerDocument).querySelectorAll(s);
                let i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) { }
                return i > -1;
            }
            return false;
        });
}
class Core {
    static getInstance() {
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
    getRect(element) {
        const cr = element.getBoundingClientRect();
        const xCenter = cr.left + Math.floor(cr.width / 2);
        const yCenter = cr.top + Math.floor(cr.height / 2);
        const center = {
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
    partition(rects, targetRect, straightOverlapThreshold) {
        const groups = [[], [], [], [], [], [], [], [], []];
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const center = rect.center;
            let x, y;
            if (center.x < targetRect.left) {
                x = 0;
            }
            else if (center.x <= targetRect.right) {
                x = 1;
            }
            else {
                x = 2;
            }
            if (center.y < targetRect.top) {
                y = 0;
            }
            else if (center.y <= targetRect.bottom) {
                y = 1;
            }
            else {
                y = 2;
            }
            const groupId = y * 3 + x;
            groups[groupId].push(rect);
            if ([0, 2, 6, 8].indexOf(groupId) !== -1) {
                const threshold = straightOverlapThreshold;
                if (rect.left <= targetRect.right - targetRect.width * threshold) {
                    if (groupId === 2) {
                        groups[1].push(rect);
                    }
                    else if (groupId === 8) {
                        groups[7].push(rect);
                    }
                }
                if (rect.right >= targetRect.left + targetRect.width * threshold) {
                    if (groupId === 0) {
                        groups[1].push(rect);
                    }
                    else if (groupId === 6) {
                        groups[7].push(rect);
                    }
                }
                if (rect.top <= targetRect.bottom - targetRect.height * threshold) {
                    if (groupId === 6) {
                        groups[3].push(rect);
                    }
                    else if (groupId === 8) {
                        groups[5].push(rect);
                    }
                }
                if (rect.bottom >= targetRect.top + targetRect.height * threshold) {
                    if (groupId === 0) {
                        groups[3].push(rect);
                    }
                    else if (groupId === 2) {
                        groups[5].push(rect);
                    }
                }
            }
        }
        return groups;
    }
    prioritize(priorities) {
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
        destPriority.group.sort((a, b) => {
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
    navigate(target, direction, candidates, section) {
        if (!target || !direction || !candidates || !candidates.length) {
            return null;
        }
        const rects = [];
        for (let i = 0; i < candidates.length; i++) {
            const rect = this.getRect(candidates[i]);
            if (rect) {
                rects.push(rect);
            }
        }
        if (!rects.length)
            return null;
        const targetRect = this.getRect(target);
        if (!targetRect)
            return null;
        const targetRectImpl = new ElementRectangleImpl(targetRect);
        const groups = this.partition(rects, targetRect, section.configuration.straightOverlapThreshold);
        const internalGroups = this.partition(groups[4], targetRect.center, section.configuration.straightOverlapThreshold);
        let priorities;
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
        let dest = undefined;
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
        if (!dest)
            dest = destGroup[0].element;
        return dest;
    }
    /**
     * Parse selector
     * @param selector
     * @returns nodes
     */
    parseSelector(selector) {
        // TO DO handle selector
        const result = [].slice.call(document.querySelectorAll(selector));
        return result;
    }
    /**
     * Check if an element match a selector
     */
    matchSelector(element, selector) {
        // TO DO selector as object N
        return element.matches(selector);
    }
}
const core = Core.getInstance();
export { Core, core };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9Db3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM5QyxPQUFPLEVBQStCLG9CQUFvQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFJN0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO0lBQzlCLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFJLE9BQU8sQ0FBQyxTQUFpQixDQUFDLGVBQWU7V0FDaEUsT0FBTyxDQUFDLFNBQWlCLENBQUMsa0JBQWtCO1dBQzVDLE9BQU8sQ0FBQyxTQUFpQixDQUFDLGlCQUFpQjtXQUMzQyxPQUFPLENBQUMsU0FBaUIsQ0FBQyxnQkFBZ0I7V0FDMUMsT0FBTyxDQUFDLFNBQWlCLENBQUMscUJBQXFCO1dBQ2hELENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNSLElBQUksSUFBSSxFQUFFO2dCQUNSLE1BQU0sT0FBTyxHQUFHLENBQUUsSUFBYSxDQUFDLFFBQVEsSUFBSyxJQUFhLENBQUMsYUFBYSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlGLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ3ZCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLEdBQUU7Z0JBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ2Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO0NBQ047QUFFRCxNQUFNLElBQUk7SUFHRCxNQUFNLENBQUMsV0FBVztRQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLElB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LENBQUM7UUFDbEUsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksYUFBYSxDQUFFLE9BQW9CLEVBQUUsUUFBZ0I7UUFDMUQsNkJBQTZCO1FBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0Y7QUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDaEMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGlvbiB9IGZyb20gJy4vdHlwZXMvRGlyZWN0aW9uJztcbmltcG9ydCB7IFJlY3RhbmdsZSwgRWxlbWVudFJlY3RhbmdsZSwgRWxlbWVudFJlY3RhbmdsZUltcGwgfSBmcm9tICcuL3R5cGVzL0VsZW1lbnRSZWN0YW5nbGUnO1xuaW1wb3J0IHsgUHJpb3JpdHkgfSBmcm9tICcuL3R5cGVzL1ByaW9yaXR5JztcbmltcG9ydCB7IFNlY3Rpb24gfSBmcm9tICcuL3R5cGVzL1NlY3Rpb24nO1xuXG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMpIHtcbiAgRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyA9IChFbGVtZW50LnByb3RvdHlwZSBhcyBhbnkpLm1hdGNoZXNTZWxlY3RvclxuICAgIHx8IChFbGVtZW50LnByb3RvdHlwZSBhcyBhbnkpLm1vek1hdGNoZXNTZWxlY3RvclxuICAgIHx8IChFbGVtZW50LnByb3RvdHlwZSBhcyBhbnkpLm1zTWF0Y2hlc1NlbGVjdG9yXG4gICAgfHwgKEVsZW1lbnQucHJvdG90eXBlIGFzIGFueSkub01hdGNoZXNTZWxlY3RvclxuICAgIHx8IChFbGVtZW50LnByb3RvdHlwZSBhcyBhbnkpLndlYmtpdE1hdGNoZXNTZWxlY3RvclxuICAgIHx8ICgocykgPT4ge1xuICAgICAgaWYgKHRoaXMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9ICgodGhpcyEgYXMgYW55KS5kb2N1bWVudCB8fCAodGhpcyEgYXMgYW55KS5vd25lckRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHMpO1xuICAgICAgICBsZXQgaSA9IG1hdGNoZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoLS1pID49IDAgJiYgbWF0Y2hlcy5pdGVtKGkpICE9PSB0aGlzKSB7fVxuICAgICAgICByZXR1cm4gaSA+IC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufVxuXG5jbGFzcyBDb3JlIHtcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IENvcmU7XG5cbiAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSAoKTogQ29yZSB7XG4gICAgaWYgKCFDb3JlLmluc3RhbmNlKSB7XG4gICAgICBDb3JlLmluc3RhbmNlID0gbmV3IENvcmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIENvcmUuaW5zdGFuY2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGVsZW1lbnQgcmVjdGFuZ2xlXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnRcbiAgICogQHJldHVybnMgZWxlbWVudCByZWN0YW5nbGVcbiAgICovXG4gIHByaXZhdGUgZ2V0UmVjdCAoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBFbGVtZW50UmVjdGFuZ2xlIHtcbiAgICBjb25zdCBjcjogRE9NUmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCB4Q2VudGVyID0gY3IubGVmdCArIE1hdGguZmxvb3IoY3Iud2lkdGggLyAyKTtcbiAgICBjb25zdCB5Q2VudGVyID0gY3IudG9wICsgTWF0aC5mbG9vcihjci5oZWlnaHQgLyAyKTtcbiAgICBjb25zdCBjZW50ZXI6IFJlY3RhbmdsZSA9IHtcbiAgICAgIHg6IHhDZW50ZXIsXG4gICAgICB5OiB5Q2VudGVyLFxuICAgICAgbGVmdDogeENlbnRlcixcbiAgICAgIHJpZ2h0OiB4Q2VudGVyLFxuICAgICAgdG9wOiB5Q2VudGVyLFxuICAgICAgYm90dG9tOiB5Q2VudGVyLFxuICAgICAgd2lkdGg6IDAsXG4gICAgICBoZWlnaHQ6IDBcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBlbGVtZW50LFxuICAgICAgeDogY3IueCxcbiAgICAgIHk6IGNyLnksXG4gICAgICBsZWZ0OiBjci5sZWZ0LFxuICAgICAgdG9wOiBjci50b3AsXG4gICAgICByaWdodDogY3IucmlnaHQsXG4gICAgICBib3R0b206IGNyLmJvdHRvbSxcbiAgICAgIHdpZHRoOiBjci53aWR0aCxcbiAgICAgIGhlaWdodDogY3IuaGVpZ2h0LFxuICAgICAgY2VudGVyXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRpc3RyaWJ1dGlvbiBvZiBlbGVtZW50cyBhcm91bmQgYSB0YXJnZXQgZWxlbWVudFxuICAgKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgYSB0d28tZGltZW5zaW9uYWwgYXJyYXksIHdlIGZpcnN0IGRpbWVuc2lvbiA9IDkgb2YgZWxlbWVudCByZWN0YW5nbGUuXG4gICAqIEluZGV4IG9mIGFycmF5cyBjb3JyZXNwb25kcyB0byB0aGUgcG9zaXRpb24gb2YgZWxlbWVudHMuXG4gICAqIExpbmsgYmV0d2VlbiBpbmRleCBhbmQgcG9zaXRpb24gOiAoZm9yIHRocmVzaG9sZCA9IDApXG4gICAqXG4gICAqICAgIF9fX19fX18gIC0gIF9fX19fX18gIC0gIF9fX19fX19cbiAgICogICB8ICAgICAgIHwgLSB8ICAgICAgIHwgLSB8ICAgICAgIHxcbiAgICogICB8ICAgMCAgIHwgLSB8ICAgMSAgIHwgLSB8ICAgMiAgIHxcbiAgICogICB8X19fX19fX3wgLSB8X19fX19fX3wgLSB8X19fX19fX3xcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKiAgICBfX19fX19fICAtICBfX19fX19fICAtICBfX19fX19fXG4gICAqICAgfCAgICAgICB8IC0gfCAgICAgICB8IC0gfCAgICAgICB8XG4gICAqICAgfCAgIDMgICB8IC0gfCBUQVJHLiB8IC0gfCAgIDUgICB8XG4gICAqICAgfF9fX19fX198IC0gfF9fX19fX198IC0gfF9fX19fX198XG4gICAqICAgICAgICAgICAgIC0gICAgICAgICAgIC1cbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKiAgICBfX19fX19fICAtICBfX19fX19fICAtICBfX19fX19fXG4gICAqICAgfCAgICAgICB8IC0gfCAgICAgICB8IC0gfCAgICAgICB8XG4gICAqICAgfCAgIDYgICB8IC0gfCAgIDcgICB8IC0gfCAgIDggICB8XG4gICAqICAgfF9fX19fX198IC0gfF9fX19fX198IC0gfF9fX19fX198XG4gICAqICAgICAgICAgICAgIC0gICAgICAgICAgIC1cbiAgICogQHBhcmFtIHJlY3RzIHJlY3RhbmdsZSBvZiBlbGVtZW50cyBhcm91bmQgdGhlIHRhcmdldFxuICAgKiBAcGFyYW0gdGFyZ2V0UmVjdCByZWN0YW5nbGUgb2YgdGFyZ2V0IGVsZW1lbnRcbiAgICogQHBhcmFtIHN0cmFpZ2h0T3ZlcmxhcFRocmVzaG9sZCB0aHJlc2hvbGRcbiAgICogQHJldHVybnMgZGlzdHJpYnV0aW9uIG9mIGVsZW1lbnRzIGFyb3VuZCBhIHRhcmdldCBlbGVtZW50XG4gICAqL1xuICBwcml2YXRlIHBhcnRpdGlvbiAocmVjdHM6IEVsZW1lbnRSZWN0YW5nbGVbXSwgdGFyZ2V0UmVjdDogUmVjdGFuZ2xlLCBzdHJhaWdodE92ZXJsYXBUaHJlc2hvbGQ6IG51bWJlcik6IEVsZW1lbnRSZWN0YW5nbGVbXVtdIHtcbiAgICBjb25zdCBncm91cHM6IEVsZW1lbnRSZWN0YW5nbGVbXVtdID0gW1tdLCBbXSwgW10sIFtdLCBbXSwgW10sIFtdLCBbXSwgW11dO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcmVjdCA9IHJlY3RzW2ldO1xuICAgICAgY29uc3QgY2VudGVyID0gcmVjdC5jZW50ZXI7XG4gICAgICBsZXQgeCwgeTtcblxuICAgICAgaWYgKGNlbnRlci54IDwgdGFyZ2V0UmVjdC5sZWZ0KSB7XG4gICAgICAgIHggPSAwO1xuICAgICAgfSBlbHNlIGlmIChjZW50ZXIueCA8PSB0YXJnZXRSZWN0LnJpZ2h0KSB7XG4gICAgICAgIHggPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgeCA9IDI7XG4gICAgICB9XG5cbiAgICAgIGlmIChjZW50ZXIueSA8IHRhcmdldFJlY3QudG9wKSB7XG4gICAgICAgIHkgPSAwO1xuICAgICAgfSBlbHNlIGlmIChjZW50ZXIueSA8PSB0YXJnZXRSZWN0LmJvdHRvbSkge1xuICAgICAgICB5ID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHkgPSAyO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBncm91cElkID0geSAqIDMgKyB4O1xuICAgICAgZ3JvdXBzW2dyb3VwSWRdLnB1c2gocmVjdCk7XG5cbiAgICAgIGlmIChbMCwgMiwgNiwgOF0uaW5kZXhPZihncm91cElkKSAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgdGhyZXNob2xkID0gc3RyYWlnaHRPdmVybGFwVGhyZXNob2xkO1xuXG4gICAgICAgIGlmIChyZWN0LmxlZnQgPD0gdGFyZ2V0UmVjdC5yaWdodCAtIHRhcmdldFJlY3Qud2lkdGggKiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICBpZiAoZ3JvdXBJZCA9PT0gMikge1xuICAgICAgICAgICAgZ3JvdXBzWzFdLnB1c2gocmVjdCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChncm91cElkID09PSA4KSB7XG4gICAgICAgICAgICBncm91cHNbN10ucHVzaChyZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVjdC5yaWdodCA+PSB0YXJnZXRSZWN0LmxlZnQgKyB0YXJnZXRSZWN0LndpZHRoICogdGhyZXNob2xkKSB7XG4gICAgICAgICAgaWYgKGdyb3VwSWQgPT09IDApIHtcbiAgICAgICAgICAgIGdyb3Vwc1sxXS5wdXNoKHJlY3QpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZ3JvdXBJZCA9PT0gNikge1xuICAgICAgICAgICAgZ3JvdXBzWzddLnB1c2gocmVjdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlY3QudG9wIDw9IHRhcmdldFJlY3QuYm90dG9tIC0gdGFyZ2V0UmVjdC5oZWlnaHQgKiB0aHJlc2hvbGQpIHtcbiAgICAgICAgICBpZiAoZ3JvdXBJZCA9PT0gNikge1xuICAgICAgICAgICAgZ3JvdXBzWzNdLnB1c2gocmVjdCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChncm91cElkID09PSA4KSB7XG4gICAgICAgICAgICBncm91cHNbNV0ucHVzaChyZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVjdC5ib3R0b20gPj0gdGFyZ2V0UmVjdC50b3AgKyB0YXJnZXRSZWN0LmhlaWdodCAqIHRocmVzaG9sZCkge1xuICAgICAgICAgIGlmIChncm91cElkID09PSAwKSB7XG4gICAgICAgICAgICBncm91cHNbM10ucHVzaChyZWN0KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGdyb3VwSWQgPT09IDIpIHtcbiAgICAgICAgICAgIGdyb3Vwc1s1XS5wdXNoKHJlY3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JvdXBzO1xuICB9XG5cbiAgcHJpdmF0ZSBwcmlvcml0aXplIChwcmlvcml0aWVzOiBQcmlvcml0eVtdKTogRWxlbWVudFJlY3RhbmdsZVtdIHwgbnVsbCB7XG4gICAgbGV0IGRlc3RQcmlvcml0eSA9IG51bGw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmlvcml0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocHJpb3JpdGllc1tpXS5ncm91cC5sZW5ndGgpIHtcbiAgICAgICAgZGVzdFByaW9yaXR5ID0gcHJpb3JpdGllc1tpXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFkZXN0UHJpb3JpdHkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc3REaXN0YW5jZSA9IGRlc3RQcmlvcml0eS5kaXN0YW5jZTtcbiAgICBjb25zdCB0YXJnZXQgPSBkZXN0UHJpb3JpdHkudGFyZ2V0O1xuICAgIGRlc3RQcmlvcml0eS5ncm91cC5zb3J0KChhOiBFbGVtZW50UmVjdGFuZ2xlLCBiOiBFbGVtZW50UmVjdGFuZ2xlKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc3REaXN0YW5jZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IGRlc3REaXN0YW5jZVtpXTtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBkaXN0YW5jZShhLCB0YXJnZXQpIC0gZGlzdGFuY2UoYiwgdGFyZ2V0KTtcbiAgICAgICAgaWYgKGRlbHRhKSB7XG4gICAgICAgICAgcmV0dXJuIGRlbHRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVzdFByaW9yaXR5Lmdyb3VwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBuZXh0IGVsZW1lbnQgdG8gbmF2aWdhdGUgdG8sIGZyb20gYSB0YXJnZXQgYWNjb3JkaW5nIHRvIGEgZGlyZWN0aW9uXG4gICAqIEBwYXJhbSB0YXJnZXQgdGFyZ2V0IGVsZW1lbnRcbiAgICogQHBhcmFtIGRpcmVjdGlvbiBuYXZpZ2F0ZSB0byB0aGlzIGRpcmVjdGlvblxuICAgKiBAcGFyYW0gY2FuZGlkYXRlcyBjYW5kaWRhdGVzIGVsZW1lbnRzIGFyb3VuZCB0YXJnZXRcbiAgICogQHBhcmFtIHNlY3Rpb24gc2VjdGlvbiBvZiB0aGUgdGFyZ2V0XG4gICAqIEByZXR1cm5zIG5leHQgZWxlbWVudCB0byBuYXZpZ2F0ZSB0bywgbnVsbCBpZiBubyBuZXh0IGVsZW1lbnQgZm91bmRcbiAgICovXG4gIHB1YmxpYyBuYXZpZ2F0ZSAodGFyZ2V0OiBIVE1MRWxlbWVudCwgZGlyZWN0aW9uOiBEaXJlY3Rpb24sIGNhbmRpZGF0ZXM6IEhUTUxFbGVtZW50W10sIHNlY3Rpb246IFNlY3Rpb24pOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIGlmICghdGFyZ2V0IHx8ICFkaXJlY3Rpb24gfHwgIWNhbmRpZGF0ZXMgfHwgIWNhbmRpZGF0ZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCByZWN0czogRWxlbWVudFJlY3RhbmdsZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYW5kaWRhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByZWN0ID0gdGhpcy5nZXRSZWN0KGNhbmRpZGF0ZXNbaV0pO1xuICAgICAgaWYgKHJlY3QpIHtcbiAgICAgICAgcmVjdHMucHVzaChyZWN0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFyZWN0cy5sZW5ndGgpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHRhcmdldFJlY3Q6IEVsZW1lbnRSZWN0YW5nbGUgPSB0aGlzLmdldFJlY3QodGFyZ2V0KTtcblxuICAgIGlmICghdGFyZ2V0UmVjdCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgdGFyZ2V0UmVjdEltcGw6IEVsZW1lbnRSZWN0YW5nbGVJbXBsID0gbmV3IEVsZW1lbnRSZWN0YW5nbGVJbXBsKHRhcmdldFJlY3QpO1xuXG4gICAgY29uc3QgZ3JvdXBzID0gdGhpcy5wYXJ0aXRpb24ocmVjdHMsIHRhcmdldFJlY3QsIHNlY3Rpb24uY29uZmlndXJhdGlvbi5zdHJhaWdodE92ZXJsYXBUaHJlc2hvbGQhKTtcbiAgICBjb25zdCBpbnRlcm5hbEdyb3VwcyA9IHRoaXMucGFydGl0aW9uKGdyb3Vwc1s0XSwgdGFyZ2V0UmVjdC5jZW50ZXIsIHNlY3Rpb24uY29uZmlndXJhdGlvbi5zdHJhaWdodE92ZXJsYXBUaHJlc2hvbGQhKTtcblxuICAgIGxldCBwcmlvcml0aWVzOiBQcmlvcml0eVtdO1xuXG4gICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgIGNhc2UgRGlyZWN0aW9uLkxFRlQ6XG4gICAgICAgIHByaW9yaXRpZXMgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3JvdXA6IGludGVybmFsR3JvdXBzWzBdLmNvbmNhdChpbnRlcm5hbEdyb3Vwc1szXSlcbiAgICAgICAgICAgICAgLmNvbmNhdChpbnRlcm5hbEdyb3Vwc1s2XSksXG4gICAgICAgICAgICBkaXN0YW5jZTogW1xuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC5uZWFyUGx1bWJMaW5lSXNCZXR0ZXIsXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLnRvcElzQmV0dGVyXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXRSZWN0SW1wbFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3JvdXA6IGdyb3Vwc1szXSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBbXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLm5lYXJQbHVtYkxpbmVJc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwudG9wSXNCZXR0ZXJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldFJlY3RJbXBsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBncm91cDogZ3JvdXBzWzBdLmNvbmNhdChncm91cHNbNl0pLFxuICAgICAgICAgICAgZGlzdGFuY2U6IFtcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwubmVhckhvcml6b25Jc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwucmlnaHRJc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwubmVhclRhcmdldFRvcElzQmV0dGVyXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXRSZWN0SW1wbFxuICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERpcmVjdGlvbi5SSUdIVDpcbiAgICAgICAgcHJpb3JpdGllcyA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBncm91cDogaW50ZXJuYWxHcm91cHNbMl0uY29uY2F0KGludGVybmFsR3JvdXBzWzVdKVxuICAgICAgICAgICAgICAuY29uY2F0KGludGVybmFsR3JvdXBzWzhdKSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBbXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLm5lYXJQbHVtYkxpbmVJc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwudG9wSXNCZXR0ZXJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldFJlY3RJbXBsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBncm91cDogZ3JvdXBzWzVdLFxuICAgICAgICAgICAgZGlzdGFuY2U6IFtcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwubmVhclBsdW1iTGluZUlzQmV0dGVyLFxuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC50b3BJc0JldHRlclxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0UmVjdEltcGxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGdyb3VwOiBncm91cHNbMl0uY29uY2F0KGdyb3Vwc1s4XSksXG4gICAgICAgICAgICBkaXN0YW5jZTogW1xuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC5uZWFySG9yaXpvbklzQmV0dGVyLFxuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC5sZWZ0SXNCZXR0ZXIsXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLm5lYXJUYXJnZXRUb3BJc0JldHRlclxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0UmVjdEltcGxcbiAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBEaXJlY3Rpb24uVVA6XG4gICAgICAgIHByaW9yaXRpZXMgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3JvdXA6IGludGVybmFsR3JvdXBzWzBdLmNvbmNhdChpbnRlcm5hbEdyb3Vwc1sxXSlcbiAgICAgICAgICAgICAgLmNvbmNhdChpbnRlcm5hbEdyb3Vwc1syXSksXG4gICAgICAgICAgICBkaXN0YW5jZTogW1xuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC5uZWFySG9yaXpvbklzQmV0dGVyLFxuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC5sZWZ0SXNCZXR0ZXJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldFJlY3RJbXBsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBncm91cDogZ3JvdXBzWzFdLFxuICAgICAgICAgICAgZGlzdGFuY2U6IFtcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwubmVhckhvcml6b25Jc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwubGVmdElzQmV0dGVyXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXRSZWN0SW1wbFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3JvdXA6IGdyb3Vwc1swXS5jb25jYXQoZ3JvdXBzWzJdKSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBbXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLm5lYXJQbHVtYkxpbmVJc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwuYm90dG9tSXNCZXR0ZXIsXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLm5lYXJUYXJnZXRMZWZ0SXNCZXR0ZXJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldFJlY3RJbXBsXG4gICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRGlyZWN0aW9uLkRPV046XG4gICAgICAgIHByaW9yaXRpZXMgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3JvdXA6IGludGVybmFsR3JvdXBzWzZdLmNvbmNhdChpbnRlcm5hbEdyb3Vwc1s3XSlcbiAgICAgICAgICAgICAgLmNvbmNhdChpbnRlcm5hbEdyb3Vwc1s4XSksXG4gICAgICAgICAgICBkaXN0YW5jZTogW1xuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC5uZWFySG9yaXpvbklzQmV0dGVyLFxuICAgICAgICAgICAgICB0YXJnZXRSZWN0SW1wbC5sZWZ0SXNCZXR0ZXJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldFJlY3RJbXBsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBncm91cDogZ3JvdXBzWzddLFxuICAgICAgICAgICAgZGlzdGFuY2U6IFtcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwubmVhckhvcml6b25Jc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwubGVmdElzQmV0dGVyXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXRSZWN0SW1wbFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3JvdXA6IGdyb3Vwc1s2XS5jb25jYXQoZ3JvdXBzWzhdKSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBbXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLm5lYXJQbHVtYkxpbmVJc0JldHRlcixcbiAgICAgICAgICAgICAgdGFyZ2V0UmVjdEltcGwudG9wSXNCZXR0ZXIsXG4gICAgICAgICAgICAgIHRhcmdldFJlY3RJbXBsLm5lYXJUYXJnZXRMZWZ0SXNCZXR0ZXJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldFJlY3RJbXBsXG4gICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChzZWN0aW9uLmNvbmZpZ3VyYXRpb24uc3RyYWlnaHRPbmx5KSB7XG4gICAgICBwcmlvcml0aWVzLnBvcCgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc3RHcm91cCA9IHRoaXMucHJpb3JpdGl6ZShwcmlvcml0aWVzKTtcbiAgICBpZiAoIWRlc3RHcm91cCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbGV0IGRlc3Q6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmIChzZWN0aW9uLmNvbmZpZ3VyYXRpb24ucmVtZW1iZXJTb3VyY2VcbiAgICAgICAgJiYgc2VjdGlvbi5wcmV2aW91c1xuICAgICAgICAmJiBzZWN0aW9uLnByZXZpb3VzLmRlc3RpbmF0aW9uID09PSB0YXJnZXRcbiAgICAgICAgJiYgc2VjdGlvbi5wcmV2aW91cy5yZXZlcnNlID09PSBkaXJlY3Rpb24pIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGVzdEdyb3VwLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChkZXN0R3JvdXBbal0uZWxlbWVudCA9PT0gc2VjdGlvbi5wcmV2aW91cy50YXJnZXQpIHtcbiAgICAgICAgICBkZXN0ID0gZGVzdEdyb3VwW2pdLmVsZW1lbnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFkZXN0KSBkZXN0ID0gZGVzdEdyb3VwWzBdLmVsZW1lbnQ7XG4gICAgcmV0dXJuIGRlc3Q7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2Ugc2VsZWN0b3JcbiAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAqIEByZXR1cm5zIG5vZGVzXG4gICAqL1xuICBwdWJsaWMgcGFyc2VTZWxlY3RvciAoc2VsZWN0b3I6IHN0cmluZyk6IG5ldmVyW10ge1xuICAgIC8vIFRPIERPIGhhbmRsZSBzZWxlY3RvclxuICAgIGNvbnN0IHJlc3VsdCA9IFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYW4gZWxlbWVudCBtYXRjaCBhIHNlbGVjdG9yXG4gICAqL1xuICBwdWJsaWMgbWF0Y2hTZWxlY3RvciAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAvLyBUTyBETyBzZWxlY3RvciBhcyBvYmplY3QgTlxuICAgIHJldHVybiBlbGVtZW50Lm1hdGNoZXMoc2VsZWN0b3IpO1xuICB9XG59XG5cbmNvbnN0IGNvcmUgPSBDb3JlLmdldEluc3RhbmNlKCk7XG5leHBvcnQgeyBDb3JlLCBjb3JlIH07XG4iXX0=