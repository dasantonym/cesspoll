(function () {
    'use strict';
    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        PostModel = Schema({

            url: { type: String, index: true, required: true },
            threadUrl: { type: String, index: true, required: true },
            body: String,
            titles: [String],
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

    module.exports.PostModel = PostModel;
}());