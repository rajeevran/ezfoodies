var mongoose = require("mongoose");
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
//Create UserSchema
var MenuCategoryScema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    restaurant_id: {
        type: String,
        required: true,
        default: null
    },
    name: {
        type: String,
        required: true
    },
    cname: {
        type: String,
        default: null
    },
    tcname: {
        type: String,
        default: null
    },
    logo: {
        type: String,
        default: null

    },
    inactive_logo: {
        type: String,
        default: ''

    },
    default_icon_id: {
        type: String,
        default: null

    },
}, {
    timestamps: true
});

MenuCategoryScema.plugin(mongoosePaginate);
MenuCategoryScema.plugin(mongooseAggregatePaginate);
// Export your module
module.exports = mongoose.model("Menucategory", MenuCategoryScema);