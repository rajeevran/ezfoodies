var async = require("async");
var mongo = require('mongodb');
var moment = require('moment');
var ObjectID = mongo.ObjectID;
var config = require('../config');

var jwt = require('jsonwebtoken');
var secretKey = config.secretKey;
const fetch = require('node-fetch');

var rewardsFacilitySchema = require('../schema/rewards');
var rewardsFacilityLogSchema = require('../schema/rewardsFacilityLog');
var orderSchema     = require('../schema/order');
var UserSchema = require('../schema/users');
var UserSettingSchema = require('../schema/userSetting');
var RestaurantSchema = require('../schema/restaurant');
var temporaryCloverSchema = require('../schema/temporaryClover');
var temporaryCartPromoClover =  require('../schema/temporaryCartPromoClover');


var RewardsFacilityService = 
{
rewardsFacilityList:function(callback)
{
rewardsFacilitySchema.find(
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
                "response_message":"RewardsFacility list",
                "response_data":result
            });
        }
    })
},

addRewardsFacility:function(data,callback)
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
                    "response_message": "Please Provide Rewards Facility name",
                    "response_data": {}
                }) 
            } else if(data.type=='' || data.type==undefined)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide type of reward",
                    "response_data": {}
                }) 
            } else
            {
            rewardsFacilitySchema.count({
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
                            "response_message": "RewardsFacility with same name already exist.Please try another one.",
                            "response_data": {}
                        });
                    } else
                        {
                            
                        var rewards={};
                        rewards._id= new ObjectID;
                        rewards.name= data.name;
                        rewards.type=data.type;
                        rewards.timesOfClover=data.timesOfClover;
                        rewards.orderProvided=data.orderProvided;
                        rewards.orderDependsOn=data.orderDependsOn,
                        rewards.timeLimitation=data.timeLimitation;
                        rewards.notificationDateOn=data.notificationDateOn; 
                        rewards.maxCloverPoint=data.maxCloverPoint;
                        rewards.additionalUserCLover=data.additionalUserCLover;
                        rewards.enable=data.enable,
                        rewards.discount=data.discount,
                        rewards.clover=data.clover

                        new rewardsFacilitySchema(rewards).save(function (err, result) {
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
rewardsFacilityDetails:function(data,callback)
{
    rewardsFacilitySchema.findOne(
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
                    "response_message":"RewardsFacility Details",
                    "response_data":result
            });
        }
    })
},
editRewardsFacility: function(data,callback)
{
    rewardsFacilitySchema.update(
        { _id:data._id },
        {
            $set:
                {

                    name: data.name,
                    type:data.type,
                    timesOfClover:data.timesOfClover,
                    orderProvided:data.orderProvided,
                    orderDependsOn:data.orderDependsOn, 
                    timeLimitation:data.timeLimitation,
                    notificationDateOn:data.notificationDateOn,
                    maxCloverPoint:data.maxCloverPoint,
                    additionalUserCLover:data.additionalUserCLover,
                    enable:data.enable,
                    discount:data.discount,
                    clover:data.clover
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
                    "response_message": "RewardsFacility Details has been updated.",
                    "response_data": result,
                    "data":data

                });
            }
        });
},
editRewardsFacilityStatusModel: function(data,callback)
{
    rewardsFacilitySchema.update(
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
deleteRewardsFacility:function(data,callback)
{
    rewardsFacilitySchema.remove(
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
                    "response_message":"RewardsFacility Deleted Successfully",
                
            });
        }
    })
},

deleteRewardsFacilityLogModel: async function(data,callback)
{


    //rewardlogIds

    if(!data._id)
    {
        callback({
            "response_code":5002,
                "response_message":"Please Provide RewardLogIds _id in array",
                "response_data":[]
        });
    }else if(!data.cartIds)
    {
        callback({
            "response_code":5002,
                "response_message":"Please Provide cartIds in array",
                "response_data":[]
        });
    }else if(!data.restaurantId)
    {
        callback({
            "response_code":5002,
                "response_message":"Please Provide restaurantId",
                "response_data":[]
        });
    }
    else if(!data.totalCartQuantity)
    {
        callback({
            "success": false,
            "response_code": 5002,
            "response_message": "please provide totalCartQuantity",
            "response_data": {}
        }) 
    }

    let getPromocodeUserId             =   await rewardsFacilityLogSchema.findOne({
         "_id": { "$in": data._id }
    })

    let cartPromocodeList =''
    
    if(getPromocodeUserId !== null)
    {
        let checkCartPromocodeApplied           =   await temporaryCloverSchema.findOne({
            cartIds           : data.cartIds,
            userId            : getPromocodeUserId.userId,
            restaurantId      : data.restaurantId,
            totalCartQuantity : data.totalCartQuantity,
            isRewardApplied   : true
        }).sort({ updatedAt: -1})

        console.log('---userId-->',getPromocodeUserId.userId)
        console.log('---restaurantId-->',data.restaurantId)
        console.log('---getPromocodeUserId-->',getPromocodeUserId)
        console.log('---checkCartPromocodeApplied-->',checkCartPromocodeApplied)


        // "subTotal": 73,
        // "cartTotal": "-34.30",
        // "amountDeducted": "107.30",
        // "userRewardPoint": "8000",
        // "promologId": "5e2850c12ccdf0276c9bb64b",
        // "promocode": "SAVE100",
        // "restaurantBasedRewardPoint": 0,
        // "promocodeDeductedAmount": 7.3,
        // "rewardDeductedAmount": 100, promocodeDeductedAmount
        if(checkCartPromocodeApplied !== null)                                                                        
        {                   
            let  rewardDeductedAmount        = checkCartPromocodeApplied.rewardDeductedAmount
            let  amountDeducted              = checkCartPromocodeApplied.amountDeducted
            let  deductedRedeemPoint         = checkCartPromocodeApplied.deductedRedeemPoint
            let  userRewardPoint             = checkCartPromocodeApplied.userRewardPoint

            let  cartAmount                  = checkCartPromocodeApplied.cartAmount

            cartAmount                       = parseFloat(cartAmount) + parseFloat(rewardDeductedAmount)
            userRewardPoint                  = parseInt(userRewardPoint) + parseInt(deductedRedeemPoint)
            amountDeducted                   = parseFloat(amountDeducted) - parseFloat(rewardDeductedAmount)
            
            console.log('---cartAmount 1---',cartAmount )
            console.log('---rewardDeductedAmount 1---',rewardDeductedAmount)
            //delete cartList.data
            
                checkCartPromocodeApplied.userRewardPoint         = userRewardPoint
                checkCartPromocodeApplied.rewardDeductedAmount    = 0
                checkCartPromocodeApplied.deductedRedeemPoint     = 0
                checkCartPromocodeApplied.isRewardApplied         = false
                checkCartPromocodeApplied.amountDeducted          = parseFloat(amountDeducted).toFixed(2)
                checkCartPromocodeApplied.cartAmount              = parseFloat(cartAmount).toFixed(2)
                checkCartPromocodeApplied.rewardlogIds            = []

                

            console.log('---getPromocodeUserId.userId---->',getPromocodeUserId.userId)

           let updateCartPromocodeApplied       =   await temporaryCloverSchema.update({
                                                            cartIds           : data.cartIds,
                                                            userId            : getPromocodeUserId.userId,
                                                            restaurantId      : data.restaurantId,
                                                            totalCartQuantity : data.totalCartQuantity,
                                                            isRewardApplied   : true
                                                },
                                                { 
                                                    $set: checkCartPromocodeApplied
                                                }
                                                )

             cartPromocodeList                  =   await temporaryCloverSchema.findOne({
                                                         //   cartIds           : data.cartIds,
                                                            userId            : getPromocodeUserId.userId,
                                                            restaurantId      : data.restaurantId,
                                                            totalCartQuantity : data.totalCartQuantity,
                                                            isRewardApplied   : true   
                                                            }).sort({ updatedAt: -1}) 

            //data                    ---delete test.blue;
            //promocodeAmountDeducted ---delete test.blue;
            //promologId              --- delete test.blue;
            //cartTotal               --- update
        }

    }

    rewardsFacilityLogSchema.remove(
        {_id: { "$in": data._id } }
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
                    "response_message":"RewardsFacility removed Successfully",
                
            });
        }
    })
},

applyRewardsFacilityModel: async function(data,callback)
{

    if(data.decoded)
    {   

        var decoded = data.decoded//await jwt.verify(data.userauthtoken, secretKey);
        var authtoken = data.authtoken
        console.log('decoded--',authtoken)
        //#region to Validate token
        if (decoded != null) {

            let userId = decoded.id
            let orderId =''
            let rewardsFacility =''
            let referralUserFlag =0
            let totalCartQuantity =0
            let referralRestaurantFlag =0
            let promocartIds = ''
            let deductedRedeemPoint = 0
            if(!data.redeemClover)
            {
                    callback({
                        "success": false,
                        "response_code": 5002,
                        "response_message": "Please Provide redeemClover",
                        "response_data": {}
                    })

            }else if(!data.cartIds)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide cartIds",
                    "response_data": {}
                }) 
            }else if(!data.totalCartQuantity)
            {
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message": "please provide totalCartQuantity",
                    "response_data": {}
                }) 
            }else{
                    promocartIds      = data.cartIds
                    totalCartQuantity = data.totalCartQuantity

                    let cartLists  = await  temporaryCloverSchema.findOne({userId:userId,cartIds:promocartIds,totalCartQuantity:totalCartQuantity}).sort({ updatedAt: -1})
                    console.log('cartLists---',cartLists)
                    let redeemClover = data.redeemClover
                    let subTotal = 0
                    
                        let userRewardPoint                         =  cartLists.cartDetails.clover_details[0].userRewardPoint
                        let restaurantId                            =  cartLists.cartDetails.restaurant_details[0]._id
                        let cartIds                                 =  cartLists.cartDetails.list.map((list) => list.cartId)
                        console.log('--------cartIds-------',cartIds)

                        let checkCartPromocodeApplied               =   await temporaryCloverSchema.findOne({
                                                                                                    cartIds:cartIds,
                                                                                                    userId:userId,
                                                                                                    restaurantId:restaurantId,
                                                                                                    totalCartQuantity:totalCartQuantity,
                                                                                                    isPromocodeApplied:true
                                                                                                }).sort({ updatedAt: -1})

                        if(checkCartPromocodeApplied !== null)                                                                        
                        {  
                            cartLists.cartDetails       = checkCartPromocodeApplied.cartDetails
                            cartLists.cartDetails.data  = checkCartPromocodeApplied.data 
                            subTotal                    = checkCartPromocodeApplied.data.promocodeAmountDeducted
                            deductedRedeemPoint         = checkCartPromocodeApplied.deductedRedeemPoint
                            userRewardPoint             = checkCartPromocodeApplied.userRewardPoint
                            
                        }else{
                            subTotal                    = parseFloat(cartLists.rewardDeductedAmount).toFixed(2)
                            deductedRedeemPoint         = cartLists.deductedRedeemPoint
                       }
                        
                        let checkCartRewardApplied                  =   await temporaryCloverSchema.findOne({
                            cartIds:cartIds,
                            userId:userId,
                            restaurantId:restaurantId,
                            totalCartQuantity:totalCartQuantity,
                            isRewardApplied:true
                        }).sort({ updatedAt: -1})

                        if(checkCartRewardApplied !== null)                                                                        
                        {  
                        userRewardPoint             = checkCartRewardApplied.userRewardPoint
                        }                        


                        console.log('userRewardPoint---',userRewardPoint)
                        if(parseInt(userRewardPoint) < 10000  ){

                            callback({
                                "success": false,
                                "response_code": 5002,
                                "response_message": "You need atleast 10000 clover to get redeemed",
                                "response_data": {}
                            })

                        }else if(parseInt(redeemClover) < 10000  ){

                            callback({
                                "success": false,
                                "response_code": 5002,
                                "response_message": "Redeem Amount Should be greater than or equal to 10000",
                                "response_data": {}
                            })

                        }else if(parseInt(userRewardPoint) < parseInt(redeemClover)  ){

                            callback({
                                "success": false,
                                "response_code": 5002,
                                "response_message": "Redeem Amount Should be less than Actual User Redeem Amount",
                                "response_data": {}
                            })

                        }else {




                            console.log('ok 0', cartLists.cartDetails.clover_details[0].defaultClover)
                            //#region Maintain Redeemed 

                            let resTaurantBasedCloverRewardsFacilityType     =  cartLists.cartDetails.clover_details[0].resTaurantBasedClover.rewardsFacilityType
                            let resTaurantBasedClover                        =  cartLists.cartDetails.clover_details[0].resTaurantBasedClover.clover

                            let amountRedeemed                               =  0
                            let cloverRedeemed                               =  parseInt(userRewardPoint) - parseInt(redeemClover)
                            let cartAmount                                   =  parseFloat(cartLists.cartAmount)
                            if(resTaurantBasedCloverRewardsFacilityType      == 'redeem')
                            {
                                 resTaurantBasedClover                       =  cartLists.cartDetails.clover_details[0].resTaurantBasedClover.clover
                                 let resTaurantBasedDiscount                 =  cartLists.cartDetails.clover_details[0].resTaurantBasedClover.discount

                                 amountRedeemed                              =  parseFloat((parseFloat(redeemClover) * parseFloat(resTaurantBasedDiscount))/parseFloat(resTaurantBasedClover))
                           
                            }else{

                                 amountRedeemed                              =  parseFloat((parseInt(redeemClover) * 100)/10000)

                            }
                            let cartAmountRedeemed                           =  parseFloat(cartAmount) -parseFloat(amountRedeemed)

                            if(parseFloat(cartAmountRedeemed) < 0)
                            {
                                callback({
                                    "success": false,
                                    "response_code": 5002,
                                    "response_message": "Amount Should not be less than Zero",
                                    "cartDetails": {}
                                })
                            }else{

                            cartLists.cartAmount                        =  parseFloat(cartAmount) -parseFloat(amountRedeemed)
                            //#region Maintain Redeemed 

                            //#region Maintain Reward Log
                            let restaurantBasedRewardPoint              =  cartLists.cartDetails.clover_details[0].restaurantBasedRewardPoint
                            let defaultCloverDiscount                   =  cartLists.cartDetails.clover_details[0].defaultClover.discount
                            let defaultClover                           =  cartLists.cartDetails.clover_details[0].defaultClover.clover
                            let defaultCloverEarnClover                 =  cartLists.cartDetails.clover_details[0].defaultClover.earnClover
                            let defaultCloverRewardsFacilityname        =  cartLists.cartDetails.clover_details[0].defaultClover.rewardsFacilityname
                            let defaultCloverRewardsFacilityType        =  cartLists.cartDetails.clover_details[0].defaultClover.rewardsFacilityType
                            console.log('ok 1')
                            let logDefaultReward                        =  await rewardsLog(
                                                                                            userId,
                                                                                            defaultCloverRewardsFacilityType,
                                                                                            defaultCloverRewardsFacilityname,
                                                                                            amountRedeemed,
                                                                                            cartAmountRedeemed,
                                                                                            defaultCloverDiscount,
                                                                                            defaultClover,
                                                                                            restaurantId,
                                                                                            defaultCloverEarnClover
                                                                                            )
    
                            let resTaurantBasedCloverDiscount            =  cartLists.cartDetails.clover_details[0].resTaurantBasedClover.discount
                            let resTaurantBasedCloverRewardsFacilityname =  cartLists.cartDetails.clover_details[0].resTaurantBasedClover.rewardsFacilityname
                           
                           
                            console.log('ok 2')
                            let logRestaurantReward =''
                            if(resTaurantBasedCloverRewardsFacilityType == 'flat')
                            {
                                let resTaurantBasedCloverAdditionalUserCLover=  cartLists.cartDetails.clover_details[0].resTaurantBasedClover.additionalUserCLover

                                logRestaurantReward                      =  await rewardsLog(
                                                                                            userId,
                                                                                            resTaurantBasedCloverRewardsFacilityType,
                                                                                            resTaurantBasedCloverRewardsFacilityname,
                                                                                            amountRedeemed,
                                                                                            cartAmountRedeemed,
                                                                                            resTaurantBasedCloverDiscount,
                                                                                            resTaurantBasedClover,
                                                                                            restaurantId,
                                                                                            resTaurantBasedCloverAdditionalUserCLover,
                                                                                            null,
                                                                                            null,
                                                                                            null,
                                                                                            null,
                                                                                            null

                                                                                            )
                            }else if(resTaurantBasedCloverRewardsFacilityType == 'order')
                            {
                                let    timesOfClover      = cartLists.cartDetails.clover_details[0].resTaurantBasedClover.timesOfClover
                                let    noOfDays           = cartLists.cartDetails.clover_details[0].resTaurantBasedClover.noOfDays
                                let    orderProvided      = cartLists.cartDetails.clover_details[0].resTaurantBasedClover.orderProvided
                                let    orderDependsOn     = cartLists.cartDetails.clover_details[0].resTaurantBasedClover.orderDependsOn
                                let    timeLimitation     = cartLists.cartDetails.clover_details[0].resTaurantBasedClover.timeLimitation
                                let    notificationDateOn = cartLists.cartDetails.clover_details[0].resTaurantBasedClover.notificationDateOn
                                let    maxCloverPoint     = cartLists.cartDetails.clover_details[0].resTaurantBasedClover.maxCloverPoint

                                logRestaurantReward                      =  await rewardsLog(
                                                                                            userId,
                                                                                            resTaurantBasedCloverRewardsFacilityType,
                                                                                            resTaurantBasedCloverRewardsFacilityname,
                                                                                            amountRedeemed,
                                                                                            cartAmountRedeemed,
                                                                                            resTaurantBasedCloverDiscount,
                                                                                            resTaurantBasedClover,
                                                                                            restaurantId,
                                                                                            noOfDays,
                                                                                            orderProvided,
                                                                                            orderDependsOn,
                                                                                            timeLimitation,
                                                                                            notificationDateOn,
                                                                                            maxCloverPoint
                                                                                            )
                            }else //if(resTaurantBasedCloverRewardsFacilityType == 'redeem')
                            {

                                logRestaurantReward                      =  await rewardsLog(
                                                                                            userId,
                                                                                            resTaurantBasedCloverRewardsFacilityType,
                                                                                            resTaurantBasedCloverRewardsFacilityname,
                                                                                            amountRedeemed,
                                                                                            cartAmountRedeemed,
                                                                                            resTaurantBasedCloverDiscount,
                                                                                            resTaurantBasedClover,
                                                                                            restaurantId,
                                                                                            null,
                                                                                            null,
                                                                                            null,
                                                                                            null,
                                                                                            null,
                                                                                            null
                                                                                            )
                            }                          
                            //#endregion Maintain Reward Log
                            let rewardLogArray = []
                            rewardLogArray.push(logDefaultReward)
                            rewardLogArray.push(logRestaurantReward)
                            console.log('logDefaultReward-->',logDefaultReward)
                            console.log('rewardLogArray-->',rewardLogArray)

                            deductedRedeemPoint = deductedRedeemPoint + redeemClover

                                                    let redeemedDetails   = {
                                                        ...cartLists,
                                                        amountRedeemed:parseFloat(amountRedeemed).toFixed(2),
                                                        appliedClover :redeemClover,
                                                        
                                                        }
                                                        var promoLogclover={};

                                                        subTotal =  
                                                        parseFloat(subTotal) + 
                                                        parseFloat(amountRedeemed)
                                                                  
                                                        if(checkCartPromocodeApplied !== null)                                                                        
                                                        { 
                                                            let promo_cartDetails = {
                                                                ...cartLists.cartDetails,
                                                                amountRedeemed:parseFloat(amountRedeemed).toFixed(2),
                                                                appliedClover :redeemClover
                                                                }
                                                            promoLogclover._id                     = new ObjectID;
                                                            promoLogclover.cartDetails             = JSON.parse(JSON.stringify(promo_cartDetails));                                                        
                                                            promoLogclover.restaurantId            = restaurantId;
                                                            promoLogclover.userId                  = userId;
                                                            promoLogclover.isPromocodeApplied      = true;
                                                            promoLogclover.isRewardApplied         = true;
                                                            promoLogclover.cartAmount              = cartAmountRedeemed;
                                                            promoLogclover.amountDeducted          = parseFloat(subTotal).toFixed(2);
                                                            promoLogclover.cartIds                 = checkCartPromocodeApplied.cartIds;
                                                            promoLogclover.userRewardPoint         = cloverRedeemed;
                                                            promoLogclover.promocode               = checkCartPromocodeApplied.promocode;
                                                            promoLogclover.promologId              = checkCartPromocodeApplied.promologId;
                                                            promoLogclover.rewardlogIds            = rewardLogArray;                                                            
                                                            promoLogclover.promocodeDeductedAmount = checkCartPromocodeApplied.promocodeDeductedAmount;
                                                            promoLogclover.rewardDeductedAmount    = parseFloat(amountRedeemed).toFixed(2);
                                                            promoLogclover.deductedRedeemPoint     = deductedRedeemPoint;
                                                            promoLogclover.totalCartQuantity       = checkCartPromocodeApplied.totalCartQuantity ;

                                                            promoLogclover.data                    = JSON.parse(JSON.stringify({
                                                                                                    ...checkCartPromocodeApplied.data,
                                                                                                    ...data,
                                                                                                    subTotal:subTotal,
                                                                                                    amountRedeemed:parseFloat(amountRedeemed).toFixed(2),
                                                                                                    appliedClover :redeemClover
                                                                                                    }))

                                                            console.log('------rewards cartLists----------->',promoLogclover)


                                                        }else{
                                                            let promo_cartDetails = {
                                                                ...cartLists.cartDetails,
                                                                amountRedeemed:parseFloat(amountRedeemed).toFixed(2),
                                                                appliedClover :redeemClover
                                                                }
                                                            promoLogclover._id                     = new ObjectID;
                                                            promoLogclover.cartDetails             = JSON.parse(JSON.stringify(promo_cartDetails));                                                        
                                                            promoLogclover.restaurantId            = restaurantId;
                                                            promoLogclover.userId                  = userId;
                                                            promoLogclover.isPromocodeApplied      = false;
                                                            promoLogclover.isRewardApplied         = true;
                                                            promoLogclover.amountDeducted          = parseFloat(subTotal).toFixed(2);
                                                            promoLogclover.cartAmount              = cartAmountRedeemed;
                                                            promoLogclover.cartIds                 = cartIds;
                                                            promoLogclover.userRewardPoint         = cloverRedeemed;
                                                            promoLogclover.rewardlogIds            = rewardLogArray;
                                                            promoLogclover.deductedRedeemPoint     = deductedRedeemPoint;
                                                            promoLogclover.totalCartQuantity       = totalCartQuantity ;

                                                            promoLogclover.promocode               = '';
                                                            promoLogclover.promologId              = '';


                                                            promoLogclover.promocodeDeductedAmount = 0;
                                                            promoLogclover.rewardDeductedAmount    = parseFloat(amountRedeemed).toFixed(2);

                                                            promoLogclover.data                    = JSON.parse(JSON.stringify({
                                                                                                        ...data,
                                                                                                        subTotal:subTotal,
                                                                                                        amountRedeemed:parseFloat(amountRedeemed).toFixed(2),
                                                                                                        appliedClover :redeemClover 
                                                                                                        }))
                                                            console.log('------rewards cartLists----------->',promoLogclover)

                                                        } 


                                                        let validatedCartOrderQuery         = await temporaryCloverSchema.findOne({
                                                            cartIds:cartIds,
                                                            totalCartQuantity:totalCartQuantity,
                                                            userId:userId
                                                            }).sort({ updatedAt: -1})
                                                        if(validatedCartOrderQuery !== null)
                                                        {
                                                            delete promoLogclover._id
                                                            let updateCartOrderQuery        = await temporaryCloverSchema.update({
                                                                                                                                cartIds:cartIds,
                                                                                                                                totalCartQuantity:totalCartQuantity,
                                                                                                                                userId:userId
                                                            },
                                                            {
        
                                                                    $set: promoLogclover
                                                            }
        
                                                            )
        
                                                        }else{
        
                                                        await temporaryCloverSchema.create(promoLogclover)
        
                                                        }

                                                        redeemedDetails.userRewardPoint =  cloverRedeemed
                                                    callback({
                                                        "success": true,
                                                        "response_code": 2000,
                                                        "response_message": "Redeem Amount Done Successfully",
                                                        "response_data": {
                                                            amountDeducted : parseFloat(promoLogclover.amountDeducted).toFixed(2),
                                                            cartAmount     : parseFloat(promoLogclover.cartAmount).toFixed(2),
                                                            userRewardPoint: cloverRedeemed
                                                        }
                                                    })

                                                }
                                           }

                                            

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


async function order(
                    userId,
                    type,
                    rewardsFacility,
                    timesOfClover,
                    orderProvided,
                    orderDependsOn,
                    timeLimitation,
                    notificationDateOn,
                    maxCloverPoint,
                    transactionAmount,
                    restaurant_id
                    )
                    {
                        console.log('order')
                        return type
                    }
async function flat(
                    userId,
                    type,
                    rewardsFacility,
                    additionalUserCLover,
                    additionalRestaurantCLover,
                    transactionAmount,
                    restaurant_id
                    )
                   {
                    //console.log('flat')
                    let removeRewardOrderLog= await removeRewardLogOnClose(rewardsFacility,userId)
                    let validatedResponse   =[]
                    let defaultClover       =  await other(userId,transactionAmount)
                    //console.log('defaultClover--',defaultClover)
                    let userClover          = 0
                    let restaurantClover    = 0
                    let discount            = 0
                    let response            = ''
                    let earnClover          = 0
                    let rewardslogId        = ''

                    if(defaultClover[0].response_code == '2000'){
                        
                        cloverRewardslogId   =  defaultClover[0].response_data.rewardslogId
                        discount             =  defaultClover[0].response_data.discount
                        earnClover           =  defaultClover[0].response_data.earnClover
                        userClover           =  parseInt(earnClover)
                                                +
                                                parseInt(additionalUserCLover)

                        let rewardsLogId     =  await   rewardsLog(userId,type,discount,userClover,rewardsFacility,restaurant_id)

            
                        response = {
                                        discount           :discount ,
                                        userClover         :userClover ,
                                        restaurantClover   :additionalRestaurantCLover ,
                                        //cloverRewardslogId :cloverRewardslogId,
                                        rewardsLogId       :[rewardsLogId,cloverRewardslogId] 
                                    }

                        validatedResponse.push({ response_code:2000 ,response_data:response })

                    }else{
                        response   = { discount:0,clover:0 }

                         validatedResponse.push({ response_code:2000 ,response_data:response })
                    }

                    return validatedResponse
                   }
async function redeem(
                    userId,
                    type,
                    rewardsFacility,
                    clover,
                    discount,
                    transactionAmount,
                    restaurant_id
                    )
                {
                    console.log('redeem')
                    return type
                }

async function other(userId,transactionAmount)
{
    console.log('other')
    let validatedResponse    = []
    let checkResponse        = []
    let checkSettingResponse = []
    let rewardsFacilityname  = ''
    //  await removeRewardLogOnClose(rewardsFacility,userId)

    let userQuery  = await UserSchema.findOne({
                                _id:userId
                                //gold_member:'yes'
                            }
                        )    
                    .exec(async function (err, result) {

                        if(err)
                        {
                            checkResponse.push({ response_code:5005 ,response_data:err })

                        }else{
                            checkResponse.push({ response_code:2000 ,response_data:result })

                        }
                    });
                    console.log('checkResponse[0].response_data.length--',checkResponse)
                    if(checkResponse[0].response_data.gold_member == 'yes')
                    {
                                //Gold foodie
                                rewardsFacilityname = 'Gold foodie'
                                let userSettingQuery  = await UserSettingSchema.findOne({
                                    userType:'gold'
                                }
                                )    
                                .exec(async function (err, result) {

                                    if(err)
                                    {
                                        checkSettingResponse.push({ response_code:5005 ,response_data:err })

                                    }else{
                                        checkSettingResponse.push({ response_code:2000 ,response_data:result })

                                    }
                                });
                        
                    }else{
                                //Clover
                                rewardsFacilityname = 'Clover'

                                let userSettingQuery  = await UserSettingSchema.findOne({
                                    userType:'normal'
                                }
                                )    
                                .exec(async function (err, result) {

                                    if(err)
                                    {
                                        checkSettingResponse.push({ response_code:5005 ,response_data:err })

                                    }else{
                                        checkSettingResponse.push({ response_code:2000 ,response_data:result })

                                    }
                                });                        
                    }

                    let removeRewardOrderLog= await removeRewardLogOnClose(rewardsFacilityname,userId)

                    let promise = new Promise(  function(resolve, reject) {

                        checkSettingResponse.map( async function(data) { 
                
                            console.log('data.response_data.length--',data.response_data.length)
                            console.log('data.response_data--',data.response_data)
                            // true condition
                            if(data.response_code == '2000'  )
                            {
                                        /**
                                         * start create rewardsFacility log
                                         * 
                                         */
                                        // "rewardsFacilityname" : "Collect +",
                                        // "rewardsFacilityType" : "order",
                                        // "userId" : "5da6b9c38bd9bb12640b861b",
                                        // "clover" : 30,
                                        // "discount" : 300,
                                        // "enable" : "yes",
                                        let clover      = data.response_data.clover
                                        let discount    = data.response_data.discount

                                        let earnClover  = parseInt(transactionAmount/discount)

                                        var rewardslog={};
                                        rewardslog._id      = new ObjectID;
                                        rewardslog.rewardsFacilityname= rewardsFacilityname;
                                        rewardslog.rewardsFacilityType= 'user';
                                        rewardslog.userId   =userId;
                                        rewardslog.clover   =clover
                                        rewardslog.discount =discount
                                        rewardslog.enable   ='yes'
                
                                        new rewardsFacilityLogSchema(rewardslog).save(function (err, result) {
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
                                         * end create rewardsFacility log
                                         * 
                                         */
                
                                        result = {
                                                 discount:discount ,
                                                 clover:clover ,
                                                 earnClover:earnClover,
                                                 rewardslogId:rewardslog._id
                                                }
                
                                         validatedResponse.push({ response_code:2000 ,response_data:result })
                            
                                        }else 
                                        {
                                                    result = { discount:0, clover:0 }
                            
                                                    validatedResponse.push({ response_code:5002 ,response_data:result })
                                        
                                        }
                                        console.log('checked response--->',validatedResponse)
                            
                                        resolve(validatedResponse)
                                        return validatedResponse
                            
                                    })
                                })
                                .then( res => res )

                     return promise
}

async function rewardsLog(
                            userId,
                            resTaurantBasedCloverRewardsFacilityType,
                            resTaurantBasedCloverRewardsFacilityname,
                            amountRedeemed,
                            cartAmountRedeemed,
                            resTaurantBasedCloverDiscount,
                            resTaurantBasedClover,
                            restaurantId,
                            noOfDaysOrAdditionalAmount,
                            orderProvided,
                            orderDependsOn,
                            timeLimitation,
                            notificationDateOn,
                            maxCloverPoint
                            )
{
    var rewardslog={};
    rewardslog._id                  = new ObjectID;
    rewardslog.rewardsFacilityname  = resTaurantBasedCloverRewardsFacilityname;
    rewardslog.rewardsFacilityType  = resTaurantBasedCloverRewardsFacilityType;
    rewardslog.userId               =userId;
    rewardslog.clover               =resTaurantBasedClover
    rewardslog.discount             =resTaurantBasedCloverDiscount
    rewardslog.amountRedeemed       =amountRedeemed
    rewardslog.cartAmountRedeemed   =cartAmountRedeemed
    rewardslog.restaurant_id        =restaurantId
    rewardslog.enable               ='yes'

    if(resTaurantBasedCloverRewardsFacilityType == 'flat')
    {
        rewardslog.additionalAmount =noOfDaysOrAdditionalAmount

    }else if(resTaurantBasedCloverRewardsFacilityType == 'order')
    {
        rewardslog.noOfDays =noOfDaysOrAdditionalAmount
        rewardslog.orderProvided =orderProvided
        rewardslog.orderDependsOn =orderDependsOn
        rewardslog.timeLimitation =timeLimitation
        rewardslog.notificationDateOn =notificationDateOn
        rewardslog.maxCloverPoint =maxCloverPoint

    }
    new rewardsFacilityLogSchema(rewardslog).save(function (err, result) {
        if (err) 
        {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    });
    return rewardslog._id
}

async function cartDetails(userId,authtoken)
{
    let cartUserIdBody = { userId: userId };
    console.log('---cartUserIdBody---',cartUserIdBody)
//authtoken

    let [cartList] = await Promise.all([

        await fetch(config.liveUrl + 'api/cartList', {
            method: 'post',
            body: JSON.stringify(cartUserIdBody),
            headers: { 
                'Content-Type': 'application/json',
                'x-access-token':authtoken
            },
        })
            .then(res => res.json())
    
        ]);
        console.log('---cartList 1---',cartList.response_data.clover_details)

        if(cartList.response_code != '2000')
        {
         //   callback(cartList.response_data);
        }

    return cartList
    
}

async function updateUserRewardsPoint(userId,calculatedCloverDiscount)
{
    //rewardPoint
    let userRewardPoint = 0
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
        if(resDetail !== null)
        {
        userRewardPoint = resDetail.rewardPoint !== undefined ? resDetail.rewardPoint :0
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
        }
    });
    return userRewardPoint
}

async function updateRestaurantRewardsPoint(rsetaurantId,calculatedCloverDiscount)
{
    //rewardPoint
    let userRewardPoint = 0
    console.log('----------rsetaurantId-----',rsetaurantId)
    if(rsetaurantId)
    {
        RestaurantSchema.findOne({
            _id:rsetaurantId
        },
        function (err, resDetail) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                });
            } else {

            if(resDetail !== null)
            {
            userRewardPoint = resDetail.rewardPoint !== undefined ? resDetail.rewardPoint :0
            userRewardPoint = userRewardPoint +  calculatedCloverDiscount

            RestaurantSchema.update({
                _id:rsetaurantId
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
            }
        });
    }
    return userRewardPoint

}


async function getUnique(array){

    var uniqueArray = [];

    // Loop through array values

    for(i=0; i < array.length; i++){

        if(uniqueArray.indexOf(array[i]) === -1) {

            uniqueArray.push(array[i]);

        }

    }

    return uniqueArray;
}

async function getUserRewardsPoint(userId)
{
    //redeemReward,rewardPoint

    let userRewardPoint = 0
    let userRedeemReward = 0
   await UserSchema.findOne({
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
            console.log('----resDetail------->',resDetail)
        if(resDetail !== null)
        {
            userRewardPoint  = resDetail.rewardPoint !== undefined ? resDetail.rewardPoint :0
            userRedeemReward = resDetail.redeemReward !== undefined ? resDetail.redeemReward :0

            userRewardPoint = parseInt(userRewardPoint) -  parseInt(userRedeemReward)

        }
        }
    });
    return userRewardPoint
}

async function removeRewardLogOnClose(rewardsFacility,userId)
{
    let validatedResponse = []
    let checkArrayRemoveStep1 = []
  //  let validatedResponse.push({ response_code:2000 ,response_data:result })

    let rewardsFacilityAllQuery  = await rewardsFacilityLogSchema.find({
    rewardsFacilityname : rewardsFacility ,
    userId : userId 
    })
    .exec(async function (err, result) {
    if (err) {
        validatedResponse.push({ response_code:5005 ,response_data:err })
    } else {
        validatedResponse.push({ response_code:2000 ,response_data:{} })

        console.log('checkArrayRemoveStep1 list---',result)
        if(result.length > 0)
        {
            for (let index = 0; index < result.length; index++) {
                let element = result[index];
                let rewardsLogId=element._id
                checkArrayRemoveStep1.push(rewardsLogId)
            }


        }

    }
    });
let checkArrayRemoveStep2= [] 
console.log('--checkArrayRemoveStep1---',checkArrayRemoveStep1)
if(checkArrayRemoveStep1.length>0)
{


for (let index = 0; index < checkArrayRemoveStep1.length; index++) {
    
    let pID = [ checkArrayRemoveStep1[index] ];
    /*
        userRewardslogId
        restaurantRewardslogId
    */

    let checkCloseQuery  = await orderSchema
    .findOne({ "rewardslogId": { "$in": pID }})
    .exec(async function (err, result) {

                if(err)
                {
                    validatedResponse.push({ response_code:5005 ,response_data:err })

                    isDelete =1
                }else{
                    validatedResponse.push({ response_code:2000 ,response_data:{} })

                    console.log('resultsss--->',result)

                if(result !==  null)
                {
                    isDelete =1
                    checkArrayRemoveStep2.push(pID)

                }else{
                    isDelete =0

                    rewardsFlag =1
                }
            }
    });

}
}

if(checkArrayRemoveStep2.length>0)
{
for (let index2 = 0; index2 < checkArrayRemoveStep2.length; index2++) {
    let elementRemove = checkArrayRemoveStep2[index2];

    rewardsFacilityLogSchema.remove(
        { _id : elementRemove }
        )
        .exec(function (err,results){
        if(err)
        {
            validatedResponse.push({ response_code:5005 ,response_data:err })
            rewardsFlag =0
        }
        else
        {
            validatedResponse.push({ response_code:2000 ,response_data:{} })
        rewardsFlag =1
        }
        })
}
}

return validatedResponse
}



module.exports = RewardsFacilityService;