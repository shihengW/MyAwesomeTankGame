// A basic message should have position, blood and firing.
interface FullMessage extends IdMessage, PositionMessage, BloodMesssage {
    firing: number, // angle.
}

// A hit message should have id, blood, and the position that got hit.
interface HitMessage extends IdMessage, BloodMesssage {
    hitX: number,
    hitY: number
}

interface IdMessage {
    tankId: number
}

interface BloodMesssage {
    blood: number
}

interface PositionMessage {
    x: number, 
    y: number,
    gunAngle: number,
    tankAngle: number
}