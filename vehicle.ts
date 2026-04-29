export class Vehicle {
  id: number;

  constructor(id: number) {
    const vehicleID = Math.floor(Math.random() * 1000);
    
    this.id = vehicleID;
  }
}
