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
        user_condition:[{
            type:String,
            enum:[
                  'first_time',
                  'any_user',
                  'gold_member',
                  'restaurant_category',
                  'two_order_placed_third_free',
                  'third_order_amount_beyond_any_previous_two_order',
                  'used_once_buy_two_get_one',
                  'finish_three_order_within_week',
                  'one_order_placed_second_free',
                  'second_order_amount_beyond_previous_order',
                  'used_once',
                  'finish_two_order_within_week',
                  'used_once_specific_category_order',
                  'used_once_five_order',
                  'referred_restaurant_new_user_never_placed_order_before',
                  'referred_user_new_user_never_placed_order_before',
                  'new_user_never_placed_order_before'
               ],
            default: 'first_time'
         }],
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
           type:Date,
           required:true
        },
        end_date:{
            type:Date,
            required:true
        },
        restaurant:{
            type:String,
            required:false
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

