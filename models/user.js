var UserSchema = require('../schema/users');
var RewardSchema = require('../schema/rewards');
var addToCartSchema = require('../schema/temporaryCarts');
var OrganizationSchema = require('../schema/organization');
var UserOrgSchema = require('../schema/userorganization');
var OrganizationTeamSchema = require('../schema/organiztionteam');
var UserOrgTeamSchema = require('../schema/userorganizationteam');
var TeamJoinRequestSchema = require('../schema/teamjoinrequest');
var NotificationSchema = require('../schema/notifications');
var orderSchema = require('../schema/order');
var userSettingSchema = require('../schema/userSetting');
var bcrypt = require('bcrypt-nodejs');
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var fs = require('fs');
var jwt = require('jsonwebtoken');
var mailProperty = require('../modules/sendMail');
var secretKey = config.secretKey;
var cron = require('node-cron');

var task = cron.schedule('0 0 3 1 * *', () => {

    UserModels.resetGoldMembership(function (result) {
        // console.log('result', result);
    });

}, {
    start: true,
    runOnInit: false
});
task.start();

//create auth token
createToken = (admin) => {
    var tokenData = {
        id: admin._id
    };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: 86400
    });
    return token;
};

//User Details
var UserModels = {
    /*======== For Admin =======*/
    // userList: function (data, callback) {

    //     var query = {};
    //     if (data) {
    //         if (data.page) {
    //             page = parseInt(data.page);
    //         }
    //         if (data.limit) {
    //             limit = parseInt(data.limit);
    //         }
    //         if (data.user_id) {
    //             query = {
    //                 _id: {
    //                     $in: data.user_id
    //                 }
    //             }
    //         }

    //         //var limit = parseInt(data.size) + parseInt(data.number);
    //         var skip = 0;
    //         UserSchema.find(query)
    //             .limit(limit)
    //             .skip((page - 1) * limit)
    //             .exec(function (err, result) {
    //                 if (err) {
    //                     callback({
    //                         "response_code": 5005,
    //                         "response_message": err,
    //                         "response_data": {}
    //                     });
    //                 } else {
    //                     callback({
    //                         "response_code": 2000,
    //                         "response_message": "User list",
    //                         "response_data": result
    //                     });
    //                 }
    //             });
    //     } else {
    //         callback({
    //             "response_code": 5005,
    //             "response_message": "INTERNAL DB ERROR",
    //             "response_data": {}
    //         });
    //     }
    // },
    //User listing
    userList: function (data, callback) {
        if (data) {
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
            if (data.user_id) {
                query = {
                    _id: {
                        $in: data.user_id
                    }
                }
            }
            if (data.name) {
                query['name'] = new RegExp(data.name, 'i');
            }


            async.waterfall([
                    function (nextCb) {
                        UserSchema.paginate(query, {
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
                            "response_message": "User list",
                            "response_data": result
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

    //========Update user clovers/Reward Point =======//

    editUserClovers: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else {


                            UserSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    rewardPoint: parseInt(data.rewardPoint)
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Reward point has been updated."
                                    });
                                }
                            });
                        }
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
    /*======== For Admin =======*/
    // Check Email Exists
    checkEmail: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    email: data.email
                }, {
                    _id: 1,
                    email: 1,
                    email_verify: 1,
                    name: 1,
                    phone_no: 1
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Email address already exist",
                                "response_data": result
                            });
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Email Not Exist.",
                                "response_data": {}
                            });
                        }
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
    // Check Phone no Exists
    checkPhoneNo: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    phone_no: data.phone_no
                }, {
                    _id: 1,
                    email: 1,
                    email_verify: 1,
                    name: 1,
                    phone_no: 1

                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Phone no already exist",
                                "response_data": result
                            });
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Phone no Not Exist.",
                                "response_data": {}
                            });
                        }
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
    //register
    register: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    email: data.email
                }, {
                    _id: 1,
                    email: 1,
                    email_verify: 1,
                    name: 1,
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Email address already exist",
                                "response_data": result
                            });
                        } else {
                            new UserSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "You have registered successfully.Please verify your email account."
                                    });
                                }
                            });
                        }
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
    //Email Verification 
    emailVerify: function (data, callback) {
        if (data) {
            UserSchema.count({
                email: data.email
            }).exec(function (err, resCount) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    if (resCount > 0) {
                        UserSchema.findOne({
                                verification_code: data.verification_code,
                                email: data.email
                            }, {
                                _id: 1,
                                email: 1,
                                name: 1,
                                profile_image: 1
                            },
                            function (err, findRes) {

                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (findRes != null) {
                                        UserSchema.update({
                                            email: data.email
                                        }, {
                                            $set: {
                                                verification_code: '',
                                                email_verify: 'yes'
                                            }
                                        }, function (err, resUpdate) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": {}
                                                });
                                            } else {
                                                var token = createToken(findRes);
                                                var all_result = {
                                                    authtoken: token,
                                                    _id: findRes._id,
                                                    name: findRes.name,
                                                    email: findRes.email,
                                                    profile_image: config.liveUrl + findRes.profile_image
                                                }

                                                callback({
                                                    "response_code": 2000,
                                                    "response_message": "Your account has been activated successfully.",
                                                    "response_data": all_result
                                                });
                                            }
                                        });
                                    } else {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "Verification code is not valid.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            });
                    } else {
                        callback({
                            "response_code": 5002,
                            "response_message": "Email address is not valid.",
                            "response_data": {}
                        });
                    }
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
    // Resend email verification code
    resendEmailVerifyCode: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    email: data.email
                }, {
                    name: 1,
                    country_code: 1,
                    phone_no: 1
                },
                function (err, findRes) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (findRes != null) {
                            UserSchema.update({
                                email: data.email
                            }, {
                                $set: {
                                    verification_code: data.verification_code,
                                    email_verify: 'no'
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (data.verification_method == 'EMAIL') {
                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Please check your registered email address. We send you verification code.",
                                            "response_data": findRes
                                        });
                                    } else {
                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Please check your registered phone no. We send you verification code.",
                                            "response_data": findRes
                                        });
                                    }

                                }
                            });
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Email address is not valid.",
                                "response_data": {}
                            });
                        }

                    }
                });
        } else {
            callback({
                "response_code": 5002,
                "response_message": "Email address is not valid.",
                "response_data": {}
            });
        }
    },
    //login
    login: async function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    email: data.email
                }, {
                    _id: 1,
                    type: 1,
                    socialLogin: 1,
                    email: 1,
                    password: 1,
                    email_verify: 1,
                    name: 1,
                    profile_image: 1,
                    gold_member: 1
                },
                async function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Wrong password or email. Please provide registered details.",
                                "response_data": {}
                            });
                        } else {
                            if (result.email_verify == 'no') {
                                var all_result = {
                                    authtoken: '',
                                    _id: result._id,
                                    name: result.name,
                                    email: result.email
                                }
                                callback({
                                    "response_code": 5010,
                                    "response_message": "Your account is not activated. Please activate your account.",
                                    "response_data": all_result
                                });
                            } else if (result.status == 'no') {
                                var all_result = {
                                    authtoken: '',
                                    _id: result._id,
                                    name: result.name,
                                    email: result.email
                                }
                                callback({
                                    "response_code": 5010,
                                    "response_message": "Your account is temporarily blocked. Please contact admin.",
                                    "response_data": all_result
                                });
                            } else if (result.type != "NORMAL") {
                                let social_type = 'Facebook';
                                if (result.type == 'GOOGLE') {
                                    social_type = 'Google';
                                }
                                callback({
                                    "response_code": 5010,
                                    "response_message": "You have register using " + social_type,
                                    "response_data": {}
                                });
                            } else {

                                var comparePass = bcrypt.compareSync(data.password, result.password);
                                if (comparePass == true) {
                                    let order_current_month = 0;

                                    await UserModels.goldMembership({
                                        userId: result._id
                                    }, function (response) {
                                        order_current_month = response.response_data;
                                    })

                                    var token = createToken(result);
                                    UserSchema.update({
                                        _id: result._id
                                    }, {
                                        $set: {
                                            devicetoken: data.devicetoken,
                                            pushtoken: data.pushtoken,
                                            apptype: data.apptype
                                        }
                                    }, function (err, resUpdate) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": "INTERNAL DB ERROR",
                                                "response_data": {}
                                            });
                                        } else {

                                            let profile_image = '';

                                            if (result.type != "NORMAL") {
                                                profile_image = result.socialLogin[0].image;
                                            } else {
                                                profile_image = config.liveUrl + result.profile_image;
                                            }
                                            if (profile_image == '' || profile_image == null) {
                                                profile_image = config.liveUrl + config.userDemoPicPath;
                                            }
                                            var all_result = {
                                                authtoken: token,
                                                _id: result._id,
                                                name: result.name,
                                                email: result.email,
                                                profile_image: profile_image,
                                                gold_member: result.gold_member,
                                                order_current_month: order_current_month
                                            }
                                            callback({
                                                "response_code": 2000,
                                                "response_message": "Logged your account",
                                                "response_data": all_result
                                            });
                                        }
                                    });
                                } else {
                                    callback({
                                        "response_code": 5002,
                                        "response_message": "Wrong password or email. Please provide registered details.",
                                        "response_data": {}
                                    });
                                }
                            }
                        }
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
    socialRegister: (data, callback) => {

        var profile_image = '';
        UserSchema.findOne({
            email: data.email
        }, (err, user) => {
            if (err) {
                console.log("Error1", err);
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                });
            } else {
                if (user) {
                    let token = createToken(user);
                    user.authtoken = token;
                    user.type = data.socialLogin.type;
                    user.socialLogin = [data.socialLogin];
                    user.devicetoken = data.devicetoken;
                    user.apptype = data.apptype;
                    user.save();

                    if (user.type != "NORMAL") {
                        profile_image = user.socialLogin[0].image;
                    } else {
                        profile_image = config.liveUrl + result.profile_image;
                    }
                    if (profile_image == '' || profile_image == null) {
                        profile_image = config.liveUrl + config.userDemoPicPath;
                    }
                    callback({
                        "response_code": 2008,
                        "response_message": "Email address already exist",
                        "response_data": {
                            authtoken: user.authtoken,
                            _id: user._id,
                            name: data.name,
                            email: data.email,
                            socialData: user.socialLogin,
                            profile_image: profile_image
                        }
                    })
                } else {
                    data._id = new ObjectID;
                    let token = createToken(data);
                    if (token) {
                        //data.authtoken = token;
                        //data.user_type = 'Normal User';
                        data.type = data.socialLogin.type;
                        data.socialLogin = [data.socialLogin];
                        data.email_verify = 'yes';
                        data.devicetoken = data.devicetoken;
                        data.apptype = data.apptype;

                        new UserSchema(data).save(function (err, result) {
                            if (err) {
                                console.log("Error2", err);
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {

                                profile_image = result.socialLogin[0].image;

                                if (profile_image == '' || profile_image == null) {
                                    profile_image = config.liveUrl + config.userDemoPicPath;
                                }
                                mailProperty('socialSignUp')(data.email, {
                                    name: data.name,
                                    email: data.email,
                                    site_url: config.liveUrl,
                                    email_validation_url: ``
                                }).send();
                                var all_result = {
                                    authtoken: token,
                                    _id: result._id,
                                    name: result.name,
                                    email: result.email,
                                    country_code: result.country_code,
                                    phone_no: result.phone_no,
                                    socialLogin: [result.socialLogin],
                                    profile_image: profile_image
                                }
                                callback({
                                    "response_code": 2000,
                                    "response_message": "User Successfully Logged in.",
                                    "response_data": all_result
                                });
                            }
                        });
                    }
                }
            }
        })
    },
    //Forgotpassword
    forgotPassword: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    email: data.email
                }, {
                    name: 1,
                },
                function (err, resDetails) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (resDetails == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User does not exist.",
                                "response_data": {}
                            });
                        } else {
                            UserSchema.update({
                                _id: resDetails._id
                            }, {
                                $set: {
                                    otp: data.otp
                                }
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Please check your registered email address. We send OTP.",
                                        "response_data": resDetails
                                    });
                                }
                            });

                        }
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
    //OTP Verification 
    // verifyOtp: function (data, callback) {
    //     if (data) {
    //         UserSchema.count({
    //             email: data.email
    //         }).exec(function (err, resCount) {
    //             if (err) {
    //                 callback({
    //                     "response_code": 5005,
    //                     "response_message": "INTERNAL DB ERROR",
    //                     "response_data": {}
    //                 });
    //             } else {
    //                 if (resCount > 0) {
    //                     UserSchema.count({
    //                         otp: data.otp
    //                     }).exec(function (err, resCount) {
    //                         if (err) {
    //                             callback({
    //                                 "response_code": 5005,
    //                                 "response_message": "INTERNAL DB ERROR",
    //                                 "response_data": {}
    //                             });
    //                         } else {
    //                             if (resCount > 0) {
    //                                 UserSchema.update({
    //                                     email: data.email
    //                                 }, {
    //                                     $set: {
    //                                         otp: ''
    //                                     }
    //                                 }, function (err, resUpdate) {
    //                                     if (err) {
    //                                         callback({
    //                                             "response_code": 5005,
    //                                             "response_message": "INTERNAL DB ERROR",
    //                                             "response_data": {}
    //                                         });
    //                                     } else {
    //                                         callback({
    //                                             "response_code": 2000,
    //                                             "response_message": "You can reset your password."
    //                                         });
    //                                     }
    //                                 });
    //                             } else {
    //                                 callback({
    //                                     "response_code": 5002,
    //                                     "response_message": "OTP is not valid.",
    //                                     "response_data": {}
    //                                 });
    //                             }
    //                         }
    //                     });
    //                 } else {
    //                     callback({
    //                         "response_code": 5002,
    //                         "response_message": "Email address is not valid.",
    //                         "response_data": {}
    //                     });
    //                 }
    //             }
    //         });
    //     } else {
    //         callback({
    //             "response_code": 5005,
    //             "response_message": "INTERNAL DB ERROR",
    //             "response_data": {}
    //         });
    //     }
    // },
    // Reset password
    resetPassword: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    email: data.email
                }, {
                    _id: 1
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {

                        bcrypt.hash(data.password, null, null, function (err, hash) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {
                                UserSchema.count({
                                    email: data.email,
                                    otp: data.otp
                                }).exec(function (err, resCount) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        if (resCount > 0) {
                                            UserSchema.update({
                                                _id: result._id
                                            }, {
                                                $set: {
                                                    otp: '',
                                                    password: hash
                                                }
                                            }, function (err, resUpdate) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                } else {
                                                    callback({
                                                        "response_code": 2000,
                                                        "response_message": "Password has been changed. You can login your account."
                                                    });
                                                }
                                            });
                                        } else {
                                            callback({
                                                "response_code": 5002,
                                                "response_message": "OTP is not valid.",
                                                "response_data": {}
                                            });
                                        }
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
    // Block User
    blockUser: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else {
                            UserSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    status: data.status,
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (data.status == 'no') {
                                        callback({
                                            "response_code": 2000,
                                            "response_message": "User has been blocked."
                                        });
                                    } else {
                                        callback({
                                            "response_code": 2000,
                                            "response_message": "User unblocked."
                                        });
                                    }
                                }
                            });
                        }
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
    //Profile view
    viewProfile: async function (data, callback) {
        if (data) {
            UserSchema.aggregate({
                    $match: {
                        _id: data._id
                    }
                },
                // {
                //     $lookup: {
                //         from: 'rewards',
                //         localField: '_id',
                //         foreignField: 'user_id',
                //         as: 'Reward'
                //     }
                // }, 
                {
                    $project: {
                        name: 1,
                        profile_image: 1,
                        email: 1,
                        country_code: 1,
                        phone_no: 1,
                        dob: 1,
                        type: 1,
                        socialLogin: 1,
                        status: 1,
                        profile_image_updated: 1,
                        gold_member: 1,
                        rewardPoint: 1,
                        redeemReward: 1,

                        // 'totalReward': {
                        //     $cond: {
                        //         if: {
                        //             $gt: [{
                        //                 $size: "$Reward"
                        //             }, 0]
                        //         },
                        //         then: {
                        //             "$arrayElemAt": ["$Reward.totalReward", 0]
                        //         },
                        //         else: 0
                        //     }
                        // },
                        // 'remainReward': {
                        //     $cond: {
                        //         if: {
                        //             $gt: [{
                        //                 $size: "$Reward"
                        //             }, 0]
                        //         },
                        //         then: {
                        //             "$arrayElemAt": ["$Reward.remainReward", 0]
                        //         },
                        //         else: 0
                        //     }
                        // }
                    }
                },
                async function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result.length > 0) {
                            result = result[0];
                            if (result.profile_image_updated == false) {
                                if (result.type == "NORMAL") {
                                    if (result.profile_image == '') {
                                        result.profile_image = config.liveUrl + config.userDemoPicPath;
                                    } else {
                                        result.profile_image = config.liveUrl + result.profile_image;
                                    }

                                } else {
                                    result.profile_image = result.socialLogin[0].image;
                                }

                            } else {
                                result.profile_image = config.liveUrl + result.profile_image;
                            }
                            if (result.profile_image == null || result.profile_image == '' || result.profile_image == undefined) {
                                result.profile_image = config.liveUrl + config.userDemoPicPath;
                            }
                            result.totalClover = result.rewardPoint - result.redeemReward;

                            var userType = 'normal';
                            if (result.gold_member == 'yes') {
                                userType = 'gold';
                            }

                            await userSettingSchema.findOne({
                                userType: userType
                            }, function (err, userSetting) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": err,
                                        "response_data": {}
                                    });

                                } else {
                                    result.cloverEarn = {
                                        spendAmount: userSetting.discount,
                                        clover: userSetting.clover
                                    }
                                }
                            })

                            await UserModels.goldMembership({
                                userId: result._id
                            }, function (response) {

                                result.order_current_month = response.response_data;

                                callback({
                                    "response_code": 2000,
                                    "response_message": "User Profile Details.",
                                    "response_data": result
                                });
                            })

                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "User does not exist",
                                "response_data": {}
                            });
                        }
                    }
                });
        }
    },
    resetGoldMembership: function (data, callback) {
        UserSchema.find({
            gold_member: 'yes'
        }, {
            _id: 1
        }).exec(function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });
            } else {

                async.forEach(result, function (item, callBack) {

                    UserSchema.update({
                        _id: item._id
                    }, {
                        $set: {
                            gold_member: 'no'
                        }
                    }, function (err, result) {
                        if (err) {
                            console.log("err===>", err);
                        }
                    });

                    callBack();
                }, function (err, content) {
                    if (err) {
                        console.log("err===>", err);
                    }
                });

            }
        });
    },
    goldMembership: function (data, callback) {
        if (data) {

            var page = 1,
                limit = 20,
                sortBy = -1,
                query = {},
                d = new Date(),
                year = d.getFullYear(),
                month = d.getMonth()


            var aggregate = orderSchema.aggregate();

            aggregate.project({
                _id: 1,
                "year": {
                    "$year": "$createdAt"
                },
                "month": {
                    "$month": "$createdAt"
                },
                orderStatus: 1,
                createdAt: 1,
                userId: 1

            });

            aggregate.match({
                userId: data.userId,
                year: year,
                month: month + 1,
                orderStatus: 'Delivered'
            });

            aggregate.sort({
                'createdAt': sortBy
            })

            var options = {
                page: page,
                limit: limit
            }

            orderSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                } else {

                    if (count >= 10) {

                        UserSchema.update({
                            _id: data.userId
                        }, {
                            $set: {
                                gold_member: 'yes'
                            }
                        }, function (err, resUpdate) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {
                                callback({
                                    "response_code": 2000,
                                    "response_message": "You have been updated to gold member successfully",
                                    "response_data": count,
                                    "gold_member": 'yes',
                                });
                            }
                        });

                    } else {

                        callback({
                            "response_code": 2008,
                            "response_message": "You are not eligible for gold membership",
                            "response_data": count
                        });
                    }
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
    //Update Profile 
    editProfile: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else {
                            UserSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    name: data.name,
                                    dob: data.dob,
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Profile has been updated."
                                    });
                                }
                            });
                        }
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
    deleteUserRequest: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data.user_id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else {

                            mailProperty('deleteUserRequest')(["caria@ezfoodie.com", "dibyendu.brainium@gmail.com"], {
                                name: result.name,
                                email: result.email,
                                reason_for_delete: data.reason_for_delete,
                                site_url: config.liveUrl,
                                email_validation_url: ``
                            }, false, false, true).send();

                            callback({
                                "response_code": 2000,
                                "response_message": "Request Received Successfully.",
                                "response_data": {}
                            });

                        }
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
    // Delete User
    deleteUser: function (data, callback) {
        if (data) {
            async.waterfall([
                    function (nextCb) {
                        UserSchema.findOne({
                                _id: data.user_id
                            },
                            function (err, userData) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (userData == null) {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "User is not valid.",
                                            "response_data": {}
                                        });
                                    } else {
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": userData
                                        });
                                    }
                                }
                            });

                    },
                    function (response, nextCb) {
                        if (response.response_code == 2000) {

                            OrganizationSchema.find({
                                organiztion_owner: data.user_id
                            }, {}).exec(function (err, orgData) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (orgData == null) {

                                        // Remove all organization jointing data for this user
                                        UserOrgSchema.remove({
                                            user_id: data.user_id
                                        }, function (err, result) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": err
                                                });
                                            } else {
                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": response.response_data
                                                });
                                            }
                                        });

                                    } else {


                                        //Remove the organizations
                                        async.forEach(orgData, function (item, callBack) {

                                            OrganizationSchema.remove({
                                                _id: item._id
                                            }, function (err, result) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": err
                                                    });
                                                } else {
                                                    // Released all the user those are linked with this organization
                                                    UserOrgSchema.remove({
                                                        orgid: item._id
                                                    }, function (err, result) {
                                                        if (err) {
                                                            callback({
                                                                "response_code": 5005,
                                                                "response_message": "INTERNAL DB ERROR",
                                                                "response_data": err
                                                            });
                                                        }
                                                    });
                                                }
                                            });

                                            callBack();
                                        }, function (err, content) {
                                            if (err) {
                                                nextCb(null, err);
                                            } else {

                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": response.response_data
                                                });

                                            }
                                        });

                                    }

                                }
                            });
                        }
                    },
                    function (response, nextCb) {
                        if (response.response_code == 2000) {

                            OrganizationTeamSchema.find({
                                team_owner: data.user_id
                            }, {}).exec(function (err, teamData) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (teamData == null) {

                                        // Remove all team jointing data for this user
                                        UserOrgTeamSchema.remove({
                                            user_id: data.user_id
                                        }, function (err, result) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": err
                                                });
                                            } else {
                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": response.response_data
                                                });
                                            }
                                        });

                                    } else {

                                        //Remove the teams
                                        async.forEach(teamData, function (item, callBack) {

                                            OrganizationTeamSchema.remove({
                                                _id: item._id
                                            }, function (err, result) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": err
                                                    });
                                                } else {
                                                    let team_id_proof = `./public/${item.id_proof}`;

                                                    if (fs.existsSync(team_id_proof)) {
                                                        fs.unlink(team_id_proof, (err) => {
                                                            if (err) throw err;
                                                            console.log('successfully deleted');
                                                        });
                                                    }
                                                    // Released all the user those are linked with this team
                                                    UserOrgTeamSchema.remove({
                                                        teamid: item._id
                                                    }, function (err, result) {
                                                        if (err) {
                                                            callback({
                                                                "response_code": 5005,
                                                                "response_message": "INTERNAL DB ERROR",
                                                                "response_data": err
                                                            });
                                                        }
                                                    });
                                                }
                                            });

                                            // Released all the user those are request to join this team
                                            TeamJoinRequestSchema.remove({
                                                teamid: item._id
                                            }, function (err, result) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": err
                                                    });
                                                }
                                            });

                                            //Remove all the notification related this time
                                            NotificationSchema.find({
                                                notification_for: "team_member",
                                                "team_join_request_details.teamid": item._id
                                            }, {}).exec(function (err, notificationData) {
                                                if (err) {
                                                    nextCb(null, err);
                                                } else {
                                                    if (notificationData != null) {

                                                        async.forEach(notificationData, function (notification, callBack) {
                                                            NotificationSchema.remove({
                                                                _id: notification._id
                                                            }, function (err, result) {
                                                                if (err) {
                                                                    callback({
                                                                        "response_code": 5005,
                                                                        "response_message": "INTERNAL DB ERROR",
                                                                        "response_data": err
                                                                    });
                                                                }
                                                            });
                                                            callBack();
                                                        });
                                                    }
                                                }
                                            });

                                            callBack();
                                        }, function (err, content) {
                                            if (err) {
                                                nextCb(null, err);
                                            } else {

                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": response.response_data
                                                });

                                            }
                                        });

                                    }

                                }
                            });
                        }
                    },
                    function (response, nextCb) {
                        if (response.response_code == 2000) {

                            let name = response.response_data.name;
                            let user_email = response.response_data.email;
                            UserSchema.remove({
                                _id: data.user_id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {

                                    mailProperty('deleteUser')(user_email, {
                                        name: name,
                                        site_url: config.liveUrl
                                    }).send();

                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": {}
                                    });
                                }
                            });


                        }
                    },
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
                            "response_message": "User Deleted Successfully.",
                            "response_data": {}
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
    //Update Profile image
    editProfileImage: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                }, {
                    profile_image: data.profile_image
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else {
                            if (result.profile_image != null || result.profile_image != '') {
                                fs.unlink(result.profile_image, (err) => {
                                    if (err) {
                                        console.log('err', err);
                                    } else {
                                        console.log(result.profile_image + ' was deleted');
                                    }

                                });
                            }
                            UserSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    profile_image: data.profile_image,
                                    profile_image_updated: true
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Profile image has been changed.",
                                        "response_data": config.liveUrl + data.profile_image
                                    });
                                }
                            });
                        }
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
    // change password
    changePassword: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User does not exist.",
                                "response_data": {}
                            });
                        } else {
                            var comparePass = bcrypt.compareSync(data.currentpassword, result.password);
                            if (comparePass == true) {
                                bcrypt.hash(data.password, null, null, function (err, hash) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        bcrypt.compare(data.password, result.password, function (err, res) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": {}
                                                });
                                            } else {
                                                if (res == false) {
                                                    UserSchema.update({
                                                            _id: data._id
                                                        }, {
                                                            $set: {
                                                                password: hash
                                                            }
                                                        },
                                                        function (err, resUpdate) {
                                                            if (err) {
                                                                callback({
                                                                    "response_code": 5005,
                                                                    "response_message": "INTERNAL DB ERROR",
                                                                    "response_data": {}
                                                                });
                                                            } else {
                                                                callback({
                                                                    "response_code": 2000,
                                                                    "response_message": "Password has been changed."
                                                                });
                                                            }
                                                        });
                                                } else {
                                                    callback({
                                                        "response_code": 5002,
                                                        "response_message": "Current password and new password are same.",
                                                        "response_data": {}
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            } else {
                                callback({
                                    "response_code": 5002,
                                    "response_message": "Current password is wrong.",
                                    "response_data": {}
                                });
                            }
                        }
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
    //Update Email Request 
    updateEmailReq: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else if (result.email == data.email) {
                            callback({
                                "response_code": 5002,
                                "response_message": "New email and current email can't be same.",
                                "response_data": {}
                            });
                        } else {
                            UserSchema.findOne({
                                    email: data.email
                                },
                                function (err, result2) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        if (result2 == null) {
                                            UserSchema.update({
                                                _id: data._id
                                            }, {
                                                $set: {
                                                    newemail: data.email,
                                                }
                                            }, function (err, resUpdate) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                } else {
                                                    var all_result = {
                                                        _id: result._id,
                                                        name: result.name,
                                                        email: result.email,
                                                        newemail: data.email
                                                    }
                                                    callback({
                                                        "response_code": 2000,
                                                        "response_message": "Please check your email and verify the link to update email address.",
                                                        "response_data": all_result
                                                    });
                                                }
                                            });
                                        } else {
                                            callback({
                                                "response_code": 5002,
                                                "response_message": "New email is already exist with some other account.",
                                                "response_data": {}
                                            });
                                        }

                                    }
                                });

                        }
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
    //Update Email  
    updateEmail: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else if (result.newemail == null || result.newemail == undefined) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Email Already Changed.",
                                "response_data": {}
                            });
                        } else {
                            UserSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    email: result.newemail,
                                    newemail: null,
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    mailProperty('changeEmailSuccess')(result.newemail, {
                                        name: result.name,
                                        email: result.email,
                                        site_url: config.liveUrl,
                                    }).send();
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Email address updated successfully.",
                                    });
                                }
                            });
                        }
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
    //Update Phone No Request
    updatePhoneNoReq: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                }, {
                    name: 1,
                },
                function (err, resDetails) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (resDetails == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User does not exist.",
                                "response_data": {}
                            });
                        } else if (resDetails.phone_no == data.phone_no) {
                            callback({
                                "response_code": 5002,
                                "response_message": "New phone no and current phone no can't be same.",
                                "response_data": {}
                            });
                        } else {
                            UserSchema.update({
                                _id: resDetails._id
                            }, {
                                $set: {
                                    otp: data.otp,
                                    newcountry_code: data.country_code,
                                    newphone_no: data.phone_no
                                }
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Please verify OTP.",
                                    });
                                }
                            });

                        }
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
    //Update Phone No 
    updatePhoneNo: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else if (result.newphone_no == null || result.newphone_no == undefined) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Phone No Already Changed.",
                                "response_data": {}
                            });
                        } else {
                            UserSchema.count({
                                _id: data._id,
                                otp: data.otp
                            }).exec(function (err, resCount) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (resCount > 0) {
                                        UserSchema.update({
                                            _id: result._id
                                        }, {
                                            $set: {
                                                otp: '',
                                                country_code: result.newcountry_code,
                                                phone_no: result.newphone_no,
                                                newcountry_code: null,
                                                newphone_no: null,
                                            }
                                        }, function (err, resUpdate) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": {}
                                                });
                                            } else {
                                                callback({
                                                    "response_code": 2000,
                                                    "response_message": "Phone No updated successfully"
                                                });
                                            }
                                        });
                                    } else {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "OTP is not valid.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            });

                        }
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
}
module.exports = UserModels;