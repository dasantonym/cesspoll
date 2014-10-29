(function () {
    'use strict';
    var mongoose = require('mongoose'),
        async = require('async'),
        Schema = mongoose.Schema,
        CommentModel = Schema({

            post_id: { type: Schema.Types.ObjectId, index: true, required: true },
            foreign_key: { type: String, index: true },
            title: String,
            body: String,
            author: String,
            author_ref: { type: String, index: true },
            source: { type: String, index: true },
            is_analyzed: { type: Boolean, index: true, default: false },

            added: Date

        });

    if (typeof CommentModel.options.toJSON === 'undefined') {
        CommentModel.options.toJSON = {};
    }

    CommentModel.options.toJSON.transform = function (doc, ret, options) {
        ret.id = ret._id.toString();
        ret.post_id = ret.post_id.toString();
        delete ret._id;
    };

    CommentModel.pre('save', function (next) {
        var now = Date.now();
        if (!this.added) {
            this.added = now;
        }
        next();
    });

    CommentModel.statics.random = function (size, query, callback) {
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
                _this.findOne(query).skip(skipIndexes[i]).exec(next);
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

    module.exports.CommentModel = CommentModel;
}());