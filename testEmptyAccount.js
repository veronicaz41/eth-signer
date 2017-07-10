var Contract = require('truffle-contract')
var TestRPC = require('ethereumjs-testrpc');
var Web3 = require('web3')
var Transaction = require('ethereumjs-tx');
const Promise = require('bluebird')
var SimpleSigner = require('./lib/simple_signer')
var KeyPair = require('./lib/generators/key_pair')
var txutils = require('./lib/txutils')
var testRegArtifact = require('./test/fixtures/TestRegistry')

var provider = TestRPC.provider()
var web3 = new Web3(provider)
var TestRegistry = Contract(testRegArtifact)
TestRegistry.setProvider(provider)

web3.eth = Promise.promisifyAll(web3.eth)
KeyPair = Promise.promisifyAll(KeyPair)

var accounts = Object.keys(provider.manager.state.accounts)
var txParams = {from: accounts[0], gas: 2000000}
var testNum = 1234

async function test() {
  var keypair = await KeyPair.generateAsync()
  var testReg = await TestRegistry.new(txParams)
  var simpleSigner = new SimpleSigner(keypair)
  simpleSigner = Promise.promisifyAll(simpleSigner)
  var nonce = await web3.eth.getTransactionCountAsync(keypair.address)
  var wrapperTx = new Transaction({
    to: testReg.address,
    value: 0,
    nonce: nonce,
    gasLimit: 2000000
  })
  var rawTx = txutils.functionTx(testRegArtifact.abi, 'register', [testNum], wrapperTx)

  var registeredNum = await testReg.registry.call(keypair.address)
  console.log('Registered number before tx: ' + registeredNum.toNumber())

  var signedRawTx = await simpleSigner.signRawTxAsync(rawTx)
  console.log('Balance before tx: ', (await web3.eth.getBalanceAsync(keypair.address)).toNumber())
  var txHash = await web3.eth.sendRawTransactionAsync(signedRawTx)
  console.log('Balance after tx: ', (await web3.eth.getBalanceAsync(keypair.address)).toNumber())

  var registeredNum = await testReg.registry.call(keypair.address)
  console.log('Registered number before tx: ' + registeredNum.toNumber())

  var tx = await web3.eth.getTransactionReceiptAsync(txHash)
  console.log('Gas used: ' + tx.gasUsed)
}

test()
