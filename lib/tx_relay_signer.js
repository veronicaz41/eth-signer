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
  if (!nonce) {
    // if the buffer is empty nonce should be zero
    nonce = '0';
  }
  // Tight packing, as Solidity sha3 does
  var hashInput = this.txRelayAddress + pad(nonce) + to + data + util.stripHexPrefix(this.txSenderAddress);
  var hash = solsha3(hashInput);
  var sig = this.signMsgHash(hash);

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

TxRelaySigner.prototype.signMsgHash = function(msgHash) {
  return util.ecsign(Buffer.from(util.stripHexPrefix(msgHash), 'hex'), Buffer.from(util.stripHexPrefix(this.keypair.privateKey), 'hex'));
}

TxRelaySigner.decodeMetaTx = function(rawMetaSignedTx) {
  var tx = new Transaction(Buffer.from(rawMetaSignedTx, 'hex'));
  var txData = tx.data.toString('hex');
  var types = txutils._getTypesFromAbi(txRelayAbi, "relayMetaTx");
  var params = txutils._decodeFunctionTxData(txData, types);

  decodedMetaTx = {}
  decodedMetaTx.v = params[0].toNumber();
  decodedMetaTx.r = Buffer.from(util.stripHexPrefix(params[1]), 'hex');
  decodedMetaTx.s = Buffer.from(util.stripHexPrefix(params[2]), 'hex');
  decodedMetaTx.to = util.stripHexPrefix(params[3]);
  decodedMetaTx.data = util.stripHexPrefix(params[4]);
  // signed tx data must start with the address of the meta sender
  decodedMetaTx.claimedAddress = '0x' + decodedMetaTx.data.slice(32, 72);

  return decodedMetaTx;
}

TxRelaySigner.isMetaSignatureValid = function(txRelayAddress, decodedMetaTx, nonce, sender) {
  // make sure nonce is a string
  nonce += '';
  var hashInput = txRelayAddress + pad(nonce) + decodedMetaTx.to + decodedMetaTx.data + util.stripHexPrefix(sender);
  var msgHash = solsha3(hashInput);
  var pubkey = util.ecrecover(Buffer.from(util.stripHexPrefix(msgHash), 'hex'), decodedMetaTx.v, decodedMetaTx.r, decodedMetaTx.s);
  var address = '0x' + util.pubToAddress(pubkey).toString('hex');
  return address === decodedMetaTx.claimedAddress;
}

function pad(n) {
  if (n.startsWith('0x')) {
    n = util.stripHexPrefix(n);
  }
  return leftPad(n, '64', '0');
}

module.exports = TxRelaySigner
