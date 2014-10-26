/*
/v2/movie/search?q={text}
Required Scope
movie_basic_rExample:
GET /v2/movie/search?q=张艺谋 GET /v2/movie/search?tag=喜剧
http://movie.douban.com/subject/7065154/
 */

var urllib = require('urllib');
var fs = require('fs');

function Searcher(query) {
    this.query = query;    // query is an object
    this.movieId = null;
}

Searcher.prototype.search = function() {
    var that = this;
    urllib.request("http://api.douban.com/v2/movie/search", {
        data: {'q': this.query, 'count': 1},
        dataType: 'json'
    }, function(err, data, res) {
        if (err) {
            console.log("error: ", err);
            return false;
        } else if (res.statusCode === 200) {
            that.id = data.subjects[0].id;
            console.log('id:', that.movieId);
            return true;
        } else {
            console.log("status code: ", res.statusCode);
            return false;
        }
    });
};

function Fetcher(movidId) {
    this.movieId = movidId;
}

Fetcher.prototype.fetch = function() {
    urllib.request("http://movie.douban.com/subject/"+this.movieId+'/', function(err, data, res){
        if (res.statusCode === 200)
            fs.writeFileSync('movie.html', data);
        else {
            console.log(res);
        }
    });
};


exports.Searcher = Searcher;
exports.Fetcher = Fetcher;

