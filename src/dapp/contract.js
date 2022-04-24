import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
    );
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      callback();
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  fetchFlightStatus(flight, callback) {
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        callback(error, payload);
      });
  }

  purchaseFlight({ airline, flight, amount }, callback) {
    let self = this;

    self.flightSuretyApp.methods
      .purchaseFlight(airline, flight)
      .send({ from: self.owner, amount }, callback);
  }

  async registerAirline({ airline }, callback) {
    let self = this;

    const results = await self.flightSuretyApp.methods
      .registerAirline(airline)
      .call({ from: self.owner })
      .catch((error) => callback(error));

    if (results.success) {
      self.flightSuretyApp.methods
        .registerAirline(airline)
        .send({ from: self.owner }, callback);
    } else {
      callback(`Waiting for votes on ${airline}`);
    }
  }

  voteAirline({ airlineFrom, airlineTo }, callback) {
    let self = this;

    self.flightSuretyApp.methods
      .voteAirline(airlineTo)
      .send({ from: airlineFrom }, callback);
  }

  getFlightCount({}, callback) {
    let self = this;

    self.flightSuretyApp.methods
      .getFlightCount()
      .call({ from: self.owner }, callback);
  }

  listenToEvents() {
    var subscription = web3.eth.subscribe("*", {}, function (error, result) {
      if (!error) console.log(result);
    });
  }
}
