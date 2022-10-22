// function deployFunc() {
//     console.log("Hii")
// }
// module.exports.default = deployFunc
const { networkConfig, developmentChain } = require("../helper-hardhat-config")
const { network } = require("hardhat")
require("dotenv").config()
const { verify } = require("../utils/verify")
//The above line is same as
// const helperConfig=require("../helper-hardhat-config") i.e, this is whole file
// const networkConfig=helperConfig.networkConfig

module.exports = async ({ getNamedAccounts, deployments }) => {
    // const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //when going to a hardhat or localhost network we want to use mocks
    let ethUsdPricefeedAddress
    if (developmentChain.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPricefeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPricefeedAddress = networkConfig[chainId]["ethUsdPricefeed"]
    }
    // log(ethUsdPricefeedAddress)
    const args = [ethUsdPricefeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChain.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //verify
        // log(fundMe.address)
        await verify(fundMe.address, args)
    }
    log(
        "----------------------------------------------------------------------"
    )
}
/*
Mocking:
If a contract doesn't exist, we deploy a minimal version of 
our local testing
*/
module.exports.tags = ["all", "fundMe"]
/*
Unit Test-> It's done to test each and every portion of solidity file to check if they ar eworking correctly
It can be done Using:
1. A local hardhat Network
2. A forked hardhat network
Staging Test-> It's the last step before deploying to main testnet
*/
