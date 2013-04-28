/* global describe it */

var Y = require('../')
  , assert = require('assert')
  , format = require('util').format

describe("promise.timeout()", function(){
  it("should be a function", function(){
    assert.ok(typeof Y.defer().promise.timeout === 'function')
  })

  it("if timeout(100) it should pass a resolve('ok') in less than 100 ms ", function(done){
    var d = Y.defer()
      , p = d.promise
      , val = "ok"

    p.timeout(100)
    .then( function(v){ if (v === val) done()
                        else done(format("resolved with %j !== %j", v, val)) }
         , function(r){ done(r) } )

    setTimeout(function(){ d.resolve(val) }, 95)
  })

  it("if timeout(100) it should pass a reject('Timed out after 100 ms') in greater than 100 ms ", function(done){
    var d = Y.defer()
      , p = d.promise
      , val = "ok"

    p.timeout(100)
    .then( function(v){ done(format("resolved with value = %j", v)) }
         , function(r){ if (r === 'Timed out after 100 ms') done()
                        else done(format("rejected with reason = %j", r)) } )

    setTimeout(function(){ d.resolve(val) }, 105)
  })

  it("if timeout(100) it should pass a reject('bad') in less than 100 ms ", function(done){
    var d = Y.defer()
      , p = d.promise
      , reason = "bad"

    p.timeout(100)
    .then( function(v){ done(format("resolved with v = %j", v)) }
         , function(r){ if (r === reason) done()
                        else done(format("rejeted with r = %j", r)) } )

    setTimeout(function(){ d.reject(reason) }, 95)
  })

  it("if timeout(100) it should pass a reject('Timed out after 100 ms') in greater than 100 ms ", function(done){
    var d = Y.defer()
      , p = d.promise
      , val = "ok"

    p.timeout(100)
    .then( function(v){ done(format("resolved with value = %j", v)) }
         , function(r){ if (r === 'Timed out after 100 ms') done()
                        else done(format("rejected with reason = %j", r)) } )

    setTimeout(function(){ d.resolve(val) }, 105)
  })


})