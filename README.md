### Install dependencies
`npm i`

### Run Simulation
`npx tsx simulations.ts`

##### Features: 
- Pedestrian Crossing: On a timer that allows a ped to walk across the lanes to the other side of the road
- Orange Flashing Light: When the straight lanes in a direction turn green and the opposite lights are all red, the left lane is updated to flashing orange, the straight lanes are green, and the right lane is red. Later, a timer changes the left or right lanes (never at the same time) change to green to allow the flow of traffic.
- Smart Sensors: When the sensors detect the weight of at least 7500lbs or 3 cars (average car weight is 2500lbs), the lights for the lane change to green to allow the flow of traffic

### How It Works
There is one simulation for North-South traffic with a pedestrian crossing request. The values for the scenario are configured in `simulationConfigs.json` so different simulations can be easily run.


##### Research: 
I wanted to use the industry standard terminology and standard traffic practices when considering how I would build this. Here are the sources I used and questions I had:

- How do traffic signals work? Sensors (in the ground or cameras)? Timers?
- How do crosswalk buttons work?
    - Cross only on same direction when light is green (standard?)
    - Include accessibility for blind

Sources:
- [https://www.roads.maryland.gov/oots/Chapter 11 - Ped Signs and Signals.pdf](https://www.roads.maryland.gov/oots/Chapter%2011%20-%20Ped%20Signs%20and%20Signals.pdf)
- https://wsdot.wa.gov/travel/operations-services/traffic-signals
- https://worksafetci.com/2023/01/what-is-a-traffic-detector/

##### LLM Usage:

The transcript can be found in `llm_output_droplet.txt`

I like to treat LLMs as a really smart pairing buddy. When I started the challenge, I started with already existing code instead of generating boilerplate classes with the agent. I did this because I have more control and opinion on how the LLM should code and what style it should conform to, instead of having that decided for me. 

##### Design Choices
- Distinct responsibilities and Separation of Concerns were top of mind when creating specific classes (`Vehicle`, `TrafficLane`, etc). Logic was added to the responsible structures to ensure that changes can be easily made and bugs can be tracked down quickly.
- DRY: Adding customizations to simulations is easy due to the config values being pulled from the config file. Adding more lanes, lights, cars are easy to extend or create because the code is modularized and allows those changes to be made quickly by updating an array.
- Enums: No magic strings over here.

##### Non-MVP (but would be cool to add)
- Countdown for crosswalk, currently only displays raised hand or walking signal
- Consider crosswalk length and calculating the crosswalk countdown on the average time it would take a pedestrian to reach the other side of the road
- Above Roadway Detector sensors