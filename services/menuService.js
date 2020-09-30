var MenuCategoryScema = require('../models/menuCategory');
var MenuCategoryIconScema = require('../schema/menu_category_icon');
var MenuItemModel = require('../models/menuItem');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var async = require("async");
var fs = require('fs');
var MenuService = {
    menuCatList: async function (data, callback) {

        var page = 1,
            limit = 20;
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
        if (data.user_id) {
            query['user_id'] = data.user_id
        }
        if (data.restaurant_id) {
            query['restaurant_id'] = data.restaurant_id
        }


        var aggregate = MenuCategoryScema.aggregate();
        aggregate.match(query);
        aggregate.lookup({
            from: 'menu-category-icons',
            localField: 'default_icon_id',
            foreignField: '_id',
            as: 'menu_category_icon'
        });

        aggregate.sort({
            'createdAt': -1
        })
        aggregate.project({
            _id: 1,
            user_id: 1,
            name: 1,
            cname: 1,
            tcname: 1,
            inactive_logo: 1,
            default_icon_id: 1,
            restaurant_id: 1,
            logo: {
                $ifNull: ["$logo", {
                    '$arrayElemAt': ["$menu_category_icon.icon", 0]
                }]
            },


            // menu_category_icon: {
            //     '$arrayElemAt': [
            //         [{
            //             _id: {
            //                 '$arrayElemAt': ['$menu_category_icon._id', 0]
            //             },
            //             icon: {
            //                 '$arrayElemAt': ['$menu_category_icon.icon', 0]
            //             },
            //         }], 0
            //     ]
            // },
        });
        var options = {
            page: page,
            limit: limit
        }

        MenuCategoryScema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "success": false,
                    "STATUSCODE": 5005,
                    "message": err,
                    "response": []
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
                    "success": true,
                    "STATUSCODE": 2000,
                    "message": "Menu Category List",
                    "response": data
                })
            }
        });



    },

    menuCatListByRestaurent: function (data, callback) {
        if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else {
            MenuItemModel.menuCatListByRestaurent(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    // menuCatList: function (data, callback) {
    //     var query = {};
    //     if (data._id) {
    //         query['_id'] = data._id;
    //     }
    //     if (data.user_id) {
    //         query['user_id'] = data.user_id
    //     }
    //     MenuCategoryScema.find(query, {
    //             _id: 1,
    //             user_id: 1,
    //             name: 1,
    //             logo: 1,
    //             inactive_logo: 1,
    //             default_icon_id: 1

    //         })
    //         .sort({
    //             'createdAt': -1
    //         })
    //         .exec(function (err, result) {
    //             if (err) {
    //                 callback({
    //                     "success": false,
    //                     "STATUSCODE": 5005,
    //                     "message": err,
    //                     "response": []
    //                 });
    //             } else {
    //                 callback({
    //                     "success": true,
    //                     "STATUSCODE": 2000,
    //                     "message": "Menu Category List",
    //                     "response": result
    //                 })
    //             }
    //         });

    // },
    menuCatIconList: function (data, callback) {
        var query = {};
        if (data._id) {
            query['_id'] = data._id;
        }
        MenuCategoryIconScema.find(query, {
                _id: 1,
                icon: 1
            })
            .sort({
                'createdAt': -1
            })
            .exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    callback({
                        "success": true,
                        "STATUSCODE": 2000,
                        "message": "Menu Category Icon List",
                        "response": result
                    })
                }
            });
    },
    addMenuCatIcon: function (data, fileData, callback) {
        if (!fileData || typeof fileData === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select default menu category icon",
                "response": []
            });
        } else {


            data._id = new ObjectID;

            var icon = fileData.icon;

            var timeStamp = Date.now();
            var icon_name = timeStamp + icon.name;
            var folderpath = config.uploadDefaultMenuCatIconPath;
            let menuCatIconPath = config.defaultMenuCatIconPath;
            let split = icon
                .mimetype
                .split("/");

            if (split[1] = "jpeg" || "png" || "jpg") {
                icon.mv(
                    folderpath + icon_name,
                    function (err) {

                        if (err) {
                            callback({
                                "success": false,
                                "STATUSCODE": 5005,
                                "message": "Active icon not uploaded",
                            });
                        } else {
                            data.icon = menuCatIconPath + icon_name;
                            new MenuCategoryIconScema(data).save(function (err, result) {

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
    addMenuCat: function (data, fileData, callback) {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide user id",
                "response": []
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide name",
                "response": []
            });
        } else if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else {


            data._id = new ObjectID;

            if (data.default_icon_id) {

                new MenuCategoryScema(data).save(function (err, result) {

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
                            "message": "Added Successfully111",
                        })

                    }

                });
            } else {

                var active_icon = fileData.logo;
                //var inactive_icon = fileData.inactive_logo;
                var timeStamp = Date.now();
                var active_icon_name = timeStamp + active_icon.name;
                //var inactive_icon_name = timeStamp + inactive_icon.name;
                var folderpath = config.uploadMenuCatPicPath;
                let menuCatPicPath = config.MenuCatPicPath;
                let split = active_icon
                    .mimetype
                    .split("/");

                if (split[1] = "jpeg" || "png" || "jpg") {
                    active_icon.mv(
                        folderpath + active_icon_name,
                        function (err) {

                            if (err) {
                                callback({
                                    "success": false,
                                    "STATUSCODE": 5005,
                                    "message": "Active icon not uploaded",
                                });
                            } else {
                                data.logo = menuCatPicPath + active_icon_name;
                                new MenuCategoryScema(data).save(function (err, result) {

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
                                            "message": "Added Successfully2222222",
                                        })

                                    }

                                });
                                // let split1 = inactive_icon
                                //     .mimetype
                                //     .split("/");
                                // if (split1[1] = "jpeg" || "png" || "jpg") {

                                //     inactive_icon.mv(
                                //         folderpath + inactive_icon_name,
                                //         function (err) {

                                //             if (err) {
                                //                 callback({
                                //                     "success": false,
                                //                     "STATUSCODE": 5005,
                                //                     "message": "In-Active icon not uploaded",
                                //                 });
                                //             } else {
                                //                 data.inactive_logo = menuCatPicPath + inactive_icon_name;
                                //                 new MenuCategoryScema(data).save(function (err, result) {

                                //                     if (err) {
                                //                         callback({
                                //                             "success": false,
                                //                             "STATUSCODE": 5005,
                                //                             "message": err,
                                //                             "response": {}
                                //                         });
                                //                     } else {

                                //                         callback({
                                //                             "success": true,
                                //                             "STATUSCODE": 2000,
                                //                             "message": "Added Successfully",
                                //                         })

                                //                     }

                                //                 });

                                //             }
                                //         }
                                //     )

                                // } else {
                                //     callback({
                                //         "success": false,
                                //         "STATUSCODE": 5002,
                                //         "message": "MIME type not allowed please upload jpg or png file",
                                //     });
                                // }

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



        }
    },

    editMenuCat: function (data, fileData, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {


            var timeStamp = Date.now();
            var folderpath = config.uploadMenuCatPicPath;
            let menuCatPicPath = config.MenuCatPicPath;

            async.waterfall([
                    function (nextCb) {
                        MenuCategoryScema.findOne({
                                _id: data._id
                            },
                            function (err, resData) {
                                if (err) {
                                    nextcb(err);
                                } else {
                                    if (resData == null) {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "Menu Category not exis.",
                                            "response_data": {}
                                        });
                                    } else {
                                        data.logo = resData.logo;
                                        data.inactive_logo = resData.inactive_logo;
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
                                                                "message": "Active icon not uploaded",
                                                            });
                                                        } else {
                                                            data.logo = menuCatPicPath + logoName;

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

                            if (fileData != null && fileData.inactive_logo) {
                                var restaurant_banner = fileData.inactive_logo;
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
                                                    "message": "In-Active icon not uploaded",
                                                });
                                            } else {
                                                data.inactive_logo = menuCatPicPath + restaurant_bannerName;
                                                let restaurant_banner_image = `./public/${arg1.response_data.inactive_logo}`;

                                                if (fs.existsSync(restaurant_banner_image)) {
                                                    fs.unlink(restaurant_banner_image, (err) => {
                                                        if (err) throw err;
                                                        console.log('successfully deleted');
                                                    });
                                                }

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

                                nextCb(null, {
                                    "response_code": 2000,
                                    "response_data": {}

                                });
                            }
                        }
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {

                            data.location = {
                                coordinates: [data.long, data.lat],
                                type: 'Point'
                            };
                            var default_icon_id = null;
                            if (data.default_icon_id) {
                                default_icon_id = data.default_icon_id;
                                data.logo = null;
                            }

                            MenuCategoryScema.update({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        cname: data.cname,
                                        tcname: data.tcname,
                                        logo: data.logo,
                                        inactive_logo: data.inactive_logo,
                                        default_icon_id: default_icon_id,
                                        restaurant_id: data.restaurant_id
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
    deleteMenuCat: function (id, callback) {

        if (!id || typeof id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {
            MenuCategoryScema.findOne({
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
                            if (resData.logo != null) {
                                let active_icon = `./public/${resData.logo}`;
                                //let inactive_icon = `./public/${resData.inactive_logo}`;
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
                                            console.log('successfully deleted active_icon');
                                        }

                                    });
                                }
                                // if (fs.existsSync(inactive_icon)) {
                                //     fs.unlink(inactive_icon, (err) => {
                                //         if (err) {
                                //             callback({
                                //                 "success": false,
                                //                 "STATUSCODE": 5002,
                                //                 "message": err,
                                //                 "response": []
                                //             });
                                //         } else {
                                //             console.log('successfully deleted inactive_icon');
                                //         }

                                //     });
                                // }
                            }

                            MenuCategoryScema.remove({
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
                                            "message": "Menu Caregory deleted successfully",
                                            "response": []
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "success": false,
                                "STATUSCODE": 5002,
                                "message": "Menu Caregory not found",
                                "response": []
                            });
                        }
                    }
                }
            )
        }
    },

    menuList: function (data, callback) {
        if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else {
            MenuItemModel.menuItemAll(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    addMenu: function (data, fileData, callback) {
        if (!data.name || typeof data.name === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide name",
                "response": []
            });
        } else if (!data.restaurant_id || typeof data.restaurant_id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select restaurant",
                "response": []
            });
        } else if (!data.menu_catagory_id || typeof data.menu_catagory_id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select menu category",
                "response": []
            });
        } else if (!data.price || typeof data.price === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide price",
                "response": []
            });
        } else if (!data.regular_time || typeof data.regular_time === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide regular time",
                "response": []
            });
        } else if (!data.busy_time || typeof data.busy_time === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select busy time",
                "response": []
            });
        } else if (!data.total_quantity || typeof data.total_quantity === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select total quantity",
                "response": []
            });
        } else {

            data._id = new ObjectID;

            if (fileData != null && fileData.logo) {

                var logoFile = fileData.logo;
                var timeStamp = Date.now();
                var logoName = timeStamp + logoFile.name;
                var folderpath = config.uploadMenuItemPicPath;
                let menuItemPicPath = config.MenuItemPath;
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
                                MenuItemModel.addMenu(data, function (result) {
                                    callback({
                                        "success": result.response_code == 2000 ? true : false,
                                        "STATUSCODE": result.response_code,
                                        "message": result.response_message,
                                        "response": result.response_data
                                    })
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
                data.menu_logo = null;
                MenuItemModel.addMenu(data, function (result) {
                    callback({
                        "success": result.response_code == 2000 ? true : false,
                        "STATUSCODE": result.response_code,
                        "message": result.response_message,
                        "response": result.response_data
                    })
                });
            }

        }
    },
    editMenu: function (data, fileData, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {
            MenuItemModel.updateMenu(data, fileData, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },
    updateMenuStock: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else if (!data.stock || typeof data.stock === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide stock status",
                "response": []
            });
        } else {
            MenuItemModel.updateMenuStock(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    },

};
module.exports = MenuService;