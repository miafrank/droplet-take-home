import { LaneDirection } from "./enums/laneDirection";
import { LaneType } from "./enums/laneType";
import { TrafficLightSignal } from "./enums/trafficLightSignal";
import { Intersection } from "./intersection";
import { TrafficLane } from "./trafficLane";

declare const process: {
  argv: string[];
};

declare const require: {
  (path: string): unknown;
};

type TrafficSimulationConfig = {
  name: string;
  activeDirections: LaneDirection[];
  allDirections: LaneDirection[];
  laneTypes: LaneType[];
  vehiclesPerLane: number;
  laneLength: number;
  initialMovingSpeedMph: number;
  stoppedSpeedMph: number;
  targetSpeedMph: number;
  straightPhaseMs: number;
  rightTurnPhaseMs: number;
  leftTurnPhaseMs: number;
  movementTickMs: number;
  movementDeltaSeconds: number;
  smartSensor?: SmartSensorConfig;
  pedestrianRequest?: PedestrianRequestConfig;
};

type SmartSensorConfig = {
  enabled: boolean;
  requiredRedMs: number;
  triggerWeightLbs: number;
};

type PedestrianRequestConfig = {
  enabled: boolean;
  crossingDirection: LaneDirection;
  requestAfterMs: number;
  trafficClearanceDelayMs: number;
  yellowPhaseMs: number;
  crossingDurationMs: number;
};

type TrafficSimulationConfigJson = Omit<
  TrafficSimulationConfig,
  "activeDirections" | "allDirections" | "laneTypes" | "pedestrianRequest"
> & {
  activeDirections: string[];
  allDirections: string[];
  laneTypes: string[];
  pedestrianRequest?: Omit<PedestrianRequestConfig, "crossingDirection"> & {
    crossingDirection: string;
  };
};

type TrafficSimulationConfigFile = Record<string, TrafficSimulationConfigJson>;

const simulationConfigs =
  require("./config/simulationConfigs.json") as TrafficSimulationConfigFile;

const parseLaneDirection = (value: string): LaneDirection => {
  switch (value) {
    case LaneDirection.NORTH:
      return LaneDirection.NORTH;
    case LaneDirection.SOUTH:
      return LaneDirection.SOUTH;
    case LaneDirection.EAST:
      return LaneDirection.EAST;
    case LaneDirection.WEST:
      return LaneDirection.WEST;
    default:
      throw new Error(`Invalid lane direction in simulation config: ${value}`);
  }
};

const parseLaneType = (value: string): LaneType => {
  switch (value) {
    case LaneType.LEFT:
      return LaneType.LEFT;
    case LaneType.STRAIGHT:
      return LaneType.STRAIGHT;
    case LaneType.RIGHT:
      return LaneType.RIGHT;
    default:
      throw new Error(`Invalid lane type in simulation config: ${value}`);
  }
};

const loadTrafficSimulationConfig = (
  scenarioName: string,
): TrafficSimulationConfig | undefined => {
  const config = simulationConfigs[scenarioName];

  if (!config) {
    return undefined;
  }

  return {
    ...config,
    activeDirections: config.activeDirections.map(parseLaneDirection),
    allDirections: config.allDirections.map(parseLaneDirection),
    laneTypes: config.laneTypes.map(parseLaneType),
    pedestrianRequest: config.pedestrianRequest
      ? {
          ...config.pedestrianRequest,
          crossingDirection: parseLaneDirection(
            config.pedestrianRequest.crossingDirection,
          ),
        }
      : undefined,
  };
};

const directionLabel = (directions: LaneDirection[]): string => {
  return directions.join("/");
};

const isActiveDirection = (
  config: TrafficSimulationConfig,
  direction: LaneDirection,
): boolean => {
  return config.activeDirections.includes(direction);
};

const formatPosition = (positionFt: number): string => {
  return `${positionFt.toFixed(1)}ft`;
};

const formatSpeed = (speedMph: number): string => {
  return `${speedMph.toFixed(1)}mph`;
};

const isPedestrianBlockedDirection = (
  direction: LaneDirection,
  blockedDirections: LaneDirection[],
): boolean => {
  return blockedDirections.includes(direction);
};

const renderLane = (
  intersection: Intersection,
  lane: TrafficLane,
  shouldRenderVehicleDetails: boolean,
  pedestrianBlockedDirections: LaneDirection[],
  pedestrianAllowedDirections: LaneDirection[],
): void => {
  const waitingVehicleCount = lane.vehicles.length;
  const blockedByPedestrian = isPedestrianBlockedDirection(
    lane.laneDirection,
    pedestrianBlockedDirections,
  );
  const stoppedByPedestrianCrossing =
    pedestrianAllowedDirections.length > 0 &&
    (!pedestrianAllowedDirections.includes(lane.laneDirection) ||
      lane.laneType !== LaneType.STRAIGHT);

  if (blockedByPedestrian || stoppedByPedestrianCrossing) {
    console.log(
      `  ${lane.laneDirection} ${lane.laneType}: signal=${lane.trafficLightSignal}, waiting=${waitingVehicleCount}, pedestrianBlock=YES, trafficMoving=false`,
    );
    return;
  }

  if (
    shouldRenderVehicleDetails &&
    lane.trafficLightSignal === TrafficLightSignal.FLASHING_ORANGE &&
    lane.laneType === LaneType.LEFT
  ) {
    const vehicle = lane.vehicles[0];
    const hasOncomingTraffic = intersection.hasOncomingStraightTraffic(lane);
    const permissiveStatus = hasOncomingTraffic ? "WAIT" : "CLEAR";

    if (!vehicle) {
      console.log(
        `  ${lane.laneDirection} ${lane.laneType}: signal=${lane.trafficLightSignal}, permissiveLeft=${permissiveStatus}, no active vehicle`,
      );
      return;
    }

    console.log(
      `  ${lane.laneDirection} ${lane.laneType}: signal=${lane.trafficLightSignal}, permissiveLeft=${permissiveStatus}, vehicle=${vehicle.id}, laneType=${vehicle.laneType}, speed=${formatSpeed(vehicle.speedMph)}, position=${formatPosition(vehicle.positionFt)}`,
    );
    return;
  }

  if (
    !shouldRenderVehicleDetails ||
    lane.trafficLightSignal !== TrafficLightSignal.GREEN
  ) {
    console.log(
      `  ${lane.laneDirection} ${lane.laneType}: signal=${lane.trafficLightSignal}, waiting=${waitingVehicleCount}`,
    );
    return;
  }

  const vehicle = lane.vehicles[0];

  if (!vehicle) {
    console.log(
      `  ${lane.laneDirection} ${lane.laneType}: signal=${lane.trafficLightSignal}, no active vehicle`,
    );
    return;
  }

  console.log(
    `  ${lane.laneDirection} ${lane.laneType}: signal=${lane.trafficLightSignal}, vehicle=${vehicle.id}, laneType=${vehicle.laneType}, speed=${formatSpeed(vehicle.speedMph)}, position=${formatPosition(vehicle.positionFt)}`,
  );
};

const renderIntersectionState = (
  title: string,
  intersection: Intersection,
  config: TrafficSimulationConfig,
  pedestrianStatus: string,
  pedestrianBlockedDirections: LaneDirection[],
  pedestrianAllowedDirections: LaneDirection[],
): void => {
  console.log("");
  console.log(`=== ${title} ===`);
  console.log(
    `Active traffic flow: ${directionLabel(config.activeDirections)}`,
  );

  if (config.smartSensor?.enabled) {
    const sensorStatus = config.allDirections
      .map((direction: LaneDirection) => {
        const detectedWeightLbs =
          intersection.getDetectedDirectionWeightLbs(direction);

        return `${direction}:${detectedWeightLbs}lbs`;
      })
      .join(", ");

    console.log(`Smart sensors: ${sensorStatus}`);
  }

  if (config.pedestrianRequest?.enabled) {
    const crosswalk = intersection.findCrosswalk(
      config.pedestrianRequest.crossingDirection,
    );
    const blockedDirectionLabel =
      pedestrianBlockedDirections.length > 0
        ? directionLabel(pedestrianBlockedDirections)
        : "none";

    console.log(
      `Pedestrian: status=${pedestrianStatus}, crossingDirection=${config.pedestrianRequest.crossingDirection}, signal=${crosswalk?.pedestrianSignal ?? "UNKNOWN"}, blockedDirections=${blockedDirectionLabel}`,
    );
  }

  config.allDirections.forEach((direction: LaneDirection) => {
    const active = isActiveDirection(config, direction);
    const lanes = intersection.trafficLanes.filter(
      (lane: TrafficLane) => lane.laneDirection === direction,
    );

    console.log(
      active ? `${direction} active lanes` : `${direction} waiting lanes`,
    );

    lanes.forEach((lane: TrafficLane) => {
      renderLane(
        intersection,
        lane,
        active,
        pedestrianBlockedDirections,
        pedestrianAllowedDirections,
      );
    });
  });
};

export const runTrafficSimulation = (config: TrafficSimulationConfig): void => {
  const intersection = new Intersection([], []);
  intersection.initializeTraffic(config);
  let pedestrianStatus = "not requested";
  let pedestrianBlockedDirections: LaneDirection[] = [];
  let pedestrianAllowedDirections: LaneDirection[] = [];
  const simulationStartedAtMs = Date.now();
  let rightTurnTimeout: ReturnType<typeof setTimeout> | undefined;
  let leftTurnTimeout: ReturnType<typeof setTimeout> | undefined;

  renderIntersectionState(
    "Starting State",
    intersection,
    config,
    pedestrianStatus,
    pedestrianBlockedDirections,
    pedestrianAllowedDirections,
  );

  const movementInterval = setInterval(() => {
    if (config.smartSensor?.enabled) {
      const sensorResults = intersection.evaluateSmartSensors({
        currentTimeMs: Date.now() - simulationStartedAtMs,
        requiredRedMs: config.smartSensor.requiredRedMs,
        triggerWeightLbs: config.smartSensor.triggerWeightLbs,
      });

      sensorResults.forEach((sensorResult) => {
        const message = sensorResult.waitingForBlockingTraffic
          ? "Smart sensor demand waiting for blocking traffic to clear"
          : "Smart sensor changed lights to GREEN";

        console.log(
          `${message}: direction=${sensorResult.direction}, detectedWeight=${sensorResult.detectedWeightLbs}lbs, redDuration=${sensorResult.redDurationMs}ms`,
        );

        if (sensorResult.triggered) {
          config.activeDirections = intersection.fetchParallelDirections(
            sensorResult.direction,
          );

          if (rightTurnTimeout) {
            clearTimeout(rightTurnTimeout);
          }

          if (leftTurnTimeout) {
            clearTimeout(leftTurnTimeout);
          }
        }
      });
    }

    intersection.moveVehiclesBySignalOnce({
      movementDeltaSeconds: config.movementDeltaSeconds,
      targetSpeedMph: config.targetSpeedMph,
      stoppedSpeedMph: config.stoppedSpeedMph,
      initialMovingSpeedMph: config.initialMovingSpeedMph,
      blockedDirections: pedestrianBlockedDirections,
      pedestrianAllowedDirections:
        pedestrianAllowedDirections.length > 0
          ? pedestrianAllowedDirections
          : undefined,
      onVehicleExit: (vehicle, lane) => {
        console.log(
          `Vehicle exited: vehicleID=${vehicle.id}, direction=${lane.laneDirection}, laneType=${lane.laneType}`,
        );
      },
    });
    renderIntersectionState(
      "Simulation Tick",
      intersection,
      config,
      pedestrianStatus,
      pedestrianBlockedDirections,
      pedestrianAllowedDirections,
    );
  }, config.movementTickMs);

  rightTurnTimeout = setTimeout(() => {
    intersection.setRightTurnsRed(config.activeDirections);
    renderIntersectionState(
      "Right Turn Phase Ended",
      intersection,
      config,
      pedestrianStatus,
      pedestrianBlockedDirections,
      pedestrianAllowedDirections,
    );
  }, config.rightTurnPhaseMs);

  leftTurnTimeout = setTimeout(() => {
    intersection.setParallelLeftTurnsGreen(config.activeDirections);
    renderIntersectionState(
      "Left Turn Phase Started",
      intersection,
      config,
      pedestrianStatus,
      pedestrianBlockedDirections,
      pedestrianAllowedDirections,
    );
  }, config.straightPhaseMs);

  const pedestrianTimeouts: ReturnType<typeof setTimeout>[] = [];

  if (config.pedestrianRequest?.enabled) {
    const pedestrianRequest = config.pedestrianRequest;

    pedestrianTimeouts.push(
      setTimeout(() => {
        pedestrianStatus = "requested";
        intersection.requestPedestrianWalk(pedestrianRequest.crossingDirection);
        console.log(
          `Pedestrian requested crossing: direction=${pedestrianRequest.crossingDirection}`,
        );
        renderIntersectionState(
          "Pedestrian Requested Crossing",
          intersection,
          config,
          pedestrianStatus,
          pedestrianBlockedDirections,
          pedestrianAllowedDirections,
        );
      }, pedestrianRequest.requestAfterMs),
    );

    pedestrianTimeouts.push(
      setTimeout(() => {
        pedestrianStatus = "clearing traffic";
        intersection.setPedestrianClearanceSignals(
          pedestrianRequest.crossingDirection,
        );
        console.log(
          `Pedestrian clearance started: GREEN lanes that must stop changed to YELLOW`,
        );
        renderIntersectionState(
          "Pedestrian Clearance Started",
          intersection,
          config,
          pedestrianStatus,
          pedestrianBlockedDirections,
          pedestrianAllowedDirections,
        );
      }, pedestrianRequest.requestAfterMs + pedestrianRequest.trafficClearanceDelayMs),
    );

    pedestrianTimeouts.push(
      setTimeout(
        () => {
          pedestrianStatus = "crossing";
          pedestrianBlockedDirections = intersection.fetchBlockedDirections(
            pedestrianRequest.crossingDirection,
          );
          pedestrianAllowedDirections = intersection.fetchParallelDirections(
            pedestrianRequest.crossingDirection,
          );
          intersection.startPedestrianCrossing(
            pedestrianRequest.crossingDirection,
          );
          console.log(
            `Pedestrian is crossing: blockingDirections=${directionLabel(pedestrianBlockedDirections)}`,
          );
          renderIntersectionState(
            "Pedestrian Crossing",
            intersection,
            config,
            pedestrianStatus,
            pedestrianBlockedDirections,
            pedestrianAllowedDirections,
          );
        },
        pedestrianRequest.requestAfterMs +
          pedestrianRequest.trafficClearanceDelayMs +
          pedestrianRequest.yellowPhaseMs,
      ),
    );

    pedestrianTimeouts.push(
      setTimeout(
        () => {
          pedestrianStatus = "finished";
          intersection.finishPedestrianCrossing(
            pedestrianRequest.crossingDirection,
          );
          pedestrianBlockedDirections = [];
          pedestrianAllowedDirections = [];
          console.log(
            `Pedestrian finished crossing: direction=${pedestrianRequest.crossingDirection}`,
          );
          renderIntersectionState(
            "Pedestrian Finished Crossing",
            intersection,
            config,
            pedestrianStatus,
            pedestrianBlockedDirections,
            pedestrianAllowedDirections,
          );
        },
        pedestrianRequest.requestAfterMs +
          pedestrianRequest.trafficClearanceDelayMs +
          pedestrianRequest.yellowPhaseMs +
          pedestrianRequest.crossingDurationMs,
      ),
    );
  }

  setTimeout(() => {
    clearInterval(movementInterval);
    if (rightTurnTimeout) {
      clearTimeout(rightTurnTimeout);
    }

    if (leftTurnTimeout) {
      clearTimeout(leftTurnTimeout);
    }
    pedestrianTimeouts.forEach((timeout) => clearTimeout(timeout));
    renderIntersectionState(
      "Simulation Complete",
      intersection,
      config,
      pedestrianStatus,
      pedestrianBlockedDirections,
      pedestrianAllowedDirections,
    );
  }, config.straightPhaseMs + config.leftTurnPhaseMs);
};

export const runNorthSouthTrafficFlowSimulation = (): void => {
  const config = loadTrafficSimulationConfig("north-south-flow");

  if (!config) {
    throw new Error("Missing simulation config: north-south-flow");
  }

  runTrafficSimulation(config);
};

const main = (scenarioName: string): void => {
  const config = loadTrafficSimulationConfig(scenarioName);

  if (config) {
    runTrafficSimulation(config);
    return;
  }

  console.log(`Unknown simulation: ${scenarioName}`);
  console.log(
    `Available simulations: ${Object.keys(simulationConfigs).join(", ")}`,
  );
};

main(process.argv[2] ?? "north-south-flow");
