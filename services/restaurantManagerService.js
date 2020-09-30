var express = require("express");
var bcrypt = require('bcrypt-nodejs');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var crypto = require('crypto');
var config = require('../config');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var secretKey = config.secretKey;

var Admin = require('../models/admin');
var RestaurantManager = require('../models/restaurantManager')
// var UserModels = require('../models/user');
// var ContentModels = require('../models/content');
// var RecyclingProductModels = require('../models/recyclingProduct');
// var CauseModels = require('../models/cause');
// var VendorModels = require('../models/vendor');
// var ProductModels = require('../models/product');
// var OrderModels = require('../models/order');
// var AdsModels = require('../models/ads');

var mailProperty = require('../modules/sendMail');

createToken = (restaurantManager) => {
    var tokenData = {
        id: restaurantManager._id
    };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: 86400
    });
    return token;
};

var restaurantManagerService = {
    restaurantManagerList: function (data, callback) {

        var page = 1,
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
        async.waterfall([
                function (nextCb) {
                    RestaurantManager.paginate(query, {
                        sort: {
                            'createdAt': -1
                        },
                        page: page,
                        limit: limit
                    }, function (err, docs) {
                        if (err) {
                            nextCb(null, err);
                        } else {
                            nextCb(null, docs);
                        }
                    });
                }
            ],
            function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "Restaurant Manager list",
                        "response_data": result
                    });
                }
            });
    },
    restaurantManagerSignup: function (restaurantManagerData, callback) {
        async.waterfall([
            function (nextcb) { //checking email existance
                var cError1 = "";
                RestaurantManager.findOne({
                    email: restaurantManagerData.email
                }, function (err, admindet) {
                    if (err)
                        nextcb(err);
                    else {
                        if (admindet) {
                            callback({
                                success: false,
                                message: "email already taken"
                            });

                        }
                        nextcb(null, cError1);
                    }
                });
            },
            function (cError1, nextcb) { //updating admin's data
                if (cError1) {
                    nextcb(null, cError1);
                } else {
                    restaurantManagerData._id = new ObjectID;
                    var restaurantmanager = new RestaurantManager(restaurantManagerData);
                    restaurantmanager.save(function (err, result) {
                        if (err) {
                            nextcb(err);
                        } else {
                            nextcb(null, result);
                        }
                    });
                }
            }

        ], function (err, result) {
            if (err) {
                callback({
                    success: false,
                    message: "some internal error has occurred",
                    err: err
                });
            } else {

                mailProperty('restManagerSignUpMail')(result.email, {
                    name: restaurantManagerData.name,
                    password: restaurantManagerData.password,
                    email: restaurantManagerData.email,
                    site_url: config.liveUrl,
                    date: new Date()
                }).send();
                callback({
                    success: true,
                    message: "RestaurantManager  saved successfully"
                })
            }
        });
    },
    //View Restaurant Manager Profile
    viewRestManagerProfile: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                success: false,
                STATUSCODE: 5002,
                message: "please provide user id",
                response: {}
            });
        } else {

            RestaurantManager.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 5005,
                            message: "INTERNAL DB ERROR",
                            response: {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                success: false,
                                STATUSCODE: 5002,
                                message: "User is not valid",
                                response: {}
                            });
                        } else {
                            callback({
                                success: true,
                                STATUSCODE: 2000,
                                response: result
                            })
                        }
                    }
                });
        }
    },
    editRestaurantManager: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                success: false,
                STATUSCODE: 5002,
                message: "please provide user id",
                response: {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                success: false,
                STATUSCODE: 5002,
                message: "please provide name",
                response: {}
            });
        } else {
            RestaurantManager.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 5005,
                            message: "INTERNAL DB ERROR",
                            response: {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                success: false,
                                STATUSCODE: 5002,
                                message: "User is not valid",
                                response: {}
                            });
                        } else {
                            RestaurantManager.update({
                                _id: data._id
                            }, {
                                $set: {
                                    name: data.name,
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 5005,
                                        message: "INTERNAL DB ERROR",
                                        response: {}
                                    });
                                } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Profile has been updated",
                                    })
                                }
                            });
                        }
                    }
                });
        }
    },
    changeStatusRestaurantManager: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                success: false,
                STATUSCODE: 5002,
                message: "please provide user id",
                response: {}
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                success: false,
                STATUSCODE: 5002,
                message: "please provide status",
                response: {}
            });
        } else {
            RestaurantManager.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            success: false,
                            STATUSCODE: 5005,
                            message: "INTERNAL DB ERROR",
                            response: {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                success: false,
                                STATUSCODE: 5002,
                                message: "User is not valid",
                                response: {}
                            });
                        } else {
                            RestaurantManager.update({
                                _id: data._id
                            }, {
                                $set: {
                                    status: data.status,
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 5005,
                                        message: "INTERNAL DB ERROR",
                                        response: {}
                                    });
                                } else {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Status has been updated",
                                    })
                                }
                            });
                        }
                    }
                });
        }
    },
    restaurantManagerLogin: function (restaurantManagerData, callback) {
        if (restaurantManagerData.email && restaurantManagerData.password) {
            RestaurantManager.findOne({
                    email: restaurantManagerData.email
                })
                .select('_id email password authtoken status')
                .exec(function (err, loginRes) {
                    if (loginRes === null) {
                        callback({
                            success: false,
                            STATUSCODE: 4000,
                            message: "Wrong password or email",
                            response: {}
                        });
                    } else if (loginRes.status == 'DE-ACTIVE') {
                        callback({
                            success: false,
                            STATUSCODE: 4000,
                            message: "Your account has been blocked. Please contact admin.",
                            response: {}
                        });
                    } else {
                        if (!loginRes.comparePassword(restaurantManagerData.password)) {

                            callback({
                                success: false,
                                STATUSCODE: 4000,
                                message: "Wrong password or email",
                                response: {}
                            });
                        } else {
                            var token = createToken(loginRes);
                            RestaurantManager.update({
                                _id: loginRes._id
                            }, {
                                $set: {
                                    authtoken: token
                                }
                            }).exec(err, function (err, result) {
                                if (!err) {
                                    callback({
                                        success: true,
                                        STATUSCODE: 2000,
                                        message: "Login success",
                                        response: {
                                            _id: loginRes._id,
                                            email: restaurantManagerData.email,
                                            token: token
                                        }
                                    })
                                }
                            })
                        }
                    }
                });
        } else {
            callback({
                success: false,
                STATUSCODE: 5000,
                message: "Insufficient information provided for user login",
                response: {}
            });
        }
    },
    restaurantManagerforgotpassLinksend: (restaurantManagerData, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!restaurantManagerData.email || typeof restaurantManagerData.email === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide user email",
                        "response_data": {}
                    });
                } else {
                    nextCb(null, {
                        "response_code": 2000,
                    });
                }
            },
            function (arg2, nextCb) {
                if (arg2.response_code === 5002) {
                    nextCb(null, arg2);
                }
                if (arg2.response_code === 5005) {
                    nextCb(null, arg2);
                }
                if (arg2.response_code === 2000) {
                    var random = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
                    bcrypt.hash(random, null, null, function (err, hash) {
                        if (err) {
                            nextCb(null, {
                                response_code: 5005,
                                response_message: "Internal server error",
                                response_data: err
                            });
                        } else {
                            RestaurantManager.findOne({
                                email: restaurantManagerData.email
                            }, function (err, admindet) {
                                if (err) {
                                    nextCb(null, {
                                        response_code: 4000,
                                        response_message: "Invalid Email",
                                        response_data: err
                                    });
                                } else {
                                    if (admindet != null) {
                                        var new_password = hash;
                                        var conditions = {
                                                _id: admindet._id
                                            },
                                            fields = {
                                                password: new_password
                                            },
                                            options = {
                                                upsert: false
                                            };
                                        RestaurantManager.update(conditions, fields, options, function (err, affected) {
                                            if (err) {
                                                nextCb(null, {
                                                    response_code: 5005,
                                                    response_message: "Internal server error",
                                                    response_data: err
                                                });
                                            } else {
                                                mailProperty('forgotPasswordMail')(restaurantManagerData.email, {
                                                    name: 'RestaurantManager',
                                                    password: random,
                                                    email: restaurantManagerData.email,
                                                    site_url: config.liveUrl,
                                                    date: new Date()
                                                }).send();
                                                nextCb(null, {
                                                    response_code: 2000,
                                                    response_message: "New password will be sent to your mail.",
                                                })
                                            }
                                        });
                                    } else {
                                        nextCb(null, {
                                            response_code: 4000,
                                            response_message: "Invalid Email"
                                        })
                                    }
                                }
                            });
                        }
                    });
                }
            }
        ], function (err, content) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                })
            } else {
                callback({
                    "success": content.response_code == 2000 ? true : false,
                    "STATUSCODE": content.response_code,
                    "message": content.response_message,
                    "response": content.response_data
                })
            }
        })
    },
    restaurantManagerChangePassword: function (restaurantManagerData, callback) {
        if (restaurantManagerData.password && restaurantManagerData.repassword) {
            if (restaurantManagerData.password != restaurantManagerData.repassword) {
                callback({
                    success: false,
                    STATUSCODE: 5000,
                    message: "Password and repassword must be same",
                    response: {}
                });
            } else {
                RestaurantManager.findOne({
                        email: restaurantManagerData.email
                    })
                    .select('_id email password')
                    .exec(function (err, loginRes) {
                        if (loginRes === null) {
                            callback({
                                success: false,
                                STATUSCODE: 4000,
                                message: "User doesn't exist",
                                response: {}
                            });
                        } else {
                            bcrypt.hash(restaurantManagerData.repassword, null, null, function (e, hash) {
                                if (e) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 4000,
                                        message: "Internal server error",
                                        err: e
                                    });

                                } else {
                                    var new_password = hash;
                                    var conditions = {
                                            _id: loginRes._id
                                        },
                                        fields = {
                                            password: new_password
                                        },
                                        options = {
                                            upsert: false
                                        };

                                    RestaurantManager.update(conditions, fields, options, function (err, affected) {
                                        if (err) {
                                            callback({
                                                success: false,
                                                STATUSCODE: 4000,
                                                message: "Internal server error",
                                                err: err
                                            });

                                        } else {
                                            callback({
                                                success: true,
                                                STATUSCODE: 2000,
                                                message: "Password Update successfully",
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
            }
        } else {
            callback({
                success: false,
                STATUSCODE: 5000,
                message: "Insufficient information provided for user login",
                response: {}
            });
        }
    },

};
module.exports = restaurantManagerService;