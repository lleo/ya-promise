# Yet Another Promise/A+ Library

## Summary

This library defaults to exporting a symbol `Y` (just like the `Q` module).

This library implements [the promise/A+ specfication][AplusSpec] and passes 
[the Promise/A+ test suite][AplusTest].

The goals were, in order of priority, to:

0. for me to understand promises better ;)
1. implement the [Promise/A+ Spec][AplusSpec] and pass the [tests][AplusTest]
2. using the _deferred_ pattern.
3. defaulting to `setImmediate` due to Node.js v0.10+ warning about recursive
   calls to `process.nextTick`. And I needed to use VERY deep promise
   chains/sequences..
4. allow for overriding this _nextTick_-like behaviour as needed.
5. speed.

The advatages of this library to you that other libraries may or may not have:

0. Complete data hiding.
    * There is no way to access a promises' the internal queue of pending functions
    * There are no special/undocumented arguments to `.resolve`, `.reject`,
      `.then`, or `.spread` functions.
1. User settable `Y.nextTick` for your own optimizations or usage patterns.
2. `Y.nextTick` comes with reasonable default.
3. Additional helper functions are implemented that do not impact performance.

## Quick Review of the **deferred** pattern

A `deferred` is an object coupled with a `promise` object. The `deferred`
object is responsible for resolving (also known as fulfilling) and rejecting
the `promise`.

The `promise` is the object with the `then` method. (It also has the `spread`
method which is the same as the `then` method but handles the `onFulfilled`
callback slightly differently.)

The two objects are coupled together by a queue of `(onFulfilled, onResolved)`
tuples. The `promise.then` and `promise.spread` methods build up the queue.
The `deferred.resolve` and `deferred.reject` methods dispatch the queue _once
and only once_.

Here is an example in the form of the `V.promisify` function:

```javascript
function promisify(nodeFn, thisObj){
  return function(){
    var args = Array.prototype.slice.call(arguments)
      , d = Y.defer()

    args.push(function(err){
      if (err) { d.reject(err); return }
      if (arguments.length > 2)
        d.resolve(Array.prototype.slice.call(arguments, 1))
      else
        d.resolve(arguments[1])
    })

    nodeFn.apply(thisObj, args)

    return d.promise
  }
}
```

## API

### Load Module

```javascript
var Y = require("ya-promise")
```

Load the library.

### Create a Deferred & Promise
Q-alike: [`Q.defer()`][Qdefer]

```javascript
deferred = Y.defer()
// or
deferred = Y.deferred()

promise = deferred.promise
```

### Promise `then`

```javascript
promise.then(onFulfililled, onRejected)
```

This library does NOT support `onProgress`. You can have a function as the
third argument to `promise.then()` but it will never be called.

### Promise `spread`

```javascript
promise.spread(onFulfilled, onRejected)
```

When `onFulfilled` is called, and `value` is an `Array`, `value` will be spread
as arguments to the function via `onFulfilled.apply(undefined, value)` rather than `onFulfilled(value)`.

### Resolve a Deferred

```javascript
deferred.resolve(value)
```

Causes:

1. all `onFulfilled` functions to be called with `value` via `Y.nextTick`.
2. the `promise` to change to a `fulfilled` state as the [Promise/A+ spec][AplusSpec] requires.
3. further calls to `deferred.resolve()` or `deferred.reject()` to be ignored.

### Reject a Deferred
Q-alike: [`Q.reject()`][Qreject]

```javascript
deferred.reject(value)
```

Causes:

1. all `onRejected` functions to be called with `value` via `Y.nextTick`.
2. the `promise` to change to a `rejected` state as the [Promise/A+ spec][AplusSpec] requires.
3. further calls to `deferred.resolve()` or `deferred.reject()` to be ignored.

### Convert a value or a foreign Promise ([thenable][terminology]) to a Y Promise
Q-alike: [`Q()`][Qfunc]
Q-alike: [`Q.when()`][Qwhen]

```javascript
Y(value_or_thanable)
Y.when(value_or_thenable)
```

Returns a `ya-promise` promise given a straight value or [thenable][terminology].

If a `ya-promise` promise is passed in, it is returned unchanged.

If a value is passed in a fulfilled `ya-promise` promise is returned.

If a foreign [thenable][terminology] is passed in it is wrapped in a _deferred_
and a `ya-promise` promise is returned.

### Create a Promise from an Array of Promises
Q-alike: [`Q.all()`][Qall]

```javascript
Y.all([promA, promB, promC]).then( function([resA, resB, resC]){ ... }
                                 , function(reason){ ... } )
```

When all the promises in the array passed to `Y.all(array)` are resolved
the returned promise is resolved. It value is an array of the results of
each of the original promises in the same order.

If ANY of the promises in the array are rejected then the returned promise
is immediately rejected.

Example:
```javascript
var Y = require('./')

function timeout(n) {
  var d = Y.defer(), t = n * Math.random()
  setTimeout(function(){ d.resolve(t) }, t*1000 )
  return d.promise
}

var t0 = Date.now()

Y.all([ timeout(10, "one")
      , timeout(10, "two")
      , timeout(10, "three")
      ])
.then(function(a){
  a.forEach(function(r, i){
    console.log("%d: %d sec", i, r)
  })
  console.log("now-t0: %d sec", (Date.now()-t0)/1000)
})
```

### Timeout a Promise

```javascript
promise.timeout(ms).then(onFulfilled, onRejected)
```

If `promise` is resolved or rejected in less than `ms` milliseconds then
`onFulfilled` or `onRejected` (respectively) will be called with the `value`
or `reason` given.

If `promise` is not resolved or rejected within that time limit, then 
the `promise` will be rejected with the reason set to 
`"Timed out after " + ms + " ms"`.

### Delay a Promise
Q-alike: [`promise.delay()`][Qpromisedelay]

// START HERE

### Create a Promise whos Resolution is delayed
Q-alike: [`Q.delay()`][Qdelay]

```javascript
delayed = Y.delay(ms)
```

This is a promise-like version of `setTimeout()` but looks nicer.
```javascript
Y.delay(1000).then(doSomthing)
```

### Create a Fulfilled or Rejected Promise
Q-alike: [`Q.reject()`][Qreject]

```javascript
fulfilled_promise = Y.resolved(value)
rejected_promise  = Y.rejected(reason)
```
Examples:
```javascript
Y.reolved(42).then( function(value){ value == 42 }
                  , function(reason){/*never called*/})

Y.rejected("oops").then( function(value){/*never called*/}
                       , function(reason){ reason == "oops" })
```
### Detect if an object ISA `ya-promise` Deferred or Promise.
Q-alike: [`Q.isPromise()`][Qispromise]

```javascript
var d = Y.defer()
  , p = d.promise
Y.isDeferred( d ) // returns `true`
Y.isPromise( p )  // returns `true`
```

### Convert a **node-style** async function to a **promise-style** async function.
Q-alike: [`Q.denodeify`][Qdenodeify]
Q-alike: [`Q.nfbind`][Qdenodeify]

```javascript
promiseFn = Y.promisify(nodeFn)
promiseFn = Y.nfbind(nodeFn)
promiseFn = Y.denodeify(nodeFn)
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
 > 593.063936063936
 > 597.1928071928072
 > 607.999000999001
 > 604.5444555444556
Average (mean) 600.70004995005

promiscuous
Raw:
 > 402.68431568431566
 > 398.86013986013984
 > 398.8851148851149
 > 401.8061938061938
Average (mean) 400.55894105894106

ya-promise
Raw:
 > 399.93806193806194
 > 396.82917082917083
 > 387.72427572427574
 > 396.3046953046953
Average (mean) 395.19905094905096

p-promise
Raw:
 > 133.1098901098901
 > 134.56043956043956
 > 134.16683316683316
 > 133.2067932067932
Average (mean) 133.76098901098902

Q
Raw:
 > 3.3366533864541834
 > 3.3716283716283715
 > 3.3846153846153846
 > 3.3506493506493507
Average (mean) 3.3608866233368224

Winner: Vow
Compared with next highest (promiscuous), it's:
33.32% faster
1.5 times as fast
0.18 order(s) of magnitude faster
A LITTLE FASTER

Compared with the slowest (Q), it's:
99.44% faster
178.73 times as fast
2.25 order(s) of magnitude faster
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

p-promise
Raw:
 > 133.78121878121877
 > 136.0979020979021
 > 137.86713286713288
 > 139.1988011988012
Average (mean) 136.73626373626374

ya-promise
Raw:
 > 108.32167832167832
 > 98.51548451548452
 > 106.22477522477523
 > 106.47152847152847
Average (mean) 104.88336663336663

Winner: p-promise
Compared with next highest (ya-promise), it's:
23.3% faster
1.3 times as fast
0.12 order(s) of magnitude faster
A LITTLE FASTER
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
[Qfunc]: https://github.com/kriskowal/q/wiki/API-Reference#qvalue
[Qdefer]: https://github.com/kriskowal/q/wiki/API-Reference#qdefer
[Qreject]: https://github.com/kriskowal/q/wiki/API-Reference#qrejectreason
[Qwhen]: https://github.com/kriskowal/q#the-middle
[Qall]: https://github.com/kriskowal/q/wiki/API-Reference#promiseall
[Qispromise]: https://github.com/kriskowal/q/wiki/API-Reference#qispromisevalue
[Qdenodeify]: https://github.com/kriskowal/q/wiki/API-Reference#qdenodeifynodefunc-args
[Qpromisedelay]: https://github.com/kriskowal/q/wiki/API-Reference#promisedelayms
[Qdelay]: https://github.com/kriskowal/q/wiki/API-Reference#qdelayms