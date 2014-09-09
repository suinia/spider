var http = require("http"),
    fs = require("fs"),
    request = require('request'),
    xml2js = require('xml2js'),
    cheerio = require("cheerio");

function PodCastSpider(url) {
    this.getUrl=url;
    this.crawl()
};
PodCastSpider.prototype.crawlHtml=function(url,callback){
    http.get(url, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function() {
            callback(null);
    });
}
PodCastSpider.prototype.crawl=function(){
    var _this=this;
    this.crawlHtml(this.getUrl,function(data){
        var parser = new xml2js.Parser();
        parser.parseString(data,function (err, result) {
            var items=result['rss'].channel[0].item;
            if(!items || items.length<1){return null};
            for(var i=0;i<items.length;i++){
                var mp3url=items[i].guid[0];
                var audioID=mp3url.substring(mp3url.lastIndexOf("/")+1,mp3url.lastIndexOf(".mp3"));
                var title=items[i].title[0];
                _this.downMP3(mp3url,audioID,title)
            }
        });

    })
}
PodCastSpider.prototype.downMP3=function(audioUrl,audioID,title){
    var req=request({uri:audioUrl},function(err, response, body){})
    var ws = fs.createWriteStream("podcast_"+audioID+".mp3")
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
var podCastSpider = new PodCastSpider("http://www.ximalaya.com/album/16753.xml");