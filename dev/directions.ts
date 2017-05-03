enum Directions { 
    None,
    Up = 1 << 1, 
    Down = 1 << 2, 
    Left = 1 << 3, 
    Right = 1 << 4,
    UpLeft = Up | Left,
    UpRight = Up | Right,
    DownLeft = Down | Left,
    DownRight = Down | Right 
}