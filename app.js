var express=require('express');
var app = express();
//添加rpc使用
var jayson=require('jayson')
var bodyParser = require('body-parser');
//日志管理 设置全局变量 全局引用
global.logger=require('./plugins/logHelper').logger;
const eth=require('./chain/eth')
app.use(bodyParser.json()); // for parsing application/json
// 创建 application/x-www-form-urlencoded 编码解析
// app.use(bodyParser.urlencoded({extended:true})); // for parsing application/x-www-form-urlencoded
// app.use(express.static('download'));
var server=jayson.server(eth);
app.use('/port',server.middleware());
const tServer=app.listen(8081,function () {
    logger.info("应用实例，访问地址为localhost:"+tServer.address().port);
    /*logger.trace('Entering cheese testing');
    logger.info('Cheese is Comté.');
    logger.warn('Cheese is quite smelly.');
    logger.error('Cheese is too ripe!');
    logger.fatal('Cheese was breeding ground for listeria.');*/
})
