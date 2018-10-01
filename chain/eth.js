//引入web3
var Web3=require('web3')
var web3=new Web3(Web3.givenProvider||'http://47.106.68.245:8999');
// var web3=new Web3(Web3.givenProvider||'http://10.1.1.99:8545');

const contractAbi=require('./index').contractAbi;
const contractAbi_=require('./index').contractAbi_;
const weiUnit=require('./index').ethUnit;
const allcode=require('./../service/resultCode');
const Canoe=require('./../plugins/canoe');

let Coins=require('./../models/coins');
let transitionRecord=require('../models/transitionRecord');
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

//解析input
const parseInput=function(data){
    var functionName = "transfer(address _to, uint256 _value)";
    var functionName_ = "transferFrom(address _to, uint256 _value)";

    var name = functionName.split('(')[0];
    var name_ = functionName_.split('(')[0];

    // var results = new Canoe.decodeConstructorArgs(name, contractAbi_,  data.substring(10));
    var results = new Canoe.decodeConstructorArgs(name_, contractAbi_,  data.substring(10));
    return results;
}
//币种和交易入库
let saveDate=function(transInfo){
    return new Promise((resolve, reject) => {
        let error;
        Coins.findOne({
            currency:transInfo.currency
        }).then(function (coins) {
            if(coins){
                return coins;
            }else {
                var coins_=new Coins({
                    name:transInfo.name,
                    currency:transInfo.currency,
                    tokens:transInfo.token,
                    baseCoin:transInfo.currency=="ETH"?true:false
                });
                return coins_.save();
            }
        }).then(function (coins) {
            if(coins){
                let transitionRecord_=new transitionRecord({
                    hash:transInfo.hash,
                    from:transInfo.from,
                    to:transInfo.to,
                    amount:transInfo.value,
                    gas:transInfo.gas,
                    gasPrice:transInfo.gasPrice,
                    transferTime:transInfo.transferTime,
                    coin_id:coins._id,
                    blockNumber:transInfo.blockNumber
                });
                return transitionRecord_.save();
            }else {
                logger.warn(`${transInfo.hash}币种保存失败！`);
                error="保存数据失败！";
                return error;
            }
        }).then(function (transInfo) {
            logger.info(`${transInfo.hash}交易记录保存成功！`);
            resolve(transInfo) ;
        })
    })


}
module.exports={
    //根据币种信息 存储数据
    saveCoins:async (params,callback)=>{
        Coins.findOne({
            currency:params.currency
        }).then(function (coins) {
            if(coins){
                return coins;
            }else {
                var coins=new Coins({
                    name:params.name,
                    currency:params.currency,
                    coin_id:1,
                    tokens:params.tokens,
                    baseCoin:params.currency=="ETH"?true:false
                });
                return coins.save();
            }
        }).then(function (coins) {
            console.log("结果");
            console.log(coins);
        })
    },
    //  获取所有交易hash 通过hash获取币种信息
    getAllCoins:async (params,callback)=>{
        const blockNum=await web3.eth.getBlockNumber();//获取总块数
        let transitions=[];
        let curTransitionInfo=null,num=6346759;
        let getInfos=[];
        let curInfo;
        let result;
        let allTransInfos=[];
        let sum=0;
        do{
            curTransitionInfo=await web3.eth.getBlock(num);
            num+=1;
            sum+=parseInt(curTransitionInfo.transactions.length);
            if(curTransitionInfo.transactions.length>0){
                // transitions=transitions.concat(curTransitionInfo.transactions);
                transitions=curTransitionInfo.transactions;
            }
            getInfos=[];
            for(var i=0;i<transitions.length;i++){
                curInfo=await web3.eth.getTransaction(transitions[i]);
                getInfos.push(curInfo)
            }
            allTransInfos=[];
            for(let i=0;i<getInfos.length;i++){
                if(getInfos[i].to){
                    const toData=await web3.eth.getCode(getInfos[i].to);
                    const times=await web3.eth.getBlock(getInfos[i].blockNumber);
                    const theTimes=times.timestamp*1000+8*60*60*1000;
                    getInfos[i].transferTime=theTimes;
                    if(toData.toUpperCase()=="0X"){
                        logger.info(`${getInfos[i].hash}基础币交易！`);
                        result=getInfos[i];
                        result.value=web3.utils.fromWei(result.value, 'ether');
                        result.gasPrice=web3.utils.fromWei(result.gasPrice, 'ether');
                        result.name="ETH";
                        result.currency="ETH";
                        allTransInfos.push(result);

                    }else{

                        let receiptInfo=await web3.eth.getTransactionReceipt(getInfos[i].hash);
                        if(receiptInfo.logs.length==1&&receiptInfo.logs[0].topics.length==3){
                            console.log(getInfos[i])
                            result=getInfos[i];
                            result.from=result.from.toLowerCase();
                            result.token=receiptInfo.to;
                            result.to=receiptInfo.logs[0].topics[2].replace("000000000000000000000000","");
                            console.log("合约地址",result.token)
                            let myContranct=await getMyContract(result.token);
                            result.name=await myContranct.methods.name().call();
                            result.currency=await myContranct.methods.symbol().call();
                            result.decimals=await myContranct.methods.decimals().call();
                            result.value=web3.utils.hexToNumberString(receiptInfo.logs[0].data);
                            result.value=web3.utils.fromWei(result.value,weiUnit[result.decimals]);
                            result.gasPrice=web3.utils.fromWei(result.gasPrice,weiUnit[result.decimals]);
                            allTransInfos.push(result);
                        }else {
                            logger.info(`${getInfos[i].hash}不是所需的ERC20交易！`);
                        }
                    }

                }else {
                    logger.info(`${getInfos[i].hash}创建规则`);
                }
            }
            for(let i=0;i<allTransInfos.length;i++){
                await saveDate(allTransInfos[i]);
            }
            logger.warn(`总和${num}`)
            logger.warn(`长度${transitions.length}`)
        }while (num<6346761)
    },
    //根据hash获取交易记录 只获取ERC-20的交易记录
    getTransitionByHash:async (params,callback)=>{
        let error;
        let result={};
        if(!(params.hash)){
            error=wrapEror(allcode["LOSS_HASH"]);
            return callback(error);
        }
        /*
        * 1、通过getTransaction获取交易基础数据
        * 2、判断to中的值
        *       如果是空，则是创建合约
        *       非空再次进行解析
        * 3、在to是非空的情况下，使用getCode判断交易是以太币转账还是只能合约的调用方法
        *       0X，则是以太币转账
        *       其他情况则是智能合约方法，需要进一步判断input的值进行判断是否是智能合约ERC-20转账
        * 4、通过http://etherscan.io/jss/canoe.js 解析input的值
        *       空，则不是ERC-20的智能合约地址 需要进一步解析交易receipt
        *       非空，获取对应的转账金额，转入转出地址
        * 5、使用getTransactionReceipt获取收据信息，再次解析获取数据重的logs
        *       空，则不是需要的
        *       否，解析topic
        * */

        const baseInfo=await web3.eth.getTransaction(params.hash);
        const times=await web3.eth.getBlock(baseInfo.blockNumber);
        const theTimes=times.timestamp*1000+8*60*60*1000;
        if(!(baseInfo.to)){
            result.data="创建合约";
            return callback(null,result);
        }
        const toData=await web3.eth.getCode(baseInfo.to);
        if(toData.toUpperCase()=="0X"){
            result=baseInfo;
            result.value=web3.utils.fromWei(result.value, 'ether');
            result.gasPrice=web3.utils.fromWei(result.gasPrice, 'ether');
        }else {
            //0x3a795ca860bb2c977abf6fde6b6067a4ae90984f5b34131a46d395ee53b566d8
            /*
            * 这样做会出问题 在不含有transfer的方法中 也会解析出input
            * */
            /*
            const inputData=parseInput(baseInfo.input);
            if(web3.utils.isAddress(inputData[0].data)){
                let tokens=baseInfo.to
                result=baseInfo;
                result.token=tokens.toLowerCase();
                result.from=baseInfo.from.toLowerCase();
                result.to=inputData[0].data.toLowerCase().indexOf("0x")==0?inputData[0].data.toLowerCase():`0x${inputData[0].data.toLowerCase()}`;
                let myContranct=await getMyContract(result.token);
                result.name=await myContranct.methods.name().call();
                result.currency=await myContranct.methods.symbol().call();
                result.value=web3.utils.fromWei(inputData[1].data,weiUnit[result.decimals]);
            }*/
            //直接解析receipt
            var receiptInfo=await web3.eth.getTransactionReceipt(params.hash);
            if(receiptInfo.logs.length==1){
                result=baseInfo;
                result.from=result.from.toLowerCase();
                result.token=receiptInfo.to;
                result.to=receiptInfo.logs[0].topics[2].replace("000000000000000000000000","")
                result.value=web3.utils.hexToNumberString(receiptInfo.logs[0].data);
                let myContranct=getMyContract(receiptInfo.to);
                result.currency=await myContranct.methods.symbol().call();
                result.name=await myContranct.methods.name().call();
                result.value=web3.utils.fromWei(result.value,weiUnit["18"]);
                result.gasPrice=web3.utils.fromWei(result.gasPrice,weiUnit["18"]);
            }else {
                error=wrapEror(allcode["NOT_REQUIRED_TRANSITION"]);
                return callback(error);
            }
        }
        callback(null,result)
    },
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
        let txParms = {
            from: '0x6779dba09a72f83bc0bdbee1bce53919a50894c3',
            to: '0xE772A79E91AcF9C48ca426d6338FB622631EbB47',
            data: '0x00',
            value: 1,
            chainId: 1
        }
        let basegas = await web3.eth.estimateGas(txParms)+4000;
        let dabt_token = '0x1c6890825880566dd6ad88147e0a6ace7930b7c0';
        let contract = getMyContract(dabt_token);
        let cdata = contract.methods.transfer('0xE772A79E91AcF9C48ca426d6338FB622631EbB47', 1).encodeABI();
        let txParms2 = {
            from: '0x6779dba09a72f83bc0bdbee1bce53919a50894c3',
            to: contract.options.address,
            data: cdata,
            chainId: 1
        };
        let tokengas = await web3.eth.estimateGas(txParms2)+4000;
        //gas价格是有最后几个区块的gas价格决定 所以每次请求可能不一样
        let price = await web3.eth.getGasPrice();
        callback(null,{basegas:basegas+"",tokengas:tokengas+"",price:web3.utils.fromWei(price)});
    }
}
