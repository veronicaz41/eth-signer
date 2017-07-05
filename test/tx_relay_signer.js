var expect = require('chai').expect
var TxRelaySigner = require('../lib/tx_relay_signer');
var keypair = require('./fixtures/keypair')
var Transaction = require('ethereumjs-tx');
var util = require("ethereumjs-util");

describe("SimpleSigner", function () {
  var relayAddress = "0xf85c44a9062acddcb5b174868fc62dd1f8c9e7f9";
  var txSenderAddress = "0xea674fdde714fd979de3edf0f56aa9716b898ec8";
  var rawTx = "f601850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901c8080";
  var signer = new TxRelaySigner(keypair, relayAddress);

  describe("getAddress", function() {
    it("returns its address", function(done) {
      expect(signer.getAddress()).to.equal(keypair.address);
      done();
    })
  })

  describe("signMsgHash", function() {
    it("should sign a hash correctly", function(done) {
      var msgHash = "0x6b0e83bf7658d26aa7b50b457dacb63a33844df405f2340ae6ef0a523dc5c34a";
      var sig = signer.signMsgHash(msgHash);
      var pubkey = util.ecrecover(Buffer.from(msgHash.slice(2), 'hex'), sig.v, sig.r, sig.s);
      var address = '0x' + util.pubToAddress(pubkey).toString('hex');
      expect(address).to.equal(keypair.address);
      done()
    })
  })

  describe("metaSignRawTx", function() {
    it("should meta sign transaction", function(done) {
      signer.metaSignRawTx(rawTx, txSenderAddress, function(e, metaSignedRawTx) {
        // This isn't really good enough as a test, ideas are welcome
        // I think the best way to test it is to do an integration test against the txRelay
        expect(metaSignedRawTx).to.equal("f9012b80850ba43b7400832fefd894f85c44a9062acddcb5b174868fc62dd1f8c9e7f980b90104c3f44c0a000000000000000000000000000000000000000000000000000000000000001b98edc25df43bba2810ea168f8f47b19219051c11f6c713296dc2ae527d9cc8bd2ef8c6eccb6e3dfdc1b27de3635a4e482852842528ff7c15da122618347316690000000000000000000000009e2068cce22de4e1e80f15cb71ef435a20a3b37c00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000090abcdef0123456789000000000000000000000000000000000000000000000001c8080");
        done();
      });
    })

    it("Should error on no nonce", function(done) {
      var tx = new Transaction(Buffer.from(rawTx, 'hex'));
      tx.nonce = Buffer.from("");
      newRawTx = tx.serialize().toString('hex');
      signer.metaSignRawTx(newRawTx, txSenderAddress, function(e, metaSignedRawTx) {
        expect(e).to.equal("Nonce, to, and data have to be specified in the tx");
        expect(metaSignedRawTx).to.be.undefined;
        done();
      });
    })

    it("Should error on no to", function(done) {
      var tx = new Transaction(Buffer.from(rawTx, 'hex'));
      tx.to = Buffer.from("");
      newRawTx = tx.serialize().toString('hex');
      signer.metaSignRawTx(newRawTx, txSenderAddress, function(e, metaSignedRawTx) {
        expect(e).to.equal("Nonce, to, and data have to be specified in the tx");
        expect(metaSignedRawTx).to.be.undefined;
        done();
      });
    })

    it("Should error on no data", function(done) {
      var tx = new Transaction(Buffer.from(rawTx, 'hex'));
      tx.data = Buffer.from("");
      newRawTx = tx.serialize().toString('hex');
      signer.metaSignRawTx(newRawTx, txSenderAddress, function(e, metaSignedRawTx) {
        expect(e).to.equal("Nonce, to, and data have to be specified in the tx");
        expect(metaSignedRawTx).to.be.undefined;
        done();
      });
    })
  })
});
