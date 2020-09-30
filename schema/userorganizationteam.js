var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var user_organiztion_team_schema = new Schema({
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
    current_active_team: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    status: {
        type: String,
        enum: ['yes', 'no', 'rejected'],
        default: 'no'
    }
}, {
    timestamps: true
});
user_organiztion_team_schema.plugin(mongoosePaginate);
user_organiztion_team_schema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Userorganizationteam', user_organiztion_team_schema);