var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var teamnamechangereqscema = new Schema({
    _id: {
        type: String,
        required: true
    },
    suggested_name: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    orgid: {
        type: String,
        required: true
    },
    teamid: {
        type: String,
        required: true
    },
    notify_users_list: [{

        type: String,
        default: ''

    }],
    change_status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    cron: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});
teamnamechangereqscema.plugin(mongoosePaginate);
teamnamechangereqscema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('Teamname-change-request', teamnamechangereqscema);