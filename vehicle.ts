import { LaneType } from "./enums/laneType";

export class Vehicle {
  id: number;
  laneType: LaneType;
  speedMph: number;
  positionFt: number;

  constructor(
    laneType: LaneType,
    speedMph: number,
    position: number,
  ) {
    const vehicleID = Math.floor(Math.random() * 1000);

    this.id = vehicleID;
    this.laneType = laneType;
    this.speedMph = speedMph;
    this.positionFt = position;
  }

  getSpeedPerSecond(): number {
    return (this.speedMph * 5280) / 3600;
  }

  accelerate(deltaSeconds: number, targetSpeedMph: number): void {
    const accelerationMphPerSecond = 5;

    this.speedMph = Math.min(
      targetSpeedMph,
      this.speedMph + accelerationMphPerSecond * deltaSeconds,
    );
  }

  decelerate(deltaSeconds: number): void {
    const decelerationMphPerSecond = 10;

    this.speedMph = Math.max(
      0,
      this.speedMph - decelerationMphPerSecond * deltaSeconds,
    );
  }
}
