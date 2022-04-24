import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        {
          label: "Operational Status",
          error: error,
          value: result ? "Is Operational" : "-",
        },
      ]);
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", () => {
      let flight = DOM.elid("flight-number").value;
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        console.log(
          "🚀 ~ file: index.js ~ line 22 ~ contract.fetchFlightStatus ~ result",
          result
        );
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp,
          },
        ]);
      });

      contract.flightSuretyApp.events.FlightStatusInfo((error, event) => {
        if (error) console.log(error);
        console.log("event", { event });
      });
    });

    DOM.elid("form-purchase-flight").addEventListener("submit", (e) => {
      e.preventDefault();

      const airline = e.target.querySelector('[name="airline"]').value;
      const flight = e.target.querySelector('[name="flight"]').value;
      const amount = e.target.querySelector('[name="amount"]').value;

      contract.purchaseFlight({ airline, flight, amount }, (error, result) => {
        display("Purchased", `Purchase details for ${flight}`, [
          {
            label: "Transaction",
            error: error,
            value: result,
          },
        ]);
      });
      return false;
    });

    DOM.elid("form-register-airline").addEventListener("submit", (e) => {
      e.preventDefault();

      const airline = e.target.querySelector('[name="airline"]').value;

      contract.registerAirline({ airline }, (error, result) => {
        display("Register Airline", `Registering airline ${airline}`, [
          {
            label: "Status",
            error: error,
            value: JSON.stringify(result),
          },
        ]);

        contract.getFlightCount({}, (error, result) => {
          if (error) console.log(error);
          console.log("event", { result });
        });
      });
      return false;
    });

    DOM.elid("form-vote-airline").addEventListener("submit", (e) => {
      e.preventDefault();

      const airlineFrom = e.target.querySelector('[name="airline-from"]').value;
      const airlineTo = e.target.querySelector('[name="airline-to"]').value;

      console.log("🚀 ~ file: index.js ~ line 101 ~ contract.voteAirline ~ airlineFrom, airlineTo", airlineFrom, airlineTo);
      contract.voteAirline({ airlineFrom, airlineTo }, (error, result) => {
        display("Voting Airline", `Voting ${airlineTo} as ${airlineFrom}`, [
          {
            label: "Status",
            error: error,
            value: JSON.stringify(result),
          },
        ]);
      });
      return false;
    });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h4(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-3 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.prepend(section);
}
