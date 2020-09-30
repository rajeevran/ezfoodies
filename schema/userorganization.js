var mongoose = require('mongoose');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var userorganiztionschema = new Schema({
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
    current_active_org: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
}, {
    timestamps: true
});
userorganiztionschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Userorganization', userorganiztionschema);