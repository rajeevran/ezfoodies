var userSettingSchema=require('../schema/userSetting');
var mongo=require('mongodb');
var ObjectId=mongo.ObjectId;
var async = require("async");
var moment = require('moment');
var config = require('../config');

var jwt = require('jsonwebtoken');
var secretKey = config.secretKey;


var userSettingModel=
{
userSettingList:function(data,callback)
{
    var page  = 1,
        limit = 20,
        query = {};
    
    if (data.page) {
        page = parseInt(data.page);
    }
    if (data.limit) {
        limit = parseInt(data.limit);
    }
    if (data.sortby) {
        sort_field = data.sortby;
    }
    if (data._id) {
        query['_id'] = data._id;
    }
    if (data.orderId) {
        query['userType'] = new RegExp(data.userType, 'i');
    }
    userSettingSchema.find(
        function(err,result){
            if(err){
                callback({
                    "response_code":5005,
                    "response_message":"INTERNAL DB ERROR",
                    "response_data":{}
                });
            }else{
                callback({
                    "response_code":2000,
                    "response_message":"User setting list found",
                    "response_data":result
                });

            }
        })
},
addUserSetting:function(data,callback){
    if(data){
    

        
        async.waterfall([
            function(nextcb)
            {
                if(data.userType == '' || data.userType === undefined)
                {
                    callback({
                        "success": false,
                        "response_code": 5002,
                        "response_message": "please provide user type",
                        "response_data": {}
                    })  
                }else if(data.discount == '' || data.discount === undefined){
                    callback({
                        "success": false,
                        "response_code": 5002,
                        "response_message": "please provide discount",
                        "response_data": {}
                    })  
                }else if(data.clover == '' || data.clover === undefined){
                    callback({
                        "success": false,
                        "response_code": 5002,
                        "response_message": "please provide clover",
                        "response_data": {}
                    })  
                }else
                {
                    var userSeting={};
                    userSeting._id=new ObjectId;
                    userSeting.userType=data.userType;
                    userSeting.discount=data.discount;
                    userSeting.clover=data.clover;

                    new userSettingSchema(userSeting).save(function(err,result)
                    {
                        console.log(err);
                        console.log(result);
                        if(err)
                        {
                            callback({
                                "success": false,
                                "response_code": 5002,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": {}
                            });  
                        }else{
                            callback({
                                "success": true,
                                "response_code": 2000,
                                "response_message": "Data added successfully",
                                "response_data": result
                            });
                        }
                    });
                }
            }
        ]);

    }else{
        callback({
            "response_code": 5005,
            "response_message": "INTERNAL DB ERROR",
            "response_data": {}
        });
    }

},

userSettingdetails:function(data,callback)
{
    userSettingSchema.findOne({_id:data._id})
        .exec(function(err,result){
            if(err){
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message":"INTERNAL DB ERROR",
                    "response_data": []
                });  
            }else{
                callback({
                    "success": true,
                    "response_code": 2000,
                    "response_message": "User setting list details",
                    "response_data": result
                });  
            }
    })

},
editUserSetting:function(data,callback){
    userSettingSchema.update(
        {_id:data._id},
        { 
            $set:
                {
                    userType:data.userType,
                    discount:data.discount,
                    clover:data.clover
                    
                }
        },function(err,result){

            if(err){
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message":"INTERNAL DB ERROR",
                    "response_data": []
                });  
            }else{
                callback({
                    "success": true,
                    "response_code": 2000,
                    "response_message":"Data updated successfuly",
                    "response_data": data
                });  
            }
        })
},
deleteUserSetting:function(data,callback){
    userSettingSchema.remove({_id:data._id})
        .exec(function(err,result){
            if(err){
                callback({
                    "success": false,
                    "response_code": 5002,
                    "response_message":"INTERNAL DB ERROR",
                    "response_data": []
                });  
            }else{
                callback({
                    "success": true,
                    "response_code": 2000,
                    "response_message":"Data deleted successfuly",
                    "response_data": []
                });  
            }
        })
       
}


}
module.exports=userSettingModel;