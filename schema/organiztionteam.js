var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var orgteamschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    orgid: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    id_proof: {
        type: String,
        default: ''
    },
    team_owner: {
        type: String,
        default: ''
    },
    is_verified: {
        type: String,
        enum: ['verified', 'pending', 'rejected'],
        default: 'verified'
    },
    meeting_point: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
orgteamschema.plugin(mongoosePaginate);
orgteamschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Organisationteam', orgteamschema);