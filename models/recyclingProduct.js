var mongoose = require("mongoose");
var RecycleProductSchema = require('../schema/recycleProducts');
var RecycleProductTypeSchema = require('../schema/recycleProductTypes');
var RewardSchema = require('../schema/rewards');
var UserSchema = require('../schema/users');
var async = require("async");
var config = require('../config');

var RecyclingProductModels = {
    recyclingProductTypeAdd: function (data, callback) {
        if (data) {
            new RecycleProductTypeSchema(data).save(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": err
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "Data added successfully.",
                        "response_data": {}
                    });
                }
            })
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    recyclingProductTypeList: function (data, callback) {
        if (data) {
            var limit = parseInt(data.size) + parseInt(data.number);
            var skip = 0;
            RecycleProductTypeSchema.find(
                {})
                .limit(limit)
                .skip(skip)
                .sort({ "productTypeName": 1 })
                .exec(function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Recycling product type list",
                            "response_data": result
                        });
                    }
                });
        } else {
            RecycleProductTypeSchema.find()
                .sort({ "productTypeName": 1 })
                .exec(function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Recycling product type list",
                            "response_data": result
                        });
                    }
                });
        }
    },
    recyclingProductTypeEdit: function (data, callback) {
        if (data) {
            RecycleProductTypeSchema.update(
                { _id: data._id },
                {
                    $set:
                        { productTypeName: data.productTypeName }
                }, function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Data updated successfully.",
                            "response_data": {}
                        });
                    }
                })
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    recyclingProductTypeDelete: function (data, callback) {
        if (data) {
            RecycleProductSchema.count(
                { productType: data._id },
                function (err, resCount) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {
                        if (resCount == 0) {
                            RecycleProductTypeSchema.remove(
                                { _id: data._id },
                                function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": err
                                        });
                                    } else {
                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Data deleted successfully.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Atfirst delete related product of this type.",
                                "response_data": err
                            });
                        }
                    }
                }
            )
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    recyclingProductListForAdmin: function (data, callback) {
        if (data) {
            var limit = parseInt(data.size) + parseInt(data.number);
            var skip = 0;
            if (data.user_id == 'all') {
                var cond = {}
            } else {
                var cond = {
                    user_id: data.user_id
                }
            }
            RecycleProductSchema.find(
                cond)
                .limit(limit)
                .skip(skip)
                .sort({ "createdAt": -1 })
                .exec(function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {
                        async.forEach(result, function (item, callBack) {
                            if (item.productImage != undefined && item.productImage != '' && item.productImage != null) {
                                item.productImage = config.liveUrl + item.productImage;
                            } else {
                                item.productImage = config.liveUrl + 'uploads/no-img.jpg';
                            }
                            callBack();
                        }, function (err, list) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {
                                callback({
                                    "response_code": 2000,
                                    "response_message": "Recycling product list",
                                    "response_data": result
                                });
                            }
                        })
                    }
                })
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    recyclingProductDetails: function (data, callback) {
        if (data) {
            RecycleProductSchema.aggregate(
                { $match: { _id: data._id } },
                {
                    $lookup:
                    {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "User"
                    }
                },
                {
                    $lookup:
                    {
                        from: "recycleproducttypes",
                        localField: "productType",
                        foreignField: "_id",
                        as: "RecyclingProductType"
                    }
                },
                {
                    $project: {
                        companyName: 1,
                        productImage: 1,
                        barCodeImage: 1,
                        binCode: 1, reward: 1, place: 1,user_id:1,productType:1,
                        'User.first_name': 1, 'User.last_name': 1, 'User.email': 1,
                        'RecyclingProductType.productTypeName': 1
                    }
                }, function (err, results) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        results  = results[0];
                        results.User = results.User[0];
                        if (results.productImage != undefined && results.productImage != '' && results.productImage != null) {
                            results.productImage = config.liveUrl + results.productImage;
                        } else {
                            results.productImage = config.liveUrl + 'uploads/no-img.jpg';
                        }
                        if (results.barCodeImage != undefined && results.barCodeImage != '' && results.barCodeImage != null) {
                            results.barCodeImage = config.liveUrl + results.barCodeImage;
                        } else {
                            results.barCodeImage = config.liveUrl + 'uploads/no-img.jpg';
                        }                        
                        results.RecyclingProductType = results.RecyclingProductType[0].productTypeName;
                        callback({
                            "response_code": 2000,
                            "response_message": "Recycling product details",
                            "response_data": results
                        });
                    }
                })
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    recyclingProductAdd: function (data, callback) {
        if (data) {
            new RecycleProductSchema(data).save(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": err
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "Data added successfully.",
                        "response_data": {}
                    });
                }
            })
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    recyclingProductListByUser: function (data, callback) {
        if (data) {
            RecycleProductSchema.find(
                { user_id: data.user_id },
                { __v: 0, updatedAt: 0 },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {
                        async.forEach(result, function (item, callBack) {
                            if (item.productImage != undefined && item.productImage != '' && item.productImage != null) {
                                item.productImage = config.liveUrl + item.productImage;
                            }
                            if (item.barCodeImage != undefined && item.barCodeImage != '' && item.barCodeImage != null) {
                                item.barCodeImage = config.liveUrl + item.barCodeImage;
                            }
                            callBack();
                        }, function (err, list) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {
                                callback({
                                    "response_code": 2000,
                                    "response_message": "Recycling product list",
                                    "response_data": result
                                });
                            }
                        })
                    }
                })
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    rewadAdd: function (data, callback) {
        if (data) {
            RewardSchema.update(
                { user_id: data.user_id },
                { $inc: { totalReward: 5, remainReward: 5 } },
                { upsert: true },
                function (err, dataRes) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        RewardSchema.findOne(
                            { user_id: data.user_id },
                            {remainReward:1},
                            function(err,pointRes){
                                if(err){
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else{
                                    UserSchema.findOne(
                                        {_id:data.user_id},
                                        {pushtoken:1},
                                        function(err,userRes){
                                            if(err){
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": err
                                                });
                                            }else{
                                                callback({                            
                                                    "response_code": 2000,
                                                    "response_message": "Reward details",
                                                    "response_data": {
                                                        remainReward: pointRes.remainReward,
                                                        pushtoken:userRes.pushtoken
                                                    }
                                                });
                                            }
                                        });
                                    
                                }
                            });
                        
                    }
                });

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    totalRewardByUser: function (data, callback) {
        if (data) {
            RewardSchema.findOne(
                { user_id: data.user_id },
                { _id: 0, totalReward: 1, remainReward: 1 },
                function (err, result) {
                    if (result != null) {
                        var totalReward = result.totalReward;
                        var remainReward = result.remainReward;
                    } else {
                        var totalReward = 0;
                        var remainReward = 0;
                    }
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Recycling product total reward",
                            "response_data": {
                                totalReward: totalReward,
                                remainReward: remainReward
                            }
                        });
                    }
                }
            )
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    }

}
module.exports = RecyclingProductModels;