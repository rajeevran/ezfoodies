var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var organiztionschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
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
        required: true
    },
    long: {
        type: String,
        required: true
    },
    organiztion_owner: {
        type: String,
        default: ''
    },
}, {
    timestamps: true
});
organiztionschema.plugin(mongoosePaginate);
organiztionschema.plugin(mongooseAggregatePaginate);
organiztionschema.index({
    "location": "2dsphere"
});
module.exports = mongoose.model('Organization', organiztionschema);