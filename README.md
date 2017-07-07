DNSPod的DNS修改API封装

## 使用前准备

+ 安装Nodejs 8.0+
+ 去Web控制台添加域名到DNSPod
+ 申请必需的TOKEN和ID


## 使用方法

``` javascript

    var dnspod = new DNSPod({
        ID: "xxx",
        TOKEN: "xxx"
    });
    
    # 自动更新公网IP到指定域名
    # 如果公网IP和域名记录一致，则不会发送更新请求，防止触发DNSPod警告
    dnspod.updateDDNS("pi.xxxx.xyz").then(() => {
    
        
    }).catch(e => {
        
    })
    

```

自动后台轮询示例

``` javascript
    
(async() => {
    var dnspod = new DNSPod({
        ID,
        TOKEN
    });
    
    while(true){
        var status = false;
        while (!status){
            try{
                await dnspod.updateDDNS("x.xxx.xyz");
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

```