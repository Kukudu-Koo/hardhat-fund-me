const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChain } = require("../../helper-hardhat-config")
!developmentChain.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe, deployer, mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              //const accounts=await ethers.getSigners()
              //const accountZero=accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.priceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough eth", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough"
                  )
              })
              it("Update the amount funded data Structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.FunderToAmount(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funders to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.funders(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a Single founder", async function () {
                  //Arrange
                  const startingfundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.withdraw()

                  const transactionReciept = await transactionResponse.wait()
                  // const gasCost = transactionReciept.gasUsed.mul(
                  //     transactionReciept.effectiveGasPrice
                  // )
                  const { gasUsed, effectiveGasPrice } = transactionReciept
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingfundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("allows us withdraw with multiple funders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingfundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.withdraw()

                  const transactionReciept = await transactionResponse.wait()
                  const { gasUsed, effectiveGasPrice } = transactionReciept
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingfundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  // We also want to make sure that funders are reset properly
                  await expect(fundMe.funders(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.FunderToAmount(accounts[i].address),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw ", async function () {
                  const accounts = ethers.getSigners()
                  const attacker = accounts[1]
              })
          })
      })
