var OrganizationTeamSchema = require('../schema/organiztionteam');
var UserOrgTeamSchema = require('../schema/userorganizationteam');
var TeamJoinRequestSchema = require('../schema/teamjoinrequest');
var NotificationModels = require('../models/notification');
var NotificationSchema = require('../schema/notifications');
var pushNotification = require('../modules/pushNotification');
var UserSchema = require('../schema/users');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var fs = require('fs');
var config = require('../config');
var mailProperty = require('../modules/sendMail');
var OrganizationTeamModels = {

    checkPushNotify: function (data, callback) {
        if (data) {
            UserSchema.findOne({
                    _id: data._id
                }, {
                    _id: 1,
                    email: 1,
                    email_verify: 1,
                    name: 1,
                    phone_no: 1,
                    devicetoken: 1,
                    apptype: 1,
                    type: 1,
                    socialLogin: 1
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
                            let profile_image = '';
                            if (result.type == "NORMAL") {
                                profile_image = result.profile_image;
                            } else {
                                profile_image = result.socialLogin[0].image;
                            }
                            if (profile_image == '' || profile_image == null) {
                                profile_image = config.liveUrl + config.userDemoPicPath;
                            }

                            var message = 'New User wants to join your team';
                            var title = 'Team Join Request';
                            var notification_code = 1000;
                            var pushData = {
                                deviceId: result.devicetoken,
                                user_id: result._id,
                                title: title,
                                message: message,
                                notification_code: notification_code,
                                profile_image: profile_image,
                                //profile_image: "https://lh3.googleusercontent.com/-QJ6XBjk0D5s/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rcZKaWniv7TEwHfVfajZerBoBcPTQ/s96-c/photo.jpg"
                            }
                            if (result.apptype == "ANDROID") {

                                pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Push sent",
                                        "response_data": pushStatus
                                    });
                                });

                            }
                            if (result.apptype == "IOS") {

                                pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Push sent",
                                        "response_data": pushStatus
                                    });
                                });

                            }


                        } else {
                            callback({
                                "response_code": 2008,
                                "response_message": "User Not Exist.",
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
    teamAll: async function (data, callback) {

        var page = 1,
            limit = 20,
            sortBy = -1;
        query = {};
        var teamJoinRequest = [];
        let restaurantDemoLogo = config.restaurantDemoLogoPath;
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }

        if (data.sortby) {
            sortBy = data.sortby;
        }

        if (data.name) {
            query['name'] = new RegExp(data.name, 'i');
        }

        if (data.teamid) {
            query['_id'] = data.teamid;
        }
        if (data.orgid) {
            query['orgid'] = data.orgid;
        }
        if (data.is_verified) {
            query['is_verified'] = data.is_verified;
        }



        if (data.user_id) {

            await UserOrgTeamSchema.find({
                user_id: data.user_id
            }, {
                teamid: 1,
                status: 1
            }).exec(function (err, result) {
                if (err) {

                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    async.forEach(result, function (item, callback) {
                        teamJoinRequest.push({
                            teamid: item.teamid,
                            status: item.status
                        });
                        callback();
                    })
                }
            });
        }

        var aggregate = OrganizationTeamSchema.aggregate();
        aggregate.match(query);
        aggregate.lookup({
            from: 'userorganizationteams',
            localField: '_id',
            foreignField: 'teamid',
            as: 'userorganizationteam'
        });
        aggregate.lookup({
            from: 'organizations',
            localField: 'orgid',
            foreignField: '_id',
            as: 'organization'
        });
        aggregate.group({
            _id: "$_id",
            name: {
                "$first": "$name"
            },
            orgid: {
                "$first": "$orgid"
            },
            is_verified: {
                "$first": "$is_verified"
            },
            team_owner: {
                "$first": "$team_owner"
            },
            meeting_point: {
                "$first": "$meeting_point"
            },
            id_proof: {
                "$first": "$id_proof"
            },

            userorganizationteam: {
                "$first": "$userorganizationteam"
            },
            organization: {
                "$first": "$organization"
            }

        });


        aggregate.sort({
            'createdAt': sortBy
        })

        aggregate.project({
            _id: 1,
            orgid: 1,
            name: 1,
            is_verified: 1,
            team_owner: 1,
            meeting_point: 1,
            id_proof: 1,
            organization_name: {
                '$arrayElemAt': ['$organization.name', 0]
            },
            acceptedMember: {
                "$size": {
                    "$filter": {
                        "input": "$userorganizationteam.status",
                        "as": "item",
                        "cond": {
                            "$eq": ["$$item", "yes"]
                        }
                    }
                }
            },
            pendindMember: {
                "$size": {
                    "$filter": {
                        "input": "$userorganizationteam.status",
                        "as": "item",
                        "cond": {
                            "$eq": ["$$item", "no"]
                        }
                    }
                }
            },

        });
        var options = {
            page: page,
            limit: limit
        }

        OrganizationTeamSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                if (teamJoinRequest.length == 0) {

                    var data = {
                        docs: results,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({
                        "response_code": 2000,
                        "response_message": "Team list",
                        "response_data": data
                    });
                } else {
                    async.forEach(results, function (item, callBack) {

                        item.linkWithTeam = false;
                        item.teamJoiningStatus = "no";
                        // const found = teamJoinRequest.some(el => el.teamid === item._id);
                        // console.log("item===", item._id);
                        // var index = teamJoinRequest.findIndex(el => el.teamid === item._id);
                        // console.log("index", index);
                        // if (index) {
                        //     item.linkWithTeam = true;
                        //     item.teamJoiningStatus = teamJoinRequest[index].status;
                        // } else {
                        //     item.linkWithTeam = false;
                        //     item.teamJoiningStatus = teamJoinRequest[index].status;
                        // }
                        async.forEach(teamJoinRequest, function (team, callback) {
                            //  console.log("team", team);

                            if (team.teamid == item._id) {
                                item.linkWithTeam = true;
                                item.teamJoiningStatus = team.status;
                                return callback(new Error('I want to exit here'));
                            }
                        })
                        callBack();
                    })

                    var data = {
                        docs: results,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({
                        "response_code": 2000,
                        "response_message": "Team list",
                        "response_data": data
                    });
                }
            }
        });
    },

    // teamAll: function (data, callback) {

    //     var page = 1,
    //         limit = 20,
    //         maxDistance = 10,
    //         query = {};
    //     if (data.page) {
    //         page = parseInt(data.page);
    //     }
    //     if (data.limit) {
    //         limit = parseInt(data.limit);
    //     }
    //     if (parseInt(data.maxDistance)) {
    //         maxDistance = parseInt(data.maxDistance)
    //     }
    //     if (data.sortby) {
    //         sort_field = data.sortby;
    //     }
    //     if (data.sortby) {
    //         if (data.sortby == 'closest') {
    //             sortBy = 'dist.calculated';
    //         } else {
    //             if (data.sortOrder == 1) {
    //                 //for ascending
    //                 sortBy = data.sortby;
    //             } else {
    //                 //for descending
    //                 sortBy = '-' + data.sortby;
    //             }
    //         }
    //     }
    //     if (data.name) {
    //         query['name'] = new RegExp(data.name, 'i');
    //         // {
    //         //     $regex: /acme.*corp/,
    //         //     $options: 'i',
    //         //     $nin: [data.name]
    //         // }
    //     }
    //     //for distance seach
    //     if (data.orgid) {

    //         query['orgid'] = data.orgid;
    //     }
    //     if (data.is_verified) {

    //         query['is_verified'] = data.is_verified;
    //     }
    //     if (data.teamid) {
    //         query['_id'] = data.teamid;
    //     }

    //     async.waterfall([
    //             function (nextCb) {
    //                 OrganizationTeamSchema.paginate(query, {
    //                     sort: {
    //                         'createdAt': -1
    //                     },
    //                     page: page,
    //                     limit: limit,
    //                     //sortBy: sortBy
    //                 }, function (err, docs) {
    //                     if (err) {
    //                         nextCb(null, err);
    //                     } else {
    //                         nextCb(null, docs);
    //                     }
    //                 });
    //             }
    //         ],
    //         function (err, result) {
    //             if (err) {
    //                 callback({
    //                     "response_code": 5005,
    //                     "response_message": "INTERNAL DB ERROR",
    //                     "response_data": {}
    //                 });
    //             } else {
    //                 callback({
    //                     "response_code": 2000,
    //                     "response_message": "Organization list",
    //                     "response_data": result
    //                 });
    //             }
    //         });

    // },

    teamUserList: function (data, callback) {
        var page = 1,
            limit = 20;
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.sortby) {
            sort_field = data.sortby;
        }
        var aggregate = UserOrgTeamSchema.aggregate();
        aggregate.match({
            teamid: data.teamid,
        });
        aggregate.lookup({
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
        });

        aggregate.project({
            _id: 1,
            user_id: 1,

            user_details: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$user.name', 0]
                        },
                        profile_image: {
                            '$arrayElemAt': ['$user.profile_image', 0]
                        },
                        socialLogin: {
                            '$arrayElemAt': ['$user.socialLogin', 0]
                        }
                    }], 0
                ]
            },
        });
        var options = {
            page: page,
            limit: limit
        }
        UserOrgTeamSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Team User List found successfully.",
                    "response_data": data
                });
            }
        });

    },

    // //Organization Team listing
    // orginationTeamAll: function (data, callback) {

    //     var page = 1,
    //         limit = 20,
    //         query = {
    //             orgid: data.orgid,
    //             is_verified: 'verified'
    //         };
    //     if (data.page) {
    //         page = parseInt(data.page);
    //     }
    //     if (data.limit) {
    //         limit = parseInt(data.limit);
    //     }
    //     if (data.sortby) {
    //         sort_field = data.sortby;
    //     }
    //     async.waterfall([
    //             function (nextCb) {
    //                 OrganizationTeamSchema.paginate(query, {
    //                     sort: {
    //                         'createdAt': -1
    //                     },
    //                     page: page,
    //                     limit: limit
    //                 }, function (err, docs) {
    //                     if (err) {
    //                         nextCb(null, err);
    //                     } else {
    //                         nextCb(null, docs);
    //                     }
    //                 });
    //             }
    //         ],
    //         function (err, result) {
    //             if (err) {
    //                 callback({
    //                     "response_code": 5005,
    //                     "response_message": "INTERNAL DB ERROR",
    //                     "response_data": {}
    //                 });
    //             } else {
    //                 callback({
    //                     "response_code": 2000,
    //                     "response_message": "Organization Team list",
    //                     "response_data": result
    //                 });
    //             }
    //         });


    // },
    //Change Team Status
    changeTeamStatus: function (data, callback) {
        if (data) {
            OrganizationTeamSchema.findOne({
                    _id: data.teamid
                },
                function (err, resultobj) {
                    if (err) {
                        nextcb(err);
                    } else {
                        if (resultobj == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Team Not Exist.",
                                "response_data": {}
                            });
                        } else {
                            OrganizationTeamSchema.update({
                                _id: data.teamid
                            }, {
                                $set: {
                                    is_verified: data.status
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (data.status == 'rejected') {
                                        UserOrgTeamSchema.remove({
                                            teamid: data.teamid,
                                            user_id: resultobj.team_owner
                                        }, function (err) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": err,
                                                });

                                            } else {
                                                callback({
                                                    "response_code": 2000,
                                                    "response_message": "Status has been changed.",
                                                });
                                            }
                                        });
                                    } else {
                                        UserOrgTeamSchema.update({
                                            teamid: data.teamid,
                                            user_id: resultobj.team_owner
                                        }, {
                                            $set: {
                                                status: "yes"
                                            }
                                        }, function (err, resUpdate1) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": {}
                                                });
                                            } else {
                                                callback({
                                                    "response_code": 2000,
                                                    "response_message": "Status has been changed.",
                                                });
                                            }
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
    // Create new team and join user to them
    addOrganisationTeam: function (data, callback) {
        if (data) {

            async.waterfall([
                    function (nextCb) {
                        OrganizationTeamSchema.findOne({
                                orgid: data.orgid,
                                name: data.name,
                                team_owner: data.user_id,
                                $or: [{
                                        is_verified: 'verified'
                                    },
                                    {
                                        is_verified: 'pending'
                                    }
                                ]
                            },
                            function (err, resultobj) {
                                if (err) {
                                    nextcb(err);
                                } else {
                                    if (resultobj != null) {
                                        callback({
                                            "response_code": 2008,
                                            "response_message": "Team with same name already exist in the Organisation. Please select from list.",
                                            "response_data": {}
                                        });
                                    } else {
                                        UserOrgTeamSchema.find({
                                            user_id: data.user_id,
                                            orgid: data.orgid,
                                            $or: [{
                                                    status: 'yes'
                                                },
                                                {
                                                    status: 'no'
                                                }
                                            ]
                                        }, {}).exec(function (err, resultusertm) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": {}
                                                });
                                            } else {
                                                if (resultusertm.length > 1) {
                                                    callback({
                                                        "response_code": 2008,
                                                        "response_message": "You are already members of two teams for that organization.",
                                                    });
                                                } else {

                                                    data.team_owner = data.user_id;

                                                    new OrganizationTeamSchema(data).save(function (err, result) {
                                                        if (err) {
                                                            nextCb(null, err);
                                                        } else {

                                                            nextCb(null, {
                                                                "response_code": 2000,
                                                                "response_data": result
                                                            });

                                                        }
                                                    });
                                                }
                                            }
                                        });

                                    }
                                }
                            });
                    },
                    function (result, nextCb) {
                        if (result.response_code == 2000) {

                            var userorg = {};
                            userorg._id = new ObjectID;
                            userorg.user_id = data.user_id;
                            userorg.status = "yes";
                            userorg.orgid = result.response_data.orgid;
                            userorg.teamid = result.response_data._id

                            new UserOrgTeamSchema(userorg).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": err,
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
                            nextCb(null, result);
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
                            "response_message": "You have been registered with team successfully.",
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
    // Register user to old Team
    registerToTeam: function (data, callback) {
        // var message = 'New User wants to join your team';
        // var title = 'Team Join Request';
        // var notification_code = 1000;
        // var pushData = {
        //     deviceId: "cVQTvdwIZWM:APA91bH1b5PEVYMdVwVrulVDxYh5NsfVxbhLYVONQsqP3SjF6fCw5lJV-a26k3Z5ApP-ZG8K-591Xb90lkEkgFLWCusAGU5NBPGhKEkCzfj0feA5HMAuQKNCMxf4fe5H683qrPwBZcVl",
        //     user_id: "123344",
        //     title: title,
        //     message: message,
        //     notification_code: notification_code
        // }

        // pushNotification.androidPushNotification(pushData, function (pushStatus) {
        //     console.log('pushStatus', pushStatus);
        // });
        if (data) {
            var userid_list = [];
            var teamName = "";
            async.waterfall([
                    function (nextCb) {

                        OrganizationTeamSchema.findOne({
                            _id: data.teamid,
                            is_verified: 'verified'
                        }, function (err, findRes) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (findRes != null) {
                                    teamName = findRes.name;
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": findRes
                                    });
                                } else {

                                    callback({
                                        "response_code": 5002,
                                        "response_message": "Team Not Exist or Verified.",
                                        "response_data": {}
                                    });
                                }
                            }
                        });
                    },
                    function (response, nextCb) {

                        if (response.response_code == 2000) {
                            // Prevent to request for same organization more than two teams
                            UserOrgTeamSchema.find({
                                user_id: data.user_id,
                                orgid: data.orgid,
                                $or: [{
                                        status: 'yes'
                                    },
                                    {
                                        status: 'no'
                                    }
                                ]
                            }, {}).exec(function (err, result) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (result.length > 1) {
                                        callback({
                                            "response_code": 2008,
                                            "response_message": "You have already request for memebership of two teams for that organization.If membership is pending wait for 14 days for new request",
                                        });
                                    } else {
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": {}
                                        });
                                    }
                                }
                            });
                        }
                    },
                    function (response, nextCb) {

                        if (response.response_code == 2000) {
                            // Prevent to request for same team multiple-times
                            UserOrgTeamSchema.find({
                                user_id: data.user_id,
                                orgid: data.orgid,
                                teamid: data.teamid,
                                $or: [{
                                        status: 'yes'
                                    },
                                    {
                                        status: 'no'
                                    }
                                ]
                            }, {}).exec(function (err, result) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (result.length > 0) {
                                        callback({
                                            "response_code": 2008,
                                            "response_message": "You have already request for the memebership of that team.If membership is pending wait for 14 days for new request",
                                        });
                                    } else {
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": {}
                                        });
                                    }
                                }
                            });
                        }
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {
                            // Get List of all previous active user in the team 
                            UserOrgTeamSchema.find({
                                teamid: data.teamid,
                                orgid: data.orgid,
                                status: 'yes'
                            }, {}).exec(function (err, result) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    async.forEach(result, function (item, callBack) {

                                        userid_list.push(item.user_id);
                                        // userid_list = [{
                                        //     _id: item.user_id
                                        // }];
                                        callBack();
                                    }, function (err, res) {
                                        if (err) {

                                        } else {

                                            var teamjoinreq = {};
                                            teamjoinreq._id = new ObjectID;
                                            teamjoinreq.user_id = data.user_id;
                                            teamjoinreq.orgid = data.orgid;
                                            teamjoinreq.teamid = data.teamid;
                                            teamjoinreq.notify_users_list = userid_list;

                                            new TeamJoinRequestSchema(teamjoinreq).save(function (err, result) {
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
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            var userorg = {};
                            userorg._id = new ObjectID;
                            userorg.user_id = data.user_id;
                            userorg.orgid = data.orgid;
                            userorg.teamid = data.teamid;
                            userorg.status = 'no';
                            console.log("userorg", userorg);
                            new UserOrgTeamSchema(userorg).save(function (err, result) {
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
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            // Push notification for other team member

                            var query = {};
                            if (arg1.response_data) {
                                query = {
                                    _id: {
                                        $in: arg1.response_data
                                    }
                                }
                            }
                            var message = 'New User wants to join your team';
                            var title = 'Team Join Request';
                            var notification_code = 1000;

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
                                                notification_code: notification_code
                                            }
                                            var addData = {
                                                _id: new ObjectID,
                                                user_id: item._id,
                                                notification_code: notification_code,
                                                message: message,
                                                title: title,
                                                notification_for: 'team_member',
                                                team_join_request_details: {
                                                    user_id: data.user_id,
                                                    orgid: data.orgid,
                                                    teamid: data.teamid
                                                }
                                            }
                                            console.log("addData", addData);
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

                                            // Email the Joining Request Notification

                                            mailProperty('teamJoinRequest')(item.email, {
                                                name: item.name,
                                                teamName: teamName,
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
                            "response_message": "Your request for team membership received successfully.",
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
    //Team Join Request Status Change
    teamJoinStatusChange: function (data, callback) {
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
                                        "response_message": "Request not exist or already verified by other member.",
                                        "response_data": {}
                                    });
                                }
                            }
                        });
                    },
                    function (response, nextCb) {
                        if (response.response_code == 2000) {
                            // Update team join request status
                            let teamJoinStatus = '';
                            let rejectReason = '';
                            if (data.status == 'yes') {
                                teamJoinStatus = 'approved';
                            } else {
                                teamJoinStatus = 'rejected';
                                rejectReason = data.rejectReason;
                            }

                            TeamJoinRequestSchema.find({
                                user_id: response.response_data.team_join_request_details.user_id,
                                orgid: response.response_data.team_join_request_details.orgid,
                                teamid: response.response_data.team_join_request_details.teamid
                            }, {}).exec(function (err, pendingList) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (pendingList.length > 0) {

                                        TeamJoinRequestSchema.update({
                                                user_id: response.response_data.team_join_request_details.user_id,
                                                orgid: response.response_data.team_join_request_details.orgid,
                                                teamid: response.response_data.team_join_request_details.teamid
                                            }, {
                                                $set: {
                                                    status: teamJoinStatus,
                                                    reject_reason: rejectReason
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
                                                        "response_data": response.response_data
                                                    });
                                                }
                                            });
                                    } else {
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": {}
                                        });
                                    }

                                }
                            });


                        }
                    },
                    function (response, nextCb) {

                        if (response.response_code == 2000) {
                            // Update status for joining request
                            let teamJoinStatus = '';
                            if (data.status == 'yes') {
                                teamJoinStatus = data.status;
                            } else {
                                teamJoinStatus = 'rejected';
                            }
                            UserOrgTeamSchema.find({
                                user_id: response.response_data.team_join_request_details.user_id,
                                orgid: response.response_data.team_join_request_details.orgid,
                                teamid: response.response_data.team_join_request_details.teamid,
                                status: 'no'
                            }, {}).exec(function (err, pendingList) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (pendingList.length > 0) {

                                        UserOrgTeamSchema.update({
                                                user_id: response.response_data.team_join_request_details.user_id,
                                                orgid: response.response_data.team_join_request_details.orgid,
                                                teamid: response.response_data.team_join_request_details.teamid
                                            }, {
                                                $set: {
                                                    status: teamJoinStatus
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
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": {}
                                        });
                                    }

                                }
                            });

                        }
                    },
                    function (response, nextCb) {

                        if (response.response_code == 2000) {
                            // Prevent to request for same organization more than two teams
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
                            "response_message": "Request has been updated",
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
    setActiveTeam: function (data, callback) {
        async.waterfall([
                function (nextCb) {

                    UserOrgTeamSchema.find({
                        _id: data.active_id
                    }, {
                        user_id: 1,
                        orgid: 1
                    }).exec(function (err, result) {
                        if (err) {
                            nextCb(null, err);
                        } else {
                            nextCb(null, {
                                "response_code": 2000,
                                "response_data": result
                            });
                        }
                    });
                },
                function (response, nextCb) {

                    if (response.response_code == 2000) {

                        // Checking if user registered with any second team
                        UserOrgTeamSchema.find({
                            _id: {
                                $ne: data.active_id
                            },
                            user_id: response.response_data[0].user_id,
                            orgid: response.response_data[0].orgid
                        }, {

                        }).exec(function (err, secondTeam) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (secondTeam == null) {
                                    // If second team not found change current team status
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": response.response_data
                                    });
                                } else {
                                    // If second team found change second team status to false
                                    UserOrgTeamSchema.update({
                                            _id: secondTeam[0]._id
                                        }, {
                                            $set: {
                                                current_active_team: false
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
                                                    "response_data": secondTeam
                                                });
                                            }
                                        });
                                }

                            }
                        });
                    }
                },
                function (response, nextCb) {
                    console.log("response", response);
                    if (response.response_code == 2000) {

                        UserOrgTeamSchema.update({
                                _id: data.active_id
                            }, {
                                $set: {
                                    current_active_team: true
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
                                        "response_data": response.response_data
                                    });
                                }
                            });
                    } else {
                        nextCb(null, response);
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
                        "response_message": "Current team set successfully.",
                        "response_data": {}
                    });
                }
            });
    },
    callUserTeam: function (data, callback) {
        var page = 1,
            limit = 20;
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.sortby) {
            sort_field = data.sortby;
        }
        var aggregate = UserOrgTeamSchema.aggregate();
        aggregate.match({
            user_id: data.user_id,
            orgid: data.orgid
        });
        aggregate.lookup({
            from: 'organisationteams',
            localField: 'teamid',
            foreignField: '_id',
            as: 'organizationteam'
        });

        aggregate.lookup({
            from: 'organizations',
            localField: 'orgid',
            foreignField: '_id',
            as: 'organization'
        });
        aggregate.project({
            _id: 1,
            user_id: 1,
            orgid: 1,
            status: 1,
            current_active_team: 1,
            organizationteam_details: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$organizationteam.name', 0]
                        },
                        is_verified: {
                            '$arrayElemAt': ['$organizationteam.is_verified', 0]
                        },
                        teamid: {
                            '$arrayElemAt': ['$organizationteam._id', 0]
                        }
                    }], 0
                ]
            },
            organization_details: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$organization.name', 0]
                        },
                        address: {
                            '$arrayElemAt': ['$organization.address', 0]
                        },
                        lat: {
                            '$arrayElemAt': ['$organization.lat', 0]
                        },
                        long: {
                            '$arrayElemAt': ['$organization.long', 0]
                        }
                    }], 0
                ]
            },
        });
        var options = {
            page: page,
            limit: limit
        }
        UserOrgTeamSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "User Team found successfully.",
                    "response_data": data
                });
            }
        });




    },
    currentTeamMemberList: async function (data, callback) {
        var page = 1,
            limit = 20,
            team_id = '';
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.sortby) {
            sort_field = data.sortby;
        }

        let userOrgTeam = await UserOrgTeamSchema.find({
            user_id: data.user_id,
            orgid: data.orgid
        }).exec(function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        if (userOrgTeam.length > 0) {

            if (userOrgTeam.length > 1) {
                async.forEach(userOrgTeam, function (item, callback) {
                    if (item.current_active_team == true) {
                        team_id = item.teamid;
                    }

                    callback()
                })
            } else {
                team_id = userOrgTeam[0].teamid;
            }

            console.log("team_id", team_id);

        } else {
            callback({
                "response_code": 2008,
                "response_message": "No Members Found",
                "response_data": []
            });
        }

        var aggregate = UserOrgTeamSchema.aggregate();
        aggregate.match({
            user_id: {
                $ne: data.user_id
            },
            orgid: data.orgid,
            teamid: team_id,
            status: "yes"
        });
        aggregate.lookup({
            from: 'organisationteams',
            localField: 'teamid',
            foreignField: '_id',
            as: 'organizationteam'
        });

        aggregate.lookup({
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
        });
        aggregate.project({
            _id: 1,
            status: 1,
            current_active_team: 1,
            organizationteam_details: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$organizationteam.name', 0]
                        },
                        is_verified: {
                            '$arrayElemAt': ['$organizationteam.is_verified', 0]
                        },
                        teamid: {
                            '$arrayElemAt': ['$organizationteam._id', 0]
                        },
                        meeting_point: {
                            '$arrayElemAt': ['$organizationteam.meeting_point', 0]
                        }
                    }], 0
                ]
            },
            user_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$user._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$user.name', 0]
                        },
                        email: {
                            '$arrayElemAt': ['$user.email', 0]
                        },
                        pfImage: {
                            $cond: {
                                if: {
                                    $in: ["NORMAL", "$user.type"]
                                },
                                then: {
                                    $cond: {
                                        if: {
                                            $in: ["", "$user.profile_image"]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$user.profile_image", 0]
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
                                                    '$arrayElemAt': ['$user.socialLogin.image', 0]
                                                }, 0], " "
                                            ]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            '$arrayElemAt': [{
                                                '$arrayElemAt': ['$user.socialLogin.image', 0]
                                            }, 0]

                                        }
                                    }
                                }
                            }
                        },
                        phone_no: {
                            $concat: [{
                                "$arrayElemAt": ["$user.country_code", 0]
                            }, {
                                "$arrayElemAt": ["$user.phone_no", 0]
                            }]
                        }
                    }], 0
                ]
            },
        });
        var options = {
            page: page,
            limit: limit
        }
        UserOrgTeamSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Team Members found successfully.",
                    "response_data": data
                });
            }
        });




    },
    exitTeam: function (data, callback) {
        async.waterfall([
                function (nextCb) {

                    OrganizationTeamSchema.find({
                        _id: data.teamid
                    }, {
                        _id: 1,
                        name: 1,
                        orgid: 1
                    }).exec(function (err, result) {
                        if (err) {
                            nextCb(null, err);
                        } else {
                            if (result.length > 0) {
                                nextCb(null, {
                                    "response_code": 2000,
                                    "response_data": result
                                });
                            } else {
                                callback({
                                    "response_code": 5002,
                                    "response_message": "Team does not exist.",
                                    "response_data": {}
                                });
                            }

                        }
                    });
                },
                function (response, nextCb) {

                    if (response.response_code == 2000) {
                        // Check if Team Owner not able to exit 
                        OrganizationTeamSchema.find({
                            team_owner: data.user_id
                        }, {}).exec(function (err, result) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (result.length > 0) {
                                    callback({
                                        "response_code": 5002,
                                        "response_message": "You are the creater of this team,You can't exit from this team. Please request admin for delete your team.",
                                        "response_data": {}
                                    });
                                } else {
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": response.response_data
                                    });

                                }

                            }
                        });
                    }
                },
                function (response, nextCb) {

                    if (response.response_code == 2000) {
                        // Remove team join request first
                        TeamJoinRequestSchema.find({
                            orgid: data.orgid,
                            teamid: data.teamid,
                            user_id: data.user_id
                        }, {}).exec(function (err, result) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (result.length > 0) {

                                    TeamJoinRequestSchema.remove({
                                        orgid: data.orgid,
                                        teamid: data.teamid,
                                        user_id: data.user_id
                                    }, function (err) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": err,
                                            });

                                        } else {
                                            nextCb(null, {
                                                "response_code": 2000,
                                                "response_data": response.response_data
                                            });
                                        }
                                    });
                                } else {
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": response.response_data
                                    });

                                }

                            }
                        });

                    }
                },
                function (response, nextCb) {

                    if (response.response_code == 2000) {
                        // Exit from team
                        UserOrgTeamSchema.remove({
                            orgid: data.orgid,
                            teamid: data.teamid,
                            user_id: data.user_id
                        }, function (err) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": err,
                                });

                            } else {
                                nextCb(null, {
                                    "response_code": 2000,
                                    "response_data": response.response_data
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
                        "response_message": "Exit from team successfully",
                        "response_data": result.response_data
                    });
                }
            });
    }
}
module.exports = OrganizationTeamModels;