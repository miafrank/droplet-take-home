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
  blockedDirections?: LaneDirection[];
  pedestrianAllowedDirections?: LaneDirection[];
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

  isInitialFlashingOrangeLane(
    direction: LaneDirection,
    laneType: LaneType,
    activeDirections: LaneDirection[],
  ): boolean {
    return (
      this.isActiveDirection(direction, activeDirections) &&
      laneType === LaneType.LEFT
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
        const startsFlashingOrange = this.isInitialFlashingOrangeLane(
          laneDirections,
          laneType,
          activeDirections,
        );
        const vehicleSignal = startsGreen
          ? TrafficLightSignal.GREEN
          : startsFlashingOrange
            ? TrafficLightSignal.FLASHING_ORANGE
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

  findCrosswalk(crossingDirection: LaneDirection): Crosswalk | undefined {
    return this.crosswalks.find(
      (cw: Crosswalk) => cw.laneDirection === crossingDirection,
    );
  }

  requestPedestrianWalk(crossingDirection: LaneDirection): boolean {
    const crosswalk = this.findCrosswalk(crossingDirection);

    if (!crosswalk) {
      return false;
    }

    return crosswalk.requestWalk();
  }

  setPedestrianClearanceSignals(crossingDirection: LaneDirection): void {
    const blockedDirections: LaneDirection[] =
      this.fetchBlockedDirections(crossingDirection);
    const parallelDirections: LaneDirection[] =
      this.fetchParallelDirections(crossingDirection);

    this.trafficLanes.forEach((lane: TrafficLane) => {
      const shouldRemainGreen =
        parallelDirections.includes(lane.laneDirection) &&
        lane.laneType === LaneType.STRAIGHT;
      const shouldStopForPedestrian =
        blockedDirections.includes(lane.laneDirection) || !shouldRemainGreen;

      if (
        shouldStopForPedestrian &&
        lane.trafficLightSignal === TrafficLightSignal.GREEN
      ) {
        lane.trafficLightSignal = TrafficLightSignal.YELLOW;
      }
    });
  }

  startPedestrianCrossing(
    crossingDirection: LaneDirection,
  ): Map<TrafficLane, TrafficLightSignal> | undefined {
    const crosswalk = this.findCrosswalk(crossingDirection);

    if (!crosswalk) {
      return undefined;
    }

    const previousSignals = this.updateTrafficSignalsOnPedestrianCrossing(
      this.fetchParallelDirections(crossingDirection),
      this.fetchBlockedDirections(crossingDirection),
    );

    crosswalk.pedestrianSignal = PedestrianSignal.WALKING_PERSON;

    return previousSignals;
  }

  finishPedestrianCrossing(
    crossingDirection: LaneDirection,
    previousSignals?: Map<TrafficLane, TrafficLightSignal>,
  ): void {
    const crosswalk = this.findCrosswalk(crossingDirection);

    if (!crosswalk) {
      return;
    }

    crosswalk.pedestrianSignal = PedestrianSignal.RAISED_HAND;
    crosswalk.walkRequested = false;

    if (previousSignals) {
      this.trafficLanes.forEach((lane: TrafficLane) => {
        const previousSignal = previousSignals.get(lane);

        if (previousSignal) {
          lane.trafficLightSignal = previousSignal;
        }
      });
    }

    this.setParallelLeftTurnsFlashingOrange(
      this.fetchParallelDirections(crossingDirection),
    );
  }

  requestPedestrianCrossing(
    crossingDirection: LaneDirection,
    crossingDurationMs = 30_000,
  ): void {
    // _TODO_: Account for multiple walks requested in non-parallel directions
    if (this.requestPedestrianWalk(crossingDirection)) {
      const previousSignals = this.startPedestrianCrossing(crossingDirection);

      setTimeout(() => {
        this.finishPedestrianCrossing(crossingDirection, previousSignals);
      }, crossingDurationMs);
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
      const isPermissiveLeftLane =
        phase.laneType === LaneType.STRAIGHT && lane.laneType === LaneType.LEFT;

      if (isActiveDirection && isPermissiveLeftLane) {
        lane.trafficLightSignal = TrafficLightSignal.FLASHING_ORANGE;
        return;
      }

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

  getOppositeDirection(direction: LaneDirection): LaneDirection {
    switch (direction) {
      case LaneDirection.NORTH:
        return LaneDirection.SOUTH;
      case LaneDirection.SOUTH:
        return LaneDirection.NORTH;
      case LaneDirection.EAST:
        return LaneDirection.WEST;
      case LaneDirection.WEST:
        return LaneDirection.EAST;
    }
  }

  isVehicleMovingThroughIntersection(vehicle: Vehicle, lane: TrafficLane): boolean {
    return (
      vehicle.speedMph > 0 &&
      vehicle.positionFt >= 0 &&
      vehicle.positionFt < this.getExitDistanceFt(lane)
    );
  }

  hasOncomingStraightTraffic(leftTurnLane: TrafficLane): boolean {
    if (leftTurnLane.laneType !== LaneType.LEFT) {
      return false;
    }

    const oppositeDirection = this.getOppositeDirection(
      leftTurnLane.laneDirection,
    );

    return this.trafficLanes.some((lane: TrafficLane) => {
      const leadVehicle = lane.vehicles[0];

      if (!leadVehicle) {
        return false;
      }

      return (
        lane.laneDirection === oppositeDirection &&
        lane.laneType === LaneType.STRAIGHT &&
        this.isVehicleMovingThroughIntersection(leadVehicle, lane)
      );
    });
  }

  canMoveOnTrafficSignal(lane: TrafficLane): boolean {
    if (lane.trafficLightSignal === TrafficLightSignal.GREEN) {
      return true;
    }

    return (
      lane.trafficLightSignal === TrafficLightSignal.FLASHING_ORANGE &&
      lane.laneType === LaneType.LEFT &&
      !this.hasOncomingStraightTraffic(lane)
    );
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

  setParallelLeftTurnsFlashingOrange(activeDirections: LaneDirection[]): void {
    this.trafficLanes.forEach((lane: TrafficLane) => {
      const shouldAllowPermissiveLeftTurn =
        this.isActiveDirection(lane.laneDirection, activeDirections) &&
        lane.laneType === LaneType.LEFT &&
        lane.trafficLightSignal === TrafficLightSignal.RED;

      if (shouldAllowPermissiveLeftTurn) {
        lane.trafficLightSignal = TrafficLightSignal.FLASHING_ORANGE;
      }
    });
  }

  moveVehiclesBySignalOnce(options: VehicleMovementOptions = {}): void {
    const movementDeltaSeconds = options.movementDeltaSeconds ?? deltaSeconds;
    const movementTargetSpeedMph = options.targetSpeedMph ?? targetSpeedMph;
    const stoppedSpeedMph = options.stoppedSpeedMph ?? 0;
    const initialMovingSpeedMph =
      options.initialMovingSpeedMph ?? movementTargetSpeedMph;
    const blockedDirections = options.blockedDirections ?? [];
    const pedestrianAllowedDirections = options.pedestrianAllowedDirections;

    this.trafficLanes.forEach((lane: TrafficLane) => {
      const vehicle = lane.vehicles[0];

      if (!vehicle) {
        return;
      }

      if (blockedDirections.includes(lane.laneDirection)) {
        vehicle.decelerate(movementDeltaSeconds);
        return;
      }

      if (
        pedestrianAllowedDirections &&
        (!pedestrianAllowedDirections.includes(lane.laneDirection) ||
          lane.laneType !== LaneType.STRAIGHT)
      ) {
        vehicle.decelerate(movementDeltaSeconds);
        return;
      }

      if (!this.canMoveOnTrafficSignal(lane)) {
        vehicle.decelerate(movementDeltaSeconds);
        return;
      }

      vehicle.accelerate(movementDeltaSeconds, movementTargetSpeedMph);
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
