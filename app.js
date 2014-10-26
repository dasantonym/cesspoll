var kue = require('kue'),
    express = require('express'),
    basicAuth = require('basic-auth-connect'),
    async = require('async'),
    mongoose = require('mongoose'),
    config = require('./config'),
    jobs = kue.createQueue(),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbname);
mongoose.model('PostModel', require('./lib/models/post').PostModel);
mongoose.model('CommentModel', require('./lib/models/comment').CommentModel);
mongoose.model('AnalysisModel', require('./lib/models/analysis').AnalysisModel);

if (config.kue.admin.active) {
    app.use(basicAuth(config.kue.admin.login, config.kue.admin.password));
    kue.app.set('title', 'Cesspoll Turd Wrangler');
    app.use(kue.app);
    app.listen(config.kue.admin.port);
}

jobs.on('job complete', function (id) {
    kue.Job.get(id, function (err, job) {
        if (job) job.remove();
    });
});

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

jobs.process('updateIndex', config.job_concurrency, function (job, done) {
    var worker = require('./lib/workers/' + job.data.items);
    worker.job(job, done);
});

var updateIndex = function () {
    for (var index in config.crawlers) {
        jobs.create('updateIndex', { title: 'Fetch new posts', source: config.crawlers[index], items: 'posts' }).save();
        jobs.create('updateIndex', { title: 'Fetch new comments', source: config.crawlers[index], items: 'comments' }).save();
    }
    setTimeout(function () {
        updateIndex();
    }, config.update_delay * 60 * 1000);
};

var analyzeNextComment = function () {
    var worker = require('./lib/workers/hyphenation');
    mongoose.model('CommentModel').findOne({ is_analyzed: false }, function (err, comment) {
        if (err || !comment) {
            setTimeout(function () {
                analyzeNextComment();
            }, 1000);
        } else {
            worker.job({
                data: {
                    hyphenation: config.analysis.hyphenation,
                    comment: comment
                }
            }, function (err) {
                setTimeout(function () {
                    analyzeNextComment();
                }, 0);
            });
        }
    });
};


// start digging for turds!!!

updateIndex();

if (config.analysis.active) {
    analyzeNextComment();
}