const { network } = require("hardhat")
const {
    developmentChain,
    DECIMALS,
    InitialAnswer,
} = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    // const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    if (developmentChain.includes(network.name)) {
        log("Local network detected: Deploying Mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, InitialAnswer],
        })
        log("Mocks deployed !!!!")
        log("---------------------------------------------------------")
    }
}
module.exports.tags = ["all", "mocks"]
