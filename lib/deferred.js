
//exports = module.exports = Y

(function (definition) {
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
       if (value && typeof value.then == 'function') return value
       var d = new Deferred()
       d.resolve(value)
       return d.promise
     }

     Y.defer = function(){
       return new Deferred()
     }

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

     var nextTick
     Y.setNextTick = function(ntFn) {
       nextTick = ntFn
     }

     if (typeof setImmediate === 'function')
       if (typeof window !== 'undefined')
         Y.setNextTick( setImmediate.bind(window) )
     else
       Y.setNextTick( setImmediate )
     else if (typeof process !== 'undefined' && process.nextTick)
       Y.setNextTick( process.nextTick )
     else
       Y.setNextTick( function(fn){ setTimeout(fn, 0) } )

     function Deferred(){
       var q = []
         , promise = { then : function(onFulfilled, onRejected){
                         var d = new Deferred()

                         q.push({ deferred  : d
                                , fulfilled : onFulfilled
                                , rejected  : onRejected })

                         return d.promise
                       }
                     }
         , deferred = { promise: promise
                      , resolve: resolve
                      , reject : reject
                      }

       function resolve(value){
         for (var i=0; i<q.length; i++) {
           if (typeof q[i].fulfilled !== 'function')
             q[i].deferred.resolve(value)
           else
             execute(q[i].fulfilled, value, q[i].deferred)
         }

         deferred.reject = deferred.resolve = noop

         //promise.then = createFulfilled(promise, value)

         //this is MUCH slower than the above createFulfilled, but it is no different
         //WHY?!?!
         promise.then = function(onFulfilled, onRejected){
           var d
           if (typeof onFulfilled !== 'function') return promise
           execute(onFulfilled, value, d = new Deferred())
           return d.promise
         }
       }

       function reject(reason){
         for (var i=0; i<q.length; i++) {
           if (typeof q[i].rejected !== 'function')
             q[i].deferred.reject(reason)
           else
             execute(q[i].rejected, reason, q[i].deferred)
         }

         deferred.reject = deferred.resolve = noop

         promise.then = createRejected(promise, reason)
       }

       return deferred
     } //Deferred()

     function createFulfilled(promise, value) {
       return function(onFulfilled, onRejected){
         var d
         if (typeof onFulfilled !== 'function') return promise
         execute(onFulfilled, value, d = new Deferred())
         return d.promise
       }
     }

     function createRejected(promise, reason) {
       return function(onFulfilled, onRejected){
         var d
         if (typeof onRejected !== 'function') return promise
         execute(onRejected, reason, d = new Deferred())
         return d.promise
       }
     }

     function noop(){}

     function execute(callback, value, deferred) {
       nextTick(function(){
         var result
         try {
           result = callback(value)
           if (result && typeof result.then == 'function')
             result.then(deferred.resolve, deferred.reject)
           else
             deferred.resolve(result)
         }
         catch (err) {
           deferred.reject(err)
         }
       })
     }

     return Y
});
