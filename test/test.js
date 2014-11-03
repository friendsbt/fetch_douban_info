var fs = require('fs');
var path = require('path');
var bufferEqual = require('buffer-equal');
var douban = require('../douban');

var correct_bytes = fs.readFileSync(path.join(__dirname, "poster_nanjing.jpg"));

var s = new douban.Searcher("南京南京");
s.search(function(info){
    if (!info) {
        console.log("fail");
    } else {
        var f1 = new douban.Fetcher(info.ilink);
        var f2 = new douban.Fetcher(info.mlink);
        var f3 = new douban.Fetcher(info.id);
        f1.fetchPoster(function(data){
            if (bufferEqual(data, correct_bytes))
                console.log("ilink test pass");
            else
                console.log("ilink test fail");
        });
        f2.fetchPoster(function(data){
            if (bufferEqual(data, correct_bytes))
                console.log("mlink test pass");
            else
                console.log("mlink test fail");
        });
        f3.fetchPoster(function(data){
            if (bufferEqual(data, correct_bytes))
                console.log("id test pass");
            else
                console.log("id test fail");
        });

        // test fetchAll
        f3.fetchAll(function(info){
            console.log(info);
        });
    }
});

var s_null = new douban.Searcher('nosuchfilm');
s_null.search(function(info){
    if (info === null) {
        console.log("null test succeed");
    } else {
        console.log("null test failed");
    }
});
