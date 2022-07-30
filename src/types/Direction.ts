/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
export enum Direction {
  LEFT = 37,
  UP = 38,
  RIGHT = 39,
  DOWN = 40
}

export enum StringDirection {
  LEFT = 'left',
  UP = 'up',
  RIGHT = 'right',
  DOWN = 'down'
}

export function getReverseDirection (direction: Direction): Direction {
  if (direction === Direction.LEFT) {
    return Direction.RIGHT;
  } else if (direction === Direction.RIGHT) {
    return Direction.LEFT;
  } else if (direction === Direction.UP) {
    return Direction.DOWN;
  } else {
    return Direction.UP;
  }
}

export function directiontoString (direction: Direction): string {
  if (direction === Direction.LEFT) {
    return 'left';
  } else if (direction === Direction.RIGHT) {
    return 'right';
  } else if (direction === Direction.UP) {
    return 'up';
  } else {
    return 'down';
  }
}
