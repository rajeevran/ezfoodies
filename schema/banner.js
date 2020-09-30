var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var bannerSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    opening_hours: {
        openingTime: {
            type: String,
            default: ''
        },
        closingTime: {
            type: String,
            default: ''
        }
    },
    slider_type: {
        type: String,
        enum: ['home_first_slider', 'home_second_slider'],
        default: 'home_first_slider',
        required: true
    },
    home_page_slider: {
        type: String,
        default: ''
    },
    restaurant_ids: [{
        type: String,
        default: ''
    }]
}, {
    timestamps: true
});
bannerSchema.plugin(mongoosePaginate);
bannerSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Promotional-Banner', bannerSchema);