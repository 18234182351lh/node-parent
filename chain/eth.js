//引入web3
var Web3=require('web3')
var web3=new Web3(Web3.givenProvider||'http://47.106.68.245:8999');
//根据合约地址获取contract对象,通过该对象可以获取对应合约信息
const getMyContract=function(contract){
    new Promise(function (resolve,reject) {
        let conobj=new web3.eth.Contract(contract);
        console.log(conobj)
        resolve();
    })
}
module.exports={
    //查询版本号
    getVersion:function (params,callback) {
        var version="版本信息"+web3.version;
        callback(null,version)
    },
    //查询余额
    getBalance:async  (params,callback)=> {
        var address=params.address;
        //获取以太坊余额
        var baseValue=await web3.eth.getBalance(address);
        //根据余额做单位处理
        baseValue=web3.utils.fromWei(baseValue, 'ether');
        var allCoin=[];
        //把获取的主币信息加载进去
        allCoin.push({
            value:baseValue,
            currency:"ETH"
        })
        //根据参数，判断是否查询代币信息，根据合约地址获取对应的代币信息
        if(params.tokens){
            var contracts=params.tokens;
            var myContracts=contracts.map(function (contract) {
                return getMyContract(contract);
            })
        }
        callback(null,allCoin);
    },
    //获取当前gas价格
    gasPrice:async(params,callback) =>{
        let gasPrice=await web3.eth.getGasPrice();
        callback(null,{gasPrice:gasPrice,})
    }
}