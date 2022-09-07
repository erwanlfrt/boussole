import { Direction } from './types/Direction';
import { Section } from './types/Section';
declare class Core {
    private static instance;
    static getInstance(): Core;
    /**
     * Get element rectangle
     * @param element element
     * @returns element rectangle
     */
    private getRect;
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
    private partition;
    private prioritize;
    /**
     * Get next element to navigate to, from a target according to a direction
     * @param target target element
     * @param direction navigate to this direction
     * @param candidates candidates elements around target
     * @param section section of the target
     * @returns next element to navigate to, null if no next element found
     */
    navigate(target: HTMLElement, direction: Direction, candidates: HTMLElement[], section: Section): HTMLElement | null;
    /**
     * Parse selector
     * @param selector
     * @returns nodes
     */
    parseSelector(selector: string): never[];
    /**
     * Check if an element match a selector
     */
    matchSelector(element: HTMLElement, selector: string): boolean;
}
declare const core: Core;
export { Core, core };
//# sourceMappingURL=Core.d.ts.map