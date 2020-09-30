var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var promocodeSchema=require('../schema/promocode');

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
                    user_condition:data.user_condition,
                    promo_code_value:data.promo_code_value,
                    promo_code_type:data.promo_code_type,
                    restaurant_category:JSON.parse(data.restaurant_category),
                    times:data.times, 
                    start_date:data.start_date,
                    end_date:data.end_date
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
}
};
module.exports = PromocodeService;