Context:
- Existing code to simulate traffic through a four-way intersection, with business logic partially implemented

Constraints:
- Do not use `any` type for any TypeScript files

Overall Goal:
Simulate a four-way traffic intersection. Using the existing code, provide implementions for traffic scenarios that I will specify. Do not make changes to the code, only read the existing code, and provide your suggestions in the terminal output. Start with the following request and I will provide more as follow ups:

- In `./intersection`, implement the method `initializeTraffic()` that will set an initial state of the intersection. The flow of traffic should be traveling North & South in both directions, with the left turn traffic lights set to 'RED' and the crosswalk set to 'RAISED HAND'. There should be a range of vehicles in each lane, between 5-10. For the opposite flow of traffic, traveling East-West there should be a range of vehicles in each lane, the lights should be set to 'RED', the crosswalk signal should be set to 'RAISED HAND'.


- In `./intersection` add a method that will stop the flow of traffic based on the a pedestrian's request to walk. First, In `./crosswalk.ts` add a method called `requestWalk()` that allows the pedestrian to request to use the crosswalk, stopping the flow of traffic impeding their movement. For example, if a person request to cross from West to East, all traffic traveling North and South should receive red lights, the pedestrian signal changes from "RAISED HAND" to "WALK" for an interval of 30 seconds. The lanes traveling only straight in the West and East directions should receive green lights to keep the flow of traffic moving without risking pedestrian safety.

- Now let's add a method in `./intersection` that changes the lights and flow of traffic based on a timer. For straight lanes, the timed cycle should be 90 seconds. For right lanes, the timed cycle should be 45 seconds. For left lanes, the timed cycle should be 30 seconds and should turn GREEN at the time same while all other lanes' lights (including the parallel lanes' lights) should turn RED to allow safe travsersal.  The `Vehicle` class needs to be updated to include a speed and `TrafficLane` should include length. Both of these will be used to determine when a car exits an intersection, set all lane lengths to be 12 feet wide and 24 feet long. A calculation needs to be created to determine how and when a car leaves the lanes in the interection based on the vehicle's speed. For turning lanes, be sure to include the vehicle's current position in the lane and the length of the lane it changes to in the calculation.



- Next, let's incorporate sensor technology that uses a in-road sensor to determine whether or not to change a light to green based on the time a vehicle has been sitting for a certain amount of time.

Simulations:

1. Simulate North-South traffic flow
2. Simulate East-West traffic flow
3. Simulate North-South pedestrian flow
4. Simulate East-West pedestrian flow




5. Generate classes and properties
   1. Road, Car, Traffic Detector (Sensor)
6. Tests with tests focusing on different scenarios 
7. Implement class methods
8. Implement simulations

Traffic Signal Controller
- Includes green, yellow, red (vehicle signal) and walking (ped signal, incl accesbility)


Implementation Plan 
1. Stub out classes, enums, etc
   - Traffic Signal Controller
     - Vehicle Signal
     - Pedestrian Signal
     - Cycle time
   - Intersection
     - Lane
     - Crosswalk (direction)
     - Sensor (In Roadway Detector/Above Roadway Detector)
   - Simulation
     - TODO: Come up with scenarios
2. Moved unchanged values to enums dir, change from interfaces/types to classes since we need dependencies and class methods


Non-MVP
- Countdown for ped walking
- Crosswalk length and basing the countdown on that length
- Above Roadway Detector
