/* global ethers */
/* eslint prefer-const: "off" */

const { getContractFactory } = require('@nomiclabs/hardhat-ethers/types/index.js')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(contractOwner.address, diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)


  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  // deploy facets
  console.log('')
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'Bank'
  ]
  const cut = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  return diamond.address
  //interact with the contract
    // const res = await ethers.getContractFactory("Bank");
    // const interact = await res.attach(diamond.address);

    // const Amount = ethers.utils.parseEther("0.001");

    // const txresult= await interact.deposit({ value: Amount })
    // const bal = await interact.getBalance()
    // const conbal = await interact.contractBalnce()

    // console.log("result: ", txresult)
    // console.log("user balance: ", Number(bal))
    // console.log("contract Balance: ", Number(conbal))

    //DEPLOYED AT: 0xbCA0e39871a2B966C3e50E966b52E75F3676b5f6
    //BamkUpgrade: 0xb05D3bd6F5758DCCAe79C3c7a8701F6419147C5A
    //DiamondInit: 0x1bfb63d1095909456206138bfc2295836f279284
    //Bank: 0xe5922321678CfF0568E508b84eFc846D23112877
    //OwnershipFaucet: 0x98E875e7330A85F1D6C45B2A2b06d8d30ba4bEa9
    //DiamondLoupeFaucet: 0x9C83a01982a35B66FcA966760296233959f485E6
  
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployDiamond = deployDiamond
