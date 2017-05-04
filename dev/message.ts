interface Message {
    tankId: number,
    x: number,
    y: number,
    gunAngle: number,
    tankAngle: number,
    firing: number, // angle.
    blood: number
}

interface HitMessage {
    tankId: number,
    hitX: number,
    hitY: number,
    blood: number
}

interface IdMessage {
    tankId: number
}