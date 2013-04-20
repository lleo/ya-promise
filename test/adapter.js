var Y = require('..')
module.exports = {
  fulfilled: Y.resolve
, rejected : Y.rejected
, pending: function() {
    var d = Y.defer()
    return {
      promise: d.promise
    , fulfill: d.resolve
    , reject : d.reject
    }
  }
}