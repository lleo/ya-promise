
(function (definition) {
  // NOTE: stolen from Q
  // Turn off strict mode for this function so we can assign to global.Q
  /*jshint strict: false, -W117*/

  // This file will function properly as a <script> tag, or a module
  // using CommonJS and NodeJS or RequireJS module formats.  In
  // Common/Node/RequireJS, the module exports the Q API and when
  // executed as a simple <script>, it creates a Q global instead.

  // Montage Require
  if (typeof bootstrap === "function") {
    bootstrap("promise", definition);
  }
  // CommonJS
  else if (typeof exports === "object") {
    module.exports = definition();
  }
  // RequireJS
  else if (typeof define === "function" && define.amd) {
    define(definition);
  }
  // SES (Secure EcmaScript)
  else if (typeof ses !== "undefined") {
    if (!ses.ok()) {
      return;
    } else {
      ses.makeY = definition;
    }
  }
  // <script>
  else {
    Y = definition();
  }
})(function () {
     "use strict";

     function Y(value){
       return Y.when(value)
     }

     Y.defer = function(){
       return new Deferred()
     }

     Y.deferred = Y.defer

     Y.resolved = function(value){
       var d = new Deferred()
       d.resolve(value)
       return d.promise
     }

     Y.rejected = function(reason){
       var d = new Deferred()
       d.reject(reason)
       return d.promise
     }

     Y.when = function(value){
       if ( isPromise(value) ) return value

       var d = new Deferred()

       if (value && typeof value.then === 'function')
         value.then( function(value) { d.resolve(value) }
                   , function(reason){ d.reject(reason) })
       else
         d.resolve(value)

       return d.promise
     }

     Y.all = function(promises){
       var n = 0, d = Y.defer(), res = []
       promises.forEach(function(p, i){
         n += 1
         Y.when(p).then(
           function(v){ n -= 1; res[i] = v; if (n === 0) d.resolve(res) }
         , function(r){ d.reject(r) })
       })
       return d.promise
     }

     Y.delay = function(ms){
       return Y.resolved().delay(ms)
     }

     Y.promisify = promisify
     Y.nfbind = promisify
     Y.denodeify = promisify

     Y.isPromise  = function(p){ return p instanceof Promise }
     Y.isDeferred = function(p){ return p instanceof Deferred }

     var isPromise  = Y.isPromise
       , isDeferred = Y.isDeferred

     var nextTick
     Object.defineProperty(Y, 'nextTick',
                           { get: function() { return nextTick }
                           , set: function(v) { nextTick = v; return v }
                           , configurable: true
                           , enumerable  : true })

     if (typeof setImmediate === 'function') {
       if (typeof window !== 'undefined')
         Y.nextTick = setImmediate.bind(window)
       else
         Y.nextTick = setImmediate
     }
     else if (typeof process !== 'undefined' && process.nextTick)
       Y.nextTick = process.nextTick
     else
       Y.nextTick = function(fn){ setTimeout(fn, 0) }

     function Deferred(){
       var q = []
         , promise = new Promise(then, spread)
         , deferred = this

       this.promise = promise
       this.resolve = resolve
       this.reject  = reject

       function then(onFulfilled, onRejected){
         var d = new Deferred()

         q.push({ deferred  : d
                , fulfilled : onFulfilled
                , rejected  : onRejected
                , spread    : false })

         return d.promise
       }

       function spread(onFulfilled, onRejected){
         var d = new Deferred()

         q.push({ deferred  : d
                , fulfilled : onFulfilled
                , rejected  : onRejected
                , spread    : true })

         return d.promise
       }

       function resolve(value){
         for (var i=0; i<q.length; i++) {
           if (typeof q[i].fulfilled !== 'function')
             q[i].deferred.resolve(value)
           else
             execute(q[i].fulfilled, value, q[i].deferred, q[i].spread)
         }

         deferred.reject = deferred.resolve = noop

         promise.then = createFulfilled(promise, value, false)
         promise.spread = createFulfilled(promise, value, true)
       }

       function reject(reason){
         for (var i=0; i<q.length; i++) {
           if (typeof q[i].rejected !== 'function')
             q[i].deferred.reject(reason)
           else
             execute(q[i].rejected, reason, q[i].deferred, false)
         }

         deferred.reject = deferred.resolve = noop

         promise.then = createRejected(promise, reason)
         promise.spread = createRejected(promise, reason)
       }

     } //Deferred()

     function Promise(then, spread) {
       this.then = then
       this.spread = spread
     } //Promise()

     Promise.prototype.timeout = function(ms){
       var d = Y.defer()
         , toid = setTimeout(function(){
                    //d.reject(new Error("Timed out after " + ms + " ms"))
                    d.reject("Timed out after " + ms + " ms")
                  }, ms)

       if (typeof toid.unref === 'function') toid.unref()

       this.then( function(v){ clearTimeout(toid); d.resolve(v) }
                , function(r){ clearTimeout(toid); d.reject(r)  } )

       return d.promise
     }

     Promise.prototype.delay = function(ms){
       var d = Y.defer()
         , p = d.promise
         , t0 = Date.now()

       setTimeout(function(){  }, ms)

       this.then(
         function(v){
           var sofar = Date.now() - t0
           if ( ms - sofar > 0 )
             setTimeout(function(){ d.resolve(v) }, ms - sofar)
           else
             d.resolve(v)
         }
       , function(r){
           var sofar = Date.now() - t0
           if ( ms - sofar > 0 )
             setTimeout(function(){ d.reject(r) }, ms - sofar)
           else
             d.reject(r)
         })

       return p
     }

     function createFulfilled(promise, value, spread) {
       spread = spread || false
       return function fulfilled(onFulfilled, onRejected){
         var d
         if (typeof onFulfilled !== 'function') return promise
         execute(onFulfilled, value, d = new Deferred(), spread)
         return d.promise
       }
     }

     function createRejected(promise, reason) {
       return function rejected(onFulfilled, onRejected){
         var d
         if (typeof onRejected !== 'function') return promise
         execute(onRejected, reason, d = new Deferred(), false)
         return d.promise
       }
     }

     function noop(){}

     function execute(callback, value, deferred, spread) {
       nextTick(function(){
         var result
         try {
           if ( spread && Array.isArray(value) )
             result = callback.apply(void(0), value)
           else
             result = callback(value)

           if (result && typeof result.then == 'function')
             result.then( function(v) { deferred.resolve(v) }
                        , function(r) { deferred.reject(r)  } )
           else
             deferred.resolve(result)
         } catch (err) {
           deferred.reject(err)
         }
       })
     }

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

     return Y
   })
