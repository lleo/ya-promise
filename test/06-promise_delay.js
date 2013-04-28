/* global describe it */

var Y = require('../')
  , assert = require('assert')
  , format = require('util').format

describe("promise.delay()", function(){
  it("should be a function", function(){
    assert.ok(typeof Y.defer().promise.delay === 'function')
  })

  it("should return a promise that is whos resolution is delayed by 100 ms", function(done){
    var t0 = Date.now()
      , d = Y.defer()
      , p = d.promise
      , val = "ok"

    p.delay(100)
    .then( function(v){ var delta = Date.now() - t0
                        if (delta > 105)
                          done("resolved in greater than 105 ms")
                        else if (delta < 99)
                          done("resolved in less than 99 ms")
                        else done() }
         , function(r){ done(format("rejected in %d ms", Date.now()-t0)) })

    setTimeout(function(){ d.resolve(val) }, 50)
  })

  it("should return a promise that is whos rejection is delayed by 100 ms", function(done){
    var t0 = Date.now()
      , d = Y.defer()
      , p = d.promise
      , reason = "bad"

    p.delay(100)
    .then( function(v){ done(format("resolved in %d ms", Date.now()-t0)) }
         , function(r){ var delta = Date.now() - t0
                        if (delta > 105)
                          done("rejected in greater than 105 ms")
                        else if (delta < 99)
                          done("rejected in less than 99 ms")
                        else done() } )

    setTimeout(function(){ d.reject(reason) }, 50)
  })

})
