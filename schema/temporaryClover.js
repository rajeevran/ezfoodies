var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var temporaryCloverSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    cartDetails: {
        type: Object,
        default: null
    },
    data: {
        type: Object,
        default: null
    },    
    cartIds: [{
        type: String,
        default: ''
    }],    
    isPromocodeApplied: {
        type: Boolean,
        default: false
    },
    isRewardApplied: {
        type: Boolean,
        default: false
    },    
    cartAmount: {
        type: Number,
        default: 0
    },
    restaurantId: {
        type: String,
        default: ''
    },
    userRewardPoint: {
        type: String,
        default: ''
    },
    amountDeducted: {
        type: String,
        default: ''
    },  
    promocode: {
        type: String,
        default: ''
    },  
    promologId: {
        type: String,
        default: ''
    },    
    rewardlogIds: [{
        type: String,
        default: ''
    }],     
    promocodeDeductedAmount: {
        type: Number,
        default: 0
    },     
    rewardDeductedAmount: {
        type: Number,
        default: 0
    },  
    deductedRedeemPoint: {
        type: Number,
        default: 0
    },  
    totalCartQuantity: {
        type: Number,
        default: 0
    },      
    userId: {
        type: String,
        default: ''
    }     

}, {
    timestamps: true
});
module.exports = mongoose.model('temporaryClover', temporaryCloverSchema);