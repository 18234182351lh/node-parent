var mongoose=require('mongoose');
var transitionSchema=require('../scheme/transitionRecord');
module.exports=mongoose.model('transitionRecord',transitionSchema);