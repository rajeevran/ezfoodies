var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var contentschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    content_type: {
        type: String,
        default: ''
    },
    home_page_slider: [{
        type: String,
        default: ''
    }]
}, {
    timestamps: true
});
module.exports = mongoose.model('Content', contentschema);