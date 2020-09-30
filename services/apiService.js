'use strict';
var express = require("express");
var Request = require("request");
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var qs = require('qs');
var fs = require('fs')
var logger = require('morgan');
const {
    Expo
} = require('expo-server-sdk');
var ObjectID = mongo.ObjectID;
var baseUrl = config.baseUrl;
var twilio = require('twilio');
var twillow_client = new twilio(config.twillow['live'].accountSid, config.twillow['live'].authToken);

//======================MODELS============================
var UserModels = require('../models/user');
var OrganizationModels = require('../models/organization');
var OrganizationTeamModels = require('../models/organizationteam');
var NotificationModels = require('../models/notification');
var ContentModels = require('../models/content');
var TeamNameChangeModels = require('../models/teamnamechange');
var RestaurantModels = require('../models/restaurant');
var MenuItemModel = require('../models/menuItem');
var FavouriteRestaurantModels = require('../models/favouriteRestaurant');
var OrderModels = require('../models/order');
var cloversSchemaService = require('../services/cloverSchemeService');
var TeamChatModels = require('../models/teamChat');
// var RecyclingProductModels = require('../models/recyclingProduct');
// var CauseModels = require('../models/cause');
// var VendorModels = require('../models/vendor');
// var ProductModels = require('../models/product');

// var AdsModels = require('../models/ads');
//======================Schema============================
//======================Module============================
//var pushNotification = require('../modules/pushNotification');
var mailProperty = require('../modules/sendMail');

const {
    STATUS_CONSTANTS,
    STATUS_MESSAGES,
    randomSrting
} = require('../utils/constant');

function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

var apiService = {
    //Contant page
    cms: (callback) => {
        // if (!data.content_type || typeof data.content_type === undefined) {
        //     callback({
        //         "response_code": 5002,
        //         "response_message": "please provide content type",
        //         "response_data": []
        //     });
        // } else {
        ContentModels.contentList(function (result) {
            if (result.response_code == 2000) {
                callback({
                    "response_code": 2000,
                    "response_message": result.response_message,
                    "response_data": result.response_data
                });
            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User not found",
                    "response_data": []
                });
            }
        });
        //}
    },
    //list promotional banner
    bannerList: function (data, callback) {
        ContentModels.bannerList(data, function (result) {
            callback(result)
        });
    },
    // Check Email Exists
    checkPushNotify: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please user id",
                "response_data": {}
            });
        } else {
            OrganizationTeamModels.checkPushNotify(data, function (result) {
                callback(result);
            });
        }
    },
    // Check Email Exists
    checkEmail: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            UserModels.checkEmail(data, function (result) {
                callback(result);
            });
        }
    },
    // Check Phone no Exists
    checkPhoneNo: (data, callback) => {
        if (!data.phone_no || typeof data.phone_no === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide phone no",
                "response_data": {}
            });
        } else {
            UserModels.checkPhoneNo(data, function (result) {
                callback(result);
            });
        }
    },
    //register
    register: (data, callback) => {
        async.waterfall([
            function (nextCb) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (!data.name || typeof data.name === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide name",
                        "response_data": {}
                    });
                } else if (!data.email || typeof data.email === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide email address",
                        "response_data": {}
                    });
                } else if (!re.test(String(data.email).toLowerCase())) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide valid email address",
                        "response_data": {}
                    });
                } else if (!data.dob || typeof data.dob === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide date of birth",
                        "response_data": {}
                    });
                }
                /*else if (getAge(data.dob) < 18) {
                                   nextCb(null, {
                                       "response_code": 5002,
                                       "response_message": "Your age should be atleast 18 years",
                                       "response_data": {}
                                   });
                               }*/
                else if (!data.password || typeof data.password === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide password",
                        "response_data": {}
                    });
                } else if (!data.country_code || typeof data.country_code === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide country code",
                        "response_data": {}
                    });
                } else if (!data.phone_no || typeof data.phone_no === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide phone number",
                        "response_data": {}
                    });
                } else if (!data.verification_method || typeof data.verification_method === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please select otp option",
                        "response_data": {}
                    });
                } else if (!data.devicetoken || typeof data.devicetoken === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide devicetoken",
                        "response_data": {}
                    });
                } else if (!data.apptype || typeof data.apptype === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide app type",
                        "response_data": {}
                    });
                } else if (!data.type || typeof data.type === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide type",
                        "response_data": {}
                    });
                } else {
                    data._id = new ObjectID;
                    data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
                    data.email = String(data.email).toLowerCase();

                    UserModels.register(data, function (result) {
                        nextCb(null, result);
                    });
                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code == 2000) {

                    if (data.verification_method == 'EMAIL') {

                        mailProperty('emailVerificationMail')(data.email, {
                            name: data.name,
                            email: data.email,
                            verification_code: data.verification_code,
                            site_url: config.liveUrl,
                            date: new Date()
                        }).send();

                        nextCb(null, arg1);
                    }
                    if (data.verification_method == 'SMS') {

                        // Twillo Message
                        twillow_client.messages
                            .create({
                                body: 'Your verification code is: ' + data.verification_code,
                                from: config.twillow['live'].from_no,
                                to: data.country_code + data.phone_no
                            })
                            .then(message => {

                                nextCb(null, {
                                    "status": true,
                                    "response_code": arg1.response_code,
                                    "response_message": arg1.response_message,
                                    "tw_response_code": 2000,
                                    "tw_response_data": message
                                });
                            })
                            .catch(e => {
                                console.error('Got an error:', e.code, e.message);
                                nextCb(null, {
                                    "status": false,
                                    "response_code": arg1.response_code,
                                    "response_message": arg1.response_message,
                                    "tw_response_code": e.code,
                                    "tw_response_data": e.message
                                });
                            });

                    }

                    // mailProperty('emailVerificationMail')(data.email, {
                    //     name: data.first_name + ' ' + data.last_name,
                    //     email: data.email,
                    //     verification_code: data.verification_code,
                    //     site_url: config.liveUrl,
                    //     date: new Date()
                    // }).send();
                    //  nextCb(null, arg1);
                } else {
                    nextCb(null, arg1);
                }
            }
        ], function (err, result) {

            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                });
            } else {
                callback({
                    "response_code": result.response_code,
                    "response_message": result.response_message,
                    "response_data": result.response_data,
                    "twillow_data": [{
                        "status": result.status,
                        "response_code": result.tw_response_code,
                        "response_message": result.tw_response_data
                    }]
                });
            }
        });
    },
    //Email Verification
    emailVerification: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            })
        } else if (!data.verification_code || typeof data.verification_code === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide verification code",
                "response_data": {}
            })
        } else {
            data.email = String(data.email).toLowerCase();
            UserModels.emailVerify(data, function (result) {
                callback(result);
            });
        }
    },
    //Resend email verification code
    resendEmailVerifyCode: (data, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!data.email || typeof data.email === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide email address",
                        "response_data": {}
                    });
                } else if (!data.verification_method || typeof data.verification_method === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please select otp option",
                        "response_data": {}
                    });
                } else {
                    data.email = String(data.email).toLowerCase();
                    data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
                    UserModels.resendEmailVerifyCode(data, function (result) {
                        nextCb(null, result);
                    });
                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code == 2000) {

                    if (data.verification_method == 'EMAIL') {

                        mailProperty('emailVerificationMail')(data.email, {
                            name: arg1.response_data.name,
                            email: data.email,
                            verification_code: data.verification_code,
                            site_url: config.liveUrl,
                            date: new Date()
                        }).send();

                        nextCb(null, arg1);
                    }
                    if (data.verification_method == 'SMS') {

                        // Twillo Message
                        twillow_client.messages
                            .create({
                                body: 'Your verification code is: ' + data.verification_code,
                                from: config.twillow['live'].from_no,
                                to: arg1.response_data.country_code + arg1.response_data.phone_no
                            })
                            .then(message => {

                                nextCb(null, {
                                    "status": true,
                                    "response_code": arg1.response_code,
                                    "response_message": arg1.response_message,
                                    "tw_response_code": 2000,
                                    "tw_response_data": message
                                });
                            })
                            .catch(e => {
                                console.error('Got an error:', e.code, e.message);
                                nextCb(null, {
                                    "status": false,
                                    "response_code": arg1.response_code,
                                    "response_message": arg1.response_message,
                                    "tw_response_code": e.code,
                                    "tw_response_data": e.message
                                });
                            });

                    }

                    // mailProperty('emailVerificationMail')(data.email, {
                    //     name: data.first_name + ' ' + data.last_name,
                    //     email: data.email,
                    //     verification_code: data.verification_code,
                    //     site_url: config.liveUrl,
                    //     date: new Date()
                    // }).send();
                    //  nextCb(null, arg1);
                } else {
                    nextCb(null, arg1);
                }
            }
        ], function (err, result) {

            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                });
            } else {
                callback({
                    "response_code": result.response_code,
                    "response_message": result.response_message,
                    "twillow_data": [{
                        "status": result.status,
                        "response_code": result.tw_response_code,
                        "response_message": result.tw_response_data
                    }]
                });
            }
        });

        // if (!data.email || typeof data.email === undefined) {
        //     callback({
        //         "response_code": 5002,
        //         "response_message": "please provide email address",
        //         "response_data": {}
        //     })
        // } else if (!data.verification_method || typeof data.verification_method === undefined) {
        //     nextCb(null, {
        //         "response_code": 5002,
        //         "response_message": "please select otp option",
        //         "response_data": {}
        //     });
        // } else {
        //     data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
        //     UserModels.resendEmailVerifyCode(data, function (result) {
        //         mailProperty('emailVerificationMail')(data.email, {
        //             name: result.response_data.name,
        //             email: data.email,
        //             verification_code: data.verification_code,
        //             site_url: config.liveUrl,
        //             date: new Date()
        //         }).send();
        //         callback({
        //             response_code: result.response_code,
        //             response_message: result.response_message
        //         });
        //     });
        // }
    },
    //login 
    login: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide password",
                "response_data": {}
            });
        } else if (!data.devicetoken || typeof data.devicetoken === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide devicetoken",
                "response_data": {}
            });
        } else if (!data.apptype || typeof data.apptype === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide apptype",
                "response_data": {}
            });
        } else {
            UserModels.login(data, function (result) {
                callback(result);
            });
        }
    },
    // Social Login
    socialRegister: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.country_code || typeof data.country_code === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country code",
                "response_data": {}
            });

        } else if (!data.phone_no || typeof data.phone_no === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide phone number",
                "response_data": {}
            });

        } else if (!data.devicetoken || typeof data.devicetoken === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide devicetoken",
                "response_data": {}
            });
        } else if (!data.apptype || typeof data.apptype === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide apptype",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            UserModels.socialRegister(data, function (result) {
                callback(result);
            });
        }
    },
    //Forgot password
    forgotPassword: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            data.otp = Math.random().toString().replace('0.', '').substr(0, 4);
            UserModels.forgotPassword(data, function (result) {
                mailProperty('sendOTPdMail')(data.email, {
                    otp: data.otp,
                    email: data.email,
                    name: result.response_data.name,
                    site_url: config.liveUrl,
                    date: new Date()
                }).send();
                callback({
                    "response_code": result.response_code,
                    "response_message": result.response_message
                });
            });
        }

    },
    //verify Otp
    // verifyOtp: (data, callback) => {
    //     if (!data.email || typeof data.email === undefined) {
    //         callback({
    //             "response_code": 5002,
    //             "response_message": "please provide email address",
    //             "response_data": {}
    //         })
    //     } else if (!data.otp || typeof data.otp === undefined) {
    //         callback({
    //             "response_code": 5002,
    //             "response_message": "please provide OTP",
    //             "response_data": {}
    //         })
    //     } else {
    //         UserModels.verifyOtp(data, function (result) {
    //             callback(result);
    //         });
    //     }
    // },
    //reset password 
    resetPassword: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.otp || typeof data.otp === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide OTP",
                "response_data": {}
            })
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide new password",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            UserModels.resetPassword(data, function (result) {
                callback(result);
            });
        }
    },
    //Profile View
    viewProfile: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            UserModels.viewProfile(data, function (result) {
                callback(result);
            })
        }
    },
    //Edit profile
    editProfile: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide first name",
                "response_data": {}
            });
        } else if (!data.dob || typeof data.dob === undefined) {
            callback(null, {
                "response_code": 5002,
                "response_message": "please provide date of birth",
                "response_data": {}
            });
        } else {
            UserModels.editProfile(data, function (result) {
                callback(result);
            });
        }
    },
    // Claim Gold Membership
    goldMembership: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            UserModels.goldMembership(data, function (result) {
                callback(result);
            });
        }
    },
    // Delete User Request
    deleteUserRequest: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.reason_for_delete || typeof data.reason_for_delete === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide delete reason",
                "response_data": {}
            });
        } else {
            UserModels.deleteUserRequest(data, function (result) {
                callback(result);
            });
        }
    },
    //Edit Profile Image
    editProfileImage: (data, fileData, callback) => {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!fileData || typeof fileData === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide profile image",
                "response_data": {}
            });
        } else {
            //console.log("fileData", fileData);
            var imageFile = fileData.file;
            var timeStamp = Date.now();
            var fileName = timeStamp + imageFile.name;
            var folderpath = config.uploadProfilepicPath;
            let profilepicPath = config.profilepicPath;
            let split = imageFile
                .mimetype
                .split("/");
            if (split[1] = "jpeg" || "png" || "jpg") {
                imageFile.mv(
                    folderpath + fileName,
                    function (err) {

                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": err
                            });
                        } else {
                            data.profile_image = profilepicPath + fileName;
                            UserModels.editProfileImage(data, function (result) {
                                callback(result);
                            });
                        }
                        // User.findById(dataUser.user_id, (err, user) => {
                        //     // console.log(user, 'fgs');
                        //     user.profileImage = liveUrl + image_url;
                        //     user.save();

                        //     callback({
                        //         status: STATUS_CONSTANTS.IMAGE_UPLOADED_SUCCESSFULLY,
                        //         message: STATUS_MESSAGES.IMAGE_UPLOADED_SUCCESSFULLY
                        //     })
                        // })
                    }
                )
            } else {
                callback({
                    status: 5002,
                    message: "MIME type not allowed please upload jpg or png file"
                })
            }

            // var pic = fileData.image;
            // console.log('pic', pic);
            // var ext = pic.name.slice(pic.name.lastIndexOf('.'));
            // var fileName = Date.now() + ext;
            // var folderpath = config.uploadProfilepicPath;
            // pic.mv(folderpath + fileName, function (err) {
            //     if (err) {
            //         callback({
            //             "response_code": 5005,
            //             "response_message": "INTERNAL DB ERROR",
            //             "response_data": err
            //         });
            //     } else {
            //         data.profile_image = config.profilepicPath + fileName;
            //         UserModels.editProfileImage(data, function (result) {
            //             callback(result);
            //         });
            //     }
            // });
        }
    },
    //Change password 
    changePassword: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.currentpassword || typeof data.currentpassword === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide current password",
                "response_data": {}
            });
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide password",
                "response_data": {}
            });
        } else {
            UserModels.changePassword(data, function (result) {
                callback(result);
            });
        }

    },
    //Change email Request 
    changeEmailReq: (data, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!data._id || typeof data._id === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide user id",
                        "response_data": {}
                    });

                } else if (!data.email || typeof data.email === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide email address",
                        "response_data": {}
                    });
                } else {
                    data.email = String(data.email).toLowerCase();
                    UserModels.updateEmailReq(data, function (result) {
                        nextCb(null, result);
                    });

                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code == 2000) {

                    const tokenId = jwt.sign({
                        id: data._id
                    }, config.secretKey, {
                        expiresIn: config.link_expire
                    })

                    mailProperty('changeEmail')(arg1.response_data.email, {
                        name: arg1.response_data.name,
                        email: arg1.response_data.email,
                        newemail: arg1.response_data.newemail,
                        site_url: config.liveUrl,
                        email_validation_url: config.baseUrl + 'reset-email/' + `${tokenId}`
                    }).send();

                    nextCb(null, arg1);


                } else {
                    nextCb(null, arg1);
                }
            }
        ], function (err, result) {

            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                });
            } else {
                callback({
                    "response_code": result.response_code,
                    "response_message": result.response_message,
                });
            }
        });

    },
    //Change email
    verifyAccount: (data, callback) => {

        if (!data.token || typeof data.token === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide token",
            });
        } else {
            jwt.verify(data.token, config.secretKey, function (err, decoded) {
                if (err) {
                    callback({
                        "response_code": 4000,
                        "response_message": "Link invalid! Please try again",
                    });
                } else {

                    data._id = decoded.id;
                    if (data._id) {
                        UserModels.updateEmail(data, function (result) {
                            callback(result);
                        });
                    }
                }
            });

        }
    },
    restaurantList: function (data, callback) {

        RestaurantModels.restaurantAll(data, function (result) {
            callback({
                "response_code": result.response_code,
                "response_message": result.response_message,
                "response_data": result.response_data
            })
        });
    },
    filterRestaurantList: function (data, callback) {

        RestaurantModels.filterRestaurantList(data, function (result) {
            callback({
                "response_code": result.response_code,
                "response_message": result.response_message,
                "response_data": result.response_data
            })
        });
    },
    addFavouriteRestaurant: function (data, callback) {

        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide restaurant id",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            FavouriteRestaurantModels.addFavouriteRestaurant(data, function (result) {
                callback({
                    "response_code": result.response_code,
                    "response_message": result.response_message,
                    "response_data": result.response_data
                })
            });
        }
    },
    removeFavouriteRestaurant: function (data, callback) {

        // if (!data._id || typeof data._id === undefined) {
        //     callback({
        //         "response_code": 5002,
        //         "response_message": "please provide id",
        //         "response_data": {}
        //     });
        // } else {
        FavouriteRestaurantModels.removeFavouriteRestaurant(data, function (result) {
            callback({
                "response_code": result.response_code,
                "response_message": result.response_message,
                "response_data": result.response_data
            })
        });
        //}
    },
    favouriteRestaurantList: function (data, callback) {


        FavouriteRestaurantModels.favouriteRestaurantList(data, function (result) {
            callback({
                "response_code": result.response_code,
                "response_message": result.response_message,
                "response_data": result.response_data
            })
        });

    },
    //Change phone Request 
    changePhoneNoReq: (data, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!data._id || typeof data._id === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide user id",
                        "response_data": {}
                    });

                } else if (!data.country_code || typeof data.country_code === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide country code",
                        "response_data": {}
                    });
                } else if (!data.phone_no || typeof data.phone_no === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide phone no",
                        "response_data": {}
                    });
                } else {
                    data.otp = Math.random().toString().replace('0.', '').substr(0, 4);
                    UserModels.updatePhoneNoReq(data, function (result) {
                        nextCb(null, result);
                    });

                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code == 2000) {

                    // Twillo Message
                    twillow_client.messages
                        .create({
                            body: 'Your verification code is: ' + data.otp,
                            from: config.twillow['live'].from_no,
                            to: data.country_code + data.phone_no
                        })
                        .then(message => {

                            nextCb(null, {
                                "status": true,
                                "response_code": arg1.response_code,
                                "response_message": arg1.response_message,
                                "tw_response_code": 2000,
                                "tw_response_data": message
                            });
                        })
                        .catch(e => {
                            console.error('Got an error:', e.code, e.message);
                            nextCb(null, {
                                "status": false,
                                "response_code": arg1.response_code,
                                "response_message": arg1.response_message,
                                "tw_response_code": e.code,
                                "tw_response_data": e.message
                            });
                        });


                } else {
                    nextCb(null, arg1);
                }
            }
        ], function (err, result) {

            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                });
            } else {
                callback({
                    "response_code": result.response_code,
                    "response_message": result.response_message,
                    "twillow_data": [{
                        "status": result.status,
                        "response_code": result.tw_response_code,
                        "response_message": result.tw_response_data
                    }]
                });
            }
        });

    },
    //Change Phone No
    changePhoneNo: (data, callback) => {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide token",
            });
        } else if (!data.otp || typeof data.otp === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide token",
            });
        } else {
            UserModels.updatePhoneNo(data, function (result) {
                callback(result);
            });
        }
    },
    //Organization List
    organizationAll: (data, callback) => {

        OrganizationModels.orginationAll(data, function (result) {
            callback(result);
        });

    },
    //Insert Organization
    organization: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization name",
                "response_data": {}
            });
        } else if (!data.lat || typeof data.lat === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide latitude",
                "response_data": {}
            });
        } else if (!data.long || typeof data.long === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide longitude",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            OrganizationModels.addOrganisation(data, function (result) {
                callback(result);
            });
        }
    },
    //Insert user to old Organization
    registerToOrganization: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            OrganizationModels.registerToOrganization(data, function (result) {
                callback(result);
            });
        }
    },
    //Organization by user
    getUserOrganization: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {

            OrganizationModels.getUserOrganization(data, function (result) {
                callback(result);
            });
        }
    },
    setActiveOrganization: (data, callback) => {

        if (!data.active_id || typeof data.active_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide active id",
                "response_data": {}
            });
        } else {

            OrganizationModels.setActiveOrganization(data, function (result) {
                callback(result);
            });
        }
    },
    //Exit Organization by user
    exitOrganization: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else {

            OrganizationModels.exitOrganization(data, function (result) {
                callback(result);
            });
        }
    },
    //Insert New Organization Team
    organizationTeam: (data, fileData, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide team name",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else if (!data.meeting_point || typeof data.meeting_point === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide meeting point",
                "response_data": {}
            });
        } else if (!fileData || typeof fileData === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id proof",
                "response_data": {}
            });
        } else {

            var imageFile = fileData.file;
            var timeStamp = Date.now();
            var fileName = timeStamp + imageFile.name;
            var folderpath = config.uploadteamidproofPath;
            let profilepicPath = config.teamidproofPath;
            let split = imageFile
                .mimetype
                .split("/");
            if (split[1] = "jpeg" || "png" || "jpg") {
                imageFile.mv(
                    folderpath + fileName,
                    function (err) {

                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": err
                            });
                        } else {
                            data._id = new ObjectID;
                            data.id_proof = profilepicPath + fileName;
                            OrganizationTeamModels.addOrganisationTeam(data, function (result) {
                                callback(result);
                            });
                        }
                    }
                )
            } else {
                callback({
                    status: 5002,
                    message: "MIME type not allowed please upload jpg or png file"
                })
            }
        }
    },
    //Register User to Team
    registerToTeam: (data, callback) => {

        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.teamid || typeof data.teamid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide team id",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else {

            OrganizationTeamModels.registerToTeam(data, function (result) {
                callback(result);
            });
        }
    },
    teamJoinStatusChange: (data, callback) => {
        if (!data.notification_id || typeof data.notification_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide status",
                "response_data": {}
            });
        } else {
            OrganizationTeamModels.teamJoinStatusChange(data, function (result) {
                callback(result);
            });
        }
    },
    //Organization List
    teamAll: (data, callback) => {

        OrganizationTeamModels.teamAll(data, function (result) {
            callback(result);
        });

    },
    //Team List by Organization
    // getOrganizationTeam: (data, callback) => {
    //     if (!data.orgid || typeof data.orgid === undefined) {
    //         callback({
    //             "response_code": 5002,
    //             "response_message": "please provide organization id",
    //             "response_data": {}
    //         });
    //     } else {

    //         OrganizationTeamModels.orginationTeamAll(data, function (result) {
    //             callback(result);
    //         });
    //     }
    // },

    //Team User List
    teamUserList: (data, callback) => {

        if (!data.teamid || typeof data.teamid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide team id",
                "response_data": {}
            });
        } else {
            OrganizationTeamModels.teamUserList(data, function (result) {
                callback(result);
            });
        }


    },
    //Team List by User
    getUserTeam: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else {

            OrganizationTeamModels.callUserTeam(data, function (result) {
                callback(result);
            });
        }
    },
    //
    setActiveTeam: (data, callback) => {

        if (!data.active_id || typeof data.active_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide active id",
                "response_data": {}
            });
        } else {

            OrganizationTeamModels.setActiveTeam(data, function (result) {
                callback(result);
            });
        }
    },
    //Get active team members list of current organization
    currentTeamMemberList: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else {

            OrganizationTeamModels.currentTeamMemberList(data, function (result) {
                callback(result);
            });
        }
    },
    // Exit team
    exitTeam: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else if (!data.teamid || typeof data.teamid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else {

            OrganizationTeamModels.exitTeam(data, function (result) {
                callback(result);
            });
        }
    },
    //Team Name Change Request
    teamNameChangeReq: (data, callback) => {

        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.suggested_name || typeof data.suggested_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide suggested team name",
                "response_data": {}
            });
        } else if (!data.teamid || typeof data.teamid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide team id",
                "response_data": {}
            });
        } else if (!data.orgid || typeof data.orgid === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide organization id",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            TeamNameChangeModels.addTeamChangeReq(data, function (result) {
                callback(result);
            });
        }
    },
    //Team Name Change Vote
    teamNameChangeVote: (data, callback) => {

        if (!data.notification_id || typeof data.notification_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.vote || typeof data.vote === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide vote",
                "response_data": {}
            });
        } else {

            TeamNameChangeModels.addteamNameChangeVote(data, function (result) {
                callback(result);
            });
        }
    },
    //User notification list
    notificationlist: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            NotificationModels.notificationList(data, function (result) {
                callback(result);
            });
        }
    },

    //User notification status change
    notificationstatuschange: (data, callback) => {
        if (!data.notification_id || typeof data.notification_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide notification id",
                "response_data": {}
            });
        } else {
            NotificationModels.notificationStatusChange(data, function (result) {
                callback(result);
            });
        }
    },

    menuCatList: function (data, callback) {
        if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "response_code": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else {
            MenuItemModel.menuCatListByRestaurent(data, function (result) {
                callback(result);
            });
        }
    },
    menuList: function (data, callback) {
        if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "response_code": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else {
            MenuItemModel.menuItemAll(data, function (result) {
                callback(result);
            });
        }
    },
    // List Recycling product type
    recyclingProductTypeList: (callback) => {
        var data = '';
        RecyclingProductModels.recyclingProductTypeList(data, function (result) {
            callback(result);
        });
    },
    //Recycling product add
    recyclingProductAdd: (data, fileData, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!data.user_id || typeof data.user_id === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide user id",
                        "response_data": {}
                    });
                } else if (!data.productType || typeof data.productType === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide product type id",
                        "response_data": {}
                    });
                } else if (!data.companyName || typeof data.companyName === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide company name",
                        "response_data": {}
                    });
                } else if (!data.binCode || typeof data.binCode === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide bin code",
                        "response_data": {}
                    });
                } else if (!data.place || typeof data.place === undefined) {
                    nextCb(null, {
                        "response_code": 5002,
                        "response_message": "please provide place",
                        "response_data": {}
                    });
                } else {
                    nextCb(null, {
                        "response_code": 2000,
                        "response_message": "",
                        "response_data": {}
                    });
                }
            },
            function (arg, nextCb) {
                if (arg.response_code === 2000) {
                    if (fileData != null && fileData != undefined && fileData != '') {
                        if (fileData.productImage != null && fileData.productImage != undefined && fileData.productImage != '') {
                            var pic = fileData.productImage;
                            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                            var fileName = Date.now() + ext;
                            var folderpath = config.uploadRecyclingProductpicPath;
                            pic.mv(folderpath + fileName, function (err) {
                                if (err) {
                                    nextCb(null, arg);
                                } else {
                                    data.productImage = config.recyclingProductpicPath + fileName;
                                    nextCb(null, arg);
                                }
                            });
                        } else {
                            nextCb(null, arg);
                        }
                    } else {
                        nextCb(null, arg);
                    }
                } else {
                    nextCb(null, arg);
                }
            },
            function (arg, nextCb) {
                if (arg.response_code === 2000) {
                    if (fileData != null && fileData != undefined && fileData != '') {
                        if (fileData.barCodeImage != null && fileData.barCodeImage != undefined && fileData.barCodeImage != '') {
                            var pic = fileData.barCodeImage;
                            var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                            var fileName = Date.now() + ext;
                            var folderpath = config.uploadBarCodepicPath;
                            pic.mv(folderpath + fileName, function (err) {
                                if (err) {
                                    nextCb(null, arg);
                                } else {
                                    data.barCodeImage = config.barCodepicPath + fileName;
                                    nextCb(null, arg);
                                }
                            });
                        } else {
                            nextCb(null, arg);
                        }
                    } else {
                        nextCb(null, arg);
                    }
                } else {
                    nextCb(null, arg);
                }
            },
            function (arg, nextCb) {
                if (arg.response_code === 2000) {
                    data._id = new ObjectID;
                    data.reward = 5;
                    RecyclingProductModels.recyclingProductAdd(data, function (result) {
                        nextCb(null, result);
                    });
                } else {
                    nextCb(null, arg);
                }
            },
            function (arg, nextCb) {
                if (arg.response_code === 2000) {
                    RecyclingProductModels.rewadAdd(data, function (result) {
                        if (result.response_code == 2000) {
                            nextCb(null, {
                                response_code: arg.response_code,
                                response_message: 'Data added successfully',
                                response_data: {
                                    remainReward: result.response_data.remainReward,
                                    pushData: {
                                        deviceToken: result.response_data.pushtoken,
                                        "body": "Congratulations you have earned 5 points.",
                                        "data": {}
                                    }
                                },
                            });
                        } else {
                            nextCb(null, arg);
                        }

                    });
                } else {
                    nextCb(null, arg);
                }
            }
        ], function (err, content) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                });
            } else {
                callback(content);
            }
        })
    },
    // List Recycling product 
    recyclingProductListByUser: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            async.parallel({
                totalReward: function (callback) {
                    RecyclingProductModels.totalRewardByUser(data, function (result) {
                        callback(null, result.response_data);
                    });
                },
                list: function (callback) {
                    RecyclingProductModels.recyclingProductListByUser(data, function (result) {
                        callback(null, result.response_data);
                    });
                },
            }, function (err, content) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": err
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "List",
                        "response_data": {
                            list: content.list,
                            totalReward: content.totalReward
                        }
                    });
                }
            })

        }
    },
    // List cause
    causeList: (data, callback) => {
        CauseModels.causeList(data, function (result) {
            callback(result);
        });
    },
    // Cause details
    causeDetail: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cause id",
                "response_data": {}
            });
        } else {
            CauseModels.causeDetail(data, function (result) {
                callback(result);
            });
        }
    },
    // List vendor
    vendorList: (data, callback) => {
        VendorModels.vendorList(data, function (result) {
            callback(result);
        });
    },
    // Vendor details
    vendorDetail: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide vendor id",
                "response_data": {}
            });
        } else {
            async.parallel({
                vendorDetail: function (callback) {
                    VendorModels.vendorDetail(data, function (result) {
                        callback(null, result.response_data);
                    });
                },
                productList: function (callback) {
                    ProductModels.productListByVendor(data, function (result) {
                        callback(null, result.response_data);
                    });
                },
            }, function (err, content) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": err
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "Vendor detail",
                        "response_data": {
                            detail: content.vendorDetail,
                            products: content.productList
                        }
                    });
                }
            });

        }
    },
    //Home page
    home: (callback) => {
        async.parallel({
            featuredVendor: function (callback) {
                VendorModels.featuredVendorList(function (result) {
                    callback(null, result.response_data);
                });
            },
            popularProduct: function (callback) {
                ProductModels.popularProductList(function (result) {
                    callback(null, result.response_data);
                });
            },
        }, function (err, content) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                });
            } else {
                callback({
                    "response_code": 2000,
                    "response_message": "List",
                    "response_data": {
                        featuredVendor: content.featuredVendor,
                        popularProduct: content.popularProduct
                    }
                });
            }
        })
    },
    // List product category
    productCategoryList: (callback) => {
        var data = '';
        ProductModels.productCategoryList(data, function (result) {
            callback(result);
        });
    },
    // List product
    productList: (data, callback) => {
        ProductModels.productList(data, function (result) {
            callback(result);
        });
    },
    // Product details
    productDetail: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product id",
                "response_data": {}
            });
        } else {
            ProductModels.productDetail(data, function (result) {
                callback(result);
            });
        }
    },
    //Add to cart
    addTocart: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.productId || typeof data.productId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product id",
                "response_data": {}
            });
        } else if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide restaurant id",
                "response_data": {}
            });
        } else if (!data.qty || typeof data.qty === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide product quantity",
                "response_data": {}
            });
        } else {
            OrderModels.addToCart(data, function (result) {
                callback(result);
            });
        }
    },
    //Cart list
    cartList: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            OrderModels.cartList(data, function (result) {
                callback(result);
            });
        }
    },
    // Product qty update in cart
    cartQuatityUpdate: (data, callback) => {
        if (!data.cartId || typeof data.cartId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cart id",
                "response_data": {}
            });
        } else if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.qty || typeof data.qty === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide quantity",
                "response_data": {}
            });
        } else {
            OrderModels.cartQuatityUpdate(data, function (result) {
                callback(result);
            });
        }
    },
    // Product delete from cart
    cartProductDelete: (data, callback) => {
        if (!data.cartId || typeof data.cartId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide cart id",
                "response_data": {}
            });
        } else if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            OrderModels.cartProductDelete(data, function (result) {
                callback(result);
            });
        }
    },
    // Delete all product from cart
    emptyCart: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            OrderModels.emptyCart(data, function (result) {
                callback(result);
            });
        }
    },

    cloversSchemeList: (data, callback) => {
        cloversSchemaService.cloversSchemeList(data, function (result) {
            callback({
                "response_code": result.STATUSCODE,
                "response_message": result.message,
                "response_data": result.response != undefined ? result.response : {}
            });
        });
    },



    // Add shipping address 
    addShippingAddress: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.addressOne || typeof data.addressOne === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide address one",
                "response_data": {}
            });
        } else if (!data.country || typeof data.country === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country",
                "response_data": {}
            });
        } else if (!data.state || typeof data.state === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide state",
                "response_data": {}
            });
        } else if (!data.zipCode || typeof data.zipCode === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide zipcode",
                "response_data": {}
            });
        } else {
            OrderModels.addShippingAddress(data, function (result) {
                callback(result);
            });
        }
    },
    //View shipping address
    viewShippingAddress: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            OrderModels.viewShippingAddress(data, function (result) {
                callback(result);
            });
        }
    },
    //order checkout
    checkOut: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.transactionAmount || typeof data.transactionAmount === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide transactionAmount",
                "response_data": {}
            });
        } else if (!data.paymentMode || typeof data.paymentMode === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide paymentMode",
                "response_data": {}
            });
        } else if (!data.paymentStatus || typeof data.paymentStatus === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide paymentStatus",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            OrderModels.checkOut(data, function (result) {
                callback(result);

            });
        }

    },
    //before order checkout
    beforeCheckOut: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            OrderModels.beforeCheckOut(data, function (result) {
                callback(result);

            });
        }

    },
    //Order list
    orderList: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            OrderModels.orderList(data, function (result) {
                callback(result);
            });
        }
    },
    //Food Arrived Notification
    foodArriveNotification: (data, callback) => {
        if (!data.orderId || typeof data.orderId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide order id",
                "response_data": {}
            });
        } else {
            OrderModels.foodArriveNotification(data, function (result) {
                callback(result);
            });
        }
    },
    //Order Recived Confirmation
    orderDeleveredCnf: (data, callback) => {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide order id",
                "response_data": {}
            });
        } else {
            OrderModels.orderDeleveredCnf(data, function (result) {
                callback(result);
            });
        }
    },
    //Order list
    currentOrderList: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            OrderModels.currentOrderList(data, function (result) {
                callback(result);
            });
        }
    },
    //Get Team Chat
    getTeamChat: (data, callback) => {
        if (!data.to_user || typeof data.to_user === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide receiver user id",
                "response_data": {}
            });
        } else if (!data.from_user || typeof data.from_user === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide sender user id",
                "response_data": {}
            });
        } else {
            TeamChatModels.teamChatAll(data, function (result) {
                callback(result);
            });
        }
    },
    //Add Team Chat
    addTeamChat: (data, callback) => {
        if (!data.to_user || typeof data.to_user === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide receiver user id",
                "response_data": {}
            });
        } else if (!data.from_user || typeof data.from_user === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide sender user id",
                "response_data": {}
            });
        } else if (!data.message || typeof data.message === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide message",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            TeamChatModels.addToChat(data, function (result) {
                callback(result);
            });
        }
    },
    contactUs: (data, callback) => {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!data.firstName || typeof data.firstName === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide first name",
                "response_data": {}
            });
        } else if (!data.lastName || typeof data.lastName === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide last name",
                "response_data": {}
            });
        } else if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!re.test(String(data.email).toLowerCase())) {
            nextCb(null, {
                "response_code": 5002,
                "response_message": "please provide valid email address",
                "response_data": {}
            });
        } else if (!data.message || typeof data.message === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide message",
                "response_data": {}
            });
        } else {
            mailProperty('contactUsMail')(data.email, {
                name: data.firstName + ' ' + data.firstName,
                email: data.email,
                message: data.message,
                site_url: config.liveUrl,
                date: new Date()
            }).send();
            callback({
                "response_code": 2000,
                "response_message": "Thank you for contacting us, a Green Litter Bug Representative will contact your at our earliest convenience.",
                "response_data": {}
            });
        }
    },

    //Featured ads list
    featuredAdsList: (data, callback) => {
        AdsModels.featuredAdslist(data, function (result) {
            callback(result);
        });
    },
};
module.exports = apiService;