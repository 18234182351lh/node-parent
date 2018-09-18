var mongoose=require('mongoose');
//币种名称（name）、币种(currency)、币种ID（coin_id）、合约地址（tokens）、baseCoin(是否是主币)
module.exports=new mongoose.Schema({
    name:String,
    currency:String,
    coin_id:String,
    tokens:String,
    baseCoin:{
        type:Boolean,
        default:false
    }
})