var Transaction = require('ethereumjs-tx');
var util = require("ethereumjs-util");
var txutils = require('./txutils');

// TODO - this abi should be gotten from the uport-identity package
var MetaIdentityManagerAbi = [ { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" }, { "name": "owner", "type": "address" } ], "name": "removeOwner", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" }, { "name": "newIdManager", "type": "address" } ], "name": "initiateMigration", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" }, { "name": "recoveryKey", "type": "address" } ], "name": "changeRecovery", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [ { "name": "a", "type": "address" } ], "name": "checkMessageData", "outputs": [ { "name": "t", "type": "bool" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" }, { "name": "newOwner", "type": "address" } ], "name": "addOwnerForRecovery", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" }, { "name": "destination", "type": "address" }, { "name": "value", "type": "uint256" }, { "name": "data", "type": "bytes" } ], "name": "forwardTo", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "owner", "type": "address" }, { "name": "recoveryKey", "type": "address" } ], "name": "registerIdentity", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" } ], "name": "cancelMigration", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" }, { "name": "newOwner", "type": "address" } ], "name": "addOwner", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "owner", "type": "address" }, { "name": "recoveryKey", "type": "address" } ], "name": "CreateIdentity", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [ { "name": "sender", "type": "address" } ], "name": "test", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "sender", "type": "address" }, { "name": "identity", "type": "address" } ], "name": "finalizeMigration", "outputs": [], "payable": false, "type": "function" }, { "inputs": [ { "name": "_userTimeLock", "type": "uint256" }, { "name": "_adminTimeLock", "type": "uint256" }, { "name": "_adminRate", "type": "uint256" }, { "name": "relayAddress", "type": "address" } ], "payable": false, "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "identity", "type": "address" }, { "indexed": true, "name": "creator", "type": "address" }, { "indexed": false, "name": "owner", "type": "address" }, { "indexed": true, "name": "recoveryKey", "type": "address" } ], "name": "IdentityCreated", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "identity", "type": "address" }, { "indexed": true, "name": "owner", "type": "address" }, { "indexed": false, "name": "instigator", "type": "address" } ], "name": "OwnerAdded", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "identity", "type": "address" }, { "indexed": true, "name": "owner", "type": "address" }, { "indexed": false, "name": "instigator", "type": "address" } ], "name": "OwnerRemoved", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "identity", "type": "address" }, { "indexed": true, "name": "recoveryKey", "type": "address" }, { "indexed": false, "name": "instigator", "type": "address" } ], "name": "RecoveryChanged", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "identity", "type": "address" }, { "indexed": true, "name": "newIdManager", "type": "address" }, { "indexed": false, "name": "instigator", "type": "address" } ], "name": "MigrationInitiated", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "identity", "type": "address" }, { "indexed": true, "name": "newIdManager", "type": "address" }, { "indexed": false, "name": "instigator", "type": "address" } ], "name": "MigrationCanceled", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "identity", "type": "address" }, { "indexed": true, "name": "newIdManager", "type": "address" }, { "indexed": false, "name": "instigator", "type": "address" } ], "name": "MigrationFinalized", "type": "event" } ];

var MetaIdentitySigner = function(proxyAddress, signer, metaIdentityManagerAddress) {
  this.proxyAddress = proxyAddress;
  this.metaIdentityManagerAddress = metaIdentityManagerAddress;
  this.signer = signer;
}

MetaIdentitySigner.prototype.getAddress = function() {
  return this.proxyAddress;
}

MetaIdentitySigner.prototype.metaSignRawTx = function(rawTx, txSender, callback) {
  var rawTx = util.stripHexPrefix(rawTx);
  var txCopy = new Transaction(new Buffer(rawTx, 'hex'));
  var finalDestination = txCopy.to;
  var wrapperTx = {
              "gasPrice": txCopy.gasPrice,
              "gasLimit": txCopy.gasLimit,
              "value": 0,
              "nonce": txCopy.nonce,
              "to": this.metaIdentityManagerAddress
              }
  var rawForwardTx = txutils.functionTx(MetaIdentityManagerAbi, "forwardTo",
    [ util.addHexPrefix(this.signer.getAddress()),
      util.addHexPrefix(this.proxyAddress),
      util.addHexPrefix(finalDestination.toString('hex')),
      util.bufferToInt(txCopy.value),
      util.addHexPrefix(txCopy.data.toString('hex')) ], wrapperTx)
  this.signer.metaSignRawTx(rawForwardTx, txSender, callback);
}


module.exports = MetaIdentitySigner;
