var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var teamjoinrequestscema = new Schema({
    _id: {
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
    status: {
        type: String,
        enum: ['approved', 'pending', 'rejected'],
        default: 'pending'
    },
    reject_reason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});
teamjoinrequestscema.plugin(mongoosePaginate);
teamjoinrequestscema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('Teamjoinrequest', teamjoinrequestscema);