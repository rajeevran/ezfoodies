var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var FavouriteRestaurantSchema = new Schema({

    _id: {
        type: String,
        require: true
    },
    restaurant_id: {
        type: String,
        require: true
    },
    user_id: {
        type: String,
        require: true
    }
}, {
    timestamps: true
});

FavouriteRestaurantSchema.plugin(mongoosePaginate);
FavouriteRestaurantSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Favourite-restaurant', FavouriteRestaurantSchema);