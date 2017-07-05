var Transaction = require('ethereumjs-tx');
var util = require("ethereumjs-util");
var solsha3 = require('solidity-sha3').default
var leftPad = require('left-pad')
var txutils = require('./txutils');

// TODO - this abi should be gotten from the uport-identity package
var txRelayAbi = [ { "constant": true, "inputs": [ { "name": "add", "type": "address" } ], "name": "getNonce", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "type": "function" }, { "constant": true, "inputs": [ { "name": "b", "type": "bytes" }, { "name": "a", "type": "address" } ], "name": "checkAddress", "outputs": [ { "name": "t", "type": "bool" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "destination", "type": "address" }, { "name": "data", "type": "bytes" } ], "name": "relayTx", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sigV", "type": "uint8" }, { "name": "sigR", "type": "bytes32" }, { "name": "sigS", "type": "bytes32" }, { "name": "destination", "type": "address" }, { "name": "data", "type": "bytes" }, { "name": "claimedSender", "type": "address" } ], "name": "relayMetaTx", "outputs": [], "payable": false, "type": "function" } ];

var TxRelaySigner = function(keypair, txRelayAddress) {
  this.keypair = keypair;
  this.txRelayAddress = txRelayAddress;
}

TxRelaySigner.prototype.getAddress = function() {
  return this.keypair.address;
}

TxRelaySigner.prototype.metaSignRawTx = function(rawTx, txSender, callback) {
  var rawTx = util.stripHexPrefix(rawTx);
  var txCopy = new Transaction(Buffer.from(rawTx, 'hex'));

  var nonce = txCopy.nonce.toString('hex');
  var to = txCopy.to.toString('hex');
  var data = txCopy.data.toString('hex');
  if (!nonce || !to || !data) {
    callback("Nonce, to, and data have to be specified in the tx")
  } else {
    // Tight packing, as Solidity sha3 does
    hashInput = this.txRelayAddress + pad(nonce) + to + data + txSender.slice(2);
    hash = solsha3(hashInput);
    sig = this.signMsgHash(hash);

    var wrapperTx = {
      "gasPrice": txCopy.gasPrice,
      "gasLimit": txCopy.gasLimit,
      "value": 0,
      "to": this.txRelayAddress,
      "from": txSender,
    };
    var rawMetaSignedTx = txutils.functionTx(txRelayAbi, "relayMetaTx",
      [ sig.v,
        util.addHexPrefix(sig.r.toString('hex')),
        util.addHexPrefix(sig.s.toString('hex')),
        util.addHexPrefix(to),
        util.addHexPrefix(data)
      ], wrapperTx)

    callback(null, rawMetaSignedTx);
  }
}

TxRelaySigner.prototype.signMsgHash = function(msgHash) {
  return util.ecsign(Buffer.from(util.stripHexPrefix(msgHash), 'hex'), Buffer.from(this.keypair.privateKey.slice(2), 'hex'));
}

function pad(n) {
  if (n.startsWith("0x")) {
    n = n.slice(2);
  }
  return leftPad(n, '64', '0');
}

module.exports = TxRelaySigner
