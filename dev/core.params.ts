// Parameters  
const FireRate: number = 200;
const BulletSpeed: number = 2000;
const BloodTextOffset = 60;
const Damage = 20;
const MaxVelocity: number = 500;
const Acceleration: number = 300;
const AngleOffsetBase: number = 0.1 * Math.PI; // degree.
const GridHeight = 50;
const GridWidth = 90;
const GameHeight = 5000;
const GameWidth = 5000;

// Names
const sandbagName: string = "sandbag";
const tankbodyName: string = "tankbody";
const guntowerName: string = "guntower";
const bulletName: string = "bullet";
const particleName: string = "particle";
const towerbodyName: string = "towerbody";
const towershooter: string = "towershooter";

// Socket-message names
const tankUpdateEventName: string = "tankUpdate";
const tankUpdateGlobalEventName: string = "tankUpdateGlobal";
const addNewEventName: string = "addNew";
const addNewGlobalEventName: string = "addNewGlobal";
const goneEventName: string = "gone";
const goneGlobalEventName: string = "goneGlobal";
const hitEventName: string = "hit";
const hitGlobalEventName: string = "hitGlobal";