var mongoose=require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var promoCodeSchema=new Schema({
        _id:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
         },
        description:{
           type:String,
           required:true
        },
        user_condition:{
            type:String,
            enum:['first_time','any_user','gold_member','restaurant_category'],
            default: 'first_time'
         },
        promo_code_type:{
            type:String,
            enum:['dollar','percentage','clovers'],
            default:'dollar'
         },
        promo_code_value:{
           type:Number,
           required:true
         },
        times:{
           type:String,
           enum:['one_time','unlimited_times','order_times'],
           default:'one_time'
        },
        next_order_times:{
           type:Number,
           default:''
        },
        start_date:{
           type:String,
           required:true
        },
        end_date:{
            type:String,
            required:true
        },
        restaurant_category: [{
                type:String,
                default:''
        }],
        enable:{
            type:String,
            enum:['yes','no'],
            default:'yes'
         }
},{
        timestamps:true
})
promoCodeSchema.plugin(mongoosePaginate);
promoCodeSchema.plugin(mongooseAggregatePaginate);
module.exports=mongoose.model('Promo-code',promoCodeSchema);

