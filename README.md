# Yet Another Promise/A+ Library

## Summary

This library defaults to exporting a symbal `Y` (just like the `Q` module).

This library implements [the promise/A+ specfication][AplusSpec] and passes 
[the Promise/A+ test suite][AplusTest].

The goals were to create a Promse/A+ library:

1. using the _deferred_ pattern.

2. defaulting to `setImmediate` due to Node.js v0.10+ warning about recursive
   calls to `process.nextTick`. And I needed to use VERY deep promise
   chains/sequences..

3. allow for overriding this _nextTick_-like behaviour as needed.

4. speed.

Additional helper functions are implemented that do not impact performance. As
for performance, this library performs better than [p-promise v0.1.4][p-promise],
[promiscuous v0.3.0][promiscuous], and (_WAY better_) [Q v0.9.3][Q]. The phrase
_"performs better"_ just means that a simple *defer/then/resolve* loop was
executed using the [bench][bench] Node.js module.

## API

### Load Module
```javascript
var Y = require("ya-promise")
```
Load the library.


### Convert a value or a foreign Promise (_thenable_[terminology]) to a Y Promise
```javascript
Y(value_or_thanable)
Y.when(value_or_thenable)
```
Returns a `ya-promise` promise given a straight value or a
[thenable][terminology].

### Convert a **node-style** async function to a **promise-style** async function.
```javascript
promiseFn = Y.promisify(nodeFn)
promiseFn = Y.nfbind(nodeFn)
```
A **node-style** async function looks like this
```javascript
nodeFn(arg0, arg1, function(err, res0, res1){ ... })
```
where the return value of `nodeFn` is usually `undefined`.

The corresponding **promise-style** async function look like this
```javascript
promise = promiseFn(arg0, arg1)
promise.then(function([res0, res1]){ ... }, function(err){ ... })
```

### Create a Fulfilled or Rejected Promise
```javascript
fulfilled_promise = Y.resolved(value)
rejected_promise  = Y.rejected(reason)
```
examples:
```javascript
Y.reolved(42).then( function(value){ value == 42 }
                  , function(reason){/*never called*/})

Y.rejected("oops").then( function(value){/*never called*/}
                       , function(reason){ reason == "oops" })
```
## Benchmarks

It was just tested with the following simple script.

Remember "Lies, Statistics, and Benchmarks".

```javascript
var Y = require('ya-promise')
  , Vow = require('vow')
  , P = require('p-promise')
  , promiscuous = require('promiscuous')

Y.nextTick = process.nextTick //force the use of process.nextTick

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

## Implementation

### Performance Lessons Learned

#### Constructors do not HAVE to be more expensive then Plain-Ole-Objects

IE `new Promise(thenFn)` does not have to be more expensive than
`{ then: thenFn }`.

### `then`, `reject`, & `resolve` are closures not methods

This is total [tl;dr][tldr]. ("To Long Don't Read" for non-internet-hipsters, like me:).

This is a cute fact about the implementation that has a few implications.

For 
```javascript
var deferred = Y.defer()
```
`deferred.resolve` and `deferred.reject` are closures not methods. That
means that you could separate the function `foo = deferred.resolve` from
the `deferred` object and calling `foo(value)` will still work.

Basically, `deferred` is just a plain javascript object `{}` with three
named values `promise`, `resolve`, and `reject`.

For that matter, `promise.then` is a closure not a method. If you look at
it `promise` only contains a `then` entry.

This turns out to be a good thing for two reasons, and bad for one reason:

1. Converting a foreign promise to a `ya-promise` promise is easy.
```javascript
function convert(foreign_promise){
  var deferred = Y.defer()
  foreign_promise.then(deferred.resolve, deferred.reject)
  return deferred.promise
}
```

2. There is no way to access to the internals of the `deferred` or `promise`
   mechanisms. They are truely private.

This could be bad when the initial `deferred.resolve` is called, it replaces
`deferred.resolve` with a new function. So, if you copy the original function
to a new variable AND that function gets called twice it will call the
previous queued up `then` functions twice as well. Simple don't do what I did
above in `1.` do the following instead:

```javascript
function convert(foreign_promise){
  var deferred = Y.defer()
  foreign_promise.then( function(value) { deferred.resolve(value) }
                      , function(reason){ deferred.reject(reasone) })
  return deferred.promise
}
```

Put in terms of code the folowing function returns `true`:

```javascript
function compareResolves(){
  var deferred = Y.defer()
    , resolveFnBefore = deferred.resolve

  deferred.resolve("whatever")  //this function call changes `deferred.resolve`

  return deferred.resolve !== resolveFnBefore  //returns `true`
}
```

This applys to the promise's `then` function as well:

```javascript
function compareThens(){
  var deferred = Y.defer()
   , thenFnBefore = deferred.promise.then

  deferred.resolve("whatever")

  return deferred.promise.then !== thenFnBefore  //returns `true`
}
```

Advice: Screw Nike comercials, "Just DON'T Do It". Don't try to be too clever
by half and take _advantage_ of the fact that `deferred.resolve`,
`deferred.reject`, and `promise.then` are closures not methods because they
"close over" `deffered` and `promise` as well.

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
[terminology]: https://github.com/promises-aplus/promises-spec#terminology
  "Promise/A+ terminology"
[tldr]: http://www.urbandictionary.com/define.php?term=tl%3Bdr
  "to long; don't read"