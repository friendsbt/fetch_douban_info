var fetchMoviePoster = require('../douban').fetchMoviePoster;
var fs = require('fs');

fetchMoviePoster("南京", function(data){
    if (data)
        fs.writeFileSync('poster.jpg', data);
    else {
        console.log("fetch failed");
    }
});
