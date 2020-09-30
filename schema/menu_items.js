var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var RestaurantMenuSchema = new Schema({

    _id: {
        type: String,
        require: true
    },
    restaurant_id: {
        type: String,
        require: true
    },
    menu_catagory_id: {
        type: String,
        require: true
    },
    name: {
        type: String,
        require: true
    },
    cname: {
        type: String,
        default: null
    },
    tcname: {
        type: String,
        default: null
    },
    price: {
        type: Number,
        require: true,
        default: 0
    },
    regular_time: {
        type: Number,
        default: ''
    },
    busy_time: {
        type: Number,
        default: ''
    },
    stock: {
        type: String,
        enum: ['In-stock', 'Out-stock'],
        default: 'In-stock'
    },
    menu_logo: {
        type: String,
        default: ''
    },
    menu_customization: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    customize_items: [{
        _id: {
            type: String,
            require: true
        },
        name: {
            type: String,
            default: ''
        },
        tcname:{
            type:String,
            default: ''
        },
        cname:{
            type:String,
            default: ''
        },
        price: {
            type: Number,
            default: 0
        },
        stock: {
            type: String,
            enum: ['In-stock', 'Out-stock'],
            default: 'In-stock'
        }
    }],
    total_quantity: {
        type: Number,
        default: ''
    },
    order_quantity: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

RestaurantMenuSchema.plugin(mongoosePaginate);
RestaurantMenuSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Restaurantmenu', RestaurantMenuSchema);