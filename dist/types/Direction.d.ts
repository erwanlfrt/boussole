export declare enum Direction {
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40
}
export declare enum StringDirection {
    LEFT = "left",
    UP = "up",
    RIGHT = "right",
    DOWN = "down"
}
export declare function getReverseDirection(direction: Direction): Direction;
export declare function directiontoString(direction: Direction): string;
