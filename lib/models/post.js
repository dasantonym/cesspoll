(function () {
    'use strict';
    var mongoose = require('mongoose'),
        async = require('async'),
        Schema = mongoose.Schema,
        PostModel = Schema({

            url: { type: String, index: true, required: true },
            threadUrl: { type: String, index: true, required: true },
            body: String,
            titles: [String],
            author: String,
            source: { type: String, index: true },

            added: Date

        });

    if (typeof PostModel.options.toJSON === 'undefined') {
        PostModel.options.toJSON = {};
    }

    PostModel.options.toJSON.transform = function (doc, ret, options) {
        ret.id = obj._id.toString();
        delete ret._id;
    };

    PostModel.pre('save', function (next) {
        var now = Date.now();
        if (!this.added) {
            this.added = now;
        }
        next();
    });

    PostModel.statics.random = function (size, query, callback) {
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

    module.exports.PostModel = PostModel;
}());