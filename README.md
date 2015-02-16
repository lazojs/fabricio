[![Build Status](https://travis-ci.org/lazojs/fabricio.svg?branch=master)](https://travis-ci.org/lazojs/fabricio)

# fabricio

> Oh, snap! It's our rival gang!

Resolves Lazo node module dependencies that are not Lazo application packages based on package.json lazo meta data.

## Usage

```javascript
var fabricio = require('fabricio');

// arguments
// 1. lazo modules to scan; data format is
//    https://github.com/lazojs/crushinator return value
// 2. options
// 3. callback
fabricio(data, {}, function (err, modules) {

});
```