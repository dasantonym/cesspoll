module.exports.job = function (job, done) {
    var jobStart = Date.now(),
        commentCount = 0,
        mongoose = require('mongoose'),
        async = require('async'),
        crawler = require('../crawler');

    console.log('fetching comments from source', job.data.source);

    mongoose.model('PostModel').find({ source: job.data.source }, function (err, posts) {
        async.each(posts, function (post, next) {
            crawler.getCommentList(job.data.source, post.threadUrl, function (err, comments) {
                if (err) {
                    return next(err);
                }
                async.each(comments, function (comment, next) {
                    async.waterfall([
                        function (cb) {
                            mongoose.model('CommentModel').findOne({ foreign_key: comment.foreign_key }, cb);
                        },
                        function (storedComment, cb) {
                            if (storedComment) {
                                cb(null);
                            } else {
                                comment.post_id = post.id;
                                commentCount += 1;
                                mongoose.model('CommentModel').create(comment, cb);
                            }
                        }
                    ], function (err) {
                        next(err);
                    });
                }, function (err) {
                    next(err);
                });
            });
        }, function (err) {
            if (err) {
                console.log('crawling error', err, job.data.source, (Date.now() - jobStart) / 1000);
            }
            console.log('added ' + commentCount + ' comments in ' + ((Date.now() - jobStart) / 1000).toFixed(3) + 's for source ' + job.data.source);
            done(err);
        });
    });
};