import { TrafficDetector } from "./enums/trafficDetector";
import { Vehicle } from "./vehicle";

export class TrafficSensor {
  detectorType: TrafficDetector;
  spanFt: number;

  constructor(spanFt: number, detectorType = TrafficDetector.DETECTOR_TYPE) {
    this.spanFt = spanFt;
    this.detectorType = detectorType;
  }

  getDetectedWeightLbs(vehicles: Vehicle[]): number {
    return vehicles
      .filter((vehicle: Vehicle) => {
        return vehicle.positionFt >= 0 && vehicle.positionFt <= this.spanFt;
      })
      .reduce((totalWeightLbs: number, vehicle: Vehicle) => {
        return totalWeightLbs + vehicle.weightLbs;
      }, 0);
  }
}
