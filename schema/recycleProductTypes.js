var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var recycleProductTypeschema = new Schema({
    _id: { type: String, required: true },
    productTypeName: { type: String, required: false }
}, {
        timestamps: true
    });
module.exports = mongoose.model('RecycleProductType', recycleProductTypeschema);