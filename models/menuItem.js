var MenuItemSchema = require('../schema/menu_items');
var MenuCategoryScema = require('./menuCategory');
var MenuCategoryIconScema = require('../schema/menu_category_icon');
var RestaurantSchema = require('../schema/restaurant');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var fs = require('fs');
var async = require("async");
var MenuItemModels = {


    //Organization listing
    menuItemAll: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};
        let menuDemoLogo = config.menuDemoLogoPath;
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

        if (data._id) {
            query['_id'] = data._id;
        }
        if (data.restaurant_id) {
            query['restaurant_id'] = data.restaurant_id;
        }
        if (data.menu_catagory_id) {
            query['menu_catagory_id'] = data.menu_catagory_id;
        }
        if (data.stock) {
            query['stock'] = data.stock;
        }

        if (data.status) {
            query['status'] = data.status;
        }

        var aggregate = MenuItemSchema.aggregate();
        aggregate.match(query);
        aggregate.lookup({
            from: 'menucategories',
            localField: 'menu_catagory_id',
            foreignField: '_id',
            as: 'menucategory'
        });
        aggregate.sort({
            'createdAt': -1
        })
        aggregate.project({
            _id: 1,
            restaurant_id: 1,
            menu_catagory_id: 1,
            name: 1,
            cname: 1,
            tcname: 1,
            price: 1,
            regular_time: 1,
            busy_time: 1,
            stock: 1,
            menu_logo: {
                $ifNull: ["$menu_logo", menuDemoLogo]
            },
            menu_customization: 1,
            customize_items: 1,
            total_quantity: 1,
            menucategory_details: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$menucategory.name', 0]
                        },
                        tcname:{
                            '$arrayElemAt': ['$menucategory.tcname', 0]
                        },
                        cname:{
                            '$arrayElemAt': ['$menucategory.cname', 0]
                        }
                    }], 0
                ]
            },
        });
        var options = {
            page: page,
            limit: limit
        }

        MenuItemSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Menu Item list",
                    "response_data": data
                });
            }
        });

    },
    menuCatListByRestaurent: async function (data, callback) {

        if (data) {
            var list = [];

            // let restaurantList = await RestaurantSchema.find({
            //     _id: data.restaurant_id
            // }).exec(function (err, result) {
            //     if (err) {
            //         callback({
            //             "response_code": 5005,
            //             "response_message": err,
            //             "response_data": {}
            //         });

            //     }
            // })
            // console.log(restaurantList[0].restaurant_manager_id);

            let menuCategory = await MenuCategoryScema.find({}).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            if (menuCategory.length > 0) {
                for (let index = 0; index < menuCategory.length; index++) {
                    let elementId = menuCategory[index]._id;



                    let menuItem = await MenuItemSchema.findOne({
                        restaurant_id: data.restaurant_id,
                        menu_catagory_id: elementId
                    }, function (err, menuRes) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": err,
                                "response_data": {}
                            });

                        }
                    })

                    if (menuItem !== null) {
                        let menu_category_df_icon = [];
                        if (menuCategory[index].logo == null) {
                            menu_category_df_icon = await MenuCategoryIconScema.findOne({
                                _id: menuCategory[index].default_icon_id,
                            }, function (err, menuRes) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": err,
                                        "response_data": {}
                                    });

                                }
                            })



                        }

                        list.push({
                            "_id": elementId,
                            "name": menuCategory[index].name,
                            "cname": menuCategory[index].cname,
                            "tcname": menuCategory[index].tcname,
                            "inactive_logo": menuCategory[index].inactive_logo,
                            "logo": menuCategory[index].logo == null ? menu_category_df_icon.icon : menuCategory[index].logo
                        });


                    }

                }
                callback({
                    "response_code": 2000,
                    "response_message": "Menu Item list",
                    "response_data": list
                });
            }


        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // },
    addMenu: function (data, callback) {
        if (data) {

            MenuItemSchema.find({
                name: data.name,
                restaurant_id: data.restaurant_id,
                menu_catagory_id: data.menu_catagory_id
            }, {}).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR1",
                        "response_data": err
                    });
                } else {
                    if (result.length > 0) {
                        callback({
                            "response_code": 2008,
                            "response_message": "Menu Item with same name already exist.",
                            "response_data": result
                        });
                    } else {
                        if (data.menu_customization == 'true') {
                            data.menu_customization = true
                        } else {
                            data.menu_customization = false
                        }

                        if (data.customize_items) {
                            data.customize_items = JSON.parse(data.customize_items);
                            async.forEach(data.customize_items, function (item, callback) {
                                item._id = new ObjectID;
                                callback();
                            })
                        }
                        new MenuItemSchema(data).save(function (err, result) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": err
                                });
                            } else {

                                callback({
                                    "response_code": 2000,
                                    "response_message": "Menu Added Successfully",
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
    updateMenu: function (data, fileData, callback) {
        if (data) {

            var timeStamp = Date.now();
            var folderpath = config.uploadMenuItemPicPath;
            let menuItemPicPath = config.MenuItemPath;

            async.waterfall([
                    function (nextCb) {
                        MenuItemSchema.findOne({
                                _id: data._id
                            },
                            function (err, resData) {
                                if (err) {
                                    nextcb(err);
                                } else {
                                    if (resData == null) {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "Menu Item not found.",
                                            "response_data": {}
                                        });
                                    } else {
                                        data.menu_logo = resData.menu_logo;
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
                                                                "message": "Menu Item Picture not uploaded",
                                                            });
                                                        } else {
                                                            data.menu_logo = menuItemPicPath + logoName;

                                                            let menu_logo = `./public/${resData.menu_logo}`;

                                                            if (fs.existsSync(menu_logo)) {
                                                                fs.unlink(menu_logo, (err) => {
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


                            if (data.customize_items != null || typeof (data.customize_items) != undefined) {

                                data.customize_items = JSON.parse(data.customize_items);

                                if (arg1.response_data.menu_customization === true) {
                                    async.forEach(data.customize_items, function (item, callback) {
                                        //checking new addon add
                                        if (item._id == undefined || item._id == null) item._id = new ObjectID;
                                        callback();
                                    })
                                } else {
                                    async.forEach(data.customize_items, function (item, callback) {
                                        item._id = new ObjectID;
                                        callback();
                                    })
                                }
                            }

                            MenuItemSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    restaurant_id: data.restaurant_id,
                                    menu_catagory_id: data.menu_catagory_id,
                                    name: data.name,
                                    tcname: data.tcname,
                                    cname: data.cname,
                                    price: data.price,
                                    regular_time: data.regular_time,
                                    busy_time: data.busy_time,
                                    menu_logo: data.menu_logo,
                                    menu_customization: data.menu_customization,
                                    customize_items: data.customize_items,
                                    total_quantity: data.total_quantity
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
                            "response_message": "Menu Item Updated Successfully",
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
    updateMenuStock: function (data, callback) {
        if (data) {
            MenuItemSchema.findOne({
                    _id: data._id
                },
                function (err, resData) {
                    if (err) {
                        nextcb(err);
                    } else {
                        if (resData == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Menu Item not found.",
                                "response_data": {}
                            });
                        } else {

                            MenuItemSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    stock: data.stock,
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
                                        "response_message": "Menu Item Status Updated Successfully",
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
    // registerToOrganization: function (data, callback) {
    //     if (data) {

    //         async.waterfall([
    //                 function (nextCb) {
    //                     UserOrgSchema.find({
    //                         user_id: data.user_id
    //                     }, {}).exec(function (err, result) {
    //                         if (err) {
    //                             nextCb(null, err);
    //                         } else {
    //                             nextCb(null, {
    //                                 "response_code": 2000,
    //                                 "response_data": result
    //                             });
    //                         }
    //                     });
    //                 },
    //                 function (response, nextCb) {
    //                     if (response.response_data.length > 1) {

    //                         callback({
    //                             "response_code": 2008,
    //                             "response_message": "You have already registered with maximum Organisations.",
    //                         });

    //                     } else {
    //                         OrganizationSchema.findOne({
    //                             _id: data.orgid,
    //                         }, {
    //                             name: 1,
    //                             address: 1,
    //                             location: 1,
    //                             meeting_point: 1
    //                         }, function (err, findRes) {
    //                             if (err) {
    //                                 nextCb(null, err);
    //                             } else {
    //                                 if (findRes != null) {

    //                                     nextCb(null, {
    //                                         "response_code": 2000,
    //                                         "response_data": findRes
    //                                     });
    //                                 } else {

    //                                     callback({
    //                                         "response_code": 5002,
    //                                         "response_message": "Organization Not Exist.",
    //                                         "response_data": {}
    //                                     });
    //                                 }
    //                             }
    //                         });
    //                     }
    //                 },
    //                 function (arg1, nextCb) {
    //                     if (arg1.response_code == 2000) {

    //                         var userorg = {};
    //                         userorg._id = new ObjectID;
    //                         userorg.user_id = data.user_id;
    //                         userorg.orgid = data.orgid;

    //                         new UserOrgSchema(userorg).save(function (err, result) {
    //                             if (err) {
    //                                 nextCb(null, err);
    //                             } else {

    //                                 nextCb(null, {
    //                                     "response_code": 2000,
    //                                     "response_data": arg1.response_data
    //                                 });

    //                             }
    //                         });
    //                     } else {
    //                         nextCb(null, arg1);
    //                     }
    //                 }

    //             ],
    //             function (err, result) {
    //                 if (err) {
    //                     callback({
    //                         "response_code": 5005,
    //                         "response_message": "INTERNAL DB ERROR",
    //                         "response_data": {}
    //                     });
    //                 } else {
    //                     callback({
    //                         "response_code": 2000,
    //                         "response_message": "You have been registered with organisation successfully.",
    //                         "response_data": result.response_data
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
    // getUserOrganization: function (data, callback) {
    //     var page = 1,
    //         limit = 20;
    //     if (data.page) {
    //         page = parseInt(data.page);
    //     }
    //     if (data.limit) {
    //         limit = parseInt(data.limit);
    //     }
    //     if (data.sortby) {
    //         sort_field = data.sortby;
    //     }
    //     var aggregate = UserOrgSchema.aggregate();
    //     aggregate.match({
    //         user_id: data.user_id
    //     });
    //     aggregate.lookup({
    //         from: 'organizations',
    //         localField: 'orgid',
    //         foreignField: '_id',
    //         as: 'organization'
    //     });
    //     aggregate.project({
    //         _id: 1,
    //         user_id: 1,
    //         organization_details: {
    //             '$arrayElemAt': [
    //                 [{
    //                     _id: {
    //                         '$arrayElemAt': ['$organization._id', 0]
    //                     },
    //                     name: {
    //                         '$arrayElemAt': ['$organization.name', 0]
    //                     },
    //                     address: {
    //                         '$arrayElemAt': ['$organization.address', 0]
    //                     },
    //                     lat: {
    //                         '$arrayElemAt': ['$organization.lat', 0]
    //                     },
    //                     long: {
    //                         '$arrayElemAt': ['$organization.long', 0]
    //                     },
    //                     meeting_point: {
    //                         '$arrayElemAt': ['$organization.meeting_point', 0]
    //                     }
    //                 }], 0
    //             ]
    //         },
    //     });
    //     var options = {
    //         page: page,
    //         limit: limit
    //     }
    //     UserOrgSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
    //         if (err) {
    //             callback({
    //                 "response_code": 5005,
    //                 "response_message": err,
    //                 "response_data": {}
    //             });

    //         } else {
    //             var data = {
    //                 docs: results,
    //                 pages: pageCount,
    //                 total: count,
    //                 limit: limit,
    //                 page: page
    //             }
    //             callback({
    //                 "response_code": 2000,
    //                 "response_message": "Organisation found successfully.",
    //                 "response_data": data
    //             });
    //         }
    //     });




    // }
}
module.exports = MenuItemModels;