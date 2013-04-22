
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
       var d = createDeferred()
       d.resolve(value)
       return d.promise
     }

     Y.defer = function(){
       return createDeferred()
     }

     Y.resolved = function(value){
       var d = createDeferred()
       d.resolve(value)
       return d.promise
     }

     Y.rejected = function(reason){
       var d = createDeferred()
       d.reject(reason)
       return d.promise
     }

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

     function createDeferred() {
       var q = []
         , promise = { then: function(onFulfilled, onRejected) {
                         return unified(onFulfilled, onRejected)
                       }
                     }
         , deferred = { promise: promise
                      , resolve: function(value) { unified(unified, true, value) }
                      , reject : function(reason) { unified(unified, false, reason) }
                      }
         , unified = function(onFulfilled, onRejected, value) {
             //called as .then
             if (onFulfilled !== unified) {
               var d = createDeferred()
               q.push({deferred: d, resolve: onFulfilled, reject: onRejected})
               return d.promise
             }

             var unified_ = onFulfilled
               , success = onRejected
             //called as .resolve or .reject
             //  signature (unified, boolean, value_or_reasone)
             var action = success ? 'resolve' : 'reject'
             for (var i=0; i<q.length; i++) {
               var defer = q[i].deferred
                 , callback = q[i][action]
               if (typeof callback !== 'function')
                 defer[action](value)
               else
                 execute(callback, value, defer)
             }

             unified = createResolved(promise, value, onRejected)

             deferred.resolve = deferred.reject = noop

             return undefined
           } //end: unified

       return deferred
     } //end: createDeferred

     function createResolved(promise, value, success){
       return function(onFulfilled, onRejected) {
         var callback = success ? onFulfilled : onRejected
           , d
         if (typeof callback !== 'function') return promise
         execute(callback, value, d = createDeferred())
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
