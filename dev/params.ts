/// ****** names and parameters. ****** ///
// Names
const sandbagName: string = "sandbag";
const tankbodyName: string = "tankbody";
const guntowerName: string = "guntower";
const bulletName: string = "bullet";
const particleName: string = "particle";

// Comm names
// just a notify.
const tankUpdateEventName: string = "tankUpdate";
const tankUpdateGlobalEventName: string = "tankUpdateGlobal";
const addNewEventName: string = "addNew";
const addNewGlobalEventName: string = "addNewGlobal";
const goneEventName: string = "gone";
const goneGlobalEventName: string = "goneGlobal";
const hitEventName: string = "hit";
const hitGlobalEventName: string = "hitGlobal";

// Parameters  
const FireRate: number = 300;
const BulletSpeed: number = 700;
const BloodTextOffset = 60;
const Damage = 20;
const MaxVelocity: number = 500;
const Acceleration: number = 300;
const AngleOffsetBase: number = 0.1 * Math.PI; // degree.

// background
const GridHeight = 80;
const GridWidth = 60;
const GameHeight = 5000;
const GameWidth = 5000;