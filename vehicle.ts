import { LaneType } from "./enums/laneType";

export class Vehicle {
  id: number;
  laneType: LaneType;

  constructor(id: number, laneType: LaneType) {
    const vehicleID = Math.floor(Math.random() * 1000);

    this.id = vehicleID;
    this.laneType = laneType;
  }
}
