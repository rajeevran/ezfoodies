var CreditSystemScema = require('../schema/creditSystem');
var CreditAppliedLogScema = require('../schema/cretidAppliedLogSchema');
var UserSchema = require('../schema/users');
var NotificationModels = require('../models/notification');
var pushNotification = require('../modules/pushNotification');
var mailProperty = require('../modules/sendMail');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var async = require("async");
var config = require('../config');
var mailProperty = require('../modules/sendMail');

var creditSystemModels = {
    creditSystemList: async function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (parseInt(data.maxDistance)) {
            maxDistance = parseInt(data.maxDistance)
        }


        if (data.reason) {
            query['reason'] = new RegExp(data.reason, 'i');
        }

        if (data._id) {
            query['_id'] = data._id;
        }

        if (data.enable) {
            query['enable'] = data.enable;
        }

        var aggregate = CreditSystemScema.aggregate();
        aggregate.match(query);


        aggregate.project({
            _id: 1,
            order_type: 1,
            type: 1,
            allowed_times: 1,
            discount_amount: 1,
            min_amount: 1,
            days: 1,
            dead_line: 1,
            date: 1,
            reason: 1,
            enable: 1,

        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }

        CreditSystemScema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                var data = {
                    docs: results,
                    pages: pageCount,
                    total: count,
                    limit: limit,
                    page: page
                }
                callback({
                    "response_code": 2000,
                    "response_message": "Credit list",
                    "response_data": data
                });
            }
        });

    },
    addCreditSystem: async function (data, callback) {

        if (data) {
            new CreditSystemScema(data).save(function (err, result) {
                if (err) {

                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {

                    callback({
                        "response_code": 2000,
                        "response_message": "Credit System Add Successfully",
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
    updateCreditSystem: async function (data, callback) {
        if (data) {

            CreditSystemScema.update({
                    _id: data._id
                }, {
                    $set: {
                        order_type: data.order_type,
                        type: data.type,
                        allowed_times: data.allowed_times,
                        discount_amount: data.discount_amount,
                        min_amount: data.min_amount,
                        days: data.days,
                        dead_line: data.dead_line,
                        date: data.date,
                        reason: data.reason

                    }
                }, {
                    upsert: true
                },
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
                            "response_message": "Credit System Updated Successfully",
                            "response_data": {}
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
    },
    updateCreditStatus: async function (data, callback) {

        if (data) {

            CreditSystemScema.update({
                    _id: data._id
                }, {
                    $set: {
                        enable: data.status

                    }
                }, {
                    upsert: true
                },
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
                            "response_message": "Credit System Status Updated Successfully",
                            "response_data": {}
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
    },
    updateUserCredit: async function (data, callback) {

        if (data) {

            let CreditSystem = await CreditSystemScema.findOne({
                _id: data._id

            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (CreditSystem.enable == 'no') {
                callback({
                    "response_code": 5005,
                    "response_message": "Please enable credit system before assign to user.",
                    "response_data": {}
                });
            }

            let User = await UserSchema.findOne({
                _id: data.userID

            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (User.email_verify == 'no' || User.status == 'no') {
                callback({
                    "response_code": 5005,
                    "response_message": "User is not verified or account is temporarily block.",
                    "response_data": {}
                });
            }

            UserSchema.update({
                    _id: data.userID
                }, {
                    $set: {
                        creditId: data._id
                    }
                }, {
                    upsert: true
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {

                        var message = 'Hurray! you have received credit of $' + CreditSystem.discount_amount + ' .Redeem at the time of place order.';
                        var title = 'Received Credit of $' + CreditSystem.discount_amount;
                        var notification_code = 1005;

                        var mail_body = 'Hurray! you have received credit of $' + CreditSystem.discount_amount + ' as a ' + CreditSystem.reason + '.';
                        mail_body += 'You can redeem this credit on ' + CreditSystem.order_type + ' order with minimum cart amount of $' + CreditSystem.min_amount + '.';
                        mail_body += CreditSystem.type == 'single_time' ? 'You can redeem this credit for one time only.' : CreditSystem.type == 'multiple_time' ? 'You can redeem this credit for ' + CreditSystem.allowed_times + ' times.' : 'You can redeem this credit for unlimited times.';
                        mail_body += CreditSystem.dead_line == 'yes' ? 'valid from ' + new Date(CreditSystem.date.openingTime).toISOString().slice(0, 10) + ' to ' + new Date(CreditSystem.date.closingTime).toISOString().slice(0, 10) : '';
                        var pushData = {
                            deviceId: User.devicetoken,
                            user_id: User._id,
                            title: title,
                            message: message,
                            notification_code: notification_code,
                            profile_image: ''
                        }
                        var addData = {
                            _id: new ObjectID,
                            user_id: User._id,
                            notification_code: notification_code,
                            message: message,
                            title: title,
                            notification_for: 'user',
                            team_join_request_details: {
                                user_id: User._id
                            }
                        }

                        NotificationModels.addNotification(addData, function (notiResult) {
                            if (User.apptype == 'IOS') {
                                pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                });
                            } else if (User.apptype = 'ANDROID') {
                                pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                });
                            }
                        });

                        mailProperty('creditAddMail')(User.email, {
                            name: User.name,
                            mail_body: mail_body,
                            site_url: config.liveUrl,
                        }).send();

                        callback({
                            "response_code": 2000,
                            "response_message": "Credit System Add Successfully",
                            "response_data": {}
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
    },
    applyCreditDiscount: async function (data, callback) {
        if (data) {
            new CreditAppliedLogScema(data).save(function (err, result) {
                if (err) {

                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {

                    callback({
                        "response_code": 2000,
                        "response_message": "Credit Applied Successfully",
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
    updateCreditDiscount: async function (data, callback) {
        if (data) {

            CreditAppliedLogScema.update({
                    _id: data.creditLogId
                }, {
                    $set: {
                        orderId: data.orderId,
                    }
                }, {
                    upsert: true
                },
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
                            "response_message": "Updated Successfully",
                            "response_data": {}
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
    },
    deleteCreditDiscount: async function (data, callback) {

        if (data) {

            CreditAppliedLogScema.remove({
                _id: data.creditLogId
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
                        "response_message": "Removed Successfully",
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

};
module.exports = creditSystemModels;