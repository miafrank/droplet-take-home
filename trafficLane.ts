import { laneLengthSize } from "./constants";
import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { TrafficLightSignal } from "./enums/trafficLightSignal";
import { TrafficSensor } from "./trafficSensor";
import { Vehicle } from "./vehicle";

export class TrafficLane {
  vehicles: Vehicle[];
  laneDirection: LaneDirection;
  laneType: LaneType;
  trafficLightSignal: TrafficLightSignal;
  length: number;
  sensor: TrafficSensor;

  constructor(
    vehicles: Vehicle[],
    laneDirection: LaneDirection,
    laneType: LaneType,
    trafficLightSignal: TrafficLightSignal,
    length = laneLengthSize,
    sensor = new TrafficSensor(length),
  ) {
    this.vehicles = vehicles;
    this.laneDirection = laneDirection;
    this.laneType = laneType;
    this.trafficLightSignal = trafficLightSignal;
    this.length = length;
    this.sensor = sensor;
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
