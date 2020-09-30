var RestaurantCategoryScema = require('../schema/restaurant_category');
var MenuItemModel = require('../models/menuItem');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var async = require("async");
var fs = require('fs');
var RestaurantCatService = {
    restaurantCatList: function (data, callback) {

        var page = 1,
            limit = 60,
            sortby = 1,
            query = {};
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data._id) {
            query['_id'] = data._id;
        }
        if (data.sortby) {
            sortby = data.sortby;
        }
        if(data.name){
            query['name']=new RegExp(data.name,'i');
        }
      
        async.waterfall([
                function (nextCb) {
                    RestaurantCategoryScema.paginate(query, {
                        sort: {
                            'createdAt': sortby
                        },
                        page: page,
                        limit: limit,
                        //sortBy: sortBy
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
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response": {}
                    })
                } else {
                    callback({
                        "success": true,
                        "STATUSCODE": 2000,
                        "message": "Restaurant Category List",
                        "response": result
                    })
                }
            });

    },
    // restaurantCatList: function (data, callback) {
    //     var query = {};
    //     var sortby = -1;
    //     if (data._id) {
    //         query['_id'] = data._id;
    //     }
    //     if (data.sortby) {
    //         sortby = data.sortby;
    //     }

    //     RestaurantCategoryScema.find(query, {
    //             _id: 1,
    //             name: 1,
    //             logo: 1
    //         })
    //         .sort({
    //             'createdAt': sortby
    //         })
    //         .exec(function (err, result) {
    //             if (err) {
    //                 callback({
    //                     "response_code": 5005,
    //                     "response_message": "INTERNAL DB ERROR",
    //                     "response_data": {}
    //                 });
    //             } else {
    //                 callback({
    //                     "success": true,
    //                     "STATUSCODE": 2000,
    //                     "message": "Restaurant Category List",
    //                     "response": result
    //                 })
    //             }
    //         });

    // },

    addRestaurantCat: function (data, fileData, callback) {
        if (!data.name || typeof data.name === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide name",
                "response": []
            });
        } else if (!fileData || typeof fileData === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select menu image",
                "response": []
            });
        } else {


            data._id = new ObjectID;

            var logo = fileData.logo;
            var timeStamp = Date.now();
            var logo_name = timeStamp + logo.name;
            var folderpath = config.uploadRestaurantCatPicPath;
            let restaurantCatPicPath = config.RestaurantCatPicPath;
            let split = logo
                .mimetype
                .split("/");

            if (split[1] = "jpeg" || "png" || "jpg") {
                logo.mv(
                    folderpath + logo_name,
                    function (err) {

                        if (err) {
                            callback({
                                "success": false,
                                "STATUSCODE": 5005,
                                "message": "Logo not uploaded",
                            });
                        } else {
                            data.logo = restaurantCatPicPath + logo_name;
                            new RestaurantCategoryScema(data).save(function (err, result) {

                                if (err) {
                                    callback({
                                        "success": false,
                                        "STATUSCODE": 5005,
                                        "message": err,
                                        "response": {}
                                    });
                                } else {

                                    callback({
                                        "success": true,
                                        "STATUSCODE": 2000,
                                        "message": "Added Successfully",
                                    })

                                }

                            });

                        }

                    }
                )
            } else {
                callback({
                    "success": false,
                    "STATUSCODE": 5002,
                    "message": "MIME type not allowed please upload jpg or png file",
                });
            }

        }
    },

    editRestaurantCat: function (data, fileData, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {


            var timeStamp = Date.now();
            var folderpath = config.uploadRestaurantCatPicPath;
            let restaurantCatPicPath = config.RestaurantCatPicPath;

            async.waterfall([
                    function (nextCb) {
                        RestaurantCategoryScema.findOne({
                                _id: data._id
                            },
                            function (err, resData) {
                                if (err) {
                                    nextcb(err);
                                } else {
                                    if (resData == null) {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "Restaurant Category not exis.",
                                            "response_data": {}
                                        });
                                    } else {
                                        data.logo = resData.logo;
                                        if (fileData != null && fileData.logo) {
                                            var logoFile = fileData.logo;
                                            var logoName = timeStamp + logoFile.name;
                                            let split = logoFile
                                                .mimetype
                                                .split("/");

                                            if (split[1] = "jpeg" || "png" || "jpg") {
                                                logoFile.mv(
                                                    folderpath + logoName,
                                                    function (err) {

                                                        if (err) {
                                                            callback({
                                                                "success": false,
                                                                "STATUSCODE": 5005,
                                                                "message": "Logo not uploaded",
                                                            });
                                                        } else {
                                                            data.logo = restaurantCatPicPath + logoName;

                                                            let active_icon = `./public/${resData.logo}`;

                                                            if (fs.existsSync(active_icon)) {
                                                                fs.unlink(active_icon, (err) => {
                                                                    if (err) throw err;
                                                                    console.log('successfully deleted');
                                                                });
                                                            }

                                                            nextCb(null, {
                                                                "response_code": 2000,
                                                                "response_data": resData

                                                            });
                                                        }

                                                    }
                                                )
                                            } else {
                                                callback({
                                                    "success": false,
                                                    "STATUSCODE": 5002,
                                                    "message": "MIME type not allowed please upload jpg or png file",
                                                });
                                            }

                                        } else {
                                            nextCb(null, {
                                                "response_code": 2000,
                                                "response_data": {}

                                            });
                                        }


                                    }
                                }
                            });
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {


                            RestaurantCategoryScema.update({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        tcname: data.tcname,
                                        cname: data.cname,
                                        logo: data.logo,
                                    }
                                },
                                function (err, resUpdate) {
                                    if (err) {
                                        callback({
                                            "success": false,
                                            "STATUSCODE": 5005,
                                            "message": "INTERNAL DB ERROR",
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
                            "response_message": "Updated Successfully",
                            "response_data": {}
                        });
                    }
                });
        }
    },
    deleteRestaurantCat: function (id, callback) {
        if (!id || typeof id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {
            RestaurantCategoryScema.findOne({
                    _id: id
                },
                function (err, resData) {
                    if (err) {
                        callback({
                            "success": false,
                            "STATUSCODE": 5005,
                            "message": "INTERNAL DB ERROR",
                            "response": err
                        });
                    } else {
                        if (resData) {

                            //let active_icon = './' + config.uploadMenuCatPicPath + resData.logo;
                            let active_icon = `./public/${resData.logo}`;
                            if (fs.existsSync(active_icon)) {
                                fs.unlink(active_icon, (err) => {
                                    if (err) {
                                        callback({
                                            "success": false,
                                            "STATUSCODE": 5002,
                                            "message": err,
                                            "response": []
                                        });
                                    } else {
                                        console.log('successfully deleted logo');
                                    }

                                });
                            }


                            RestaurantCategoryScema.remove({
                                    _id: id
                                },
                                async function (err, result) {
                                    if (err) {
                                        callback({
                                            "success": false,
                                            "STATUSCODE": 5005,
                                            "message": "INTERNAL DB ERROR",
                                            "response": err
                                        });
                                    } else {

                                        callback({
                                            "success": true,
                                            "STATUSCODE": 2000,
                                            "message": "Restaurant Category deleted successfully",
                                            "response": []
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "success": false,
                                "STATUSCODE": 5002,
                                "message": "Restaurant Category not found",
                                "response": []
                            });
                        }
                    }
                }
            )
        }
    },

};
module.exports = RestaurantCatService;