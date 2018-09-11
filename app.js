var express=require('express');
var app = express();
//添加rpc使用
var jayson=require('jayson')
var bodyParser = require('body-parser');
const eth=require('./chain/eth')
app.use(bodyParser.json()); // for parsing application/json
// 创建 application/x-www-form-urlencoded 编码解析
app.use(bodyParser.urlencoded({extended:true})); // for parsing application/x-www-form-urlencoded
app.use(express.static('download'));



var server=jayson.server(eth);
app.use('/port',server.middleware())
const tServer=app.listen(8081,function () {
    console.log("应用实例，访问地址为localhost:"+tServer.address().port)
})
