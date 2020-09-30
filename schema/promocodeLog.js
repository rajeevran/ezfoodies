var mongoose=require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var promoCodeLogSchema=new Schema({
        _id:{
            type:String,
            required:true
        },
        promocodename:{
            type:String,
            required:false
         },
         userId:{
            type:String,
            required:false
        },
        orderId:{
         type:String,
         required:false
        },
        discountType:{
            type:String,
            required:false,
            default:''

        },
        discount:{
            type:String,
            required:false,
            default:'0'
           },
        restaurant:{
            type:String,
            required:false,
            default:''

        }, 
        restaurantCategory:[{
            type:String,
            required:false
        }],
        referralCode :{
            type:String,
            required:false,
            default:''
        },   
        userRefferedId:{
            type:String,
            required:false,
            default:''            
        },
        cartIds: [{
            type: String,
            default: ''
        }],      
        enable:{
            type:String,
            enum:['yes','no'],
            default:'yes'
        }
},{
        timestamps:true
})
promoCodeLogSchema.plugin(mongoosePaginate);
promoCodeLogSchema.plugin(mongooseAggregatePaginate);
module.exports=mongoose.model('PromocodeLog',promoCodeLogSchema);

