var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var RestaurantSchema = new Schema({

    _id: {
        type: String,
        require: true
    },
    restaurant_manager_id: {
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
    address: {
        type: String,
        default: ''
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    lat: {
        type: String,

    },
    long: {
        type: String,

    },
    restaurant_banner_image: {
        type: String,
        default: null
    },
    restaurant_logo: {
        type: String,
        default: null
    },
    opening_hours: [{
        day: {
            type: Number,
            default: ''
        },
        time: {
            type: String,
            default: ''
        },
        openingTime: {
            type: String,
            default: ''
        },
        closingTime: {
            type: String,
            default: ''
        },
        breakTime: {
            type: String,
            default: null
        },
        breakStartTime: {
            type: String,
            default: null
        },
        breakEndTime: {
            type: String,
            default: null
        },
    }],
    closing_days: [{
        type: Number,
        default: ''
    }],
    restaurant_type: [{
        type: String,
        default: ''
    }],
    contact_info: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    contact_timing: [{
        day: {
            type: Number,
            default: ''
        },
        time: {
            type: String,
            default: ''
        },
        openingTime: {
            type: String,
            default: ''
        },
        closingTime: {
            type: String,
            default: ''
        }
    }],
    pre_order_accepted: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    status: {
        type: String,
        enum: ['Publish', 'Hidden'],
        default: 'Hidden'
    },
    busy_mode: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    featured: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    qr_code: {
        type: String,
        default: null
    },
    referralCode: {
        type: String,
        default: ''
    },
    rewardId: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

RestaurantSchema.plugin(mongoosePaginate);
RestaurantSchema.plugin(mongooseAggregatePaginate);
RestaurantSchema.index({
    "location": "2dsphere"
});
module.exports = mongoose.model('Restaurant', RestaurantSchema);