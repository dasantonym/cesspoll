module.exports.job = function (job, done) {
    var jobStart = Date.now(),
        postCount = 0,
        mongoose = require('mongoose'),
        async = require('async'),
        crawler = require('../crawler');

    console.log('fetching posts from source', job.data.source);

    crawler.getPostList(job.data.source, function (err, posts) {
        if (err) {
            return done(err);
        }
        async.eachSeries(posts, function (post, next) {
            async.waterfall([
                function (cb) {
                    mongoose.model('PostModel').findOne({ url: post.url }, cb);
                },
                function (storedPost, cb) {
                    if (storedPost) {
                        cb(null, storedPost);
                    } else {
                        postCount += 1;
                        mongoose.model('PostModel').create(post, cb);
                    }
                }
            ], function (err) {
                next(err);
            });
        }, function (err) {
            if (err) {
                console.log('crawling error', err, job.data.source, (Date.now() - jobStart) / 1000);
                if (err.code === 'ECONNRESET') {
                    err = null;
                }
            }
            console.log('added ' + postCount + ' posts in ' + ((Date.now() - jobStart) / 1000).toFixed(3) + 's for source ' + job.data.source);
            done(err);
        });
    });
};