//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Priceconverter.sol";
import "hardhat/console.sol";
error notOwner();

contract FundMe {
    using Priceconverter for uint256;
    uint256 public minUSD = 50 * 1e18;
    address immutable owner;
    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    address[] public funders;
    mapping(address => uint256) public FunderToAmount;

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) >= minUSD,
            "Didn't send enough"
        );
        FunderToAmount[msg.sender] = msg.value;
        funders.push(msg.sender);
    }

    function withdraw() public OnlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            FunderToAmount[funders[funderIndex]] = 0;
        }
        funders = new address[](0);
        (bool Callsuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(Callsuccess, "Call Transaction Failure");
    }

    modifier OnlyOwner() {
        require(msg.sender == owner, "Sender is not owner");
        _;
    }

    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }
    /*
    To reduce the gas price we can make the variables to be private instead of Public 
    and can retrieve their value by using retrieve functions
    */
}
