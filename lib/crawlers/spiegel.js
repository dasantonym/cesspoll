var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    jsdom = require('jsdom'),
    jquery = fs.readFileSync(path.join(__dirname, '../../bower_components/jquery/jquery.min.js'), 'utf-8');

module.exports.getPostList = function (callback) {
    async.waterfall([
        function (cb) {
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
                cb(err, posts);
            });
        },
        function (posts, cb) {
            async.eachLimit(posts, 10, function (post, next) {
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
    async.waterfall([
        function (cb) {
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
            async.each(pageUrls, function (url, next) {
                async.waterfall([
                    function (cb) {
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
