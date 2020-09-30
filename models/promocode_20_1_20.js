var async = require("async");
var mongo = require('mongodb');
var moment = require('moment');
var ObjectID = mongo.ObjectID;
var config = require('../config');

var jwt = require('jsonwebtoken');
var secretKey = config.secretKey;

const fetch = require('node-fetch');

var promocodeSchema = require('../schema/promocode');
var promocodeLogSchema = require('../schema/promocodeLog');
var orderSchema     = require('../schema/order');
var UserSchema = require('../schema/users');
var RestaurantSchema = require('../schema/restaurant');
var RestaurantCategoryScema = require('../schema/restaurant_category');

var PromocodeService = 
{
promocodeList:function(callback)
{
promocodeSchema.find(
    function(err,result)
    {
        if(err)
        {
            callback({
                "response_code":5005,
                "response_message":"INTERNAL DB ERROR",
                "response_data":{}
            });
        }
        else
        {
            callback({
                "response_code":2000,
                "response_message":"Promocode list",
                "response_data":result
            });
        }
    })
},

addPromocode:function(data,callback)
{
    console.log('data---',data);
    if(data)
    {
    async.waterfall([
        function (nextCb) 
        {
            if(data.name=='' || data.name==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide promocode name",
                    "response_data": {}
                }) 
            } else if(data.user_condition=='' || data.user_condition==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide user condition",
                    "response_data": {}
                }) 
            } else if(data.promo_code_type=='' || data.promo_code_type==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide promocode type",
                    "response_data": {}
                }) 
            } else if(data.promo_code_value=='' || data.promo_code_value==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide promocode value",
                    "response_data": {}
                }) 
            } else if(data.times=='' || data.times==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide uses times",
                    "response_data": {}
                }) 
            } else if(data.start_date=='' || data.start_date==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide start date",
                    "response_data": {}
                }) 
            } else if(data.end_date=='' || data.end_date==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide end date",
                    "response_data": {}
                }) 
            } else
            {
            promocodeSchema.count({
                name: data.name
            }).exec(function (err, resCount)
                {
                    console.log('resCount---',resCount);
                if (err) 
                {
                    nextcb(err);
                } else
                    {
                    if (resCount > 0)
                        {
                        callback({
                            "response_code": 2008,
                            "response_message": "Promocode with same name already exist.Please try another one.",
                            "response_data": {}
                        });
                    } else
                        {
                        var promo={};
                        promo._id= new ObjectID;
                        promo.name= data.name;
                        promo.user_condition=data.user_condition;
                        promo.promo_code_value=data.promo_code_value;
                        promo.promo_code_type=data.promo_code_type;
                        promo.restaurant=data.restaurant,
                        promo.restaurant_category=data.restaurant_category;
                        promo.times=data.times; 
                        promo.start_date=data.start_date;
                        promo.end_date=data.end_date;
                        promo.enable=data.enable,
                        promo.description=data.description,
                        promo.next_order_times=data.next_order_times
                        
                       

                        new promocodeSchema(promo).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {
                                console.log('result--', result)
            
                                callback({
                                    "response_code": 2000,
                                    "response_message": "data added  successfully.",
                                    "response_data": result
                                });
                            }
                        });
                    }
                }
            });
          }
        },
    ]);
    }
    else
    {
        callback({
            "response_code": 5005,
            "response_message": "INTERNAL DB ERROR",
            "response_data": {}
        });
    }   
},
promocodeDetails:function(data,callback)
{
    promocodeSchema.findOne(
        {_id:data._id }
    ).exec(function (err,result){
        if(err)
        {
            callback({
                "response_code":5005,
                    "response_message":"INTERNAL DB ERROR",
                    "response_data":[]
            });
        }
        else
        {
            callback({
                "response_code":2000,
                    "response_message":"Promocode Details",
                    "response_data":result
            });
        }
    })
},
editPromocode: function(data,callback)
{
    promocodeSchema.update(
        { _id:data._id },
        {
            $set:
                {
                    name: data.name,
                    user_condition:JSON.parse(JSON.stringify(data.user_condition)),
                    promo_code_value:data.promo_code_value,
                    promo_code_type:data.promo_code_type,
                    restaurant:data.restaurant,
                    restaurant_category:JSON.parse(JSON.stringify(data.restaurant_category)),
                    times:data.times, 
                    start_date:data.start_date,
                    end_date:data.end_date,
                    description:data.description,
                    next_order_times:data.next_order_times
                }
        },
         function(err,result)
        {
            if(err)
            {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                });
            }
            else
            {

                callback({
                    "response_code": 2000,
                    "response_message": "Promocode Details has been updated.",
                    "response_data": result,
                    "data":data

                });
            }
        });
    },
editStatus: function(data,callback)
{
    promocodeSchema.update(
        { _id:data._id },
        {
            $set:
                {
                    enable:data.enable
                }
        },
        function(err,result)
        {
            if(err)
            {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                });
            }
            else
            {
                callback({
                    "response_code": 2000,
                    "response_message": "Status Updated Successfully",
                    "response_data": result,
                    "data":data

                });
            }
        });
    },
deletePromocode:function(data,callback)
{
    promocodeSchema.remove(
        {_id:data._id }
    ).exec(function (err,result){
        if(err)
        {
            callback({
                "response_code":5005,
                    "response_message":"INTERNAL DB ERROR",
                    "response_data":[]
            });
        }
        else
        {
            callback({
                "response_code":2000,
                    "response_message":"Promocode Deleted Successfully",
                
            });
        }
    })
},

deletePromocodeLogModel:function(data,callback)
{
    promocodeLogSchema.remove(
        {_id:data._id }
    ).exec(function (err,result){
        if(err)
        {
            callback({
                "response_code":5005,
                    "response_message":"INTERNAL DB ERROR",
                    "response_data":[]
            });
        }
        else
        {
            callback({
                "response_code":2000,
                    "response_message":"Promocode removed Successfully",
                
            });
        }
    })
},

applyPromocodeModel: async function(data,callback)
{

    if(data.decoded)
    {

        var decoded = data.decoded//await jwt.verify(data.userauthtoken, secretKey);
        var authtoken = data.authtoken
console.log('decoded--',authtoken)
        //#region to Validate token
        if (decoded != null) {

            let userId = decoded.id
            let discount = 0.0
            let orderId =''
            let promocode =''
            let referralUserFlag =0
            let referralRestaurantFlag =0

                   
            if(!data.promocode)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide promocode",
                    "response_data": {}
                }) 
            }else{
                promocode = data.promocode
                promocodeSchema.findOne(
                    {
                        name:data.promocode,
                        end_date :{ $gte: Date.now() } ,
                        enable:'yes'
                    },
                    async function(err,result)
                    {
                        if(err)
                        {
                            callback({
                                "success": false,
                                "response_code":5005,
                                "response_message":"INTERNAL DB ERROR",
                                "response_data":{}
                            });
                        }
                        else
                        {

                            console.log('result-->',result)
                            let promocodeDiscountResultResponse = []

                            if(result !==  null)
                            {
                                    
                                     let  discountType      = result.promo_code_type
                                        //enum:['dollar','percentage','clovers'],
                                     discount               = result.promo_code_value
                                     let  next_order_times  = result.next_order_times
                                     let  times             = result.times
                                     let  restaurant        = result.restaurant
                                     restaurant             = result.restaurant !==  undefined? result.restaurant:''
                                        //enum:['one_time','unlimited_times','order_times'],
                                     let restaurant_category= result.restaurant_category !==  undefined? result.restaurant_category:''
                                        console.log('restaurant_category typeof--',typeof restaurant_category)
                                     console.log('restaurant_category--', restaurant_category)
                                     let checkRefferedRestaurant =0
                                      if(result.user_condition.length >0){
    
                                            for (let index = 0; index < result.user_condition.length; index++) {
                                                let mcondition = result.user_condition[index];

                                                //  console.log('mcondition',mcondition)

                                                if(mcondition == 'first_time')
                                                {

                                                let output =  await first_time(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times
                                                    )
                                                    console.log('first_time output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
    
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        promologId : response_data.promologId,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }

                                                if(mcondition == 'used_once')
                                                {
                                                   let output = await used_once(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times
                                                   )
                                                   console.log('used_once output time--->',output)

                                                   if(output.length >0){
   
                                                       for (let index = 0; index < output.length; index++) {
                                                           let response_code = output[index].response_code;
                                                           let response_data = output[index].response_data;

                                                           if(response_code == '5005')
                                                           {
                                                               
                                                               callback({
                                                                   "success": false,
                                                                   "response_code":5005,
                                                                   "response_message":"INTERNAL DB ERROR",
                                                                   "response_data":{}
                                                               });
   
                                                           }else{
   
                                                               promocodeDiscountResultResponse.push(
                                                                {
                                                                    promologId : response_data.promologId,
                                                                    discount : response_data.discount,
                                                                    discountType : response_data.discountType,
                                                                    response_code : response_code
                                                                }
                                                                ) 

                                                           }
                                                           
                                                       }
                                                    }
                                                }

                                                if(mcondition == 'used_once_five_order')
                                                {

                                                let output =  await used_once_five_order(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times
                                                    )
                                                    console.log('used_once_five_order output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
    
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        promologId : response_data.promologId,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }
                                          
                                                if(mcondition == 'used_once_specific_category_order')
                                                {

                                                let output =  await used_once_specific_category_order(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times,
                                                    restaurant,
                                                    restaurant_category
                                                    )
                                                    console.log('used_once_specific_category_order output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
    
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        promologId : response_data.promologId,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }

                                                if(mcondition == 'referred_restaurant_new_user_never_placed_order_before')
                                                {
                                                     referralRestaurantFlag =1

                                                let output =  await referred_restaurant_new_user_never_placed_order_before(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times,
                                                    restaurant,
                                                    data.refferalCode
                                                    )
                                                    console.log('referred_restaurant_new_user_never_placed_order_before output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
    
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        promologId : response_data.promologId,
                                                                        mcondition:mcondition,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }
                                                
                                                if(mcondition == 'referred_user_new_user_never_placed_order_before')
                                                {
                                                     referralUserFlag =1
                                                let output =  await referred_user_new_user_never_placed_order_before(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times,
                                                    restaurant,
                                                    data.refferalCode
                                                    )
                                                    console.log('referred_user_new_user_never_placed_order_before output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
    
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        promologId : response_data.promologId,
                                                                        mcondition:mcondition,
                                                                        refferalCode:data.refferalCode,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }
       
                                                if(mcondition == 'one_order_placed_second_free')
                                                {
                                                let output =  await one_order_placed_second_free(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times,
                                                    restaurant,
                                                    authtoken
                                                    )
                                                    console.log('one_order_placed_second_free output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
                                                                
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        mcondition:mcondition,
                                                                        promologId : response_data.promologId,
                                                                        offerAmount : response_data.offerAmount,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }
                                                
                                                if(mcondition == 'two_order_placed_third_free')
                                                {
                                                let output =  await two_order_placed_third_free(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times,
                                                    restaurant,
                                                    authtoken
                                                    )
                                                    console.log('two_order_placed_third_free output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
                                                                
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        mcondition:mcondition,
                                                                        promologId : response_data.promologId,
                                                                        offerAmount : response_data.offerAmount,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                } 
                                                                                            
                                                if(mcondition == 'any_user')
                                                {

                                                let output =  await any_user(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times
                                                    )
                                                    console.log('any_user output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
    
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        promologId : response_data.promologId,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }

                                                if(mcondition == 'gold_member')
                                                {

                                                let output =  await gold_member(
                                                    userId,
                                                    orderId,
                                                    discount,
                                                    promocode,
                                                    discountType,
                                                    times,
                                                    next_order_times
                                                    )
                                                    console.log('gold_member output time--->',output)

                                                    if(output.length >0){
    
                                                        for (let index = 0; index < output.length; index++) {
                                                            let response_code = output[index].response_code;
                                                            let response_data = output[index].response_data;
                                                            if(response_code == '5005')
                                                            {
                                                                
                                                                callback({
                                                                    "success": false,
                                                                    "response_code":5005,
                                                                    "response_message":"INTERNAL DB ERROR",
                                                                    "response_data":{}
                                                                });
    
                                                            }else{
    
                                                                promocodeDiscountResultResponse.push(
                                                                    {
                                                                        promologId : response_data.promologId,
                                                                        discount : response_data.discount,
                                                                        discountType : response_data.discountType,
                                                                        response_code : response_code
                                                                    }
                                                                    ) 

                                                            }
                                                            
                                                        }
                                                     }


                                                }
                                            }
                                        }
                    
                                        console.log('output promocodeDiscountResultResponse-->',promocodeDiscountResultResponse)
                                           // let calculatedData           = await orderSchema.findOne({_id:orderId}).exec(async function (err, result) {
                                            let checkForFailedValidation =   promocodeDiscountResultResponse.filter(checkArray => checkArray.response_code == '5002')
                                            let checkForCloverValidation =   promocodeDiscountResultResponse.filter(checkClover => checkClover.discountType == 'clovers')
                                            let checkForReffRestValidation = promocodeDiscountResultResponse.filter(checkReffRest => checkReffRest.refferalCode !== undefined)
                                            let checkForReffUserValidation = promocodeDiscountResultResponse.filter(checkReffUser => checkReffUser.refferalCode !== undefined)
                                            let checkForBuyValidation = promocodeDiscountResultResponse.filter(checkBuyUser => checkBuyUser.offerAmount !== undefined)
                                          //  console.log('checkForReffRestValidation-->',checkForReffRestValidation)
                                          //  console.log('checkForReffUserValidation -->',checkForReffUserValidation.length)
                                            console.log('checkForBuyValidation---',checkForBuyValidation)

                                            if( referralUserFlag == 1 && checkForReffUserValidation.length == 0 )
                                            {
                                                if(!data.refferalCode)
                                                {
                                                    callback({
                                                        "success": false,
                                                        "response_code":5002,
                                                        "response_message":"Please Provide User refferalCode",
                                                        "response_data":{}
                                                    });                                                
                                                }
                                            }   
                                           else if( referralRestaurantFlag == 1 && checkForReffRestValidation.length == 0)
                                            {
                                                if(!data.refferalCode)
                                                {
                                                    callback({
                                                        "success": false,
                                                        "response_code":5002,
                                                        "response_message":"Please Provide Restaurant refferalCode",
                                                        "response_data":{}
                                                    });                                                
                                                }
                                            } 
                                          else if (checkForFailedValidation.length>0 )
                                           {
                                    
                                                callback({
                                                    "success": false,
                                                    "response_code":5002,
                                                    "response_message":"Promocode cannot be applied",
                                                    "response_data":{}
                                                });

                                            }else {

                                                let cartUserIdBody = { userId: userId };

                                                let [cartList] = await Promise.all([

                                                    fetch(config.liveUrl + 'api/cartList', {
                                                        method: 'post',
                                                        body: JSON.stringify(cartUserIdBody),
                                                        headers: { 
                                                            'Content-Type': 'application/json',
                                                            'x-access-token':authtoken
                                                        },
                                                    })
                                                        .then(res => res.json())
                                                
                                                    ]);

                                                    if(cartList.response_code != '2000')
                                                    {
                                                        callback(cartList.response_data);
                                                    }

                                                console.log('config.liveUrl--',config.liveUrl)
                                                console.log('cartList-->',cartList)
                                                let transactionAmount = 0
                                                if(checkForBuyValidation.length>0){
                                                     transactionAmount = checkForBuyValidation[0].offerAmount
                                                }else{
                                                     transactionAmount = cartList.response_data !== null ? cartList.response_data.cartTotal : 0

                                                }
                                                let calculatedAmount = 0
                                                let calculatedCloverDiscount = 0
                                                let calculatedAmountDeducted = 0
                                                promocodeDiscountResultResponse.length>0 ? 
                                                promocodeDiscountResultResponse.forEach(element => {
                                                    console.log('element.discountType-->',element.discountType)
                                                    // {
                                                    //     discount : response_data.discount,
                                                    //     discountType : response_data.discountType
                                                    // }
                                                    if(element.discountType == 'dollar'){

                                                        calculatedAmount = calculatedAmount + 
                                                                          (parseFloat(transactionAmount) - 
                                                                          parseFloat(element.discount))

                                                        calculatedAmountDeducted=calculatedAmountDeducted+ parseFloat(element.discount)
                                                    }else if(element.discountType == 'percentage'){

                                                        calculatedAmount = calculatedAmount + (parseFloat(transactionAmount)*                                                        
                                                        (1-(parseFloat(element.discount)/100)))                                                     
                                                        let discounted= parseFloat(element.discount)
                                                        if(discounted>0)
                                                        {
                                                            calculatedAmountDeducted=calculatedAmountDeducted+(parseFloat(transactionAmount)*                                                        
                                                            (parseFloat(discounted)/100))

                                                        }else{
                                                            calculatedAmountDeducted=calculatedAmountDeducted
                                                        }
                                                    }else{
                                                        calculatedCloverDiscount =calculatedCloverDiscount + parseFloat(element.discount)
                                                        calculatedAmount = calculatedAmount + parseFloat(transactionAmount)
                                                        
                                                        calculatedAmountDeducted=calculatedAmountDeducted
                                                       
                                                    }

                                                })
                                                :
                                                calculatedAmount = transactionAmount

                                                let value = parseFloat(parseFloat(calculatedAmount).toFixed(2))
                                                cartList.response_data.cartTotal = value
                                                //result = {...result.toObject(), promocodeAmount:value}
                                               // console.log('result true-->',result)

                                                if(checkForCloverValidation.length>0)
                                                {
                                                    
                                                //rewardPoint
                                                UserSchema.findOne({
                                                    _id:userId
                                                },
                                                 function (err, resDetail) {
                                                    if (err) {
                                                        callback({
                                                            "response_code": 5005,
                                                            "response_message": "INTERNAL DB ERROR",
                                                            "response_data": {}
                                                        });
                                                    } else {

                                                    let userRewardPoint = resDetail.rewardPoint !== undefined ? resDetail.rewardPoint :0
                                                    userRewardPoint = userRewardPoint +  calculatedCloverDiscount
                                                   
                                                    UserSchema.update({
                                                        _id:userId
                                                    }, {
                                                        $set: {
                                                            rewardPoint:userRewardPoint
                                                        }
                                                    }, function (err, resUpdate) {
                                                        if (err) {
                                                            callback({
                                                                "response_code": 5005,
                                                                "response_message": "INTERNAL DB ERROR",
                                                                "response_data": {}
                                                            });
                                                        } else {

            
                                                          
                                                        }
                                                    });

                                                    }
                                                });


                                                }
                                                let promologId=0
                                                if(promocodeDiscountResultResponse.length>0)
                                                {
                                                    promologId= promocodeDiscountResultResponse[0].promologId 

                                                }else{
                                                    promologId=''
                                                }

                                              //let user =  await UserSchema.find({_id:userId})
                                                callback({
                                                    "success": true,
                                                    "response_code": 2000,
                                                    "response_message": "Promocode applied Successfully.",
                                                    "response_data": {
                                                        ...cartList.response_data,
                                                        promologId:promologId,
                                                        promocodeAmountDeducted:parseFloat(calculatedAmountDeducted).toFixed(2)
                                                        },
                                                    "data":data
                                                   })

                                            }
                                      //  });
                        }else{
                            callback({
                                "success": false,
                                "response_code":5002,
                                "response_message":"Either Promocode is Invalid or Expire",
                                "response_data":{}
                            });
                        }

                    }

            })

        }

        }else{

            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "Invalid Token",
                "response_data": {}
            }) 

        }
        //#endregion to Validate token


    }else{

        callback({
            "success": false,
            "response_code": 5002,
            "response_message": "please provide correct token",
            "response_data": {}
        }) 

    }
},

};

async function used_once(userId,orderId,discount,promocode,discountType,times,next_order_times)
{

    console.log('used_once-->',userId)
   // promocodeLogSchema
   let checkResponse = [] 
   let validatedResponse = [] 
   let isDelete=0
   let promoFlag =0

   let checkCloseQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "orderpromo_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       }

   ])    
   .exec(async function (err, result) {

        if(err)
        {
            isDelete =1
        }
        console.log('resultsss--->',result)

       if(result[0].orderpromo_info.length == 0)
       {
        isDelete =1
           //console.log('result--->',result)
           promocodeLogSchema.remove(
               { promocodename : promocode ,userId : userId }
           ).exec(function (err,results){
               if(err)
               {
                   promoFlag =0
               }
               else
               {
                   promoFlag =1
               }
           })
         //  promoFlag =0

       }else{
        isDelete =0

           promoFlag =1
       }
    });

    console.log('isDelete--',isDelete)
    // if(isDelete === 1)
    // {
    //   //  console.log('result--->',result)
    //    await promocodeSchema.remove(
    //         { promocodename : promocode ,userId : userId }
    //     ).exec(function (err,result){
    //         if(err)
    //         {
    //             promoFlag =0
    //         }
    //         else
    //         {
    //             promoFlag =1
    //         }
    //     })
    // }

   //#region check for user
   let checkQuery  = await promocodeLogSchema.find({promocodename:promocode,userId:userId}).exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
   //#endregion check for user



   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data.length--',data.response_data.length)
            // true condition

            if(data.response_code == '2000' && data.response_data.length <= 0 )
            {
               // discount = '30'


            
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType

                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */

                        result = { discount:discount ,promologId:promolog._id, discountType:discountType }
                        console.log('used once result true-->',result)
                        validatedResponse.push({ response_code:2000 ,response_data:result })
            
                 

            }else 
            {
               
            
                        result = { discount:0 , discountType:discountType }

                        validatedResponse.push({ response_code:5002 ,response_data:result })
            
                   
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount

    return promise

}


async function first_time(userId,orderId,discount,promocode,discountType,times,next_order_times)
{

    console.log('first_time-->',userId)
   // orderSchema
   let checkResponse = [] 
   let validatedResponse = [] 
   let promoFlag =0

   let isDelete=0
   let checkCloseQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "orderpromo_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       }

   ])    
   .exec(async function (err, result) {

        if(err)
        {
            isDelete =1
        }
        console.log('resultsss--->',result)

       if(result[0].orderpromo_info.length == 0)
       {
        isDelete =1
           //console.log('result--->',result)
           promocodeLogSchema.remove(
               { promocodename : promocode ,userId : userId }
           ).exec(function (err,results){
               if(err)
               {
                   promoFlag =0
               }
               else
               {
                   promoFlag =1
               }
           })
         //  promoFlag =0

       }else{
        isDelete =0

           promoFlag =1
       }
    });

   //#region check for user
   let checkQuery  = await orderSchema.find({userId:userId}).exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
   //#endregion check for user



   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data.length--',data.response_data.length)
            console.log('data.response_data--',data.response_data)
            // true condition
            if(data.response_code == '2000' && data.response_data.length <= 0 )
            {
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType

                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */

                        result = { discount:discount ,promologId:promolog._id, discountType:discountType }


                         validatedResponse.push({ response_code:2000 ,response_data:result })
            
                   

            }else 
            {

            
                        result = { discount:0 , discountType:discountType }

                         validatedResponse.push({ response_code:5002 ,response_data:result })
            
                   
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount



    return promise


}

async function used_once_five_order(userId,orderId,discount,promocode,discountType,times,next_order_times)
{

    console.log('used_once_five_order-->',userId)
   // orderSchema
   let checkResponse = [] 
   let validatedResponse = [] 
    let promoFlag =0
   let isDelete=0
   let checkCloseQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "orderpromo_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       }

   ])    
   .exec(async function (err, result) {

        if(err)
        {
            isDelete =1
        }
        console.log('resultsss--->',result)

       if(result[0].orderpromo_info.length == 0)
       {
        isDelete =1
           //console.log('result--->',result)
           promocodeLogSchema.remove(
               { promocodename : promocode ,userId : userId }
           ).exec(function (err,results){
               if(err)
               {
                   promoFlag =0
               }
               else
               {
                   promoFlag =1
               }
           })
         //  promoFlag =0

       }else{
        isDelete =0

           promoFlag =1
       }
    });

   //#region check for user
   let checkQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "userId",   // name of users table field
               foreignField: "userId", // name of userinfo table field
               as: "order_info"         // alias for userinfo table
           }
       },
   
       // define some conditions here 
       {
           $match:{
            $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       },
       // Sorting pipeline
       {
            $sort: { "order_info.updatedAt": 1 } 
       }

   ])    
   .exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
   //#endregion check for user

    console.log('checkQuery 1--->',checkResponse)

   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data--',data.response_data)
            // true condition
            if(data.response_code == '2000' && data.response_data.length <= 0 )
            {

                //#region check for promocode used in 5 order or not
                console.log('promocode--->',promocode)

                                //true condition
                                //discount = 20

                                        /**
                                         * start create promocode log
                                         * 
                                         */
                                        var promolog={};
                                            promolog._id= new ObjectID;
                                            promolog.promocodename= promocode;
                                            promolog.userId=userId;
                                            promolog.orderId=orderId
                                            promolog.discount =discount
                                            promolog.discountType =discountType

                                            new promocodeLogSchema(promolog).save(function (err, result) {
                                                if (err) 
                                                {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                }
                                            });
                                            result = { discount:discount ,promologId:promolog._id, discountType:discountType }

                                            /**
                                             * end create promocode log
                                             * 
                                             */
                                  validatedResponse.push({ response_code:2000 ,response_data:result })
                                                          
                          
                //#endregion check for user

            }else 
            {
                        //result = { discount:discount}
                        result = { discount:0 , discountType:discountType }

                         validatedResponse.push({ response_code:5002 ,response_data:result })
            
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount



    return promise


}

async function used_once_specific_category_order(userId,
                                                orderId,discount,promocode,discountType,
                                                times,next_order_times,restaurant,restaurant_category)
{

    console.log('used_once_specific_category_order restaurant-->',restaurant)
    console.log('used_once_specific_category_order category-->',restaurant_category)
   // orderSchema
   let checkResponse = [] 
   let validatedResponse = [] 
   let orderFlag =0;

   let isDelete=0
   let checkCloseQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "orderpromo_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       }

   ])    
   .exec(async function (err, result) {

        if(err)
        {
            isDelete =1
        }
        console.log('resultsss--->',result)

       if(result[0].orderpromo_info.length == 0)
       {
        isDelete =1
           //console.log('result--->',result)
           promocodeLogSchema.remove(
               { promocodename : promocode ,userId : userId }
           ).exec(function (err,results){
               if(err)
               {
                   orderFlag =0
               }
               else
               {
                   orderFlag =1
               }
           })
         //  orderFlag =0

       }else{
        isDelete =0

           orderFlag =1
       }
    });


   let validatedOrderQuery  = await orderSchema.findOne({ _id:orderId,
                                                          restaurant_id:restaurant
    })
     .exec(function (err, result) {
    if (err) {
        orderFlag =0

    } else {

        orderFlag =1
    }
    });
    
    console.log('aggregate orderFlag-->',orderFlag)

   //
   //#region check for user
   let checkQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "restaurants",    // other table name
               localField: "restaurant",   // name of restaurants table field
               foreignField: "_id", // name of userinfo table field
               as: "restaurants_info"         // alias for userinfo table
           }
       },
       {   $unwind:"$restaurants_info" },     // $unwind used for getting data in object or for one record only

       {
           $match:{
               $and :[
                {promocodename : promocode}  ,
                {restaurantCategory    :  restaurant_category }, 
                { userId : userId }
               ]
           }
       }

   ])
   .exec(function (err, result) {
       console.log('aggregate promocode-->',result)
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        }else   if(orderFlag=='0')
        {
            return  checkResponse.push({ response_code:5002 ,response_data:[] })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
   //#endregion check for user

    console.log('checkQuery 1--->',checkResponse)

   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data--',data.response_data)
            // true condition
            if(data.response_code == '2000' && data.response_data.length <=0 )
            {

                                //true condition
                                //discount = 20

                                        /**
                                         * start create promocode log
                                         * 
                                         */
                                        var promolog={};
                                            promolog._id= new ObjectID;
                                            promolog.promocodename= promocode;
                                            promolog.userId=userId;
                                            promolog.orderId=orderId
                                            promolog.discount =discount
                                            promolog.discountType =discountType
                                            promolog.restaurant =restaurant
                                            promolog.restaurantCategory =restaurant_category
                                            
                                          await  new promocodeLogSchema(promolog).save(function (err, result) {
                                                if (err) 
                                                {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                }
                                            });

                                            /**
                                             * end create promocode log
                                             * 
                                             */
                                            result = { discount:discount ,promologId:promolog._id, discountType:discountType }
                                            //console.log('---------result---->',result)
                                  validatedResponse.push({ response_code:2000 ,response_data:result })

                //#endregion check for user

            }else 
            {
                let validatedQuery  = await orderSchema.findOne({_id:orderId}).exec(function (err, result) {
                    if (err) {
            
                        return  validatedResponse.push({ response_code:5005 ,response_data:err })
            
                    } else {
            
                        //result = { discount:discount}
                        result = { discount:0 , discountType:discountType }

                        return validatedResponse.push({ response_code:5002 ,response_data:result })
            
                    }
                });
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount



    return promise


}

async function referred_restaurant_new_user_never_placed_order_before(userId,orderId,discount,promocode,
    discountType,times,next_order_times,restaurant,referralCode)
{

    console.log('1st referralCode-->',referralCode)
   // orderSchema
   let checkResponse = [] 
   let validatedResponse = [] 
   let restaurantFlag =0;
   let restaurantRefferedCode ='';
   let isDelete=0
   let checkCloseQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "orderpromo_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       }

   ])    
   .exec(async function (err, result) {

        if(err)
        {
            isDelete =1
        }
        console.log('resultsss--->',result)

       if(result[0].orderpromo_info.length == 0)
       {
        isDelete =1
           //console.log('result--->',result)
           promocodeLogSchema.remove(
               { promocodename : promocode ,userId : userId }
           ).exec(function (err,results){
               if(err)
               {
                   restaurantFlag =0
               }
               else
               {
                   restaurantFlag =1
               }
           })
         //  restaurantFlag =0

       }else{
        isDelete =0

           restaurantFlag =1
       }
    });

   if(referralCode !== undefined)
   {
   let validatedRestaurantRefferedCodeQuery  = await RestaurantSchema.findOne(
       { _id:restaurant,referralCode:referralCode})
    .exec(function (err, result) {
    if (err) {
        restaurantFlag =0

    } else {

        restaurantFlag =1
        // result.referralCode    = result.referralCode !== undefined? result.referralCode:''
        // restaurantRefferedCode = result.referralCode
    }
    });
    }else{
    
        restaurantFlag =0

    }

    console.log('aggregate restaurantFlag-->',restaurantFlag)



   //#region check for user
   let checkQuery  = await await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "userId",   // name of users table field
               foreignField: "userId", // name of userinfo table field
               as: "order_info"         // alias for userinfo table
           }
       },
       {   $unwind:"$order_info" },     // $unwind used for getting data in object or for one record only
   
       // define some conditions here 
       {
           $match:{
            $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       }

   ])    
   .exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        }else   if(restaurantFlag=='0')
        {
            return  checkResponse.push({ response_code:5002 ,response_data:[] })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
   //#endregion check for user

console.log('---1st checkResponse--',checkResponse)

   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data.length--',data.response_data.length)
            // true condition
            if(data.response_code == '2000' && data.response_data.length <= 0 )
            {


                        
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType
                        promolog.restaurant =restaurant
                        promolog.referralCode =referralCode
                        
                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */

                        result = { discount:discount ,promologId:promolog._id, discountType:discountType }

                         validatedResponse.push({ response_code:2000 ,response_data:result })
            
                   

            }else 
            {
               
            
                        result = { discount:0 , discountType:discountType }

                         validatedResponse.push({ response_code:5002 ,response_data:result })
            
                   
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount



    return promise


}

async function referred_user_new_user_never_placed_order_before(userId,orderId,discount,promocode,
    discountType,times,next_order_times,restaurant,referralCode)
{

    console.log('1st referralCode-->',referralCode)
   // orderSchema
   let checkResponse = [] 
   let validatedResponse = [] 
   let userFlag =0;
   let userRefferedId ='';
   //cartList
   let isDelete=0
   let checkCloseQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "orderpromo_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       }

   ])    
   .exec(async function (err, result) {

        if(err)
        {
            isDelete =1
        }
        console.log('resultsss--->',result)

       if(result[0].orderpromo_info.length == 0)
       {
        isDelete =1
           //console.log('result--->',result)
           promocodeLogSchema.remove(
               { promocodename : promocode ,userId : userId }
           ).exec(function (err,results){
               if(err)
               {
                   userFlag =0
               }
               else
               {
                   userFlag =1
               }
           })
         //  userFlag =0

       }else{
        isDelete =0

           userFlag =1
       }
    });


    if(referralCode !== undefined)
    {
        let validatedUserRefferedCodeQuery  = await UserSchema.findOne(
            { referralCode:referralCode})
            .exec(function (err, result) {
            if (err) {
                userFlag =0

            } else {

                userFlag =1
                result.referralCode    = result.referralCode !== undefined? result.referralCode:''
                userRefferedId         = result._id
            }
            });
    }else{
        userFlag =0
    }
    console.log('aggregate userFlag-->',userFlag)


    //userId = ""
   //#region check for user
   let checkQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "userId",   // name of users table field
               foreignField: "userId", // name of userinfo table field
               as: "order_info"         // alias for userinfo table
           }
       },
       {   $unwind:"$order_info" },     // $unwind used for getting data in object or for one record only
   
       // define some conditions here 
       {
           $match:{
            $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
          }
       }

   ])    
   .exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        }else   if(userFlag=='0')
        {
            return  checkResponse.push({ response_code:5002 ,response_data:[] })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
   //#endregion check for user

console.log('---1st checkResponse--',checkResponse)

   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data.length--',data.response_data.length)
            // true condition
            if(data.response_code == '2000' && data.response_data.length <= 0 )
            {

                                     
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType
                        promolog.restaurant =restaurant
                        promolog.referralCode =referralCode
                        promolog.userRefferedId =userRefferedId
                        
                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */

                        result = { discount:discount ,
                            promologId:promolog._id,
                            discountType:discountType }

                         validatedResponse.push({ response_code:2000 ,response_data:result })
            
                   

            }else 
            {

            
                        result = { discount:0 , discountType:discountType }

                         validatedResponse.push({ response_code:5002 ,response_data:result })
            
                    
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount



    return promise


}

async function one_order_placed_second_free(userId,orderId,discount,promocode,
    discountType,times,next_order_times,restaurant,authtoken)
{

    console.log('1st referralCode-->',userId)
   // orderSchema
   let checkResponse = [] 
   let checkArrayRemoveStep1= [] 
   let validatedResponse = [] 
   let userFlag =0;
   let userRefferedId ='';
   //cartList
   let isDelete=0
   let promoFlag=0

        let promocodeAllQuery  = await promocodeLogSchema.find({
        promocodename : promocode ,
        userId : userId 
        })
        .exec(async function (err, result) {
        if (err) {

        } else {
            console.log('checkArrayRemoveStep1 list---',result)
            if(result.length > 0)
            {
                for (let index = 0; index < result.length; index++) {
                    let element = result[index];
                    let promoLogId=element._id
                    checkArrayRemoveStep1.push(promoLogId)
                }


            }

        }
        });
let checkArrayRemoveStep2= [] 
console.log('--checkArrayRemoveStep1---',checkArrayRemoveStep1)
if(checkArrayRemoveStep1.length>0)
{
    

    for (let index = 0; index < checkArrayRemoveStep1.length; index++) {
        
        let pID = checkArrayRemoveStep1[index];
        
        let checkCloseQuery  = await promocodeLogSchema
        .aggregate([

            // Join with order_info table
            {
                $lookup:{
                        from: "orders",    // other table name
                        localField: "_id",   // name of users table field
                        foreignField: "promologId", // name of userinfo table field
                        as: "orderpromo_info"         // alias for userinfo table
                }
            },

            // define some conditions here 
            {
                $match:{
                    _id:pID
                }
            }
            ,{
                $project: {
                        _id: 1,
                        'orderpromo_info': 1
                }
            },

        ])    
        .exec(async function (err, result) {

                    if(err)
                    {
                        isDelete =1
                    }
                        console.log('resultsss--->',result)

                    if(result[0].orderpromo_info.length == 0)
                    {
                        isDelete =1
                        checkArrayRemoveStep2.push(pID)
                        //console.log('result--->',result)
                           
                        //  promoFlag =0

                    }else{
                        isDelete =0

                        promoFlag =1
                    }
        });

    }
}

if(checkArrayRemoveStep2.length>0)
{
    for (let index2 = 0; index2 < checkArrayRemoveStep2.length; index2++) {
        let elementRemove = checkArrayRemoveStep2[index2];

        promocodeLogSchema.remove(
            { _id : elementRemove }
            )
            .exec(function (err,results){
            if(err)
            {
            promoFlag =0
            }
            else
            {
            promoFlag =1
            }
            })
    }
}
    //userId = ""
   //#region check for user
    var d = new Date();
    d.setDate(d.getDate()-7);
    var endDate = moment(d).endOf('day');
    console.log('endDate---',endDate)
    let promoExistFlag =0;
    let checkForSevenDayQuery  = await promocodeLogSchema.findOne({
                                                                promocodename : promocode ,
                                                                userId : userId 
                                                                })
     .exec(async function (err, result) {
    if (err) {
        promoFlag =0

    } else {
        console.log('result-->',result)
            if(result === null)
            {

                promoFlag =1
            }else{
                promoExistFlag =1
                promoFlag =1
                

            }
    }
    });

    if(promoExistFlag==1)
    {
    let checkForValidDayQuery  = await promocodeLogSchema.findOne({
        promocodename : promocode ,
        updatedAt : {$gte:endDate} ,
        userId : userId 
        })

        console.log('checkForValidDayQuery-->',checkForValidDayQuery)
        if(checkForValidDayQuery === null)
        {
            promoFlag =0

        }else{
            promoFlag =1
        }
    }
console.log('---1st promoFlag--',promoFlag)


   let checkQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "order_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       },
        // Sorting pipeline
        {
             $sort: { "order_info.updatedAt": 1 } 
        }

        // Optionally limit results
        // { 
        //     $limit: 1 
        // }

   ])    
   .exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        }else if(promoFlag==0){
            return  checkResponse.push({ response_code:5002 ,response_data:{} })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });

   //#endregion check for user

console.log('---1st checkResponse--',checkResponse)

   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

                    console.log('data.response_data--',data.response_data)
                    let offerAmount = 0
                    // true condition
                    let flag=0
                    flag= 
                   ( data.response_data.length !== undefined && data.response_data.length !== 0 ) ? 
                    data.response_data.length:
                    0
                    console.log('---------flag------',flag)

                    if(data.response_code == '2000' && flag <= 1 )
                    {

                    let  previousOrderAmount =0
                    let  transactionAmount   =0

                    let cartUserIdBody = { userId: userId };

                    let [cartList] = await Promise.all([

                        fetch(config.liveUrl + 'api/cartList', {
                            method: 'post',
                            body: JSON.stringify(cartUserIdBody),
                            headers: { 
                                'Content-Type': 'application/json',
                                'x-access-token':authtoken
                            },
                        })
                            .then(res => res.json())
                    
                        ]);

                        if(cartList.response_code != '2000')
                        {
                            callback(cartList.response_data);
                        }

                    console.log('config.liveUrl--',config.liveUrl)
                    console.log('cartList-->',cartList)
                    transactionAmount = cartList.response_data !== null ? cartList.response_data.cartTotal : 0
                    console.log('transactionAmount-->',transactionAmount)
                    console.log('flag-->',flag)

                    if(data.response_data.length>=1 )
                    {
                        

                        previousOrderAmount =
                        data.response_data[0].order_info.length>0 ?
                        data.response_data[0].order_info[0].transactionAmount :
                        0

                        if((parseFloat(previousOrderAmount) < parseFloat(transactionAmount))  && parseInt(flag) ==1 )
                        {
                            console.log('transactionAmount ok-->')

                            offerAmount = parseFloat(transactionAmount) - parseFloat(previousOrderAmount)
                        }else{
                            console.log('transactionAmount not ok-->')

                            offerAmount = parseFloat(transactionAmount)

                        }

                       // }
                    }else{
                        offerAmount = parseFloat(transactionAmount)
                    }
                                     
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType
                        promolog.restaurant =restaurant
                        
                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */
                            console.log('offerAmount ok-->',offerAmount)

                        result = {
                                discount:0 ,
                                offerAmount:offerAmount,
                                promologId:promolog._id,
                                discountType:discountType
                         }

                        validatedResponse.push({ response_code:2000 ,response_data:result })
            
                   

            }else 
            {
                let validatedQuery  = await orderSchema.findOne({_id:orderId}).exec(function (err, result) {
                    if (err) {
            
                        return  validatedResponse.push({ response_code:5005 ,response_data:err })
            
                    } else {
            
                        result = { discount:0 , discountType:discountType }

                        return validatedResponse.push({ response_code:5002 ,response_data:result })
            
                    }
                });
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount



    return promise


}

async function two_order_placed_third_free(userId,orderId,discount,promocode,
    discountType,times,next_order_times,restaurant,authtoken)
{

    console.log('1st referralCode-->',userId)
   // orderSchema

   let checkResponse = [] 
   let checkArrayRemoveStep1= [] 
   let validatedResponse = [] 
   let userFlag =0;
   let userRefferedId ='';
   //cartList
   let isDelete=0
   let promoFlag=0

        let promocodeAllQuery  = await promocodeLogSchema.find({
        promocodename : promocode ,
        userId : userId 
        })
        .exec(async function (err, result) {
        if (err) {

        } else {
            console.log('checkArrayRemoveStep1 list---',result)
            if(result.length > 0)
            {
                for (let index = 0; index < result.length; index++) {
                    let element = result[index];
                    let promoLogId=element._id
                    checkArrayRemoveStep1.push(promoLogId)
                }


            }

        }
        });
let checkArrayRemoveStep2= [] 
console.log('--checkArrayRemoveStep1---',checkArrayRemoveStep1)
if(checkArrayRemoveStep1.length>0)
{
    

    for (let index = 0; index < checkArrayRemoveStep1.length; index++) {
        
        let pID = checkArrayRemoveStep1[index];
        
        let checkCloseQuery  = await promocodeLogSchema
        .aggregate([

            // Join with order_info table
            {
                $lookup:{
                        from: "orders",    // other table name
                        localField: "_id",   // name of users table field
                        foreignField: "promologId", // name of userinfo table field
                        as: "orderpromo_info"         // alias for userinfo table
                }
            },

            // define some conditions here 
            {
                $match:{
                    _id:pID
                }
            }
            ,{
                $project: {
                        _id: 1,
                        'orderpromo_info': 1
                }
            },

        ])    
        .exec(async function (err, result) {

                    if(err)
                    {
                        isDelete =1
                    }
                        console.log('resultsss--->',result)

                    if(result[0].orderpromo_info.length == 0)
                    {
                        isDelete =1
                        checkArrayRemoveStep2.push(pID)
                        //console.log('result--->',result)
                           
                        //  promoFlag =0

                    }else{
                        isDelete =0

                        promoFlag =1
                    }
        });

    }
}

if(checkArrayRemoveStep2.length>0)
{
    for (let index2 = 0; index2 < checkArrayRemoveStep2.length; index2++) {
        let elementRemove = checkArrayRemoveStep2[index2];

        promocodeLogSchema.remove(
            { _id : elementRemove }
            )
            .exec(function (err,results){
            if(err)
            {
            promoFlag =0
            }
            else
            {
            promoFlag =1
            }
            })
    }
}
    //userId = ""
   //#region check for user
    var d = new Date();
    d.setDate(d.getDate()-7);
    var endDate = moment(d).endOf('day');
    console.log('endDate---',endDate)
    let promoExistFlag =0;
    let checkForSevenDayQuery  = await promocodeLogSchema.findOne({
                                                                promocodename : promocode ,
                                                                userId : userId 
                                                                })
     .exec(async function (err, result) {
    if (err) {
        promoFlag =0

    } else {
        console.log('result-->',result)
            if(result === null)
            {

                promoFlag =1
            }else{
                promoExistFlag =1
                promoFlag =1
                

            }
    }
    });

    if(promoExistFlag==1)
    {
    let checkForValidDayQuery  = await promocodeLogSchema.findOne({
        promocodename : promocode ,
        updatedAt : {$gte:endDate} ,
        userId : userId 
        })

        console.log('checkForValidDayQuery-->',checkForValidDayQuery)
        if(checkForValidDayQuery === null)
        {
            promoFlag =0

        }else{
            promoFlag =1
        }
    }
console.log('---1st promoFlag--',promoFlag)


   let checkQuery  = await promocodeLogSchema
   .aggregate([

       // Join with order_info table
       {
           $lookup:{
               from: "orders",    // other table name
               localField: "_id",   // name of users table field
               foreignField: "promologId", // name of userinfo table field
               as: "order_info"         // alias for userinfo table
           }
       },

       // define some conditions here 
       {
           $match:{
               $and:[
                { promocodename : promocode },
                { userId : userId },
            ]
           }
       },
        // Sorting pipeline
        {
             $sort: { "order_info.updatedAt": 1 } 
        }
        // Optionally limit results
        // { 
        //     $limit: 1 
        // }

   ])    
   .exec(async function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        }else if(promoFlag==0){
            return  checkResponse.push({ response_code:5002 ,response_data:{} })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
   //#endregion check for user

console.log('---1st checkResponse--',checkResponse)

   //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

                    console.log('data.response_data-->',data.response_data)
                    let offerAmount = 0
                    console.log('data.response_data.length--',data.response_data.length)
                    // true condition
                    let flag=0
                    flag= 
                    ( data.response_data.length !== undefined && data.response_data.length !== 0 ) ? 
                     data.response_data.length:
                     0

                     console.log('data.response_data-->',data.response_data)

                    if(data.response_code == '2000' && flag <= 2 )
                    {
                    let  previousOrderAmount =0
                    let  transactionAmount   =0
                    let  previousArrayAmount= [] 

                    let cartUserIdBody = { userId: userId };

                    let [cartList] = await Promise.all([

                        fetch(config.liveUrl + 'api/cartList', {
                            method: 'post',
                            body: JSON.stringify(cartUserIdBody),
                            headers: { 
                                'Content-Type': 'application/json',
                                'x-access-token':authtoken
                            },
                        })
                            .then(res => res.json())
                    
                        ]);

                        if(cartList.response_code != '2000')
                        {
                            callback(cartList.response_data);
                        }

                    console.log('config.liveUrl--',config.liveUrl)
                    console.log('cartList-->',cartList)
                    transactionAmount = cartList.response_data !== null ? cartList.response_data.cartTotal : 0
                   


                    if(data.response_data.length>=1 )
                    {
                        console.log('--inner data.response_data--',data.response_data[0].order_info)
                        data.response_data[0].order_info.length = 
                        data.response_data[0].order_info.length<=2 ? 
                        data.response_data[0].order_info.length :
                        2

                        for (let index = 0; index < data.response_data[0].order_info.length ; index++)
                        {
                        console.log('--inner indexing--',index)
                        previousOrderAmount =data.response_data[0].order_info[index].transactionAmount
                        previousArrayAmount.push(previousOrderAmount)

                       // }
                        }
                        console.log('previousArrayAmount--',previousArrayAmount)
                        let validPreviousAmount=0
                        if(previousArrayAmount.length>0 )
                        {
                            for (let index = 0; index < previousArrayAmount.length; index++) {
                                let prevData = previousArrayAmount[index];
                                if(parseFloat(prevData) < parseFloat(transactionAmount))
                                {
                                    validPreviousAmount=1
                                }
                            }
                        }

                        if(parseInt(validPreviousAmount) == 1 && parseInt(flag) ==2)
                        {
                            offerAmount = parseFloat(transactionAmount) - parseFloat(previousOrderAmount)
                        }else{
                            offerAmount = parseFloat(transactionAmount)

                        }
                    

                    }else{
                        offerAmount = parseFloat(transactionAmount)
                    }
                                     
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType
                        promolog.restaurant =restaurant
                        
                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */

                        result = {
                                discount:0 ,
                                offerAmount:offerAmount,
                                promologId:promolog._id,
                                discountType:discountType
                         }

                        validatedResponse.push({ response_code:2000 ,response_data:result })
    

            }else 
            {

                        result = { discount:0 , discountType:discountType }

                         validatedResponse.push({ response_code:5002 ,response_data:result })
            

            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

   //#endregion calculate promocode amount



    return promise


}

async function any_user(userId,orderId,discount,promocode,discountType,times,next_order_times)
{

    console.log('any_user-->',userId)
    // orderSchema
    let checkResponse = [] 
    let validatedResponse = [] 
    let isDelete=0
    let promoFlag=0

    let checkCloseQuery  = await promocodeLogSchema
    .aggregate([
 
        // Join with order_info table
        {
            $lookup:{
                from: "orders",    // other table name
                localField: "_id",   // name of users table field
                foreignField: "promologId", // name of userinfo table field
                as: "orderpromo_info"         // alias for userinfo table
            }
        },
 
        // define some conditions here 
        {
            $match:{
                $and:[
                 { promocodename : promocode },
                 { userId : userId },
             ]
            }
        }
 
    ])    
    .exec(async function (err, result) {
 
         if(err)
         {
             isDelete =1
         }
         console.log('resultsss--->',result[0].orderpromo_info.length)
 
        if(result[0].orderpromo_info.length == 0)
        {
         isDelete =1
            //console.log('result--->',result)
            promocodeLogSchema.remove(
                { promocodename : promocode ,userId : userId }
            ).exec(function (err,results){
                if(err)
                {
                    promoFlag =0
                }
                else
                {
                    promoFlag =1
                }
            })
          //  promoFlag =0
 
        }else{
         isDelete =0
 
            promoFlag =1
        }
     });
 
    //#region check for user
    let checkQuery  = await UserSchema.find({_id:userId}).exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
    //#endregion check for user



    //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data.length--',data.response_data.length)
            console.log('data.response_data--',data.response_data)
            // true condition
            if(data.response_code == '2000')
            {
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType

                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */

                        result = { discount:0 ,promologId:promolog._id, discountType:discountType }


                            validatedResponse.push({ response_code:2000 ,response_data:result })
            
                    

            }else 
            {

            
                        result = { discount:0 , discountType:discountType }

                            validatedResponse.push({ response_code:5002 ,response_data:result })
            
                    
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

    //#endregion calculate promocode amount



    return promise


}

async function gold_member(userId,orderId,discount,promocode,discountType,times,next_order_times)
{

    console.log('gold_member-->',userId)
    // orderSchema
    let checkResponse = [] 
    let validatedResponse = [] 
    let isDelete=0
    let promoFlag=0
    let checkCloseQuery  = await promocodeLogSchema
    .aggregate([
 
        // Join with order_info table
        {
            $lookup:{
                from: "orders",    // other table name
                localField: "_id",   // name of users table field
                foreignField: "promologId", // name of userinfo table field
                as: "orderpromo_info"         // alias for userinfo table
            }
        },
 
        // define some conditions here 
        {
            $match:{
                $and:[
                 { promocodename : promocode },
                 { userId : userId },
             ]
            }
        }
 
    ])    
    .exec(async function (err, result) {
 
         if(err)
         {
             isDelete =1
         }
         console.log('resultsss--->',result)
 
        if(result[0].orderpromo_info.length == 0)
        {
         isDelete =1
            //console.log('result--->',result)
            promocodeLogSchema.remove(
                { promocodename : promocode ,userId : userId }
            ).exec(function (err,results){
                if(err)
                {
                    promoFlag =0
                }
                else
                {
                    promoFlag =1
                }
            })
          //  promoFlag =0
 
        }else{
         isDelete =0
 
            promoFlag =1
        }
     });
 
    //#region check for user
    let checkQuery  = await UserSchema.find({gold_member:'yes'}).exec(function (err, result) {
        if (err) {

            return  checkResponse.push({ response_code:5005 ,response_data:err })

        } else {

            return checkResponse.push({ response_code:2000 ,response_data:result })

        }
    });
    //#endregion check for user



    //#region calculate promocode amount

    let promise = new Promise(  function(resolve, reject) {

        checkResponse.map( async function(data) { 

            console.log('data.response_data.length--',data.response_data.length)
            console.log('data.response_data--',data.response_data)
            // true condition
            if(data.response_code == '2000')
            {
                        /**
                         * start create promocode log
                         * 
                         */
                        
                        var promolog={};
                        promolog._id= new ObjectID;
                        promolog.promocodename= promocode;
                        promolog.userId=userId;
                        promolog.orderId=orderId
                        promolog.discount =discount
                        promolog.discountType =discountType

                        new promocodeLogSchema(promolog).save(function (err, result) {
                            if (err) 
                            {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            }
                        });

                        /**
                         * end create promocode log
                         * 
                         */

                        result = { discount:0 ,promologId:promolog._id, discountType:discountType }


                            validatedResponse.push({ response_code:2000 ,response_data:result })
            
                    

            }else 
            {

            
                        result = { discount:0 , discountType:discountType }

                            validatedResponse.push({ response_code:5002 ,response_data:result })
            
                    
                
            }
            console.log('checked response--->',validatedResponse)

            resolve(validatedResponse)
            return validatedResponse

        })
    })
    .then( res => res )

    //#endregion calculate promocode amount



    return promise


}
module.exports = PromocodeService;