var TeamNameChangeReqScema = require('../schema/teamnamechangereq');
var TeamNameChangeVoteScema = require('../schema/teamnamechangevote');
var OrganizationTeamSchema = require('../schema/organiztionteam');
var UserOrgTeamSchema = require('../schema/userorganizationteam');
var NotificationSchema = require('../schema/notifications');
var NotificationModels = require('../models/notification');
var pushNotification = require('../modules/pushNotification');
var UserSchema = require('../schema/users');
var config = require('../config');
var mailProperty = require('../modules/sendMail');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var cron = require('node-cron');

var task = cron.schedule('0 0 */1 * * *', () => {
    console.log("cron run in 1 hr");
    TeamNameChangeModels.changeTeamNameCronJob(function (result) {
        // console.log('result', result);
    });

}, {
    start: true,
    runOnInit: false
});
task.start();

var TeamNameChangeModels = {


    addTeamChangeReq: async function (data, callback) {
        if (data) {
            var userid_list = [];

            let teamDetails = await OrganizationTeamSchema.findOne({
                _id: data.teamid

            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            async.waterfall([
                    function (nextCb) {
                        TeamNameChangeReqScema.findOne({
                                orgid: data.orgid,
                                teamid: data.teamid,
                                cron: 0
                            },
                            function (err, resultobj) {
                                if (err) {
                                    nextcb(err);
                                } else {
                                    if (resultobj != null) {
                                        callback({
                                            "response_code": 2008,
                                            "response_message": "Team name change request already submitted. Please wait 48 hrs.",
                                            "response_data": {}
                                        });
                                    } else {


                                        UserOrgTeamSchema.find({
                                            teamid: data.teamid,
                                            orgid: data.orgid,
                                            status: 'yes'
                                        }, {}).exec(function (err, result) {
                                            if (err) {
                                                nextCb(null, err);
                                            } else {
                                                async.forEach(result, function (item, callBack) {
                                                    if (item.user_id != data.user_id) {
                                                        userid_list.push(item.user_id);
                                                    }
                                                    // userid_list = [{
                                                    //     _id: item.user_id
                                                    // }];
                                                    callBack();
                                                }, function (err, res) {
                                                    if (err) {
                                                        nextCb(null, err);
                                                    } else {

                                                        data.notify_users_list = userid_list;
                                                        data.cron = 0;

                                                        new TeamNameChangeReqScema(data).save(function (err, result) {
                                                            if (err) {
                                                                nextCb(null, err);
                                                            } else {

                                                                nextCb(null, {
                                                                    "response_code": 2000,
                                                                    "response_data": userid_list
                                                                });

                                                            }
                                                        });

                                                    }
                                                });
                                            }
                                        });

                                    }
                                }
                            });
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            UserSchema.find({
                                    _id: data.user_id
                                })
                                .exec(function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": err,
                                            "response_data": {}
                                        });
                                    } else {
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": arg1.response_data,
                                            "request_user_detaits": result
                                        });
                                    }
                                });
                        }
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            let name = '';
                            let profile_image = '';
                            if (arg1.request_user_detaits.length > 0) {

                                name = arg1.request_user_detaits[0].name

                                if (arg1.request_user_detaits[0].type == "NORMAL") {
                                    profile_image = arg1.request_user_detaits[0].profile_image;
                                } else {
                                    profile_image = arg1.request_user_detaits[0].socialLogin[0].image;
                                }
                                if (profile_image == '' || profile_image == null) {
                                    profile_image = config.liveUrl + config.userDemoPicPath;
                                }
                            }

                            // Push notification for other team member

                            var query = {};
                            if (arg1.response_data) {
                                query = {
                                    _id: {
                                        $in: arg1.response_data
                                    }
                                }
                            }
                            var message = 'A team member ' + name + ' has proposed to change the team name from ' + teamDetails.name + ' to ' + data.suggested_name + '. Do you want to accept it?';
                            var title = 'Team Name Change Request';
                            var notification_code = 1001;

                            UserSchema.find(query)
                                .exec(function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": err,
                                            "response_data": {}
                                        });
                                    } else {
                                        async.forEach(result, function (item, callBack) {
                                            var pushData = {
                                                deviceId: item.devicetoken,
                                                user_id: item._id,
                                                title: title,
                                                message: message,
                                                notification_code: notification_code,
                                                profile_image: profile_image
                                            }
                                            var addData = {
                                                _id: new ObjectID,
                                                user_id: item._id,
                                                notification_code: notification_code,
                                                message: message,
                                                title: title,
                                                notification_for: 'team_member',
                                                teamname_change_request_id: data._id,
                                                team_join_request_details: {
                                                    user_id: data.user_id
                                                }
                                            }
                                            NotificationModels.addNotification(addData, function (notiResult) {
                                                if (item.apptype == 'IOS') {
                                                    pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                                        console.log('pushStatus', pushStatus);
                                                    });
                                                } else if (item.apptype = 'ANDROID') {
                                                    pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                                        console.log('pushStatus', pushStatus);
                                                    });
                                                }
                                            });

                                            // Email the Team Name Change Request Notification

                                            mailProperty('teamNameChangeRequest')(item.email, {
                                                name: item.name,
                                                current_team_name: teamDetails.name,
                                                request_user_name: name,
                                                suggested_teamName: data.suggested_name,
                                                site_url: config.liveUrl,
                                            }).send();

                                            callBack();
                                        }, function (err, content) {
                                            if (err) {
                                                nextCb(null, err);
                                            } else {

                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": arg1.response_data
                                                });

                                            }
                                        });
                                    }
                                });



                        } else {
                            nextCb(null, arg1);
                        }
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
                            "response_message": "You have been request team name change successfully.",
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
    addteamNameChangeVote: function (data, callback) {
        if (data) {
            async.waterfall([
                    function (nextCb) {
                        NotificationSchema.findOne({
                            _id: data.notification_id,
                            read_status: 'no'
                        }, function (err, findRes) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (findRes != null) {
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": findRes
                                    });
                                } else {

                                    callback({
                                        "response_code": 5002,
                                        "response_message": "Request not exist.",
                                        "response_data": {}
                                    });
                                }
                            }
                        });
                    },
                    function (response, nextCb) {
                        if (response.response_code == 2000) {

                            TeamNameChangeReqScema.findOne({
                                _id: response.response_data.teamname_change_request_id,
                                cron: 0
                            }, function (err, findRes) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (findRes != null) {

                                        var vote_data = {
                                            _id: new ObjectID,
                                            name_change_request_id: findRes._id,
                                            user_id: response.response_data.user_id,
                                            vote: data.vote
                                        }

                                        new TeamNameChangeVoteScema(vote_data).save(function (err, result) {
                                            if (err) {
                                                nextCb(null, err);
                                            } else {

                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": response.response_data
                                                });

                                            }
                                        });


                                    } else {

                                        callback({
                                            "response_code": 5002,
                                            "response_message": "Request not exist.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            });
                        }
                    },
                    function (response, nextCb) {

                        if (response.response_code == 2000) {
                            // Update Notification Status
                            NotificationSchema.update({
                                    _id: data.notification_id
                                }, {
                                    $set: {
                                        read_status: 'yes'
                                    }
                                },
                                function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": {}
                                        });
                                    }
                                });
                        } else {
                            nextCb(null, arg1);
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
                            "response_message": "Your opinion has been taken successfully.",
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
    changeTeamNameCronJob: function (data, callBack) {

        var d = new Date("2019-12-23T10:37:59.533Z").getTime();
        var day_before_yesterday = new Date().setDate(new Date().getDate() - 2);

        var userid_list = [];
        TeamNameChangeReqScema.find({
            // createdAt: {
            //     $gte: new Date(),
            //     $lt: new Date(new Date().setHours(23, 59, 59))
            // },
            cron: 0
        }, {}).exec(function (err, pendingList) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                });
            } else {
                //console.log("pendingList", pendingList);
                if (pendingList.length > 0) {

                    async.forEach(pendingList, function (item, callback) {
                        var createdAt = new Date(item.createdAt).getTime();
                        if (day_before_yesterday > createdAt) {


                            let positive_vote = 0;
                            let negative_vote = 0;

                            TeamNameChangeVoteScema.find({
                                name_change_request_id: item._id
                            }, {}).exec(function (err, votingLists) {

                                async.forEach(votingLists, function (votingList, callback) {

                                    if (votingList.vote == 'yes') {
                                        positive_vote++;
                                    } else {
                                        negative_vote++
                                    }
                                    //Remove all votes related to this team
                                    TeamNameChangeVoteScema.remove({
                                        _id: votingList._id
                                    }, function (err) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": err,
                                            });

                                        }
                                    });
                                    callback();
                                }, function (err, content) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": err,
                                            "response_data": {}
                                        });
                                    } else {

                                        userid_list = item.notify_users_list;
                                        userid_list.push(item.user_id);


                                        if (positive_vote > negative_vote) {

                                            // Update the new team name
                                            OrganizationTeamSchema.update({
                                                _id: item.teamid
                                            }, {
                                                $set: {
                                                    name: item.suggested_name
                                                }
                                            }, function (err, resUpdate) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                } else {

                                                    //Update the request status and cron
                                                    TeamNameChangeReqScema.update({
                                                        _id: item._id
                                                    }, {
                                                        $set: {
                                                            change_status: 'yes',
                                                            cron: 1
                                                        }
                                                    }, function (err, resUpdate) {
                                                        if (err) {
                                                            callback({
                                                                "response_code": 5005,
                                                                "response_message": "INTERNAL DB ERROR",
                                                                "response_data": {}
                                                            });
                                                        } else {
                                                            // Update notification status
                                                            NotificationSchema.find({
                                                                teamname_change_request_id: item._id,
                                                                read_status: 'no'
                                                            }, {}).exec(function (err, notificationList) {
                                                                async.forEach(notificationList, function (notification, callback) {

                                                                    NotificationSchema.update({
                                                                        _id: notification._id
                                                                    }, {
                                                                        $set: {
                                                                            read_status: 'yes'
                                                                        }
                                                                    }, function (err, resUpdate) {
                                                                        if (err) {
                                                                            callback({
                                                                                "response_code": 5005,
                                                                                "response_message": "INTERNAL DB ERROR",
                                                                                "response_data": {}
                                                                            });
                                                                        } else {


                                                                            // Notify User about team name change
                                                                            var message = 'Team name change to ' + item.suggested_name;
                                                                            var title = 'Team Name Change Successfully';
                                                                            var notification_code = 1002;

                                                                            UserSchema.find({
                                                                                _id: {
                                                                                    $in: userid_list
                                                                                }
                                                                            }).exec(function (err, result) {
                                                                                if (err) {
                                                                                    console.log("err", err);
                                                                                    callback({
                                                                                        "response_code": 5005,
                                                                                        "response_message": err,
                                                                                        "response_data": {}
                                                                                    });
                                                                                } else {

                                                                                    async.forEach(result, function (user, callBack) {

                                                                                        let profile_image = '';
                                                                                        if (user.type == "NORMAL") {
                                                                                            profile_image = user.profile_image;
                                                                                        } else {
                                                                                            profile_image = user.socialLogin[0].image;
                                                                                        }
                                                                                        if (profile_image == '' || profile_image == null) {
                                                                                            profile_image = config.liveUrl + config.userDemoPicPath;
                                                                                        }
                                                                                        var pushData = {
                                                                                            deviceId: user.devicetoken,
                                                                                            user_id: user._id,
                                                                                            title: title,
                                                                                            message: message,
                                                                                            notification_code: notification_code,
                                                                                            profile_image: profile_image
                                                                                        }

                                                                                        var addData = {
                                                                                            _id: new ObjectID,
                                                                                            user_id: user._id,
                                                                                            notification_code: notification_code,
                                                                                            message: message,
                                                                                            title: title,
                                                                                            notification_for: 'team_member',
                                                                                            team_join_request_details: {
                                                                                                user_id: user._id
                                                                                            }
                                                                                        }
                                                                                        NotificationModels.addNotification(addData, function (notiResult) {
                                                                                            if (user.apptype == 'IOS') {
                                                                                                pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                                                                                    console.log('pushStatus', pushStatus);
                                                                                                });
                                                                                            } else if (user.apptype = 'ANDROID') {
                                                                                                pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                                                                                    console.log('pushStatus', pushStatus);
                                                                                                });
                                                                                            }
                                                                                        });

                                                                                        // Email the Team Name Change Request Notification

                                                                                        mailProperty('teamNameChanged')(user.email, {
                                                                                            name: user.name,
                                                                                            suggested_teamName: item.suggested_name,
                                                                                            site_url: config.liveUrl,
                                                                                        }).send();

                                                                                        callBack();
                                                                                    }, function (err, content) {
                                                                                        if (err) {
                                                                                            nextCb(null, err);
                                                                                        } else {

                                                                                            console.log("Team name changed successfully");

                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                    callback();
                                                                });
                                                            });

                                                        }
                                                    });

                                                }
                                            });

                                        } else {

                                            //update the request status cron
                                            TeamNameChangeReqScema.update({
                                                _id: item._id
                                            }, {
                                                $set: {
                                                    change_status: 'yes',
                                                    cron: 1
                                                }
                                            }, function (err, resUpdate) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                } else {

                                                    // Update notification status
                                                    NotificationSchema.find({
                                                        teamname_change_request_id: item._id,
                                                        read_status: 'no'
                                                    }, {}).exec(function (err, notificationList) {
                                                        async.forEach(notificationList, function (notification, callback) {

                                                            NotificationSchema.update({
                                                                _id: notification._id
                                                            }, {
                                                                $set: {
                                                                    read_status: 'yes'
                                                                }
                                                            }, function (err, resUpdate) {
                                                                if (err) {
                                                                    callback({
                                                                        "response_code": 5005,
                                                                        "response_message": "INTERNAL DB ERROR",
                                                                        "response_data": {}
                                                                    });
                                                                } else {

                                                                    UserSchema.find({
                                                                            _id: {
                                                                                $in: userid_list
                                                                            }
                                                                        })
                                                                        .exec(function (err, result) {
                                                                            if (err) {
                                                                                callback({
                                                                                    "response_code": 5005,
                                                                                    "response_message": err,
                                                                                    "response_data": {}
                                                                                });
                                                                            } else {

                                                                                async.forEach(result, function (user, callBack) {

                                                                                    // Email the Team Name Change Request Notification

                                                                                    mailProperty('teamNameNotChanged')(user.email, {
                                                                                        name: user.name,
                                                                                        suggested_teamName: item.suggested_name,
                                                                                        site_url: config.liveUrl,
                                                                                    }).send();

                                                                                    callBack();
                                                                                }, function (err, content) {
                                                                                    if (err) {
                                                                                        nextCb(null, err);
                                                                                    } else {

                                                                                        console.log("Team name not changed");

                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                }
                                                            });
                                                            callback();
                                                        });
                                                    });

                                                }
                                            });
                                        }
                                    }
                                });

                            });
                        }

                        callback();
                    })
                }
            }
        });

    }

}
module.exports = TeamNameChangeModels;