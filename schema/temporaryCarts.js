var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var temporaryCartschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    restaurant_id: {
        type: String,
        require: true
    },
    addon: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    addon_items: [{
        type: String
    }],
    addon_items_details: [{
        _id: {
            type: String,
            require: true
        },
        name: {
            type: String,
            default: ''
        },
        price: {
            type: Number,
            default: ''
        },
    }],
    productId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    }

}, {
    timestamps: true
});
module.exports = mongoose.model('temporaryCart', temporaryCartschema);