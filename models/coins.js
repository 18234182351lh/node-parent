var mongoose=require('mongoose');
var coinSchema=require('../scheme/coins');
module.exports=mongoose.model('Coins',coinSchema);