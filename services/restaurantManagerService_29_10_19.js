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
    //Content list
    listContent: function (callback) {
        ContentModels.contentList(function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    //Content Details
    detailsContent: function (data, callback) {
        ContentModels.detailsContent(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    // Edit content
    editContent: function (data, file, callback) {
        async.waterfall([
            function (nextCb) {
                if (!data.description || typeof data.title === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide description",
                        "response_data": []
                    });
                } else if (!data._id || typeof data._id === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide content id",
                        "response_data": []
                    });
                } else {
                    nextCb(null, {
                        "response_code": 2000
                    });
                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code == 2000) {
                    ContentModels.editContent(data, function (result) {
                        if (result.response_code == 2000) {
                            nextCb(null, {
                                "success": true,
                                "STATUSCODE": 2000,
                                "message": result.response_message,
                                "response": result.response_data
                            })
                        } else {
                            nextCb(null, {
                                "success": false,
                                "STATUSCODE": 5002,
                                "message": "Data not found",
                                "response": []
                            });
                        }
                    })
                } else {
                    nextCb(null, arg1);
                }

            }
        ], function (err, content) {
            if (err) {
                callback({
                    "success": false,
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                })
            } else {
                callback(content);
            }
        });
    },
    //User list
    listUser: function (data, callback) {
        var data = {
            number: data.number,
            size: data.size,
            status: ['yes', 'no']
        }
        UserModels.userList(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    //User Details
    detailsUser: function (data, callback) {
        UserModels.viewProfile(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    // Add Recycling product type
    recyclingProductTypeAdd: function (data, callback) {
        if (!data.productTypeName || typeof data.productTypeName === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product type name",
                "response_data": []
            });
        } else {
            data._id = new ObjectID;
            RecyclingProductModels.recyclingProductTypeAdd(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // List Recycling product type
    recyclingProductTypeList: function (data, callback) {
        RecyclingProductModels.recyclingProductTypeList(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    // Edit Recycling product type
    recyclingProductTypeEdit: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product type id",
                "response_data": []
            });
        } else if (!data.productTypeName || typeof data.productTypeName === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product type name",
                "response_data": []
            });
        } else {
            RecyclingProductModels.recyclingProductTypeEdit(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Recycling product type
    recyclingProductTypeDelete: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product type id",
                "response_data": []
            });
        } else {
            RecyclingProductModels.recyclingProductTypeDelete(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // List Recycling product
    recyclingProductList: function (data, callback) {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": []
            });
        } else {
            RecyclingProductModels.recyclingProductListForAdmin(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Details of Recycling product
    recyclingProductDetails: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide recycling product id",
                "response_data": []
            });
        } else {
            RecyclingProductModels.recyclingProductDetails(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Add cause
    addCause: function (data, fileData, callback) {
        if (!data.title || typeof data.title === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause title",
                "response_data": []
            });
        } else if (!data.description || typeof data.description === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause description",
                "response_data": []
            });
        } else if (fileData.length == 0) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause image",
                "response_data": []
            });
        } else {
            var img_all = [];
            var c = 0;
            async.forEach(fileData, function (item, callBack) {
                var fileName = '';
                var pic = item;
                var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                var fileName = Date.now() + c + ext;
                var folderpath = config.uploadCausepicPath;
                c++;
                pic.mv(folderpath + fileName, function (err) {
                    if (!err) {
                        img_all.push({
                            _id: new ObjectID,
                            imageUrl: config.causepicPath + fileName
                        })
                        callBack();
                    } else {
                        callBack();
                    }

                });
            }, function (err, list) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": {}
                    });
                } else {
                    data._id = new ObjectID;
                    data.image = img_all;
                    CauseModels.addCause(data, function (result) {
                        callback({
                            "success": result.response_code == 2000 ? true : false,
                            "STATUSCODE": result.response_code,
                            "message": result.response_message,
                            "response": result.response_data
                        });
                    })
                }
            })
        }
    },
    // Edit cause
    editCause: function (data, fileData, callback) {
        if (!data.title || typeof data.title === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause title",
                "response_data": []
            });
        } else if (!data.description || typeof data.description === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause description",
                "response_data": []
            });
        } else {
            var img_all = [];
            if (fileData && fileData.length != 0) {
                var c = 0;
                async.forEach(fileData, function (item, callBack) {
                    var fileName = '';
                    var pic = item;
                    var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                    var fileName = Date.now() + c + ext;
                    var folderpath = config.uploadCausepicPath;
                    c++;

                    pic.mv(folderpath + fileName, function (err) {
                        if (!err) {
                            img_all.push({
                                _id: new ObjectID,
                                imageUrl: config.causepicPath + fileName
                            })
                            callBack();
                        } else {
                            callBack();
                        }

                    });
                }, function (err, list) {
                    if (err) {
                        callback({
                            "success": false,
                            "STATUSCODE": 5005,
                            "message": "INTERNAL DB ERROR",
                            "response": {}
                        });
                    } else {
                        //data._id = new ObjectID;
                        data.image = img_all;
                        CauseModels.editCause(data, function (result) {
                            callback({
                                "success": result.response_code == 2000 ? true : false,
                                "STATUSCODE": result.response_code,
                                "message": result.response_message,
                                "response": result.response_data
                            });
                        })
                    }
                })
            } else {
                data.image = img_all;
                CauseModels.editCause(data, function (result) {
                    callback({
                        "success": result.response_code == 2000 ? true : false,
                        "STATUSCODE": result.response_code,
                        "message": result.response_message,
                        "response": result.response_data
                    });
                })
            }

        }
    },
    //Cause list
    listCause: function (data, callback) {
        CauseModels.causeListForAdmin(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    //Upload cause document
    uploadDocCause: function (data, fileData, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide cause title",
                "response_data": {}
            })
        } else if (!data.doctitle || typeof data.doctitle === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide cause title",
                "response_data": {}
            })
        } else if (fileData.length == 0) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide cause image",
                "response_data": {}
            })
        } else {
            var pic = fileData.doc;
            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            var fileName = Date.now() + ext;
            var folderpath = config.uploadCauseDocPath;
            pic.mv(folderpath + fileName, function (err) {
                if (err) {
                    callback({
                        "success": false,
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": err
                    })
                } else {
                    data.document = {
                        _id: new ObjectID,
                        title: data.doctitle,
                        fileUrl: config.causeDocPath + fileName
                    }
                    CauseModels.uploadDocCause(data, function (result) {
                        callback({
                            "success": result.response_code == 2000 ? true : false,
                            "STATUSCODE": result.response_code,
                            "message": result.response_message,
                            "response": result.response_data
                        })
                    });


                }
            });
        }
    },
    //Cause Detail
    detailCause: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide cause id",
                "response_data": {}
            })
        } else {
            CauseModels.causeDetail(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Cause
    deleteCause: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause id",
                "response_data": []
            });
        } else {
            CauseModels.causeDelete(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Cause Document
    deleteCauseDocumentService: function (data, callback) {
        if (!data._id) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause id",
                "response_data": []
            });
        } else {
            CauseModels.deleteCauseDocumentModel(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Cause Image
    deleteCauseImageService: function (data, callback) {
        if (!data._id) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause id",
                "response_data": []
            });
        } else {
            CauseModels.deleteCauseImageModel(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Add vendor
    addVendor: function (data, fileData, callback) {
        if (!data.companyName || typeof data.companyName === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company name",
                "response_data": []
            });
        } else if (!data.ownerName || typeof data.ownerName === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide owner name",
                "response_data": []
            });
        } else if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": []
            });
        } else {
            if (fileData != undefined && fileData != '' && fileData != '') {
                var pic = fileData.companyLogo;
                var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                var fileName = Date.now() + ext;
                var folderpath = config.uploadCompanyLogoPath;
                pic.mv(folderpath + fileName, function (err) {
                    if (err) {
                        callback({
                            "success": false,
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        })
                    } else {
                        data._id = new ObjectID;
                        data.companyLogo = config.companyLogoPath + fileName;
                        VendorModels.AddVendor(data, function (result) {
                            callback({
                                "success": result.response_code == 2000 ? true : false,
                                "STATUSCODE": result.response_code,
                                "message": result.response_message,
                                "response": result.response_data
                            })
                        });
                    }
                });
            } else {
                data._id = new ObjectID;
                data.companyLogo = 'uploads/no-img.jpg';
                VendorModels.AddVendor(data, function (result) {
                    callback({
                        "success": result.response_code == 2000 ? true : false,
                        "STATUSCODE": result.response_code,
                        "message": result.response_message,
                        "response": result.response_data
                    })
                });
            }

        }
    },
    // Edit vendor
    editVendor: function (data, fileData, callback) {
        if (!data._id) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": []
            });
        } else {
            if (fileData != undefined && fileData != '') {
                var pic = fileData.companyLogo;
                var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                var fileName = Date.now() + ext;
                var folderpath = config.uploadCompanyLogoPath;
                pic.mv(folderpath + fileName, function (err) {
                    if (err) {
                        callback({
                            "success": false,
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        })
                    } else {
                        //data._id = new ObjectID;
                        data.companyLogo = config.companyLogoPath + fileName;
                        VendorModels.EditVendor(data, function (result) {
                            callback({
                                "success": result.response_code == 2000 ? true : false,
                                "STATUSCODE": result.response_code,
                                "message": result.response_message,
                                "response": result.response_data
                            })
                        });
                    }
                });
            } else {
                // data._id = new ObjectID;
                // data.companyLogo = 'uploads/no-img.jpg';
                VendorModels.EditVendor(data, function (result) {
                    callback({
                        "success": result.response_code == 2000 ? true : false,
                        "STATUSCODE": result.response_code,
                        "message": result.response_message,
                        "response": result.response_data
                    })
                });
            }

        }
    },
    //Vendor featured set
    setFeatureVendor: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide vendor id",
                "response_data": {}
            })
        } else if (!data.isFeatured || typeof data.isFeatured === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide vendor featured status (yes/no)",
                "response_data": {}
            })
        } else {
            VendorModels.setFeatureVendor(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Vendor
    deleteVendor: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide vendor id",
                "response_data": []
            });
        } else {
            VendorModels.vendorDelete(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    //Vendor list
    listVendor: function (data, callback) {
        VendorModels.vendorListForAdmin(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    //Vendor Detail
    detailVendor: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide vendor id",
                "response_data": {}
            })
        } else {
            VendorModels.vendorDetail(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Add Product category
    productCategoryAdd: function (data, callback) {
        if (!data.category || typeof data.category === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product category name",
                "response_data": []
            });
        } else {
            data._id = new ObjectID;
            ProductModels.productCategoryAdd(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Edit Product category
    productCategoryEdit: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product category id",
                "response_data": []
            });
        } else if (!data.category || typeof data.category === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product category name",
                "response_data": []
            });
        } else {
            ProductModels.productCategoryEdit(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Product category 
    productCategoryDelete: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product type id",
                "response_data": []
            });
        } else {
            ProductModels.productCategoryDelete(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },

    // List product category
    productCategoryList: function (data, callback) {
        ProductModels.productCategoryList(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    // Add product
    addProduct: function (data, fileData, callback) {
        if (!data.category || typeof data.category === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide category id",
                "response_data": []
            });
        } else if (!data.vendor || typeof data.vendor === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide vendor id",
                "response_data": []
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product name",
                "response_data": []
            });
        } else if (!data.description || typeof data.description === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product description",
                "response_data": []
            });
        } else if (!data.point || typeof data.point === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product point",
                "response_data": []
            });
        } else if (fileData.length == 0) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product image",
                "response_data": []
            });
        } else {
            var img_all = [];
            var c = 0;
            async.forEach(fileData, function (item, callBack) {
                var fileName = '';
                var pic = item;
                var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                var fileName = Date.now() + c + ext;
                var folderpath = config.uploadProductpicPath;
                c++;
                pic.mv(folderpath + fileName, function (err) {
                    if (!err) {
                        img_all.push({
                            _id: new ObjectID,
                            imageUrl: config.productpicPath + fileName
                        })
                        callBack();
                    } else {
                        callBack();
                    }

                });
            }, function (err, list) {
                if (err) {
                    callback({
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": {}
                    });
                } else {
                    data._id = new ObjectID;
                    data.image = img_all;
                    ProductModels.addProduct(data, function (result) {
                        callback({
                            "success": result.response_code == 2000 ? true : false,
                            "STATUSCODE": result.response_code,
                            "message": result.response_message,
                            "response": result.response_data
                        });
                    })
                }
            })
        }
    },

    // List product
    productList: function (data, callback) {
        ProductModels.productListForAdmin(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    //Product featured set
    setPopularProduct: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide product id",
                "response_data": {}
            })
        } else if (!data.isPopular || typeof data.isPopular === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide product popular status (yes/no)",
                "response_data": {}
            })
        } else {
            ProductModels.setPopularProduct(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    //Product Detail
    DetailProduct: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide product id",
                "response_data": {}
            })
        } else {
            ProductModels.productDetail(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Product
    DeleteProduct: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product id",
                "response_data": []
            });
        } else {
            ProductModels.productDelete(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Product Image
    deleteProductImageService: function (data, callback) {
        if (!data._id) {
            callback({
                "response_code": 5002,
                "response_message": "please provide Product id",
                "response_data": []
            });
        } else {
            ProductModels.deleteProductImageModel(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Edit Product
    editProduct: function (data, fileData, callback) {
        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause name",
                "response_data": []
            });
        } else if (!data.description || typeof data.description === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause description",
                "response_data": []
            });
        } else {
            var img_all = [];
            if (fileData && fileData.length != 0) {
                var c = 0;
                async.forEach(fileData, function (item, callBack) {
                    var fileName = '';
                    var pic = item;
                    var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                    var fileName = Date.now() + c + ext;
                    var folderpath = config.uploadProductpicPath;
                    c++;

                    pic.mv(folderpath + fileName, function (err) {
                        if (!err) {
                            img_all.push({
                                _id: new ObjectID,
                                imageUrl: config.productpicPath + fileName
                            })
                            callBack();
                        } else {
                            callBack();
                        }

                    });
                }, function (err, list) {
                    if (err) {
                        callback({
                            "success": false,
                            "STATUSCODE": 5005,
                            "message": "INTERNAL DB ERROR",
                            "response": {}
                        });
                    } else {
                        //data._id = new ObjectID;
                        data.image = img_all;
                        ProductModels.editProduct(data, function (result) {
                            callback({
                                "success": result.response_code == 2000 ? true : false,
                                "STATUSCODE": result.response_code,
                                "message": result.response_message,
                                "response": result.response_data
                            });
                        })
                    }
                })
            } else {
                data.image = img_all;
                ProductModels.editProduct(data, function (result) {
                    callback({
                        "success": result.response_code == 2000 ? true : false,
                        "STATUSCODE": result.response_code,
                        "message": result.response_message,
                        "response": result.response_data
                    });
                })
            }

        }
    },
    // List Order
    orderList: function (data, callback) {
        OrderModels.orderListModel(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    //Change Order Status
    changeOrderStatus: function (data, callback) {
        if (!data._id) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": []
            });
        } else if (!data.orderStatus) {
            callback({
                "response_code": 5002,
                "response_message": "please provide Order Status",
                "response_data": []
            });
        } else {
            OrderModels.changeOrderStatus(data, function (result) {
                if (result.response_code == 2000 && data.userId.email) {
                    console.log(data.userId.email);

                    mailProperty('orderStatusChange')(data.userId.email, {
                        name: data.userId.first_name + ' ' + data.userId.last_name,
                        orderId: data._id,
                        orderStatus: data.orderStatus == 'Cancel' ? 'Cancelled' : data.orderStatus,
                        email: data.userId.email,
                        site_url: config.liveUrl,
                        date: new Date()
                    }).send();

                }

                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Add Ads
    addAds: function (data, fileData, callback) {


        if (!data.vendorId) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide vendor id",
                "response": {}
            });
        } else {
            if (fileData) {
                // console.log('data', data);
                // console.log('fileData', fileData);
                // callback({                
                //             "success": true,
                //             "STATUSCODE": 5002,
                //             "message": "please provide vendor id",
                //             "response": {}
                //         });
                var pic = fileData.image;
                var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                var fileName = Date.now() + ext;
                var folderpath = config.uploadAdsImagePath;
                pic.mv(folderpath + fileName, function (err) {
                    if (err) {
                        callback({
                            "success": false,
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        })
                    } else {
                        console.log('data', data);
                        console.log('fileData', fileData);
                        data._id = new ObjectID;
                        data.image = config.AdsImagePath + fileName;
                        AdsModels.adsAdd(data, function (result) {
                            callback({
                                "success": result.response_code == 2000 ? true : false,
                                "STATUSCODE": result.response_code,
                                "message": result.response_message,
                                "response": result.response_data
                            })
                        });
                    }
                });
            } else {
                callback({
                    "success": false,
                    "STATUSCODE": 5002,
                    "message": "please provide image",
                    "response": {}
                });
                // data._id = new ObjectID;
                // data.companyLogo = 'uploads/no-img.jpg';
                // VendorModels.AddVendor(data, function (result) {
                //     callback({
                //         "success": result.response_code == 2000 ? true : false,
                //         "STATUSCODE": result.response_code,
                //         "message": result.response_message,
                //         "response": result.response_data
                //     })
                // });
            }

        }
    },
    // List Ads
    adsList: function (data, callback) {
        AdsModels.adsListModel(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    //Ads featured set
    setFeatureAds: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide ads id",
                "response_data": {}
            })
        } else if (!data.isFeatured || typeof data.isFeatured === undefined) {
            callback({
                "success": false,
                "response_code": 5002,
                "response_message": "please provide ads featured status (yes/no)",
                "response_data": {}
            })
        } else {
            AdsModels.setFeatureAds(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Delete Ads
    DeleteAds: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide Ads id",
                "response_data": []
            });
        } else {
            AdsModels.AdsDelete(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // Edit Ads
    editAds: function (data, fileData, callback) {
        if (!data._id) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": []
            });
        } else {
            if (fileData != undefined && fileData != '') {
                var pic = fileData.image;
                var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                var fileName = Date.now() + ext;
                var folderpath = config.uploadAdsImagePath;
                pic.mv(folderpath + fileName, function (err) {
                    if (err) {
                        callback({
                            "success": false,
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        })
                    } else {
                        //data._id = new ObjectID;
                        data.image = config.AdsImagePath + fileName;
                        AdsModels.EditAds(data, function (result) {
                            callback({
                                "success": result.response_code == 2000 ? true : false,
                                "STATUSCODE": result.response_code,
                                "message": result.response_message,
                                "response": result.response_data
                            })
                        });
                    }
                });
            } else {
                // data._id = new ObjectID;
                // data.companyLogo = 'uploads/no-img.jpg';
                AdsModels.EditAds(data, function (result) {
                    callback({
                        "success": result.response_code == 2000 ? true : false,
                        "STATUSCODE": result.response_code,
                        "message": result.response_message,
                        "response": result.response_data
                    })
                });
            }

        }
    },
};
module.exports = restaurantManagerService;