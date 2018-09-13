//引入web3
var Web3=require('web3')
var web3=new Web3(Web3.givenProvider||'http://47.106.68.245:8999');
const contractAbi=require('./index').contractAbi;
const weiUnit=require('./index').ethUnit;
const allcode=require('./../service/resultCode')
//根据合约地址获取contract对象,通过该对象可以获取对应合约信息
const getMyContract=function(contract){
    let conobj=new web3.eth.Contract(contractAbi,contract);
    return conobj;
};
//错误消息返回
const wrapEror=function (err) {
    return {code:err.code,message:err.message};
}
//根据合于实力获取代币信息
const getTokenInfo=function(contract,address){
    return new Promise((resolve,reject)=>{
        let tokenInfo=[contract.methods.name().call(),contract.methods.balanceOf(address).call(),contract.methods.symbol().call(),contract.methods.decimals().call()];
        return Promise.all(tokenInfo).then(res=>{
            let resulte={
                "value":web3.utils.fromWei(res[1],weiUnit[res[3]]),
                "currency":res[2],
                "name":res[0]
            };
            resolve(resulte);
        })
    })
};
module.exports={
    //查询版本号
    getVersion:function (params,callback) {
        var version="版本信息"+web3.version;
        callback(null,version)
    },
    //查询余额
    getBalance:async  (params,callback)=> {
        var error;//错误提示消息
        var address=params.address;
        //判断共要地址是否有效
        if(!web3.utils.isAddress(address)){
            logger.error(`getBalance公钥地址：${address},合约地址：${params.tokens}`)
            error=wrapEror(allcode["INVALID_ADDRESS"]);
            return callback(error);
        }
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
        if(params.tokens){//含有代币信息
            var contracts=params.tokens;
            var myContracts=contracts.map(function (contract) {
                return getMyContract(contract);
            });
            var tokensInfo=myContracts.map(myContract=> {
                return getTokenInfo(myContract,address);
            })
            Promise.all(tokensInfo).then(tokensInfos=>{
                tokensInfos.forEach(function (res) {
                    allCoin.push(res);
                })
                callback(null,allCoin);
            })
        }else {//无代币信息
            callback(null,allCoin);
        }
    },
    //获取当前gas价格
    gasPrice:async(params,callback) =>{
        let gasPrice=await web3.eth.getGasPrice();
        callback(null,{gasPrice:gasPrice})
    }
}