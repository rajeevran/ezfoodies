var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var temporaryCartPromoCloverSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    cartDetails: {
        type: Object,
        default: null
    },
    userId: {
        type: String,
        default: ''
    },  
    cartIds: [{
        type: String,
        default: ''
    }]   
}, {
    timestamps: true
});
module.exports = mongoose.model('temporaryCartPromoClover', temporaryCartPromoCloverSchema);