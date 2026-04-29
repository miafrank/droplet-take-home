import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { VehicleSignal } from "./enums/vehicleSignal";
import { Vehicle } from "./vehicle";

export class TrafficLane {
  laneDirection: LaneDirection;
  laneType: LaneType;
  vehicleSignal: VehicleSignal;
  vehicles: Vehicle[];

  constructor(
    laneDirection: LaneDirection,
    laneType: LaneType,
    vehicleSignal: VehicleSignal,
    vehicles: Vehicle[],
  ) {
    this.laneDirection = laneDirection;
    this.laneType = laneType;
    this.vehicleSignal = vehicleSignal;
    this.vehicles = vehicles;
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
