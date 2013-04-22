
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

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeY = definition;
        }

    // <script>
    } else {
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
  var self = this
    , q = []
    , isFulfilled = false
    , isRejected = false

  var isResolved = this.isResolved = function(){
    return isFulfilled || isRejected
  }

  var promise = this.promise = {
    then : function(onFulfilled, onRejected){
      var o = { deferred  : new Deferred()
              , fulfilled : null
              , rejected  : null }

      if (typeof onFulfilled == 'function') o.fulfilled = onFulfilled
      if (typeof onRejected  == 'function') o.rejected = onRejected

      q.push(o)

      return o.deferred.promise
    }
  }

  this.resolve = function(value){
    if ( isResolved() ) return
    isFulfilled = true

    q.forEach(function(e){
      if (typeof e.fulfilled != 'function') {
        //nextTick(function(){ e.deferred.resolve(value) })
        e.deferred.resolve(value)
      }
      else {
        execute(e.fulfilled, value, e.deferred)
      }
    })

    promise.then = function(onFulfilled, onRejected) {
      var deferred = new Deferred()

      if (typeof onFulfilled != 'function')
        deferred.resolve(value)
      else
        execute(onFulfilled, value, deferred)

      return deferred.promise
    }
  }

  this.reject = function(reason){
    if ( isResolved() ) return
    isRejected = true

    q.forEach(function(e){
      if (typeof e.rejected != 'function') {
        //nextTick(function(){ e.deferred.reject(reason) })
        e.deferred.reject(reason)
      }
      else {
        execute(e.rejected, reason, e.deferred)
      }
    })

    promise.then = function(onFulfilled, onRejected) {
      var deferred = new Deferred()

      if (typeof onRejected != 'function')
        deferred.reject(reason)
      else
        execute(onRejected, reason, deferred)

      return deferred.promise
    }
  }

}

function execute(callback, value, deferred) {
  nextTick(function(){
    var result
    try {
      result = callback(value)
      if (result && typeof result.then == 'function')
        result.then(deferred.resolve, deferred.reject)
      else
        deferred.resolve(result)
    } catch (err) {
      deferred.reject(err)
    }
  })
}

return Y
});
