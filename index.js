module.exports = {
  txutils: require('./lib/txutils.js'),
  vault: require('./lib/vault.js'),
  signer: require('./lib/signer.js'),
  HDWallet: require('./lib/hd_wallet.js'),
  Wallet: require('./lib/wallet.js'),
  signers: {
    SimpleSigner: require('./lib/simple_signer.js'),
    HDSigner: require('./lib/hd_signer.js'),
    ProxySigner: require('./lib/proxy_signer.js')
  },

  generators: {
    KeyPair: require('./lib/generators/key_pair.js'),
    Phrase: require('./lib/generators/phrase.js'),
    Random: require('./lib/generators/random.js')
  }
};
