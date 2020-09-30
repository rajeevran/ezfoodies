var OrganizationSchema = require('../schema/organization');
var UserOrgSchema = require('../schema/userorganization');
var OrganizationTeamSchema = require('../schema/organiztionteam');
var UserOrgTeamSchema = require('../schema/userorganizationteam');
var TeamJoinRequestSchema = require('../schema/teamjoinrequest');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;


var OrganizationModels = {


    //Organization listing
    orginationAll: async function (data, callback) {

        var page = 1,
            limit = 20,
            maxDistance = 10,
            query = {};
        var teamJoinRequest = [];
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (parseInt(data.maxDistance)) {
            maxDistance = parseInt(data.maxDistance)
        }
        if (data.sortby) {
            sort_field = data.sortby;
        }
        if (data.sortby) {
            if (data.sortby == 'closest') {
                sortBy = 'dist.calculated';
            } else {
                if (data.sortOrder == 1) {
                    //for ascending
                    sortBy = data.sortby;
                } else {
                    //for descending
                    sortBy = '-' + data.sortby;
                }
            }
        }
        if (data.name) {
            query['name'] = new RegExp(data.name, 'i');
            // {
            //     $regex: /acme.*corp/,
            //     $options: 'i',
            //     $nin: [data.name]
            // }
        }
        //for distance seach
        if (data.userLat && data.userLong) {

            query['location'] = {

                $geoNear: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(data.userLong), parseFloat(data.userLat)]
                    },
                    $maxDistance: maxDistance * 1609,
                },

            };
        }
        // if (data.userLat && data.userLong) {

        //     query['location'] = {

        //         $near: {
        //             $geometry: {
        //                 type: 'Point',
        //                 //coordinates: [parseFloat(data.userLat), parseFloat(data.userLong)]
        //                 coordinates: [parseFloat(data.userLong), parseFloat(data.userLat)]
        //             },
        //             $maxDistance: maxDistance * 1609,
        //         },

        //     };
        // }
        if (data.orgid) {
            query['_id'] = data.orgid;
        }
        // var org_obj = [];
        // async.waterfall([
        //         function (nextCb) {
        //             OrganizationSchema.paginate(query, {
        //                 sort: {
        //                     'createdAt': -1
        //                 },
        //                 page: page,
        //                 limit: limit,
        //                 //sortBy: sortBy
        //             }, function (err, docs) {
        //                 if (err) {
        //                     nextCb(null, err);
        //                 } else {

        //                     nextCb(null, {
        //                         "response_code": 2000,
        //                         "response_data": docs
        //                     });
        //                 }
        //             });
        //         },
        //         function (response, nextCb) {

        //             if (response.response_code == 2000) {
        //                 // console.log(response.response_data.docs);
        //                 async.forEach(response.response_data.docs, function (item, callback) {

        //                     OrganizationTeamSchema.find({
        //                         orgid: item._id,
        //                         // is_verified: 'verified'
        //                     }, {}).exec(function (err, result) {
        //                         if (err) {
        //                             nextCb(null, err);
        //                         } else {

        //                             if (result.length > 0) {
        //                                 //console.log("result", result);
        //                                 item.teamData = result

        //                             } else {
        //                                 //console.log("result1", result);
        //                                 item.teamData = null
        //                             }

        //                             org_obj.push(item);

        //                             console.log("org_obj", org_obj);

        //                         }
        //                     });
        //                     callback();
        //                 }, function (err, content) {
        //                     if (err) {
        //                         nextCb(null, err);
        //                     } else {
        //                         //console.log("org_obj", org_obj);
        //                         callback({
        //                             "response_code": 2000,
        //                             "response_message": "Organization list11",
        //                             "response_data": org_obj
        //                         });
        //                         // nextCb(null, {
        //                         //     "response_code": 2000,
        //                         //     "response_data": org_obj
        //                         // });
        //                     }
        //                 });

        //             }
        //         }
        //     ],
        //     function (err, result) {

        //         if (err) {
        //             callback({
        //                 "response_code": 5005,
        //                 "response_message": "INTERNAL DB ERROR",
        //                 "response_data": {}
        //             });
        //         } else {

        //             callback({
        //                 "response_code": 2000,
        //                 "response_message": "Organization list",
        //                 "response_data": result
        //             });
        //         }
        //     });


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



        var aggregate = OrganizationSchema.aggregate();
        aggregate.match(query);



        aggregate.lookup({
            from: 'organisationteams',
            localField: '_id',
            foreignField: 'orgid',
            as: 'organisationteam'
        });
        // aggregate.unwind(
        //     "$organisationteam"
        // );

        // aggregate.lookup({
        //     from: 'userorganizationteams',
        //     localField: '_id',
        //     foreignField: 'orgid',
        //     as: 'userorganizationteam'
        // });
        // aggregate.unwind(
        //     "$userorganizationteam"
        // );

        // aggregate.group({
        //     _id: "$_id",
        //     createdAt: {
        //         "$first": "$createdAt"
        //     },
        //     name: {
        //         "$first": "$name"
        //     },
        //     lat: {
        //         "$first": "$lat"
        //     },
        //     long: {
        //         "$first": "$long"
        //     },
        //     organiztion_owner: {
        //         "$first": "$organiztion_owner"
        //     },
        //     location: {
        //         "$first": "$location"
        //     },
        //     address: {
        //         "$first": "$address"
        //     },

        //     team_details: {
        //         "$first": "$organisationteam"
        //     },
        //     userorganizationteam: {
        //         "$push": "$userorganizationteam"
        //     }

        // });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            lat: 1,
            // paymentId: 1,
            long: 1,
            organiztion_owner: 1,
            location: 1,
            address: 1,
            name: 1,
            team_details: "$organisationteam",
            //userorganizationteam: "$userorganizationteam"
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }
        OrganizationSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {
                async.forEach(results, function (organization, callBack) {

                    if (organization.team_details.length > 0) {
                        async.forEach(organization.team_details, function (item, callBack) {
                            item.linkWithTeam = false;
                            item.teamJoiningStatus = "no";
                            if (teamJoinRequest.length > 0) {
                                async.forEach(teamJoinRequest, function (team, callback) {
                                    //  console.log("team", team);

                                    if (team.teamid == item._id) {
                                        item.linkWithTeam = true;
                                        item.teamJoiningStatus = team.status;
                                        return callback(new Error('I want to exit here'));
                                    }
                                })
                            }
                            callBack();
                        })

                    }
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
                    "response_message": "Organization list.",
                    "response_data": data
                });


            }
        });

    },
    editOrganization: function (data, callback) {
        if (data) {
            OrganizationSchema.count({
                _id: data._id
            }).exec(function (err, resCount) {
                if (err) {
                    nextCb(null, err);
                } else {
                    if (resCount == null) {
                        callback({
                            "response_code": 2008,
                            "response_message": "Organisation not exist",
                            "response_data": {}
                        });
                    } else {
                        data.location = {
                            type: 'Point',
                            coordinates: [data.long, data.lat]
                        };
                        OrganizationSchema.update({
                            _id: data._id
                        }, {
                            $set: {
                                name: data.name,
                                address: data.address,
                                location: data.location,
                                lat: data.lat,
                                long: data.long

                            }
                        }, function (err, resUpdate) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": err,
                                    "response_data": {}
                                });
                            } else {
                                callback({
                                    "response_code": 2000,
                                    "response_message": "Organization Updated Successfully",
                                    "response_data": {}
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
    addOrganisation: function (data, callback) {
        if (data) {

            async.waterfall([
                    function (nextCb) {
                        UserOrgSchema.find({
                            user_id: data.user_id
                        }, {}).exec(function (err, result) {
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
                        if (response.response_data.length > 1) {

                            callback({
                                "response_code": 2008,
                                "response_message": "You have already registered with maximum Organisations.",
                            });

                        } else {
                            OrganizationSchema.count({
                                lat: data.lat,
                                long: data.long
                            }).exec(function (err, resCount) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (resCount > 0) {
                                        callback({
                                            "response_code": 2008,
                                            "response_message": "Organisation already exist.Please select from list.",
                                            "response_data": {}
                                        });
                                    } else {
                                        data.location = {
                                            coordinates: [data.long, data.lat]
                                        };
                                        data.organiztion_owner = data.user_id;
                                        new OrganizationSchema(data).save(function (err, result) {
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
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            var userorg = {};
                            userorg._id = new ObjectID;
                            userorg.user_id = data.user_id;
                            userorg.orgid = arg1.response_data._id;

                            new UserOrgSchema(userorg).save(function (err, result) {
                                if (err) {
                                    nextCb(null, err);
                                } else {

                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": arg1.response_data
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
                            "response_message": "You have been registered with organisation successfully.",
                            "response_data": result.response_data
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
    registerToOrganization: function (data, callback) {
        if (data) {

            async.waterfall([
                    function (nextCb) {
                        UserOrgSchema.find({
                            user_id: data.user_id
                        }, {}).exec(function (err, result) {
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
                        if (response.response_data.length > 1) {

                            callback({
                                "response_code": 2008,
                                "response_message": "You have already registered with maximum Organisations.",
                            });

                        } else {
                            OrganizationSchema.findOne({
                                _id: data.orgid,
                            }, {
                                name: 1,
                                address: 1,
                                location: 1
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
                                            "response_message": "Organization Not Exist.",
                                            "response_data": {}
                                        });
                                    }
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

                            new UserOrgSchema(userorg).save(function (err, result) {
                                if (err) {
                                    nextCb(null, err);
                                } else {

                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": arg1.response_data
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
                            "response_message": "You have been registered with organisation successfully.",
                            "response_data": result.response_data
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
    getUserOrganization: function (data, callback) {
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
        var aggregate = UserOrgSchema.aggregate();
        aggregate.match({
            user_id: data.user_id
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
            current_active_org: 1,
            organization_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$organization._id', 0]
                        },
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
        UserOrgSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Organisation found successfully.",
                    "response_data": data
                });
            }
        });
    },
    setActiveOrganization: function (data, callback) {
        async.waterfall([
                function (nextCb) {

                    UserOrgSchema.find({
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

                        // Checking if user registered with any second organization
                        UserOrgSchema.findOne({
                            _id: {
                                $ne: data.active_id
                            },
                            user_id: response.response_data[0].user_id,
                            // current_active_org: true
                        }, {

                        }).exec(function (err, secondOrg) {
                            console.log("secondOrg", secondOrg);
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (secondOrg == null) {
                                    // If second organization not found change current organization status
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": response.response_data
                                    });
                                } else {
                                    console.log("secondOrg", secondOrg._id);
                                    // If second organization found change second organization status to false
                                    UserOrgSchema.update({
                                            _id: secondOrg._id
                                        }, {
                                            $set: {
                                                current_active_org: false
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
                                                    "response_data": secondOrg
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

                        UserOrgSchema.update({
                                _id: data.active_id
                            }, {
                                $set: {
                                    current_active_org: true
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
                        "response_message": "Current organization set successfully.",
                        "response_data": {}
                    });
                }
            });
    },
    exitOrganization: function (data, callback) {
        async.waterfall([
                function (nextCb) {

                    OrganizationSchema.find({
                        _id: data.orgid
                    }, {
                        _id: 1,
                        organiztion_owner: 1,
                        name: 1
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
                                    "response_message": "Organization does not exist.",
                                    "response_data": {}
                                });
                            }

                        }
                    });
                },
                function (response, nextCb) {

                    if (response.response_code == 2000) {
                        // Check if Organization Owner then not able to exit 
                        if (response.response_data[0].organiztion_owner == data.user_id) {
                            callback({
                                "response_code": 5002,
                                "response_message": "You are the creater of this organization,You can't leave from this organization. Please request admin for delete your organization.",
                                "response_data": {}
                            });
                        } else {
                            nextCb(null, {
                                "response_code": 2000,
                                "response_data": response.response_data
                            });
                        }
                    }
                },
                function (response, nextCb) {

                    if (response.response_code == 2000) {
                        // Check if Team Owner of this Organization then not able to exit 
                        OrganizationTeamSchema.find({
                            team_owner: data.user_id,
                            orgid: data.orgid,
                            $or: [{
                                    is_verified: 'verified'
                                },
                                {
                                    is_verified: 'pending'
                                }
                            ]
                        }, {}).exec(function (err, result) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (result.length > 0) {


                                    callback({
                                        "response_code": 5002,
                                        "response_message": "You have created team in this organization. Please exit from your team first.",
                                        "response_data": result
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
                        // Check if join any team with in this Organization 
                        UserOrgTeamSchema.find({
                            orgid: data.orgid,
                            user_id: data.user_id,
                            status: 'yes'
                        }, {}).exec(function (err, result) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (result.length > 0) {
                                    callback({
                                        "response_code": 5002,
                                        "response_message": "You have join team in this organization. Please exit from your team first.",
                                        "response_data": result
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
                        // Remove request to join any team with in this Organization in pending state
                        UserOrgTeamSchema.find({
                            orgid: data.orgid,
                            user_id: data.user_id,
                            status: 'no'
                        }, {}).exec(function (err, pendingList) {
                            if (err) {
                                nextCb(null, err);
                            } else {
                                if (pendingList.length > 0) {
                                    let reqList = [];
                                    async.forEach(pendingList, function (item, callback) {
                                        reqList.push(item._id);
                                        callback();
                                    });
                                    if (reqList.length > 0) {

                                        UserOrgTeamSchema.remove({
                                            _id: {
                                                '$in': reqList
                                            }
                                        }, function (err) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": err,
                                                });

                                            } else {
                                                nextCb(null, {
                                                    "response_code": 2009,
                                                    "response_data": response.response_data,
                                                    "pendingList_data": pendingList
                                                });
                                            }
                                        });
                                    }
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

                    if (response.response_code == 2009) {
                        let joinreqList = [];
                        // Remove team join request pendind state
                        async.forEach(response.pendingList_data, function (item, callback) {


                            TeamJoinRequestSchema.find({
                                orgid: item.orgid,
                                teamid: item.teamid,
                                user_id: item.user_id
                            }, {}).exec(function (err, result) {
                                if (err) {
                                    nextCb(null, err);
                                } else {
                                    if (result.length > 0) {

                                        joinreqList.push(result[0]._id);

                                    } else {
                                        nextCb(null, {
                                            "response_code": 2000,
                                            "response_data": response.response_data
                                        });

                                    }

                                }
                            });

                            callback();
                        });

                        if (joinreqList.length > 0) {
                            console.log("joinreqList", joinreqList);

                            TeamJoinRequestSchema.remove({
                                _id: {
                                    '$in': joinreqList
                                }
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

                    } else {
                        nextCb(null, {
                            "response_code": 2000,
                            "response_data": response.response_data
                        });
                    }
                },
                function (response, nextCb) {

                    if (response.response_code == 2000) {
                        // Exit from Organization
                        UserOrgSchema.remove({
                            orgid: data.orgid,
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
                        "response_message": "Leave from organization successfully",
                        "response_data": result.response_data
                    });
                }
            });
    }
}
module.exports = OrganizationModels;