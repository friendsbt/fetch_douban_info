var fetchMoviePoster = require('douban').fetchMoviePoster;
var fs = require('fs');

fetchMoviePoster("南京", function(data){
    /*
    data is a buffer of movie's poster image
    if fetch fails, data is null
     */

    if (data)
        fs.writeFileSync('poster.jpg', data);
    else {
        console.log("fetch failed");
    }
});
