var Y = require('..')
module.exports = {
  fulfilled: Y.resolved
, rejected : Y.rejected
, pending: function() {
    var d = Y.defer()
    return {
      promise: d.promise
    , fulfill: function(v){ d.resolve(v) } //d.resolve
    , reject : function(r){ d.reject(r)  } //d.reject
    }
  }
}