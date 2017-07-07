var DNSPod = require("./client"),
    log4js = require("log4js");


const ID = process.env.ID,
    TOKEN = process.env.TOKEN;


const logger = log4js.getLogger('cheese');
    
if(ID === undefined){
    throw new Error("必须在环境变量中传入ID");
}    
if(TOKEN === undefined){
    throw new Error("必须在环境变量中传入TOKEN")
}


(async() => {
    var dnspod = new DNSPod({
        ID,
        TOKEN
    });
    
    while(true){
        var status = false;
        while (!status){
            try{
                await dnspod.updateDDNS("pi.xxx.xyz");
                status = true;
            }catch(e){
                log4js.error(e);
                console.log("等待1分钟之后重试...");
                await DNSPod.sleep(1000*60);
            }
        }
        
        console.log("等待中1分钟之后再次检查...");
        await DNSPod.sleep(1000*60*1);
    }
    
})();

module.exports = DNSPod;