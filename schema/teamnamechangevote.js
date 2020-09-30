var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var teamnamechangevotescema = new Schema({
    _id: {
        type: String,
        required: true
    },
    name_change_request_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    vote: {
        type: String,
        enum: ['yes', 'no'],
        default: ''
    },
    // voting: {
    //     vote: {
    //         type: String,
    //         enum: ['yes', 'no'],
    //         default: ''
    //     },
    //     user_id: {
    //         type: String,
    //         default: ''
    //     }
    // }
}, {
    timestamps: true
});
teamnamechangevotescema.plugin(mongoosePaginate);
teamnamechangevotescema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('Teamname-change-vote', teamnamechangevotescema);