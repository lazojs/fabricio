[![Build Status](https://travis-ci.org/lazojs/fabricio.svg?branch=master)](https://travis-ci.org/lazojs/fabricio)

# fabricio

> Oh, snap! It's our rival gang!

Resolves Lazo node module dependencies that are not Lazo application packages based on package.json lazo meta data.

```javascript
// package.json snippet
{
    "dependencies": {
        "moment": "2.0.0"
    }
    "lazo": {
        "dependencies": {
            "moment": [{
                "install": "common", // install location; app/moment/index.js
                "moduleId": "moment", // optional; module id for rjs conf
                "shim": {}, // optional; rjs shim
                "main": "index" // optional; module main; default is package.json main
            }]
        }
    }
}
```

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