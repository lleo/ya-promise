/* global describe it */

var Y = require('../')
  , u = require('lodash')
  , assert = require('assert')

describe("promise.spread", function(){
  var d, p

  it("promise should have a `spread` property", function(){
    d = Y.defer()
    p = d.promise
    assert.ok( u.has(p, 'spread'))
  })

  it("this `spread` property should be a function", function(){
    assert.ok( typeof p.spread === 'function' )
  })

  it("promise.then functions are passes the exact same resolved value ", function(done){
    var d = Y.defer()
      , p = d.promise
      , value = ["hello", "world"]
    p.then(function(v){
      if (v === value) done()
      else done(new Error("v !== value"))
      p})
    d.resolve(value)
  })

  it("promise.spread works as advertised", function(done){
    var d = Y.defer()
      , p = d.promise
      , value = ["hello", "world"]
    p.spread(function(a, b){
      if (a == "hello" && b == "world") done()
      else done(new Error("did not work"))
    })
    d.resolve(value)
  })
})
