var http = require("http"),
    fs = require("fs"),
    request = require('request'),
    cheerio = require("cheerio");

function DouBanSpider(url) {
    this.getUrl=url;
    this.crawl()
};
DouBanSpider.prototype.crawlHtml=function(url,callback){
    var _this=this;
    if(!url ||url.indexOf("http://site.douban.com")<0){return callback(null);}
    var path=url.replace("http://site.douban.com","");
    var options={
        hostname:'site.douban.com',
        path:path,
        headers:{
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0'
        }
    }
    http.get(options, function(res){
        var data = "";
        if(res.statusCode == 200){
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on("end", function() {
                callback(data);
            });
        }else if(res.statusCode == 302){
            _this.crawlHtml(res.headers.location,callback);
        }else{
            callback(null);
        }
    }).on("error", function() {
            callback(null);
    });
}
DouBanSpider.prototype.getRoomUrl=function(callback){
    var room_url=[];
    this.crawlHtml(this.getUrl,function(data){
        if(data == null){return callback(room_url)};
        var $ = cheerio.load(data);
        var navItems=$("#header").find(".nav-items").find("li");
        if(navItems.length>0){
            for(var i= 0;i<navItems.length;i++){
                var tab_url=navItems.eq(i).find("a").attr("href");
                if(tab_url && tab_url.indexOf("site.douban.com")>0){
                    room_url.push(tab_url)
                }
            }
        }
        return callback(room_url);
    })
}
DouBanSpider.prototype.crawlAudio=function(url_arr){
    if(url_arr){
        url_arr=url_arr.replace("song_records =","");
        url_arr=JSON.parse(url_arr);
        for(var i=0;i<url_arr.length;i++){
            var audioID=url_arr[i].id,
                audioUrl=url_arr[i].rawUrl,
                title=url_arr[i].name;
            this.downMP3(audioUrl,audioID,title);
        }
    }
}
DouBanSpider.prototype.downMP3=function(audioUrl,audioID,title){
    var req=request({uri:audioUrl},function(err, response, body){})
    var ws = fs.createWriteStream("douban_"+audioID+".mp3")
    req.on('data',function(chunk){
        if( ws.write(chunk,function(){}) == false ){
            req.pause()
        }
    });
    req.on('end',function(){
        ws.end(function(){
            console.log(audioID+".mp3下载完成");
        })
    });
    ws.on('drain',function(){
        req.resume();
    });
}

DouBanSpider.prototype.crawl =function(){
    var _this=this;
    _this.getRoomUrl(function(room_url){
        if(!room_url || room_url.length<1){return null};
        for(var i=0;i<1;i++){
            _this.crawlHtml(room_url[i],function(data){
                if(data == null){return null};
                var $ = cheerio.load(data);
                var re=/(song_records\s*=\s*(\[[^\]]*\]))/ig;
                var r = "";
                while(r = re.exec($.html())) {
                    if(r[0] && r[0]!=""){
                        _this.crawlAudio(r[0])
                    }
                }
            })
        }
    })
}


var douBanSpider = new DouBanSpider("http://site.douban.com/chitalfm/");
//douBanSpider;

//crawlHtml("callback(null);",function(data){console.log(data)})