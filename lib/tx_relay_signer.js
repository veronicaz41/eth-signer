var Transaction = require('ethereumjs-tx');
var UportIdentity = require('uport-identity')
var util = require("ethereumjs-util");
var solsha3 = require('solidity-sha3').default
var leftPad = require('left-pad')
var txutils = require('./txutils');

// TODO - this abi should be gotten from the uport-identity package
var txRelayAbi = UportIdentity.TxRelay.abi;

var TxRelaySigner = function(keypair, txRelayAddress, txSenderAddress) {
  this.keypair = keypair;
  this.txRelayAddress = txRelayAddress;
  this.txSenderAddress = txSenderAddress;
}

TxRelaySigner.prototype.getAddress = function() {
  return this.keypair.address;
}

TxRelaySigner.prototype.signRawTx = function(rawTx, callback) {
  var rawTx = util.stripHexPrefix(rawTx);
  var txCopy = new Transaction(Buffer.from(rawTx, 'hex'));

  var nonce = txCopy.nonce.toString('hex');
  var to = txCopy.to.toString('hex');
  var data = txCopy.data.toString('hex');
  if (!nonce || !to || !data) {
    callback("Nonce, to, and data have to be specified in the tx")
  } else {
    // Tight packing, as Solidity sha3 does
    hashInput = this.txRelayAddress + pad(nonce) + to + data + this.txSenderAddress.slice(2);
    hash = solsha3(hashInput);
    sig = this.signMsgHash(hash);

    var wrapperTx = {
      "gasPrice": txCopy.gasPrice,
      "gasLimit": txCopy.gasLimit,
      "value": 0,
      "to": this.txRelayAddress,
      "from": this.txSenderAddress,
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
