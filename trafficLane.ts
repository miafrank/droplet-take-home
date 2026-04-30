import { laneLengthSize } from "./const";
import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { TrafficLightSignal } from "./enums/trafficLightSignal";
import { Vehicle } from "./vehicle";

export class TrafficLane {
  vehicles: Vehicle[];
  laneDirection: LaneDirection;
  laneType: LaneType;
  trafficLightSignal: TrafficLightSignal;
  length: number;

  constructor(
    vehicles: Vehicle[],
    laneDirection: LaneDirection,
    laneType: LaneType,
    trafficLightSignal: TrafficLightSignal,
    length = laneLengthSize,
  ) {
    this.vehicles = vehicles;
    this.laneDirection = laneDirection;
    this.laneType = laneType;
    this.trafficLightSignal = trafficLightSignal;
    this.length = length;
  }

  addVehicle(vehicle: Vehicle) {
    this.vehicles.push(vehicle);
  }

  // simulate car driving through intersection
  removeVehicle() {
    return this.vehicles.shift();
  }

  hasVehicle() {
    return this.vehicles.length > 0;
  }
}
