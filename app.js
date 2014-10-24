var kue = require('kue'),
    express = require('express'),
    basicAuth = require('basic-auth-connect'),
    async = require('async'),
    mongoose = require('mongoose'),
    jobs = kue.createQueue(),
    crawlerMap = require('./lib/crawler-map'),
    config = require('./config'),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbname);
mongoose.model('PostModel', require('./lib/models/post').PostModel);
mongoose.model('CommentModel', require('./lib/models/comment').CommentModel);

if (config.kue.admin.active) {
    app.use(basicAuth(config.kue.admin.login, config.kue.admin.password));
    kue.app.set('title', 'Cesspoll Turd Wrangler');
    app.use(kue.app);
    app.listen(config.kue.admin.port);
}

jobs.on('job complete', function (id) {
    kue.Job.get(id, function (err, job) {
        if (err) {
            return console.log('error getting job on complete', err, job);
        }
        job.remove(function (err) {
            if (err) {
                console.log('error removing job', err, job);
                return;
            }
        });
    });
});

jobs.process('fetchPosts', function (job, done) {
    var jobStart = Date.now();
    console.log('fetching posts from source', job.data.source);
    var postCount = 0;
    crawlerMap[job.data.source].getPostList(function (err, posts) {
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
            }
            console.log('added ' + postCount + ' posts in ' + ((Date.now() - jobStart) / 1000).toFixed(3) + 's for source ' + job.data.source);
            jobs.create('fetchComments', { title: 'Fetch new comments', source: job.data.source }).save();
            done(err);
        });
    });
});

jobs.process('fetchComments', function (job, done) {
    var jobStart = Date.now();
    console.log('fetching comments from source', job.data.source);
    var commentCount = 0;
    mongoose.model('PostModel').find({}, function (err, posts) {
        async.each(posts, function (post, next) {
            crawlerMap[job.data.source].getCommentList(post.threadUrl, function (err, comments) {
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
});

var updateIndex = function () {
    for (var source in crawlerMap) {
        jobs.create('fetchPosts', { title: 'Fetch new posts', source: source }).save();
    }
};


// start digging for turds!!!

setInterval(function () {
    updateIndex();
}, config.update_interval*60*1000);

updateIndex();
