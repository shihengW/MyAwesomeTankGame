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
const GameHeight = 3000;
const GameWidth = 3000;

// Names
const SandbagName: string = "sandbag";
const TankbodyName: string = "tankbody";
const GuntowerName: string = "guntower";
const BulletName: string = "bullet";
const ParticleName: string = "particle";
const TowerbodyName: string = "towerbody";
const TowershooterName: string = "towershooter";

// Socket-message names
const TankUpdateEventName: string = "tankUpdate";
const TankUpdateGlobalEventName: string = "tankUpdateGlobal";
const AddNewEventName: string = "addNew";
const AddNewGlobalEventName: string = "addNewGlobal";
const GoneEventName: string = "gone";
const GoneGlobalEventName: string = "goneGlobal";
const HitEventName: string = "hit";
const HitGlobalEventName: string = "hitGlobal";