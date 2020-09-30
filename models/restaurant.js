var RestaurantSchema = require('../schema/restaurant');
var RestaurantManagerSchema = require('../models/restaurantManager');
var FavouriteRestaurantSchema = require('../schema/favouriteRestaurant');
var RestaurantCategoryScema = require('../schema/restaurant_category');
var MenuItemSchema = require('../schema/menu_items');
var async = require("async");
var config = require('../config');
var mailProperty = require('../modules/sendMail');
var fs = require('fs');
var QRCode = require('qrcode')
var OrganizationModels = {

    filterRestaurantList: async function (data, callback) {

        var page = 1,
            limit = 20,
            maxDistance = 10,
            query = {},
            catids = [];


        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (parseInt(data.maxDistance)) {
            maxDistance = parseInt(data.maxDistance)
        }

        let restaurantDemoLogo = config.restaurantDemoLogoPath;
        let restaurantDemoBanner = config.restaurantDemoBannerPath;


        // if (data.name) {
        //     query['name'] = new RegExp(data.name, 'i');
        // }    

        let restaurantCategory = await RestaurantCategoryScema.find({
            name: new RegExp(data.name, 'i')
        }).exec(function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        var menuItems = await MenuItemSchema.find({
            name: new RegExp(data.name, 'i'),
            stock: "In-stock"
        }).exec(function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })




        if (restaurantCategory.length > 0) {
            for (let index = 0; index < restaurantCategory.length; index++) {
                let elementId = restaurantCategory[index]._id;
                catids.push(elementId);
            }

        }

        query = {
            "$or": [{
                "name": new RegExp(data.name, 'i')
            }, {
                "restaurant_type": {
                    $in: catids
                }
            }],
            status: "Publish"
        }

        if (data.userLat && data.userLong) {

            query['location'] = {

                $geoNear: {
                    $geometry: {
                        type: 'Point',
                        //coordinates: [parseFloat(data.userLat), parseFloat(data.userLong)]
                        coordinates: [parseFloat(data.userLong), parseFloat(data.userLat)]
                    },
                    $maxDistance: maxDistance * 1609,
                },

            };
        }


        if (data.restaurant_ids) {
            if (typeof data.restaurant_ids === 'string' || data.restaurant_ids instanceof String) {
                query['_id'] = data.restaurant_ids;
            } else {

                // console.log(typeof (data.rewardId));
                // console.log(data.rewardId);
                query['_id'] = {
                    '$in': data.restaurant_ids
                };
            }
        }

        var aggregate = RestaurantSchema.aggregate();
        aggregate.match(query);

        aggregate.unwind(
            "$restaurant_type"
        );
        aggregate.lookup({
            from: 'restaurant-categories',
            localField: 'restaurant_type',
            foreignField: '_id',
            as: 'restaurant_category'
        });
        aggregate.unwind(
            "$restaurant_category"
        );
        aggregate.lookup({
            from: 'rewards',
            localField: 'rewardId',
            foreignField: '_id',
            as: 'restReward'
        });
        aggregate.group({
            "_id": "$_id",
            "restaurant_category": {
                "$push": "$restaurant_category"
            },
            restaurantReward: {
                "$first": "$restReward"
            },
            restaurant_manager_id: {
                "$first": "$restaurant_manager_id"
            },
            name: {
                "$first": "$name"
            },
            cname: {
                "$first": "$cname"
            },
            tcname: {
                "$first": "$tcname"
            },
            address: {
                "$first": "$address"
            },
            lat: {
                "$first": "$lat"
            },
            long: {
                "$first": "$long"
            },
            location: {
                "$first": "$location"
            },
            location: {
                "$first": "$location"
            },
            restaurant_banner_image: {
                "$first": "$restaurant_banner_image"
            },
            restaurant_logo: {
                "$first": "$restaurant_logo"
            },
            opening_hours: {
                "$first": "$opening_hours"
            },
            closing_days: {
                "$first": "$closing_days"
            },
            restaurant_type: {
                "$first": "$restaurant_type"
            },
            contact_info: {
                "$first": "$contact_info"
            },
            email: {
                "$first": "$email"
            },
            pre_order_accepted: {
                "$first": "$pre_order_accepted"
            },
            status: {
                "$first": "$status"
            },
            busy_mode: {
                "$first": "$busy_mode"
            },
            qr_code: {
                "$first": "$qr_code"
            },
            featured: {
                "$first": "$featured"
            },
            order: {
                "$first": "$order"
            },
        });

        aggregate.sort({
            'createdAt': -1
        })
        aggregate.project({
            _id: 1,
            restaurant_manager_id: 1,
            name: 1,
            restaurantReward: 1,
            cname: 1,
            tcname: 1,
            address: 1,
            lat: 1,
            long: 1,
            location: 1,
            featured: 1,
            order: {
                $cond: {
                    if: {
                        $eq: ["$featured", 'yes']
                    },
                    then: 1,
                    else: 2
                }
            },
            restaurant_banner_image: {
                $ifNull: ["$restaurant_banner_image", restaurantDemoBanner]
            },
            // restaurant_banner_image: {
            //     $ifNull: ["$restaurant_banner_image", {
            //         '$arrayElemAt': ["$restaurant_category.logo", 0]
            //     }]
            // },
            restaurant_logo: {
                $ifNull: ["$restaurant_logo", restaurantDemoLogo]
            },
            opening_hours: 1,
            closing_days: 1,
            restaurant_type: 1,
            contact_info: 1,
            email: 1,
            pre_order_accepted: 1,
            status: 1,
            busy_mode: 1,
            restaurant_category: "$restaurant_category"

        });
        aggregate.sort({
            'order': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        RestaurantSchema.aggregatePaginate(aggregate, options, async function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {



                let finalmenuItems = [];
                if (results.length > 0) {
                    let restIds = [];
                    async.forEach(results, function (item, callback) {
                        restIds.push(item._id);
                        async.forEach(menuItems, function (menuItem, callback) {
                            if (item._id == menuItem.restaurant_id) {
                                finalmenuItems.push(menuItem);
                            }

                            callback();
                        })
                        callback();
                    })

                }

                var data = {
                    docs: results,
                    menuItems: finalmenuItems,
                    pages: pageCount,
                    total: count,
                    limit: limit,
                    page: page
                }

                callback({
                    "response_code": 2000,
                    "response_message": "Restaurant list",
                    "response_data": data
                });
            }
        });




    },
    //Restaurant listing
    restaurantAll: async function (data, callback) {

        var page = 1,
            limit = 20,
            maxDistance = 10,
            sortBy = '';
        query = {};
        var fav_restaurents = [];
        let restaurantDemoLogo = config.restaurantDemoLogoPath;
        let restaurantDemoBanner = config.restaurantDemoBannerPath;
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
        //for distance seach
        if (data.userLat && data.userLong) {

            query['location'] = {

                $geoNear: {
                    $geometry: {
                        type: 'Point',
                        //coordinates: [parseFloat(data.userLat), parseFloat(data.userLong)]
                        coordinates: [parseFloat(data.userLong), parseFloat(data.userLat)]
                    },
                    $maxDistance: maxDistance * 1609,
                },

            };
        }
        if (data.restaurant_id) {
            query['_id'] = data.restaurant_id;
        }
        if (data.restaurant_manager_id) {
            query['restaurant_manager_id'] = data.restaurant_manager_id;
        }
        if (data.status) {
            query['status'] = data.status;
        }


        if (data.rewardId) {
            if (typeof data.rewardId === 'string' || data.rewardId instanceof String) {
                query['rewardId'] = data.rewardId;
            } else {

                // console.log(typeof (data.rewardId));
                // console.log(data.rewardId);
                query['rewardId'] = {
                    '$in': data.rewardId
                };
            }
        }


        if (data.user_id) {

            await FavouriteRestaurantSchema.find({}, {
                restaurant_id: 1
            }).exec(function (err, result) {
                if (err) {

                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    async.forEach(result, function (item, callback) {
                        fav_restaurents.push(item.restaurant_id);
                        callback();
                    })
                }
            });
        }

        var aggregate = RestaurantSchema.aggregate();
        aggregate.match(query);
        aggregate.lookup({
            from: 'restaurantmanagers',
            localField: 'restaurant_manager_id',
            foreignField: '_id',
            as: 'restaurantmanager'
        });
        aggregate.unwind(
            "$restaurant_type"
        );
        aggregate.lookup({
            from: 'restaurant-categories',
            localField: 'restaurant_type',
            foreignField: '_id',
            as: 'restaurant_category'
        });
        aggregate.unwind(
            "$restaurant_category"
        );
        aggregate.lookup({
            from: 'rewards',
            localField: 'rewardId',
            foreignField: '_id',
            as: 'restReward'
        });

        aggregate.group({
            "_id": "$_id",
            "restaurant_category": {
                "$push": "$restaurant_category"
            },
            restaurant_manager_id: {
                "$first": "$restaurant_manager_id"
            },
            restaurantReward: {
                "$first": "$restReward"
            },
            restReward1: {
                "$first": "$restReward"
            },
            name: {
                "$first": "$name"
            },
            cname: {
                "$first": "$cname"
            },
            tcname: {
                "$first": "$tcname"
            },
            address: {
                "$first": "$address"
            },
            lat: {
                "$first": "$lat"
            },
            long: {
                "$first": "$long"
            },
            location: {
                "$first": "$location"
            },
            location: {
                "$first": "$location"
            },
            restaurant_banner_image: {
                "$first": "$restaurant_banner_image"
            },
            restaurant_logo: {
                "$first": "$restaurant_logo"
            },
            opening_hours: {
                "$first": "$opening_hours"
            },
            closing_days: {
                "$first": "$closing_days"
            },
            restaurant_type: {
                "$addToSet": "$restaurant_type"
            },
            contact_info: {
                "$first": "$contact_info"
            },
            email: {
                "$first": "$email"
            },
            pre_order_accepted: {
                "$first": "$pre_order_accepted"
            },
            status: {
                "$first": "$status"
            },
            busy_mode: {
                "$first": "$busy_mode"
            },
            qr_code: {
                "$first": "$qr_code"
            },
            restaurantmanager: {
                "$first": "$restaurantmanager"
            },
            createdAt: {
                "$first": "$createdAt"
            },
            featured: {
                "$first": "$featured"
            },
            order: {
                "$first": "$order"
            },

        });


        aggregate.project({
            _id: 1,
            restaurant_manager_id: 1,
            restaurantReward: 1,
            name: 1,
            cname: 1,
            tcname: 1,
            address: 1,
            lat: 1,
            long: 1,
            location: 1,
            featured: 1,
            order: {
                $cond: {
                    if: {
                        $eq: ["$featured", 'yes']
                    },
                    then: 1,
                    else: 2
                }
            },
            restaurant_banner_image: {
                $ifNull: ["$restaurant_banner_image", restaurantDemoBanner]
            },
            // restaurant_banner_image: {
            //     $ifNull: ["$restaurant_banner_image", {
            //         '$arrayElemAt': ["$restaurant_category.logo", 0]
            //     }]
            // },
            restaurant_logo: {
                $ifNull: ["$restaurant_logo", restaurantDemoLogo]
            },
            opening_hours: 1,
            closing_days: 1,
            restaurant_type: 1,
            contact_info: 1,
            email: 1,
            pre_order_accepted: 1,
            status: 1,
            busy_mode: 1,
            qr_code: 1,
            restaurantmanager_details: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$restaurantmanager.name', 0]
                        },
                        email: {
                            '$arrayElemAt': ['$restaurantmanager.email', 0]
                        },
                    }], 0
                ]
            },
            restaurant_category: "$restaurant_category"

        });
        aggregate.sort({
            'order': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        RestaurantSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                if (fav_restaurents == null) {
                    var data = {
                        docs: results,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({
                        "response_code": 2000,
                        "response_message": "Restaurant list",
                        "response_data": data
                    });
                } else {

                    async.forEach(results, function (item, callback) {
                        if (fav_restaurents.includes(item._id)) {
                            item.isFavourite = true;
                        } else {
                            item.isFavourite = false;
                        }
                        callback();
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
                        "response_message": "Restaurant list",
                        "response_data": data
                    });
                }
            }
        });

    },
    addRestaurant: async function (data, fileData, callback) {
        if (data) {

            var timeStamp = Date.now();
            var folderpath = config.uploadRestaurantPicPath;
            let restaurantpicPath = config.RestaurantPicPath;


            async.waterfall([
                    function (nextCb) {
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
                                                "message": "Restaurant logo not uploaded",
                                            });
                                        } else {
                                            data.restaurant_logo = restaurantpicPath + logoName;
                                            nextCb(null, {
                                                "response_code": 2000,
                                                "response_data": {}

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
                            data.restaurant_logo = null;
                            nextCb(null, {
                                "response_code": 2000,
                                "response_data": {}

                            });
                        }


                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            if (fileData != null && fileData.banner) {
                                var restaurant_banner = fileData.banner;
                                var restaurant_bannerName = timeStamp + restaurant_banner.name;

                                let split_banner = restaurant_banner
                                    .mimetype
                                    .split("/");

                                if (split_banner[1] = "jpeg" || "png" || "jpg") {

                                    restaurant_banner.mv(
                                        folderpath + restaurant_bannerName,
                                        function (err) {
                                            if (err) {
                                                callback({
                                                    "success": false,
                                                    "STATUSCODE": 5005,
                                                    "message": "Restaurant banner not uploaded",
                                                });
                                            } else {
                                                data.restaurant_banner_image = restaurantpicPath + restaurant_bannerName;

                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": {}

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
                                // Replace Category logo as banner
                                data.restaurant_banner_image = null;

                                nextCb(null, {
                                    "response_code": 2000,
                                    "response_data": {}

                                });


                            }
                        } else {
                            nextCb(null, arg1);
                        }
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            // var obj = {
                            //     restaurant_id: data._id,
                            //     restaurant_name: data.name
                            // }
                            // let qr_code_file_name = timeStamp + data.name + '.png';

                            // QRCode.toFile(config.uploadRestaurantQRPicPath + qr_code_file_name, JSON.stringify(obj), {
                            //     color: {
                            //         dark: '#000', // Blue dots
                            //         light: '#0000' // Transparent background
                            //     }
                            // }, function (err) {
                            //     console.log("err====", err);
                            //     if (err) {

                            //         callback({
                            //             "success": false,
                            //             "STATUSCODE": 5002,
                            //             "message": err,
                            //         });
                            //     } else {
                            //         data.qr_code = config.RestaurantQRPicPath + qr_code_file_name;
                            //         console.log("data11========>", data)
                            //         nextCb(null, {
                            //             "response_code": 2000,
                            //             "response_data": {}

                            //         });
                            //     }
                            // })

                            const qrString = data._id;

                            QRCode.toDataURL(String(qrString), function (err, url) {

                                if (err) {

                                    callback({
                                        "success": false,
                                        "STATUSCODE": 5002,
                                        "message": err,
                                    });
                                } else {
                                    data.qr_code = url;
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": {}

                                    });
                                }
                            })
                        } else {
                            nextCb(null, arg1);
                        }
                    },

                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            data.location = {
                                coordinates: [data.long, data.lat]
                            };

                            new RestaurantSchema(data).save(function (err, result) {

                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": err,
                                        "response_data": {}
                                    });
                                } else {
                                    RestaurantManagerSchema.findOne({
                                            _id: data.restaurant_manager_id,
                                        }, {
                                            _id: 1,
                                            email: 1,
                                            name: 1
                                        },
                                        function (err, findRes) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "err",
                                                    "response_data": {}
                                                });
                                            } else {

                                                mailProperty('restautantAddMail')(findRes.email, {
                                                    name: findRes.name,
                                                    restaurant_name: data.name,
                                                    email: findRes.email,
                                                    site_url: config.liveUrl,
                                                    date: new Date()
                                                }).send();

                                            }

                                        });

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
                            "response_message": "Restaurant added successfully.",
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


    updateRestaurant: function (data, fileData, callback) {
        if (data) {
            // console.log(data);
            // console.log(fileData);

            data.qr_code = null;
            var timeStamp = Date.now();
            var folderpath = config.uploadRestaurantPicPath;
            let restaurantpicPath = config.RestaurantPicPath;

            async.waterfall([
                    function (nextCb) {
                        RestaurantSchema.findOne({
                                _id: data._id
                            },
                            function (err, resData) {
                                if (err) {
                                    nextcb(err);
                                } else {
                                    if (resData == null) {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "Restaurant not found.",
                                            "response_data": {}
                                        });
                                    } else {
                                        data.restaurant_logo = resData.restaurant_logo;
                                        data.restaurant_banner_image = resData.restaurant_banner_image;
                                        data.qr_code = resData.qr_code;
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
                                                                "message": "Restaurant logo not uploaded",
                                                            });
                                                        } else {
                                                            data.restaurant_logo = restaurantpicPath + logoName;

                                                            let restaurant_logo = `./public/${resData.restaurant_logo}`;

                                                            if (fs.existsSync(restaurant_logo)) {
                                                                fs.unlink(restaurant_logo, (err) => {
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
                                                "response_data": resData

                                            });
                                        }


                                    }
                                }
                            });
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            if (fileData != null && fileData.banner) {
                                var restaurant_banner = fileData.banner;
                                var restaurant_bannerName = timeStamp + restaurant_banner.name;
                                let split_banner = restaurant_banner
                                    .mimetype
                                    .split("/");

                                if (split_banner[1] = "jpeg" || "png" || "jpg") {

                                    restaurant_banner.mv(
                                        folderpath + restaurant_bannerName,
                                        function (err) {
                                            if (err) {
                                                callback({
                                                    "success": false,
                                                    "STATUSCODE": 5005,
                                                    "message": "Restaurant banner not uploaded",
                                                });
                                            } else {
                                                data.restaurant_banner_image = restaurantpicPath + restaurant_bannerName;
                                                let restaurant_banner_image = `./public/${arg1.response_data.restaurant_banner_image}`;

                                                if (fs.existsSync(restaurant_banner_image)) {
                                                    fs.unlink(restaurant_banner_image, (err) => {
                                                        if (err) throw err;
                                                        console.log('successfully deleted');
                                                    });
                                                }

                                                nextCb(null, {
                                                    "response_code": 2000,
                                                    "response_data": arg1.response_data

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
                                    "response_data": arg1.response_data

                                });
                            }
                        }
                    },
                    function (arg1, nextCb) {

                        if (arg1.response_code == 2000 && (arg1.response_data.qr_code == null || arg1.response_data.qr_code == undefined)) {

                            const qrString = data._id;

                            QRCode.toDataURL(String(qrString), function (err, url) {

                                if (err) {

                                    callback({
                                        "success": false,
                                        "STATUSCODE": 5002,
                                        "message": err,
                                    });
                                } else {
                                    data.qr_code = url;
                                    nextCb(null, {
                                        "response_code": 2000,
                                        "response_data": {}

                                    });
                                }
                            })
                        } else {
                            nextCb(null, arg1);
                        }
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            data.location = {
                                coordinates: [data.long, data.lat],
                                type: 'Point'
                            };

                            RestaurantSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    name: data.name,
                                    cname: data.cname,
                                    tcname: data.tcname,
                                    address: data.address,
                                    location: data.location,
                                    lat: data.lat,
                                    long: data.long,
                                    restaurant_banner_image: data.restaurant_banner_image,
                                    restaurant_logo: data.restaurant_logo,
                                    opening_hours: data.opening_hours,
                                    closing_days: data.closing_days,
                                    restaurant_type: data.restaurant_type,
                                    contact_info: data.contact_info,
                                    email: data.email,
                                    qr_code: data.qr_code
                                }
                            }, function (err, resUpdate) {
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
                            "response_message": "Restaurant Updated Successfully",
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
    updateRestaurantStatus: function (data, callback) {
        if (data) {
            RestaurantSchema.findOne({
                    _id: data._id
                },
                function (err, resData) {
                    if (err) {
                        nextcb(err);
                    } else {
                        if (resData == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Restaurant not found.",
                                "response_data": {}
                            });
                        } else {

                            RestaurantSchema.update({
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
                                    var obj = {
                                        restaurant_id: data._id,
                                        status: data.status
                                    }
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Restaurant Status Updated Successfully",
                                        "response_data": obj
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
    updateRestaurantReward: function (data, callback) {
        if (data) {
            RestaurantSchema.findOne({
                    _id: data._id
                },
                function (err, resData) {
                    if (err) {
                        nextcb(err);
                    } else {
                        if (resData == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Restaurant not found.",
                                "response_data": {}
                            });
                        } else {

                            RestaurantSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    rewardId: data.rewardId,
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    var obj = {
                                        restaurant_id: data._id,
                                        status: data.rewardId
                                    }
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Restaurant Reward Updated Successfully",
                                        "response_data": obj
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
    updateRestaurantFeature: function (data, callback) {
        if (data) {
            RestaurantSchema.findOne({
                    _id: data._id
                },
                function (err, resData) {
                    if (err) {
                        nextcb(err);
                    } else {
                        if (resData == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Restaurant not found.",
                                "response_data": {}
                            });
                        } else {

                            RestaurantSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    featured: data.featured,
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    var obj = {
                                        restaurant_id: data._id,
                                        featured: data.featured
                                    }
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Restaurant Featured Updated Successfully",
                                        "response_data": obj
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
    updateRestaurantMode: function (data, callback) {
        if (data) {
            RestaurantSchema.findOne({
                    _id: data._id
                },
                function (err, resData) {
                    if (err) {
                        nextcb(err);
                    } else {
                        if (resData == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Restaurant not found.",
                                "response_data": {}
                            });
                        } else {

                            RestaurantSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    busy_mode: data.busy_mode,
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
                                        "response_message": "Restaurant Mode Updated Successfully",
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
    // Update Restaurant Pre Order Status
    updateRestaurantPreOrder: function (data, callback) {
        if (data) {
            RestaurantSchema.findOne({
                    _id: data._id
                },
                function (err, resData) {
                    if (err) {
                        nextcb(err);
                    } else {
                        if (resData == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Restaurant not found.",
                                "response_data": {}
                            });
                        } else {

                            RestaurantSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    pre_order_accepted: data.status,
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
                                        "response_message": "Pre Order Status Updated Successfully",
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
    deleteRestaurant: function (id, callback) {
        if (id) {
            RestaurantSchema.findOne({
                    _id: id
                },
                function (err, resData) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {
                        if (resData) {
                            RestaurantSchema.remove({
                                    _id: id
                                },
                                async function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": err
                                        });
                                    } else {
                                        let restaurant_banner_image = `./public/${resData.restaurant_banner_image}`;
                                        let restaurant_logo = `./public/${resData.restaurant_logo}`;
                                        if (fs.existsSync(restaurant_banner_image)) {
                                            await fs.unlink(restaurant_banner_image, (err) => {
                                                if (err) throw err;
                                                console.log('successfully deleted');
                                            });
                                        }
                                        if (fs.existsSync(restaurant_logo)) {
                                            await fs.unlink(restaurant_logo, (err) => {
                                                if (err) throw err;
                                                console.log('successfully deleted');
                                            });
                                        }
                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Restaurant deleted successfully.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Restaurant not found.",
                                "response_data": err
                            });
                        }
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
}
module.exports = OrganizationModels;