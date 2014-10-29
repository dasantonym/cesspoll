(function () {
    'use strict';
    var mongoose = require('mongoose'),
        async = require('async'),
        Schema = mongoose.Schema,
        AnalysisModel = Schema({

            comment_id: { type: Schema.Types.ObjectId, index: true, required: true },
            post_id: { type: Schema.Types.ObjectId, index: true, required: true },
            source: String,
            fragment: String,
            words: [String],
            syllables: [String],
            fragment_length: Number,
            fragment_index: Number,

            added: Date

        });

    if (typeof AnalysisModel.options.toJSON === 'undefined') {
        AnalysisModel.options.toJSON = {};
    }

    AnalysisModel.options.toJSON.transform = function (doc, ret, options) {
        ret.id = ret._id.toString();
        ret.comment_id = ret.comment_id.toString();
        delete ret._id;
    };

    AnalysisModel.pre('save', function (next) {
        var now = Date.now();
        if (!this.added) {
            this.added = now;
        }
        next();
    });

    AnalysisModel.statics.random = function (size, query, callback) {
        this.count(query, function (err, count) {
            if (err) {
                return callback(err);
            }
            if (count === 0) {
                return callback(null, null);
            }
            if (count < size) {
                size = count;
            }
            var skipIndexes = [],
                _this = this;
            while (skipIndexes.length < size) {
                var rand = Math.floor(Math.random() * count);
                if (skipIndexes.length === 0 || skipIndexes.indexOf(rand) < 0) {
                    skipIndexes.push(rand);
                }
            }
            async.times(size, function (i, next) {
                var rand = Math.floor(Math.random() * count);
                _this.findOne(query).skip(rand).exec(next);
            }, function (err, items) {
                if (items.length > 1) {
                    callback(err, items);
                } else if (items.length === 1) {
                    callback(err, items[0]);
                } else {
                    callback(err, null);
                }
            });
        }.bind(this));
    };

    module.exports.AnalysisModel = AnalysisModel;
}());