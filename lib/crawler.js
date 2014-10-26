var crawler = null,
    noCrawlerErr = new Error('Crawler is not initialized. Use "load(crawlerName)" to load one.');

module.exports.load = function (crawlerName) {
    var path = require('path');
    crawler = require(path.join(__dirname, 'crawlers', crawlerName));
};

module.exports.getPostList = function (callback) {
    if (crawler !== null) {
        crawler.getPostList(callback);
    } else {
        callback(noCrawlerErr, null);
    }
};

module.exports.getCommentList = function (threadUrl, callback) {
    if (crawler !== null) {
        crawler.getCommentList(threadUrl, callback);
    } else {
        callback(noCrawlerErr, null);
    }
};
