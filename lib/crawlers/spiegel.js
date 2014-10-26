module.exports.getPostList = function (callback) {
    var async = require('async'),
        config = require('../../config.js'),
        jquery = require('../util/jsdom-jquery')();
    async.waterfall([
        function (cb) {
            var jsdom = require('jsdom');
            jsdom.env({
                url: 'http://www.spiegel.de',
                encoding: 'binary',
                src: [jquery],
                done: cb
            });
        },
        function (window, cb) {
            var $ = window.$,
                posts = [];
            async.each($("h2.article-title"), function (article, next) {
                posts.push({
                    url: $(article).find('a')[0].href,
                    titles: [
                        $(article).first('.headline-intro').text().toString('utf-8').trim(),
                        $(article).first('.headline').text().toString('utf-8').trim()
                    ],
                    body: null,
                    threadUrl: null,
                    source: 'spiegel'
                });
                next();
            }, function (err) {
                window.close();
                cb(err, posts);
            });
        },
        function (posts, cb) {
            async.eachLimit(posts, config.jsdom_concurrency, function (post, next) {
                var jsdom = require('jsdom');
                jsdom.env({
                    url: post.url,
                    src: [jquery],
                    encoding: 'binary',
                    done: function (err, window) {
                        if (err) {
                            return next(err);
                        }
                        var $ = window.$;
                        var paragraphs = $('.article-section p').text().toString('utf-8').trim();
                        var postIndex = posts.indexOf(post);
                        posts[postIndex].body = paragraphs.replace(/<!--(?:.|\n)*?-->/gm, '');
                        if ($('.article-comments-box .module-title a').length > 0) {
                            posts[postIndex].threadUrl = $('.article-comments-box .module-title a')[0].href;
                        }
                        window.close();
                        next();
                    }
                });
            }, function (err) {
                cb(err, posts);
            });
        },
        function (posts, cb) {
            var filteredPosts = [];
            async.each(posts, function (post, next) {
                if (typeof post.threadUrl === 'string') {
                    filteredPosts.push(post);
                }
                next();
            }, function (err) {
                cb(err, filteredPosts);
            });
        }
    ], function (err, posts) {
        callback(err, posts);
    });
};

module.exports.getCommentList = function (threadUrl, callback) {
    var async = require('async'),
        config = require('../../config.js'),
        jquery = require('../util/jsdom-jquery')();
    async.waterfall([
        function (cb) {
            var jsdom = require('jsdom');
            jsdom.env({
                url: threadUrl,
                src: [jquery],
                encoding: 'binary',
                done: cb
            });
        },
        function (window, cb) {
            var $ = window.$,
                pages = 0;
            if ($('.threadPaginator .currentPage').length > 0) {
                pages = parseInt($('.threadPaginator .currentPage').text().toString('utf-8').trim().split('/')[1]);
            }
            window.close();
            cb(null, pages);
        },
        function (pages, cb) {
            var pageUrls = [];
            for (var i = 0; i < pages; i += 1) {
                pageUrls.push(threadUrl.replace('-1.html', '-' + (i+1).toString() + '.html'));
            }
            cb(null, pageUrls);
        },
        function (pageUrls, cb) {
            var comments = [];
            async.eachLimit(pageUrls, config.jsdom_concurrency, function (url, next) {
                async.waterfall([
                    function (cb) {
                        var jsdom = require('jsdom');
                        jsdom.env({
                            url: url,
                            src: [jquery],
                            encoding: 'binary',
                            done: cb
                        });
                    },
                    function (window, cb) {
                        var $ = window.$;
                        async.each($('#postList .postbit'), function (post, next) {
                            var comment = {
                                foreign_key: $(post).attr('id'),
                                author: $(post).find('a b').text().toString('utf-8').trim(),
                                author_ref: $(post).find('a')[1].href,
                                title: $(post).find('h2').text().toString('utf-8').trim(),
                                body: $(post).find('.postContent').text().toString('utf-8').trim()
                            };
                            comments.push(comment);
                            next();
                        }, function (err) {
                            window.close();
                            cb(err);
                        });
                    }
                ], function (err) {
                    next(err);
                });
            }, function (err) {
                cb(err, comments);
            });
        }
    ], function (err, comments) {
        callback(err, comments);
    });
};
