# Eth-Signer

A minimal ethereum javascript signer.

This is a fork of eth-lightwallet and will not be backwards compatible.

TODO update docs and example code. See tests for the time being.

## Get Started

```
npm install eth-signer
```

The `eth-signer` package contains `dist/eth-signer.min.js` that can be included in an HTML page:

```html
<html>
  <body>
    <script src="eth-signer.min.js"></script>
  </body>
</html>
```

The file `eth-signer.min.js` exposes the global object `EthSigner` to the browser.


## Tests

Run all tests:

```
npm run test
npm run coverage
```

[BIP39]: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
[BIP32]: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki

## License

MIT License.
