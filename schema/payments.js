var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var paymentschema = new Schema({

        paymentId:          { type: String, required: true },
        authCode:           { type: String, required: true },
        userDetails:        { type: Object},
        orderDetails:       { type: Object},
        transactionAmount:  { type: Number,  default: 0.00 } ,
        transactionFees:    { type: Number, required: false },
        currency:           { type: String, required: false },
        message:            { type: Number,  default: null } ,
        paymentDate:        { type: Date, required: false, default: Date.now() },
        paymentMode:        { type: String, enum: ['EMI', 'Credit card', 'Debit Card', 'Others']  }, // 0: EMI / 1: Credit card / 2: Debit Card / 3: Others
        paymentStatus:      { type: String, enum: ['Fauled', 'Succeed', 'Wait for payment', 'Payment interrupted'] } // 0:Fauled /1:Succeed /2:Wait for payment /3:Payment interrupted

    }, {
        timestamps: true
    });
module.exports = mongoose.model('Payment', paymentschema);