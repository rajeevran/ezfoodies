var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var Notoficationschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        default: ''
    },
    notification_code: {
        type: Number,
        default: ''
    },
    notification_for: {
        type: String,
        enum: ['user', 'team_member'],
        default: 'user'
    },
    team_join_request_details: {
        user_id: {
            type: String,
            default: ''
        },
        orgid: {
            type: String,
            default: ''
        },
        teamid: {
            type: String,
            default: ''
        }
    },
    teamname_change_request_id: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    read_status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    teamOrder: {
        restaurant_id: {
            type: String,
            default: ''
        },
        parentOrderId: {
            type: String,
            default: ''
        }
    },
}, {
    timestamps: true
});
Notoficationschema.plugin(mongoosePaginate);
Notoficationschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Notification', Notoficationschema);