var mongoose=require('mongoose');
//hash（hash）、转账from（from）、转账to(to)、金额（amount）、gas量(gas)、gasPrice(gasPrice)、转账时间（transferTime）、币种Id(coin_id)、所在块（blockNumber）
module.exports=new mongoose.Schema({
    hash:String,
    from:String,
    to:String,
    amount:String,
    gas:String,
    gasPrice:String,
    transferTime:String,
    coin_id:String,
    blockNumber:String
})
