var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
//Create UserSchema
var RestaurantManagerSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    authtoken: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'DE-ACTIVE'],
        default: 'ACTIVE'
    },
}, {
    timestamps: true
});

RestaurantManagerSchema.pre('save', function (next) {
    var admin = this;
    if (!admin.isModified('password')) return next();

    bcrypt.hash(admin.password, null, null, function (err, hash) {
        if (err) {
            return next(err);
        }

        admin.password = hash;
        next();
    });
});

RestaurantManagerSchema.methods.comparePassword = function (password) {
    var admin = this;

    return bcrypt.compareSync(password, admin.password);
};




RestaurantManagerSchema.plugin(mongoosePaginate);
RestaurantManagerSchema.plugin(mongooseAggregatePaginate);
// Export your module
module.exports = mongoose.model("RestaurantManager", RestaurantManagerSchema);