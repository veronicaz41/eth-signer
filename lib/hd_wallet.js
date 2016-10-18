var util = require("ethereumjs-util");
var Phrase = require('./generators/phrase');
var KeyPair = require('./generators/key_pair');
var Transaction = require('ethereumjs-tx');

var HDWallet = function(hdSeed, initAccounts = 0) {
  this.hdSeed = Phrase.toHDPrivateKey(hdSeed);
  this.keypairs = [];
  var key;
  for (var i = 0 ; i < initAccounts ; i++) {
    key = this.hdSeed.derive(["m","44'", "60'", "0'","0", i].join("/"));
    this.keypairs[i] = KeyPair.fromPrivateKey(key.privateKey.toBuffer())
  }
}

HDWallet.prototype.addAccounts = function(numAccounts = 1) {
  var totalNumAccounts = numAccounts + this.keypairs.length
  for (var i = this.keypairs.length ; i < totalNumAccounts ; i++) {
    key = this.hdSeed.derive(["m","44'", "60'", "0'","0", i].join("/"));
    this.keypairs[i] = KeyPair.fromPrivateKey(key.privateKey.toBuffer())
  }
};

HDWallet.prototype.hasAddress = function(address, callback) {
  callback(null, this.indexOfKeypair(address) !== -1)
};

HDWallet.prototype.getAddress = function(i = 0) {
    if(!this.keypairs[i]) {return new Error("address " + i + " doesnt exist")}
    return this.keypairs[i].address;
}

HDWallet.prototype.getAccounts = function(callback = function(e,r){return r}) {
  callback(null, this.getAddresses());
}

HDWallet.prototype.getAddresses = function() {
  var addresses = []
  for (var i = 0 ; i < this.keypairs.length ; i++) {
    addresses.push(this.keypairs[i].address);
  }
  return addresses;
}

HDWallet.prototype.signTransaction = function (txParams, callback) {
  var ethjsTxParams = {};
  ethjsTxParams.from = util.addHexPrefix(txParams.from);
  ethjsTxParams.to = util.addHexPrefix(txParams.to);
  ethjsTxParams.gasLimit = util.addHexPrefix(txParams.gas);
  ethjsTxParams.gasPrice = util.addHexPrefix(txParams.gasPrice);
  ethjsTxParams.nonce = util.addHexPrefix(txParams.nonce);
  ethjsTxParams.value = util.addHexPrefix(txParams.value);
  ethjsTxParams.data = util.addHexPrefix(txParams.data);

  var senderAddress = ethjsTxParams.from; 
  var txObj = new Transaction(ethjsTxParams);
  var rawTx = txObj.serialize().toString('hex');
  this.signRawTx(rawTx, senderAddress, function(e,signedTx) {
    if (e)
      callback(e,null)
    else
      callback(null, '0x' + signedTx);
  });
};

HDWallet.prototype.signRawTx = function(rawTx, senderAddress, callback) {
  var index = this.indexOfKeypair(senderAddress);
  if (index === -1) return callback(new Error("address not managed by this wallet"), null)
  var keypair = this.keypairs[index];

  var rawTx = util.stripHexPrefix(rawTx);
  var txCopy = new Transaction(new Buffer(rawTx, 'hex'));
  txCopy.sign(new Buffer(util.stripHexPrefix(keypair.privateKey), 'hex'));
  callback(null, txCopy.serialize().toString('hex'));
}

HDWallet.prototype.indexOfKeypair = function(address){
  for(var i = 0 ; i < this.keypairs.length ; i++){
    if(this.keypairs[i].address == address){return i;}
  }
  return -1
}

module.exports = HDWallet;
