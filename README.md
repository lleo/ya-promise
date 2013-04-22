# Yet Another Promise/A+ Library

## Summary

This library defaults to exporting a symbal `Y` (just like the `Q` module).

This library implements [the promise/A+ specfication][AplusSpec] and passes 
[the Promise/A+ test suite][AplusTest].

The goals were to create a Promse/A+ library:
1) using the _deferred_ pattern.
2) defaulting to `setImmediate` due to Node.js v0.10+ warning about recursive
   calls to `process.nextTick`. And I needed to use VERY deep promise
   chains/sequences..
3) allow for overriding this _nextTick_-like behaviour as needed.
4) speed.

Additional helper functions are implemented that do not impact performance. As
for performance, this library performs better than [p-promise v0.1.4][p-promise],
[promiscuous v0.3.0][promiscuous], and (_WAY better_) [Q v0.9.3][Q]. The phrase
_"performs better"_ just means that a simple *defer/then/resolve* loop was
executed using the [bench][bench] Node.js module.

## API

* `Y = require("ya-promise")`
  Load the library.

* `Y(value_or_promise)`
  Returns a promise. Equivalent to `Y.when()`

* `Y.when(value_or_promise)`
  Just like `Q.when()`. If the argument is a _thenable_ it is returned.
  Otherwise a promise is returned, reolved to the given value.

* `Y.promisify`
* `Y.nfbind`
  Convert a _node-style_ asynce function
  `nodeFunc(a,b,function(err, ...results){})` to promise returning async
  function `promise = promFunc(a,b)`. Ex `promFunc = Y.promisify( nodeFunc )`.

## Benchmarks

It was just tested with the following simple script.

Remember "Lies, Statistics, and Benchmarks".

```javascript
var Y = require('ya-promise')
  , Vow = require('vow')
  , P = require('p-promise')
  , promiscuous = require('promiscuous')

exports.compare = {
 'ya-promise' : function(done){
    var d = Y.defer()
      , p = d.promise
    p.then(function(v){ return v+1 })
    p.then(function(v){ done() })
    d.resolve(0)
  }
, 'Vow' : function(done){
    var p = Vow.promise()
    p.then(function(v){ return v+1 })
    p.then(function(v){ done() })
    p.fulfill(0)
  }
, 'p-promise' : function(done){
    var d = P.defer()
      , p = d.promise
    p.then(function(v){ return v+1 })
    p.then(function(v){ done() })
    d.resolve(0)
  }
, 'promiscuous': function(done){
    var d = promiscuous.deferred()
      , p = d.promise
    p.then(function(v){ return v+1 })
    p.then(function(v){ done() })
    d.resolve(0)
  }
}

require('bench').runMain()
```

## Links

[AplusSpec]: http://promises-aplus.github.io/promises-spec/
  "Promise/A+ Specification"
[AplusTest]: https://github.com/promises-aplus/promises-tests
  "Promise/A+ Test Suite"
[p-promise]: https://npmjs.org/package/p-promise
  "p-promise module"
[promiscuous]: https://npmjs.org/package/promiscuous
  "promiscuous module"
[Q]: https://npmjs.org/package/q
  "Q mdoule"
[bench]: https://npmjs.org/package/bench
  "bench module"
