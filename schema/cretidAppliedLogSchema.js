var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cretidAppliedLogSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    creditId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        default: null
    },

}, {
    timestamps: true
});

module.exports = mongoose.model('Credit-Applied-Logs', cretidAppliedLogSchema);