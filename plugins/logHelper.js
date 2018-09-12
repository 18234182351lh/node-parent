//日志管理
var log4js=require('log4js');

/***
 * configure(obj||string) obj：配置对象 string：加载配置文件名
 * Configuration 对象
 * levels(map)  key:级别名，value是一个obj
 *      value(obj) level value(整数)以及colour 颜色
 * appenders(obj):
 * */
log4js.configure({
    appenders: {
        cheese:{type:"dateFile",filename:"logic/eth","pattern": "_yyyyMMdd.log","alwaysIncludePattern": true,},
        // cheese: { type: 'file', filename: 'logic/cheese.log' } ,
        console:{ type:"console", category:"console"}
    },
    categories: { default: { appenders: ['cheese',"console"], level: 'trace' } },
    replaceConsole: true
});

const logger = log4js.getLogger('log');
exports. logger= logger