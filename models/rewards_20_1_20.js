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
                        rewards.additionalCLover=data.additionalCLover;
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
                    additionalCLover:data.additionalCLover,
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

deleteRewardsFacilityLogModel:function(data,callback)
{
    rewardsFacilityLogSchema.remove(
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
            let referralRestaurantFlag =0

                   
            if(!data.redeemClover)
            {
                    callback({
                        "success": false,
                        "response_code": 5002,
                        "response_message": "Please Provide redeemClover",
                        "response_data": {}
                    })

            }else{

                    let cartLists  = await  cartDetails(userId,authtoken)
                    console.log('cartLists---',cartLists.response_data.clover_details)
                    let redeemClover = data.redeemClover

                    if(cartLists.response_code == '2000')
                    {

                        let restaurantBasedRewardPoint =  cartLists.response_data.clover_details[0].restaurantBasedRewardPoint
                        let userRewardPoint            =  cartLists.response_data.clover_details[0].userRewardPoint

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


                            let cloverRedeemed   =  parseInt(userRewardPoint) - parseInt(redeemClover)
                            let cartAmount       =  parseInt(cartLists.response_data.cartTotal)
                            let amountRedeemed   =  parseInt((parseInt(redeemClover) * 100)/10000)

                            cartLists.response_data.cartTotal = parseInt(cartAmount) -parseInt(amountRedeemed)

                           let redeemedDetails = {
                               ...cartLists,
                               amountRedeemed:amountRedeemed,
                               appliedClover :redeemClover,
                               
                           }

                            callback({
                                "success": true,
                                "response_code": 2000,
                                "response_message": "Redeem Amount Done Successfully",
                                "response_data": redeemedDetails
                            })

                        }

                    }else{

                        callback({
                            "success": false,
                            "response_code": cartDetails.response_code,
                            "response_message": cartDetails.response_message,
                            "response_data": {}
                        })

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

async function rewardsLog(userId,type,discount,clover,rewardsFacility,restaurant_id)
{
    var rewardslog={};
    rewardslog._id                  = new ObjectID;
    rewardslog.rewardsFacilityname  = rewardsFacility;
    rewardslog.rewardsFacilityType  = type;
    rewardslog.userId               =userId;
    rewardslog.clover               =clover
    rewardslog.discount             =discount
    rewardslog.restaurant_id        =restaurant_id
    rewardslog.enable               ='yes'

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