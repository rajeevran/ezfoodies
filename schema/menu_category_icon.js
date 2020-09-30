var mongoose = require("mongoose");

//Create UserSchema
var MenuCategoryIconScema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: ''

    },
    
}, {
    timestamps: true
});


// Export your module
module.exports = mongoose.model("Menu-category-icon", MenuCategoryIconScema);