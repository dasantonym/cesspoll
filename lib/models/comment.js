(function () {
    'use strict';
    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        CommentModel = Schema({

            post_id: { type: Schema.Types.ObjectId, index: true, required: true },
            foreign_key: { type: String, index: true },
            title: String,
            body: String,
            author: String,
            author_ref: { type: String, index: true },
            source: { type: String, index: true },

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

    module.exports.CommentModel = CommentModel;
}());