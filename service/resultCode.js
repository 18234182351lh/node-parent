/**
 * 接口请求错误 提示消息
 * 参考文档https://ai.qq.com/doc/returncode.shtml
 * @type {{INVALID_ADDRESS: {code}}}
 */
module.exports={
    //参数非法
    INVALID_ADDRESS:{code:4096,message:"地址无效！"},
    LOSS_HASH:{code:4096,message:"hash不可为空！"},
    //区块链查询报错
    NOT_REQUIRED_TRANSITION:{code:12289,message:"不是ERC20交易！"}
}