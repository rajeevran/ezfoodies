var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var rewardschema = new Schema({
    _id: 
        {
         type: String,
         required: true 
        },
    name: 
        { 
        type: String,
        required: false
        },
    type: 
        { 
            type:String,
            enum:[
                'order',
                'flat',
                'redeem'
            ],
            default:''
        },
    discount: 
        { 
        type: Number,
        required: false
        },
    clover: 
        { 
        type: Number,
        required: false
        } ,
    additionalUserCLover: 
        { 
        type: Number,
        required: false
        } , 
    additionalRestaurantCLover: 
        { 
        type: Number,
        required: false
        } , 
    timesOfClover: 
        { 
        type: Number,
        required: false
        }, 
    orderProvided: 
        { 
        type: Number,
        required: false
        },                 
    orderDependsOn: 
        { 
        type: Number,
        required: false
        } ,
    timeLimitation: 
        { 
        type: Number,
        required: false
        },
    notificationDateOn: 
        { 
        type: Number,
        required: false
        } ,
    maxCloverPoint: 
        { 
        type: Number,
        required: false
        },
    enable:
        {
            type:String,
            enum:['yes','no'],
            default:'yes'
        }            

}, {
        timestamps: true
    });
module.exports = mongoose.model('Reward', rewardschema);