var Searcher = require('../douban').Searcher;
var Fetcher = require('../douban').Fetcher;


var s = new Searcher('解决解决的');

var f = new Fetcher("7065154");
f.fetch();
