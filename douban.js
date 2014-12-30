/*
/v2/movie/search?q={text}
Required Scope
movie_basic_rExample:
GET /v2/movie/search?q=张艺谋 GET /v2/movie/search?tag=喜剧
http://movie.douban.com/subject/7065154/
 */

var urllib = require('urllib');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var cheerio = require('cheerio');


function retry_request(url, options, times, callback) {
    var count = 0;
    var OK = new EventEmitter();
    options.followRedirect = true;
    urllib.request(url, options, function cb(err, data, res){
        count++;
        if (count > times) {
            callback(null);  // if not succeed, pass back null
            return;
        }
        if (err)  {
            console.log(err);
            urllib.request(url, options, cb);
        } else if (res.statusCode === 200) {
            OK.emit('ok', {'data': data, 'res': res});
        } else {
            console.log(res.statusCode);
            urllib.request(url, options, cb);
        }
    });
    OK.on('ok', function(params){
        callback(params.data, params.res);
    });
}

function Searcher(query) {
    this.query = query;    // query is an object
}

Searcher.prototype.search = function(cb) {
    retry_request("http://api.douban.com/v2/movie/search", {
        data: {'q': this.query, 'count': 1},
        dataType: 'json'
    }, 3, function(data) {
        if (data && data.total) {
            var info = {};
            info.id = data.subjects[0].id;
            info.mlink = data.subjects[0].alt;
            info.ilink = data.subjects[0].images.medium;
            info.rating = data.subjects[0].rating.average;
            cb(info);  // pass back movieid
        } else {
            cb(null);   // no search result
        }
    });
};

function Fetcher(source) {
    this.source = source;
    var that = this;
    this.source_type = (function() {
        if (!isNaN(source)) {  // "123456"
            return "id";
        } else if (source.indexOf("http://img3.douban.com") === 0) {
            return "ilink";     // image link
        } else if (source.indexOf("http://movie.douban.com/subject/") === 0) {
            // last character if mlink must not be slash
            that.source = that.source.charAt(that.source.length-1) === '/' ?
                that.source.substr(0, that.source.length-1) : that.source;
            return "mlink";     // movie link
        } else {
            console.log("wrong type");
            return null;
        }
    })();
}

Fetcher.prototype.fetchAll = function (callback) {
    /*
    * fetch 所有信息, 包括 title, year, countries, summary, comments
    * 除了comments通过网页抓取, 其它通过movieAPI获取
     */
    if (this.source_type !== 'id' && this.source_type !== 'mlink') {
        console.log("source type should be id or mlink");
        callback(null);
    } else {
        var movie_api_url = "http://api.douban.com/v2/movie/subject/" +
            (this.source_type === 'mlink' ? this.source.split('/').pop() : this.source);
        var movie_url = this.source_type === 'mlink' ? this.source :
            'http://movie.douban.com/subject/' + this.source;
        console.log(movie_url);
        retry_request(movie_api_url, {dataType: 'json'}, 3, function(info){
            if(!info) {
                return callback(null);
            }
            retry_request(movie_url, {}, 3, function(page) {
                var $ = cheerio.load(page ? page.toString() : '');
                var commentsArray = [];
                $('div.comment-item > div.comment > p').each(function(i, element){
                    commentsArray[i] = element.children[0].data.trim();
                });
                callback({
                    'title': info.title,
                    'year': (function normalize(year) {
                        var begin = year.match(/[12][0-9][0-9][0-9]/);
                        if(begin && begin >= 0) {
                            return parseInt(year.substring(begin, begin+4));
                        }
                        return null;
                    }(info.year)),
                    'countries': info.countries,
                    'summary': info.summary,
                    'comments': commentsArray
                });
            });
        });
    }
};

Fetcher.prototype.fetchPoster = function(callback) {
    switch (this.source_type) {
        case "id":
            retry_request("http://movie.douban.com/subject/" + this.source + '/', {}, 3, function (data) {
                var $ = cheerio.load(data.toString());
                var img = $('img[src^="http://img3.douban.com/view/movie_poster_cover/spst/public/"]')[0];
                retry_request(img.attribs.src, {}, 3, function (data) {
                    callback(data);
                });
            });
            break;
        case "ilink":
            retry_request(this.source, {}, 3, function (data) {
                callback(data);
            });
            break;
        case "mlink":
            retry_request(this.source, {}, 3, function (data) {
                var $ = cheerio.load(data.toString());
                var img = $('img[src^="http://img3.douban.com/view/movie_poster_cover/spst/public/"]')[0];
                retry_request(img.attribs.src, {}, 3, function (data) {
                    callback(data);
                });
            });
            break;
        default :
            console.log("unknown type");
    }
};

function fetchMoviePoster(searchText, callback) {
    /*
    目前仅针对电影, 之后可以把动漫加上
    抓取失败, callback(null)
    抓取成功, callback(image_buffer)
     */
    var s = new Searcher(searchText);
    s.search(function(info){
        if (!info) {
            callback(null);
        } else {
            var f = new Fetcher(info.ilink);
            f.fetchPoster(callback);
        }
    });
}

var getInfo = (function(){
    var s = new Searcher();
    return function(stext, callback){
        s.query = stext;
        s.search(function(sr){
            if(sr) {
                var f = new Fetcher(sr.id);
                f.fetchAll(function(info){
                    if(info) {
                        info.rating = sr.rating;
                        info.id = sr.id;
                        info.mlink = sr.mlink;
                        info.ilink = sr.ilink;
                        callback(info);
                    } else {
                        callback(null);
                    }
                });
            } else {
                callback(null);
            }
        });
    };
}());

exports.Searcher = Searcher;
exports.Fetcher = Fetcher;
exports.fetchMoviePoster = fetchMoviePoster;
exports.getInfo = getInfo;

