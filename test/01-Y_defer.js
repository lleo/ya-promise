/* global describe it */

var Y = require('../')
  , u = require('lodash')
  , assert = require('assert')

describe("Y.defer()", function(){
  var d
  it("is should return a 'ya-promise' Deferred object", function(){
    d = Y.defer()
    assert.ok( Y.isDeferred( d ) )
  })

  it("the Deferred object should have a `promise` property", function(){
    assert.ok( u.has(d, 'promise') )
  })

  it("the Deferred object's 'promise' property must be a 'ya-promise' Promise object", function(){
    assert.ok( Y.isPromise( d.promise ) )
  })

  it("the Deferred object should have a `resolve` property", function(){
    assert.ok( u.has(d, 'resolve') )
  })

  it("the Deferred objec's `resolve` object must be a function", function(){
    assert.ok( typeof d.resolve === 'function' )
  })

  it("the Deferred object should have a `reject` property", function(){
    assert.ok( u.has(d, 'reject') )
  })

  it("the Deferred object's `reject` object must be a function", function(){
    assert.ok( typeof d.reject === 'function' )
  })

  it("the Deferred object should have no other properties", function(){
    var diff = u.difference(Object.keys(d), ['promise', 'resolve', 'reject'])
    assert.strictEqual( diff.length, 0 )
  })
})