module.exports.getPostList = function (crawlerName, callback) {
    var path = require('path'),
        crawler = require(path.join(__dirname, 'crawlers', crawlerName));
    crawler.getPostList(callback);
};

module.exports.getCommentList = function (crawlerName, threadUrl, callback) {
    var path = require('path'),
        crawler = require(path.join(__dirname, 'crawlers', crawlerName));
    crawler.getCommentList(threadUrl, callback);
};
