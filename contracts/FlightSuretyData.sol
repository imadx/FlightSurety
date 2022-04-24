pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    mapping(address => bool) private authorizedCallers;

    uint256 public airlineCount;

    mapping(address => bool) private airlines;
    mapping(address => uint256) public airlineVotes;
    mapping(address => mapping(address => bool)) private airlineVoteLog;

    mapping(string => bool) private flights;
    mapping(string => address[]) private flightPurchases;
    mapping(string => mapping(address => uint256))
        private flightPurchasesAmount;
    mapping(address => uint256) private flightPurchaseRefunds;
    mapping(string => uint256) private flightFunds;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() public {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = true;
    }

    function isAirline(address airline) external view returns (bool) {
        return airlines[airline];
    }

    function getAirlines() external view returns (uint256) {
        return airlineCount;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline) external {
        airlines[airline] = true;
        airlineCount += 1;
    }

    function voteAirline(address airline) external {
        require(
            airlineVoteLog[msg.sender][airline] == false,
            "This airline has already voted"
        );

        airlineVoteLog[msg.sender][airline] = true;
        airlineVotes[airline] += 1;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(string flight) external payable {
        flightPurchases[flight].push(msg.sender);
        flightPurchasesAmount[flight][msg.sender] = msg.value;
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external {
        flightPurchaseRefunds[msg.sender] = SafeMath.div(
            SafeMath.mul(flightPurchaseRefunds[msg.sender], 3),
            2
        );
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external {
        msg.sender.transfer(flightPurchaseRefunds[msg.sender]);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {
        flightFunds["default"] = msg.value;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        fund();
    }
}
