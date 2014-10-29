module.exports.getPostList = function (crawlerName, config, callback) {
    var path = require('path'),
        crawler = require(path.join(__dirname, 'crawlers', crawlerName));
    crawler.getPostList(config.jsdom_concurrency, callback);
};

module.exports.getCommentList = function (crawlerName, threadUrl, config, callback) {
    var path = require('path'),
        crawler = require(path.join(__dirname, 'crawlers', crawlerName));
    crawler.getCommentList(threadUrl, config.jsdom_concurrency, callback);
};
