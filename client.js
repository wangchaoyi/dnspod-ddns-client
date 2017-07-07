const request = require("request"),
    _ = require("lodash"),
    net = require("net"),
    log4js = require("log4js");

const logger = log4js.getLogger('cheese');
    

/**
 * 获取主机当前的公网IP
 * 备注：目前是通过ip.cn的接口来获取的
 */ 
function getMyIP_bk(){
    return new Promise((resolve, reject) => {
        request.get("http://ip.cn", {
            headers: {
                'User-Agent': 'curl/7.51.0'
            }
        }, function(err, res){
            if(err){
                return reject(err);
            }
            
            try{
                resolve(/((\d{1,3}\.){3}\d{1,3})/.exec(res.body)[1]);
            }catch(e){
                reject("没有找到ip");
            }
        })
    });
}

/**
 * 获取主机当前的公网IP
 * 备注： 通过dnspod的接口
 */ 
function getMyIP(){
    return new Promise((resolve, reject) => {
        try{
            var self = this,
                message = '',
                client;
        
            client = net.connect({
                host: 'ns1.dnspod.net',
                port: 6666
            }, function () {
                // console.log('client connected');
            }).on('data', function (data) {
                message = data.toString();
                // console.log(message);
                client.end();
            }).on('end', function () {
                // console.log('client disconnected');
                process.nextTick(function () {
                    resolve(message);
                });
            }).on('error', function (err) {
                reject(err);
            });
        }catch(e){
            reject(e);
        }
    })

}



class DNSPod{
    
    constructor(_config = {}){
        this.config = {
            TOKEN: null,
            ID: null
        }
        
        this.config = Object.assign(this.config, _config);
        
    }
    
    /**
     * 修改域名记录，没有则新增
     * @param domain {String} 修改的域名 eg: www.baidu.com
     * @param record {String} 修改的IP eg: 127.0.0.1
     */ 
    modifyRecord(domain, record, type = "A"){
        return new Promise(async(resolve, reject) => {
            if(!domain){
                throw new Error("必须设置要修改的域名");
            }else if(domain.indexOf("http") !== -1){
                throw new Error("域名不允许携带其它不必要的参数。 正确示例：www.baidu.com | cdn.image.baidu.com");
            }
            
            var tempList = domain.split(".");
            if(tempList.length <= 1){
                throw new Error(`未知域名错误, 传入的域名为: ${domain}`);
            }
            
            let mainDomain = tempList[tempList.length-2] + "." + tempList[tempList.length - 1],
                subDomain = tempList.concat().slice(0, tempList.length - 2).join(".");
            
            var res = await this.fetch("https://dnsapi.cn/Record.List", {domain: mainDomain});
            let i = _.findIndex(res.records, {name: subDomain});
            if(i === -1){
                console.log("没有找到记录, 准备新建...");
            }else{
                console.log("已经找到记录, 准备修改...");
                let recordId = res.records[i]["id"];
                try{
                    res = await this.fetch("https://dnsapi.cn/Record.Modify", {
                        record_id: recordId,
                        sub_domain: subDomain,
                        domain: mainDomain,
                        record_type: "A",
                        record_line: "默认",
                        mx: 1,
                        value: record
                    });
                    
                    if(res.status.code === "1"){
                        resolve(res);
                    }
                    
                }catch(e){
                    reject(res);
                    return false;
                }
            }
        });
        
    }
    
    /**
     * 更新当前的动态IP
     */ 
    updateDDNS(domain){
        return new Promise(async(resolve, reject) => {
            if(!domain){
                throw new Error("必须设置要修改的域名");
            }else if(domain.indexOf("http") !== -1){
                throw new Error("域名不允许携带其它不必要的参数。 正确示例：www.baidu.com | cdn.image.baidu.com");
            }
            
            var tempList = domain.split(".");
            if(tempList.length <= 1){
                throw new Error(`未知域名错误, 传入的域名为: ${domain}`);
            }
            
            let mainDomain = tempList[tempList.length-2] + "." + tempList[tempList.length - 1],
                subDomain = tempList.concat().slice(0, tempList.length - 2).join(".");
            
            var res = await this.fetch("https://dnsapi.cn/Record.List", {domain: mainDomain});
            let i = _.findIndex(res.records, {name: subDomain});
            if(i === -1){
                console.log("没有找到记录, 准备新建...");
            }else{
                logger.info("已经找到记录, 准备修改...");
                let recordId = res.records[i]["id"],
                    recordValue = res.records[i]["value"];
                
                var myIP = await getMyIP();
                if(myIP === recordValue){
                    logger.info("公网IP未发生变化，不需要修改");
                    resolve();
                }else{
                    logger.info("公网IP已经发生变化，准备修改中");
                    try{
                        res = await this.fetch("https://dnsapi.cn/Record.Modify", {
                            record_id: recordId,
                            sub_domain: subDomain,
                            domain: mainDomain,
                            record_type: "A",
                            record_line: "默认",
                            mx: 1,
                            value: myIP
                        });
                        
                        if(res.status.code === "1"){
                            resolve(res);
                        }
                        
                    }catch(e){
                        reject(res);
                        return false;
                    }
                }
                
                
            }
        });
    }
    
    static sleep(time){
        return new Promise((resolve, reject) => {
            if(time){
                setTimeout(() => {
                    resolve()
                }, time);
            }else{
                reject("必须设置time参数");
            }
        });
    }
    
    /**
     * @private
     * DNSPod接口封装
     */ 
    fetch(url, formData = {}){
        return new Promise((resolve, reject) => {
            request.post(url, {
                form: Object.assign({
                    login_token: `${this.config.ID},${this.config.TOKEN}`, 
                    format: "json"
                }, formData)
            }, function(err, res){
                if(err){
                    return reject(err);
                }
                
                if(typeof res.body === "string"){
                    res.body = JSON.parse(res.body);
                }
                
                if(res.body["status"] && res.body["status"]["code"] === "1"){
                    resolve(res.body);
                }else{
                    reject(res.body);
                }
            });
        });
    }
}

module.exports = DNSPod;

/*
modifyRecord("pi.kingreg.xyz", "114.114.62.32").then((res) => {
    console.log("修改成功");
    
}).catch(e => {
    console.log(e);
});
*/