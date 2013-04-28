/* global describe it */

var Y = require('../')
  , Vow = require('vow')
  , assert = require('assert')

describe("Y.when", function(){
  var vow_promise
    , p

  it("should ruturn the exact same passed a `ya-promise` Promise", function(){
    var d = Y.defer()
      , p0 = d.promise
      , p1 = Y.when(p0)

    assert.strictEqual(p0, p1)
  })

  it("should return a native promise when passed a foreign promise", function(){
    vow_promise = Vow.promise()
    p = Y.when(vow_promise)
    assert.ok( Y.isPromise( p ) )
  })

  it("native promise should be fulfilled when the foreign promise is fulfilled", function(done){
    p.then(function(v){
      if ( v !== "ok" ) done(new Error("fulfilled native promise is not equal to 'ok'"))
      else done()
    })
    vow_promise.fulfill("ok")
  })

  it("should return a fulfilled promise when passes a non-thenable", function(done){
    var resolved = Y.when("resolved")
    resolved.then(function(v){
      if (v !== "resolved") done(new Error("fulfilled promise value not equal to 'resolve'"))
      else done()
    })
  })
})
