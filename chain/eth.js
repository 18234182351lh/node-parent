//引入web3
var Web3=require('web3')
var web3=new Web3(Web3.givenProvider||'http://47.106.68.245:8999');
module.exports={
    //查询版本号
    getVersion:function (params,callback) {
        var version="版本信息"+web3.version;
        callback(null,version)
    },
    //查询余额
    getBalance:function (params,callback) {
        var address=params.address;
        //获取以太坊余额
        var baseValue=web3.eth.getBalance(address);
        var allCoin=[];
        allCoin.push({
            value:baseValue,
            currency:"ETH"
        })
        callback(null,allCoin);
    },
    //获取当前gas价格
    gasPrice:async(params,callback) =>{
        let gasPrice=await web3.eth.getGasPrice();
        callback(null,{gasPrice:gasPrice,})
    }
}