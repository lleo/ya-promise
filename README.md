# Yet Another Promise/A+ Library

## Summary

This library defaults to exporting a symbol `Y` (just like the `Q` module).

This library implements [the promise/A+ specfication][AplusSpec] and passes 
[the Promise/A+ test suite][AplusTest].

The goals were, in order of priority, to:

0. for me to understand promises better ;)
1. implement the [Promise/A+ Spec][AplusSpec] and pass the tests[AplusTest]
2. using the _deferred_ pattern.
3. defaulting to `setImmediate` due to Node.js v0.10+ warning about recursive
   calls to `process.nextTick`. And I needed to use VERY deep promise
   chains/sequences..
4. allow for overriding this _nextTick_-like behaviour as needed.
5. speed.

The advatages of this library to you that other libraries may or may not have:

0. Complete data hiding.
    * There is no way to access a promises' the internal queue of pending functions
    * There are no special/undocumented arguments to `.resolve`, `.reject`, or
      `.then` functions.
1. User settable `Y.nextTick` for your own optimizations or usage patterns.
2. Y.nextTick comes with reasonable/plausable defaults.
3. Additional helper functions are implemented that do not impact performance.

## API

### Load Module

```javascript
var Y = require("ya-promise")
```

Load the library.

### Create a Deferred & Promise

```javascript
deferred = Y.defer()
// or
deferred = Y.deferred()

promise = deferred.promise
```

### Promise Then

```javascript
promise.then(onFulfililled, onRejected)
```

This library does NOT support `onProgress`. You can have a function as the
third argument to `promise.then()` but it will never be called.

### Resolve a Deferred

```javascript
deferred.resolve(value)
```

Causes:

1. all `onFulfilled` functions to be called with `value` via `Y.nextTick`.
2. the `promise` to change to a `fulfilled` state as the [Promise/A+ spec][promsiseAplus] requires.
3. further calls to `deferred.resolve()` or `deferred.reject()` to be ignored.

### Reject a Deferred

```javascript
deferred.reject(value)
```

Causes:

1. all `onRejected` functions to be called with `value` via `Y.nextTick`.
2. the `promise` to change to a `rejected` state as the [Promise/A+ spec][AplusSpec] requires.
3. further calls to `deferred.resolve()` or `deferred.reject()` to be ignored.

### Convert a value or Y Promise or a foreign Promise ([thenable][terminology]) to a Y Promise

```javascript
Y(value_or_thanable)
Y.when(value_or_thenable)
```

Returns a `ya-promise` promise given a straight value or promise from
`ya-promise` or [thenable][terminology].

If a `ya-promise` promise is passed in, it is returned unchanged.

If a value is passed in a fulfilled `ya-promise` promise is returned.

If a foreign [thenable][terminology] is passed in it is wrapped in a _deferred_
and a `ya-promise` promise is returned.

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
### Detect is an object ISA `ya-promise` deferred or promise.

```javascript
var d = Y.defer()
  , p = d.promise
Y.isDeferred( d ) // returns `true`
Y.isPromise( p )  // returns `true`
```

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

However, for a **node-style** async function that returns a single result,
`Y.promisify(nodeFn)` does NOT return an single element array. For example:

```javascript
nodeFn(arg0, arg1, function(err, res0){ ... })
```

is converted to:

```javascript
promise = promiseFn(arg0, arg1)
promise.then(function(res0){ ... }, function(err){ ... })
```

Notice, `res0` is not wrapped in an array.

## Benchmarks

`ya-promise` was just tested with the following simple script against a few
other Promise/A+ libraries. (My results also included.)

Remember "Lies, Statistics, and Benchmarks".

```javascript
var Y = require('ya-promise')
  , Q = require('q')
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
, 'Q' : function(done){
    var d = Q.defer()
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

### My Benchmark Results

```
{ http_parser: '1.0',
  node: '0.10.4',
  v8: '3.14.5.8',
  ares: '1.9.0-DEV',
  uv: '0.10.4',
  zlib: '1.2.3',
  modules: '11',
  openssl: '1.0.1e' }
Scores: (bigger is better)

Vow
Raw:
 > 619.05994005994
 > 620.7982017982018
 > 618.0889110889111
 > 605.2717282717283
Average (mean) 615.8046953046953

ya-promise
Raw:
 > 461.97002997003
 > 456.5094905094905
 > 457.46453546453546
 > 452.87012987012986
Average (mean) 457.20354645354644

promiscuous
Raw:
 > 410.73226773226776
 > 410.3096903096903
 > 410.09190809190807
 > 401.5804195804196
Average (mean) 408.17857142857144

p-promise
Raw:
 > 134.74725274725276
 > 135.12687312687314
 > 133.78921078921078
 > 134.9010989010989
Average (mean) 134.64110889110887

Q
Raw:
 > 3.136863136863137
 > 3.136863136863137
 > 3.116883116883117
 > 3.144855144855145
Average (mean) 3.133866133866134

Winner: Vow
Compared with next highest (ya-promise), it's:
25.76% faster
1.35 times as fast
0.13 order(s) of magnitude faster
A LITTLE FASTER

Compared with the slowest (Q), it's:
99.49% faster
196.5 times as fast
2.29 order(s) of magnitude faster
```

This is not fair to `p-promise` because it uses `setImmediate` if avalable.

So here is the fair comparison:

```javascript
var Y = require('ya-promise')
  , P = require('p-promise')

exports.compare = {
  'ya-promise' : function(done){
    var d = Y.defer()
      , p = d.promise
    p.then(function(v){ return v+1 })
    p.then(function(v){ done() })
    d.resolve(0)
  }
, 'p-promise' : function(done){
    var d = P.defer()
      , p = d.promise
    p.then(function(v){ return v+1 })
    p.then(function(v){ done() })
    d.resolve(0)
  }
}

require('bench').runMain()
```

Please be patient.
{ http_parser: '1.0',
  node: '0.10.4',
  v8: '3.14.5.8',
  ares: '1.9.0-DEV',
  uv: '0.10.4',
  zlib: '1.2.3',
  modules: '11',
  openssl: '1.0.1e' }
Scores: (bigger is better)

p-promise
Raw:
 > 133.14085914085913
 > 133.13872255489022
 > 133.82217782217782
 > 134.4815184815185
Average (mean) 133.64581949986143

ya-promise
Raw:
 > 112.26373626373626
 > 113.13386613386614
 > 113.13086913086913
 > 113.54445554445554
Average (mean) 113.01823176823177

Winner: p-promise
Compared with next highest (ya-promise), it's:
15.43% faster
1.18 times as fast
0.07 order(s) of magnitude faster
A LITTLE FASTER```
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

Advice: Screw Nike comercials, "Just DON'T Do It". Don't try to be _too clever
by half_ and take _advantage_ of the fact that `deferred.resolve`,
`deferred.reject`, and `promise.then` are closures not methods because they
"close over" `deffered` and `promise` as well.

## Links

[Promise/A+ Specification][AplusSpec]
[Promise/A+ Test Suite][AplusTest]
[p-promise NPM module][p-promise]
[promiscuous NPM mdule[promiscuous]
[Q NPM module][Q]
[bench NPM module][bench]
[Promise/A+ terminology][terminology]
[tl;dr definition][tldr]

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