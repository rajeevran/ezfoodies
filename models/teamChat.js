var teamChatSchema = require('../schema/teamChat');
var pushNotification = require('../modules/pushNotification');
var UserSchema = require('../schema/users');
var config = require('../config');

var teamChatModels = {
    teamChatAll: async function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};


        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }


        query = {
            "$or": [{
                "to_user": data.to_user,
                "from_user": data.from_user
            }, {
                "to_user": data.from_user,
                "from_user": data.to_user
            }]
        }

        if (data.chat_id) {
            query['_id'] = data.chat_id;
        }



        var aggregate = teamChatSchema.aggregate();
        aggregate.match(query);

        // aggregate.lookup({
        //     from: 'users',
        //     localField: 'to_user',
        //     foreignField: '_id',
        //     as: 'to_user_image'
        // });

        aggregate.lookup({
            from: 'users',
            localField: 'from_user',
            foreignField: '_id',
            as: 'from_user_image'
        });

        aggregate.sort({
            'createdAt': -1
        })
        aggregate.project({
            _id: 1,
            to_user: 1,
            from_user: 1,
            // message: 1,
            "text": "$message",
            createdAt: 1,
            user: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$from_user_image._id', 0]
                        },
                        avatar: {
                            $cond: {
                                if: {
                                    $in: ["NORMAL", "$from_user_image.type"]
                                },
                                then: {
                                    $cond: {
                                        if: {
                                            $in: ["", "$from_user_image.profile_image"]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$from_user_image.profile_image", 0]
                                            }]
                                            // "$arrayElemAt": ["$User.profile_image", 0]
                                        }
                                    }

                                },
                                else: {
                                    $cond: {
                                        if: {
                                            $eq: [
                                                [{
                                                    '$arrayElemAt': ['$from_user_image.socialLogin.image', 0]
                                                }, 0], " "
                                            ]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            '$arrayElemAt': [{
                                                '$arrayElemAt': ['$from_user_image.socialLogin.image', 0]
                                            }, 0]

                                        }
                                    }
                                }
                            }
                        },

                    }], 0
                ]
            },
        });
        var options = {
            page: page,
            limit: limit
        }

        teamChatSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Chat list",
                    "response_data": data
                });
            }
        });

    },
    addToChat: function (data, callback) {
        if (data) {

            console.log("data.user_online", data);

            new teamChatSchema(data).save(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                } else {



                    if (data.user_online == false) {

                        UserSchema.find({
                            _id: data.to_user
                        }).exec(function (err, result) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": err,
                                    "response_data": {}
                                });

                            } else {
                                if (result.length > 0) {

                                    var pushData = {
                                        deviceId: result.devicetoken,
                                        user_id: result._id,
                                        title: "You have new message",
                                        message: data.message,
                                        profile_image: config.liveUrl + config.userDemoPicPath
                                    }

                                    if (result.apptype == 'IOS') {
                                        pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                            console.log('pushStatus', pushStatus);
                                        });
                                    } else if (result.apptype = 'ANDROID') {
                                        pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                            console.log('pushStatus', pushStatus);
                                        });
                                    }
                                }

                                callback({
                                    "response_code": 2000,
                                    "response_message": "Submitted successfully.",
                                    "response_data": {}
                                });
                            }
                        })

                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Submitted successfully.",
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
}
module.exports = teamChatModels;