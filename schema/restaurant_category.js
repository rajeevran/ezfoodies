var mongoose = require("mongoose");
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var RestaurantcatScema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
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
        default: ''

    }
}, {
    timestamps: true
});

RestaurantcatScema.plugin(mongoosePaginate);
RestaurantcatScema.plugin(mongooseAggregatePaginate);
// Export your module
module.exports = mongoose.model("Restaurant-category", RestaurantcatScema);