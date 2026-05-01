### Install dependencies
npm i

### Run Simulation
npx tsx simulations.ts

### How It Works
There is one simulation for North-South traffic with a pedestrian crossing request. The values for the scenario are configured in `simulationConfigs.json` so different simulations can be easily run.

##### Features: 
- Pedestrian Crossing: On a timer that allows a ped to walk across the lanes to the other side of the road
- Orange Flashing Light: When the straight lanes in a direction turn green and the opposite lights are all red, the left lane is updated to flashing orange, the straight lanes are green, and the right lane is red. Later, a timer changes the left or right lanes (never at the same time) change to green to allow the flow of traffic.
- Smart Sensors: When the sensors detect the weight of at least 7500lbs or 3 cars (average car weight is 2500lbs), the lights for the lane change to green to allow the flow of traffic