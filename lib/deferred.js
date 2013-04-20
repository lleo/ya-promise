
var inspect = require('util').inspect

exports = module.exports = Y

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

var nextTick = global.setImmediate

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
