interface ITrajectory {
    // The angle of guntower in rad.
    theta: number,
    // sin(theta) for fast calculate.
    sinTheta: number,
    // -1*cos(theta) for fast calculate.
    reverseCosTheta: number,
    // start x position.
    startX: number,
    // start y position.
    startY: number,
    // move to x position.
    moveToX: number,
    // move to y position.
    moveToY: number
}