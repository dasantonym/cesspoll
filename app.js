var kue = require('kue'),
    express = require('express'),
    basicAuth = require('basic-auth-connect'),
    async = require('async'),
    mongoose = require('mongoose'),
    jobs = kue.createQueue(),
    app = express();

mongoose.connect('mongodb://localhost:27017/cesspoll');
mongoose.model('PostModel', require('./lib/models/post').PostModel);
mongoose.model('CommentModel', require('./lib/models/comment').CommentModel);

app.use(basicAuth('admin', 'dumbasfuck'));
kue.app.set('title', 'Cesspoll Turd Wrangler');
app.use(kue.app);
app.listen(4444);

jobs.on('job complete', function (id) {
    kue.Job.get(id, function (err, job) {
        if (err) {
            return console.log('error getting job on complete', err);
        }
        job.remove(function (err) {
            if (err) {
                console.log('error removing job', err);
                return;
            }
            console.log('removed completed job with type: ' + job.type);
        });
    });
});

jobs.process('fetchPosts', function (job, done) {
    var spiegelCrawler = require('./lib/crawlers/spiegel');
    spiegelCrawler.getPostList(function (err, posts) {
        async.eachSeries(posts, function (post, next) {
            async.waterfall([
                function (cb) {
                    mongoose.model('PostModel').findOne({ url: post.url }, cb);
                },
                function (storedPost, cb) {
                    if (!storedPost) {
                        console.log('create post');
                        mongoose.model('PostModel').create(post, cb);
                    } else {
                        cb(null, storedPost);
                    }
                }
            ], function (err) {
                next(err);
            });
        }, function (err) {
            jobs.create('fetchComments', { title: 'Fetch new comments', source: 'spiegel' }).save();
            done(err);
        });
    });
});

jobs.process('fetchComments', function (job, done) {
    mongoose.model('PostModel').find({}, function (err, posts) {
        var spiegelCrawler = require('./lib/crawlers/spiegel');
        async.each(posts, function (post, next) {
            spiegelCrawler.getCommentList(post.threadUrl, function (err, comments) {
                async.each(comments, function (comment, next) {
                    async.waterfall([
                        function (cb) {
                            mongoose.model('CommentModel').findOne({ foreign_key: comment.foreign_key }, cb);
                        },
                        function (storedComment, cb) {
                            if (storedComment) {
                                cb(null);
                            } else {
                                console.log('create comment');
                                comment.post_id = post.id;
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
                console.log('crawling error', err);
            }
            done(err);
        });
    });
});

setInterval(function () {
    jobs.create('fetchPosts', { title: 'Fetch new posts' }).save();
}, 30*60*1000);

// start that shit up!!!

jobs.create('fetchPosts', { title: 'Fetch new posts' }).save();
