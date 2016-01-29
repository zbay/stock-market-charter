var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create User Schema
var Stock = new Schema({
  symbol: {type: String, unique:true},
  priceData: Object
});


module.exports = mongoose.model('stocks', Stock);