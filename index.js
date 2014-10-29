var kue = require('kue'),
    async = require('async'),
    mongoose = require('mongoose'),
    jobs = kue.createQueue(),
    _config = null;

module.exports.startUpdateService = function (config) {

    _config = config;

    var express = require('express'),
        basicAuth = require('basic-auth-connect');

    mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbname);
    mongoose.model('PostModel', require('./lib/models/post').PostModel);
    mongoose.model('CommentModel', require('./lib/models/comment').CommentModel);
    mongoose.model('AnalysisModel', require('./lib/models/analysis').AnalysisModel);

    if (config.kue.admin.active) {
        var app = express();
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

    // start digging for turds!!!

    module.exports.updateIndex();

    if (config.analysis.active) {
        module.exports.analyzeNextComment();
    }

};

module.exports.updateIndex = function () {
    for (var index in _config.crawlers) {
        jobs.create('updateIndex', { title: 'Fetch new posts', source: _config.crawlers[index], items: 'posts', config: _config }).save();
        jobs.create('updateIndex', { title: 'Fetch new comments', source: _config.crawlers[index], items: 'comments', config: _config }).save();
    }
    setTimeout(function () {
        module.exports.updateIndex();
    }, _config.update_delay * 60 * 1000);
};

module.exports.analyzeNextComment = function () {
    var worker = require('./lib/workers/hyphenation'),
        path = require('path');
    mongoose.model('CommentModel').findOne({ is_analyzed: false }, function (err, comment) {
        if (err || !comment) {
            setTimeout(function () {
                module.exports.analyzeNextComment();
            }, 1000);
        } else {
            worker.job({
                data: {
                    hyphenation: _config.analysis.hyphenation,
                    comment: comment,
                    tmpPath: path.resolve(_config.tmp_folder)
                }
            }, function (err) {
                setTimeout(function () {
                    module.exports.analyzeNextComment();
                }, 0);
            });
        }
    });
};
