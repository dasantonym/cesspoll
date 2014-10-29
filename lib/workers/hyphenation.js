module.exports.job = function (job, done) {
    var mongoose = require('mongoose'),
        path = require('path'),
        fs = require('fs'),
        async = require('async'),
        exec = require('exec'),
        textUtils = require('../util/text');

    async.waterfall([
        function (cb) {
            var comment = job.data.comment;
            if (!comment) {
                cb(new Error('nothing to process'), null);
            } else {
                var tmpPath = path.join(__dirname, '..', '..', 'tmp', comment.id);
                var normalizedText = (comment.title ? textUtils.normalizeText(comment.title) + ' ' : '') + textUtils.normalizeText(comment.body);
                var fragments = textUtils.extractFragments(normalizedText);
                var fragmentIndex = 0;
                async.eachSeries(fragments, function (frag, next) {
                    async.waterfall([
                        function (cb) {
                            fs.writeFile(tmpPath, frag.trim(), cb);
                        },
                        function (cb) {
                            exec([
                                path.resolve(job.data.hyphenation.hyphen_example_path),
                                path.resolve(job.data.hyphenation.hyphen_dictionary_path),
                                tmpPath
                            ], cb);
                        },
                        function (output, code, cb) {
                            output = output.trim();
                            output += frag.substr(frag.length - 1, 1);
                            var words = output.trim().split(' ');
                            cb(null, words);
                        },
                        function (words, cb) {
                            var syllables = [];
                            async.eachSeries(words, function (word, next) {
                                var parts = word.split('=');
                                syllables = syllables.concat(parts[0] === '' ? parts.slice(1) : parts);
                                next();
                            }, function (err) {
                                cb(err, words, syllables);
                            });
                        },
                        function (words, syllables, cb) {
                            for (var i = 0; i < words.length; i += 1) {
                                words[i] = words[i].replace(/=/g, '');
                            }
                            cb(null, words, syllables);
                        },
                        function (words, syllables, cb) {
                            mongoose.model('AnalysisModel').create({
                                post_id: comment.post_id,
                                source: comment.source,
                                fragment: frag,
                                words: words,
                                syllables: syllables,
                                fragment_length: syllables.length,
                                comment_id: comment.id,
                                fragment_index: fragmentIndex
                            }, cb);
                        }
                    ], function (err, analysis) {
                        fragmentIndex += 1;
                        next(err);
                    });
                }, function (err) {
                    fs.unlink(tmpPath, function (fsErr) {
                        if (err || fsErr) {
                            return cb(err || fsErr, null, null);
                        }
                        mongoose.model('CommentModel').findByIdAndUpdate(comment.id, { is_analyzed: true }, function (err) {
                            cb(err);
                        });
                    });
                });
            }
        }
    ], function (err) {
        if (err) {
            console.log('analysis error', err);
        }
        done(err);
    });

};