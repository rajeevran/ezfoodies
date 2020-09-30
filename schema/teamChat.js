var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var teamChatschema = new Schema({
    _id: {
        type: String
    },
    to_user: {
        type: String,
        required: true
    },
    from_user: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});
teamChatschema.plugin(mongoosePaginate);
teamChatschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Team-chat', teamChatschema);