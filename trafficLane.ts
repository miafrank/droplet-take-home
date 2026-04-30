import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { VehicleSignal } from "./enums/vehicleSignal";
import { Vehicle } from "./vehicle";

export class TrafficLane {
  vehicles: Vehicle[];
  laneDirection: LaneDirection;
  laneType: LaneType;
  vehicleSignal: VehicleSignal;

  constructor(
    vehicles: Vehicle[],
    laneDirection: LaneDirection,
    laneType: LaneType,
    vehicleSignal: VehicleSignal,
  ) {
    this.vehicles = vehicles;
    this.laneDirection = laneDirection;
    this.laneType = laneType;
    this.vehicleSignal = vehicleSignal;
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
