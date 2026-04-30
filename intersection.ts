import { TrafficLane } from "./trafficLane";
import { Crosswalk } from "./crosswalk";
import { TrafficLightSignal } from "./enums/trafficLightSignal";
import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { Vehicle } from "./vehicle";
import { PedestrianSignal } from "./enums/pedestrianSignal";
import { deltaSeconds, laneLengthSize, targetSpeedMph } from "./const";

type TrafficPhase = {
  directions: LaneDirection[];
  laneType: LaneType;
  durationsMs: number;
  rightTurnDurationMs?: number;
};

type InitializeTrafficOptions = {
  activeDirections?: LaneDirection[];
  allDirections?: LaneDirection[];
  laneTypes?: LaneType[];
  vehiclesPerLane?: number;
  laneLength?: number;
  initialMovingSpeedMph?: number;
  stoppedSpeedMph?: number;
};

type VehicleExitHandler = (vehicle: Vehicle, lane: TrafficLane) => void;

type VehicleMovementOptions = {
  movementDeltaSeconds?: number;
  targetSpeedMph?: number;
  stoppedSpeedMph?: number;
  initialMovingSpeedMph?: number;
  onVehicleExit?: VehicleExitHandler;
};

export class Intersection {
  trafficLanes: TrafficLane[];
  crosswalks: Crosswalk[];

  private trafficCycleTimeout?: ReturnType<typeof setTimeout>;
  private rightTurnTimeout?: ReturnType<typeof setTimeout>;
  private vehicleMovementTimeout?: ReturnType<typeof setTimeout>;
  private currentPhaseIndex = 0;

  constructor(trafficLanes: TrafficLane[], crosswalks: Crosswalk[]) {
    this.trafficLanes = trafficLanes;
    this.crosswalks = crosswalks;
  }

  laneDirections: LaneDirection[] = [
    LaneDirection.NORTH,
    LaneDirection.SOUTH,
    LaneDirection.EAST,
    LaneDirection.WEST,
  ];

  laneTypes: LaneType[] = [
    LaneType.LEFT,
    LaneType.STRAIGHT,
    LaneType.STRAIGHT,
    LaneType.RIGHT,
  ];

  northSouthDirections = new Set<LaneDirection>([
    LaneDirection.NORTH,
    LaneDirection.SOUTH,
  ]);

  eastWestDirections = new Set<LaneDirection>([
    LaneDirection.EAST,
    LaneDirection.WEST,
  ]);

  createVehicles = (
    laneType: LaneType,
    vehicleCount = Math.floor(Math.random() * 6) + 5,
    speedMph = 0,
    positionFt = 0,
  ): Vehicle[] => {
    return Array.from(
      { length: vehicleCount },
      () => new Vehicle(laneType, speedMph, positionFt),
    );
  };

  isActiveDirection(
    direction: LaneDirection,
    activeDirections: LaneDirection[],
  ): boolean {
    return activeDirections.includes(direction);
  }

  isInitialGreenLane(
    direction: LaneDirection,
    laneType: LaneType,
    activeDirections: LaneDirection[],
  ): boolean {
    return (
      this.isActiveDirection(direction, activeDirections) &&
      (laneType === LaneType.STRAIGHT || laneType === LaneType.RIGHT)
    );
  }

  initializeTraffic(options: InitializeTrafficOptions = {}): void {
    // Initialize North-South travel with left turn lights set to RED,
    // Straight and right lights are set to GREEN and all East-West traffic lights set to RED
    // Pedestrian signals are all said to RAISED HAND - no walks requested
    const allDirections = options.allDirections ?? this.laneDirections;
    const laneTypes = options.laneTypes ?? this.laneTypes;
    const activeDirections = options.activeDirections ?? [
      LaneDirection.NORTH,
      LaneDirection.SOUTH,
    ];
    const laneLength = options.laneLength ?? laneLengthSize;
    const initialMovingSpeedMph = options.initialMovingSpeedMph ?? 0;
    const stoppedSpeedMph = options.stoppedSpeedMph ?? 0;

    this.trafficLanes = allDirections.flatMap((laneDirections: LaneDirection) =>
      laneTypes.map((laneType: LaneType) => {
        const startsGreen = this.isInitialGreenLane(
          laneDirections,
          laneType,
          activeDirections,
        );
        const vehicleSignal = startsGreen
          ? TrafficLightSignal.GREEN
          : TrafficLightSignal.RED;
        const speedMph = startsGreen ? initialMovingSpeedMph : stoppedSpeedMph;

        return new TrafficLane(
          this.createVehicles(laneType, options.vehiclesPerLane, speedMph, 0),
          laneDirections,
          laneType,
          vehicleSignal,
          laneLength,
        );
      }),
    );

    this.crosswalks = allDirections.map(
      (laneDirections: LaneDirection) =>
        new Crosswalk(laneDirections, PedestrianSignal.RAISED_HAND, false),
    );
  }

  isEastWestPedestrianCrossing(crossingDirection: LaneDirection) {
    return (
      crossingDirection === LaneDirection.EAST ||
      crossingDirection === LaneDirection.WEST
    );
  }

  isNorthSouthPedestrianCrossing(crossingDirection: LaneDirection) {
    return (
      crossingDirection === LaneDirection.NORTH ||
      crossingDirection === LaneDirection.SOUTH
    );
  }

  fetchBlockedDirections(crossingDirection: LaneDirection) {
    const isEastWestPedestrianCrossing =
      this.isEastWestPedestrianCrossing(crossingDirection);

    const isNorthSouthPedestrianCrossing =
      this.isNorthSouthPedestrianCrossing(crossingDirection);

    if (isEastWestPedestrianCrossing) {
      const blockedDirections: LaneDirection[] = [
        LaneDirection.NORTH,
        LaneDirection.SOUTH,
      ];

      return blockedDirections;
    }

    if (isNorthSouthPedestrianCrossing) {
      const blockedDirections: LaneDirection[] = [
        LaneDirection.EAST,
        LaneDirection.WEST,
      ];

      return blockedDirections;
    }

    // If no pedestrians crossing
    return [];
  }

  fetchParallelDirections(crossingDirection: LaneDirection) {
    const isEastWestPedestrianCrossing =
      this.isEastWestPedestrianCrossing(crossingDirection);

    const isNorthSouthPedestrianCrossing =
      this.isNorthSouthPedestrianCrossing(crossingDirection);

    if (isEastWestPedestrianCrossing) {
      const parallelDirections: LaneDirection[] = [
        LaneDirection.EAST,
        LaneDirection.WEST,
      ];

      return parallelDirections;
    }

    if (isNorthSouthPedestrianCrossing) {
      const parallelDirections: LaneDirection[] = [
        LaneDirection.NORTH,
        LaneDirection.SOUTH,
      ];

      return parallelDirections;
    }
    // If no pedestrians crossing
    return [];
  }

  updateTrafficSignalsOnPedestrianCrossing(
    parallelDirections: LaneDirection[],
    blockedDirections: LaneDirection[],
  ) {
    const previousSignals = new Map<TrafficLane, TrafficLightSignal>();

    this.trafficLanes.forEach((lane: TrafficLane) => {
      previousSignals.set(lane, lane.trafficLightSignal);

      // Check if traffic flow same direction as pedestrian flow for straight lanes only
      const shouldAllowStraightTraffic =
        parallelDirections.includes(lane.laneDirection) &&
        lane.laneType === LaneType.STRAIGHT;

      const shouldStopTraffic = blockedDirections.includes(lane.laneDirection);

      // Update blocked directions traffic lights to RED
      if (shouldStopTraffic) {
        lane.trafficLightSignal = TrafficLightSignal.RED;
        return;
      }

      // Change traffic light for left and right to RED and straight to GREEN on ped-xing
      lane.trafficLightSignal = shouldAllowStraightTraffic
        ? TrafficLightSignal.GREEN
        : TrafficLightSignal.RED;
    });

    return previousSignals;
  }

  requestPedestrianCrossing(crossingDirection: LaneDirection): void {
    // _TODO_: Account for multiple walks requested in non-parallel directions

    const crosswalk = this.crosswalks.find(
      // Find first occurence of requested walk
      (cw: Crosswalk) => cw.laneDirection === crossingDirection,
    );

    if (!crosswalk) {
      return;
    }

    const blockedDirections: LaneDirection[] =
      this.fetchBlockedDirections(crossingDirection);

    const parallelDirections: LaneDirection[] =
      this.fetchParallelDirections(crossingDirection);

    const previousSignals = this.updateTrafficSignalsOnPedestrianCrossing(
      parallelDirections,
      blockedDirections,
    );

    // TODO: What logic can we move to CrossWalk

    // simulate ped x-ing request, 30 second phase
    if (crosswalk.requestWalk()) {
      crosswalk.pedestrianSignal = PedestrianSignal.WALKING_PERSON;

      setTimeout(() => {
        crosswalk.pedestrianSignal = PedestrianSignal.RAISED_HAND;
        crosswalk.walkRequested = false;

        this.trafficLanes.forEach((lane: TrafficLane) => {
          const previousSignal = previousSignals.get(lane);

          if (previousSignal) {
            lane.trafficLightSignal = previousSignal;
          }
        });
      }, 30_000);
    }
  }

  // TODO: parameterze to include differnet lanes
  runTrafficPhase(): void {
    const phases: TrafficPhase[] = [
      {
        directions: [LaneDirection.NORTH, LaneDirection.SOUTH],
        laneType: LaneType.STRAIGHT,
        durationsMs: 90_000,
        rightTurnDurationMs: 45_000,
      },
      {
        directions: [LaneDirection.NORTH, LaneDirection.SOUTH],
        laneType: LaneType.LEFT,
        durationsMs: 30_000,
      },
      {
        directions: [LaneDirection.EAST, LaneDirection.WEST],
        laneType: LaneType.STRAIGHT,
        durationsMs: 90_000,
        rightTurnDurationMs: 45_000,
      },
      {
        directions: [LaneDirection.EAST, LaneDirection.WEST],
        laneType: LaneType.LEFT,
        durationsMs: 30_000,
      },
    ];

    const phase = phases[this.currentPhaseIndex];

    this.trafficLanes.forEach((lane: TrafficLane) => {
      const isActiveDirection = phase.directions.includes(lane.laneDirection);

      const isActiveStraightLane =
        phase.laneType === LaneType.STRAIGHT &&
        lane.laneType === LaneType.STRAIGHT;

      const isActiveRightLane =
        phase.laneType === LaneType.STRAIGHT &&
        lane.laneType === LaneType.RIGHT;

      const isActiveLeftLane =
        phase.laneType === LaneType.LEFT && lane.laneType === LaneType.LEFT;

      lane.trafficLightSignal =
        isActiveDirection &&
        (isActiveStraightLane || isActiveRightLane || isActiveLeftLane)
          ? TrafficLightSignal.GREEN
          : TrafficLightSignal.RED;
    });

    if (phase.rightTurnDurationMs) {
      this.rightTurnTimeout = setTimeout(() => {
        this.trafficLanes.forEach((lane: TrafficLane) => {
          const shouldStopRightTurn =
            phase.directions.includes(lane.laneDirection) &&
            lane.laneType === LaneType.RIGHT;

          if (shouldStopRightTurn) {
            lane.trafficLightSignal = TrafficLightSignal.RED;
          }
        });
      }, phase.rightTurnDurationMs);
    }
    // TODO: Where to put this
    this.trafficCycleTimeout = setTimeout(() => {
      this.currentPhaseIndex = (this.currentPhaseIndex + 1) % phases.length;
      this.runTrafficPhase();
    }, phase.durationsMs);
  }

  moveVehiclesBySignal(): void {
    this.moveVehiclesBySignalOnce();

    this.vehicleMovementTimeout = setTimeout(() => {
      this.moveVehiclesBySignal();
    }, 1_000);
  }

  startTimedTrafficCycle(): void {
    this.currentPhaseIndex = 0;
    this.runTrafficPhase();
    this.moveVehiclesBySignal();
  }

  stopTimedTrafficCycle(): void {
    if (this.trafficCycleTimeout) {
      clearTimeout(this.trafficCycleTimeout);
    }

    if (this.rightTurnTimeout) {
      clearTimeout(this.rightTurnTimeout);
    }

    if (this.vehicleMovementTimeout) {
      clearTimeout(this.vehicleMovementTimeout);
    }
  }

  getNextLaneLength(lane: TrafficLane): number {
    return laneLengthSize;
  }

  getExitDistanceFt(lane: TrafficLane): number {
    if (lane.laneType === LaneType.STRAIGHT) {
      return lane.length;
    }

    return lane.length + this.getNextLaneLength(lane);
  }

  setRightTurnsRed(activeDirections: LaneDirection[]): void {
    this.trafficLanes.forEach((lane: TrafficLane) => {
      const shouldStopRightTurn =
        this.isActiveDirection(lane.laneDirection, activeDirections) &&
        lane.laneType === LaneType.RIGHT;

      if (shouldStopRightTurn) {
        lane.trafficLightSignal = TrafficLightSignal.RED;
      }
    });
  }

  setParallelLeftTurnsGreen(activeDirections: LaneDirection[]): void {
    this.trafficLanes.forEach((lane: TrafficLane) => {
      const shouldAllowLeftTurn =
        this.isActiveDirection(lane.laneDirection, activeDirections) &&
        lane.laneType === LaneType.LEFT;

      lane.trafficLightSignal = shouldAllowLeftTurn
        ? TrafficLightSignal.GREEN
        : TrafficLightSignal.RED;
    });
  }

  moveVehiclesBySignalOnce(options: VehicleMovementOptions = {}): void {
    const movementDeltaSeconds = options.movementDeltaSeconds ?? deltaSeconds;
    const movementTargetSpeedMph = options.targetSpeedMph ?? targetSpeedMph;
    const stoppedSpeedMph = options.stoppedSpeedMph ?? 0;
    const initialMovingSpeedMph =
      options.initialMovingSpeedMph ?? movementTargetSpeedMph;

    this.trafficLanes.forEach((lane: TrafficLane) => {
      const vehicle = lane.vehicles[0];

      if (!vehicle) {
        return;
      }

      if (lane.trafficLightSignal === TrafficLightSignal.GREEN) {
        vehicle.accelerate(movementDeltaSeconds, movementTargetSpeedMph);
      } else {
        vehicle.decelerate(movementDeltaSeconds);
      }

      vehicle.positionFt += vehicle.getSpeedPerSecond() * movementDeltaSeconds;

      if (vehicle.positionFt < this.getExitDistanceFt(lane)) {
        return;
      }

      const exitedVehicle = lane.removeVehicle();

      if (exitedVehicle) {
        options.onVehicleExit?.(exitedVehicle, lane);
      }

      const nextVehicle = lane.vehicles[0];

      if (nextVehicle) {
        nextVehicle.positionFt = 0;
        nextVehicle.speedMph =
          lane.trafficLightSignal === TrafficLightSignal.GREEN
            ? initialMovingSpeedMph
            : stoppedSpeedMph;
      }
    });
  }
}
