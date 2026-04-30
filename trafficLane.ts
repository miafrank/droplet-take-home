import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { TrafficLightSignal } from "./enums/trafficLightSignal";
import { Vehicle } from "./vehicle";

export class TrafficLane {
  vehicles: Vehicle[];
  laneDirection: LaneDirection;
  laneType: LaneType;
  trafficLightSignal: TrafficLightSignal;

  constructor(
    vehicles: Vehicle[],
    laneDirection: LaneDirection,
    laneType: LaneType,
    trafficLightSignal: TrafficLightSignal,
  ) {
    this.vehicles = vehicles;
    this.laneDirection = laneDirection;
    this.laneType = laneType;
    this.trafficLightSignal = trafficLightSignal;
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
