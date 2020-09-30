var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var orderschema = new Schema({
    _id: {
        type: String
    },
    orderId: {
        type: String,
        required: true
    },
    gui_no: {
        type: String,
        default: null
    },
    // paymentId: {
    //     type: String,
    //     required: true
    // },
    userId: {
        type: String,
        required: true
    },
    buyer_name: {
        type: String,
        default: null
    },
    buyer_email: {
        type: String,
        default: null
    },
    buyer_telephone: {
        type: String,
        default: null
    },
    restaurant_id: {
        type: String,
        required: true
    },
    orderDetails: {
        type: Object
    },

    promoClovers: {
        type: Object
    },
    transactionAmount: {
        type: Number,
        default: 0.00
    },
    transactionFees: {
        type: Number,
        required: false,
        default: 0.00
    },
    currency: {
        type: String,
        required: false,
        default: null
    },
    message: {
        type: String,
        default: null
    },
    paymentDate: {
        type: Date,
        required: false,
        default: Date.now()
    },
    paymentMode: {
        type: String,
        enum: ['EMI', 'Credit card', 'Debit Card', 'Others']
    }, // 0: EMI / 1: Credit card / 2: Debit Card / 3: Others
    paymentStatus: {
        type: String,
        enum: ['Fauled', 'Succeed', 'Wait for payment', 'Payment interrupted']
    }, // 0:Fauled /1:Succeed /2:Wait for payment /3:Payment interrupted
    orderStatus: {
        type: String,
        enum: ['Accepted', 'Pending', 'Delivered', 'Cancel'],
        default: 'Pending'
    },
    additional_wait_time: {
        type: Number,
        default: null
    },
    promologId: {
        type: String,
        required: false
    },
    rewardslogId: [{
        type: String,
        default: null
    }],
    order_reject_reason: {
        type: String,
        default: null
    },
    orderType: {
        type: String,
        required: true,
        enum: ['SOLO', 'TEAM', 'JOIN-TEAM-ORDER'],
        default: 'SOLO'
    },
    teamOrderUserList: [{
        type: String,
        default: ''
    }],
    team_id: {
        type: String,
        default: null
    },
    team_order_arrived: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    childOrderIds: [{
        type: String,
        default: ''
    }],
    invoice: {
        type: String,
        default: null
    },

}, {
    timestamps: true
});
orderschema.plugin(mongoosePaginate);
orderschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Order', orderschema);