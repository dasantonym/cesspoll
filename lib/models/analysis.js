(function () {
    'use strict';
    var mongoose = require('mongoose'),
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

    module.exports.AnalysisModel = AnalysisModel;
}());