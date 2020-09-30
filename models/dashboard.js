var async = require("async");
var UserSchema = require('../schema/users');
var restaurantScema = require('../schema/restaurant');
var OrganizationSchema = require('../schema/organization');
var orderSchema = require('../schema/order');
var MenuCategoryScema = require('../models/menuCategory');
var MenuItemSchema = require('../schema/menu_items');
var dashboardModels = {

    dashBoard: async function (data, callback) {

        var d = new Date(),
            year = d.getFullYear(),
            month = d.getMonth();

        let user = await UserSchema.find({

        }, function (err, user) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        let restaurant = await restaurantScema.find({

        }, function (err, restaurant) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        let organization = await OrganizationSchema.find({

        }, function (err, restaurant) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })



        // let order = await orderSchema.find({
        //     $where: function () {
        //         return (new Date(this.createdAt).getFullYear() == new Date().getFullYear())
        //     },

        // }, function (err, restaurant) {
        //     if (err) {
        //         callback({
        //             "response_code": 5005,
        //             "response_message": err,
        //             "response_data": {}
        //         });

        //     }
        // })

        await orderSchema.aggregate({
                $project: {
                    _id: 1,
                    "year": {
                        "$year": "$createdAt"
                    },
                    "month": {
                        "$month": "$createdAt"
                    },
                    description: 1
                }
            }, {
                $match: {
                    year: year,
                    month: month + 1,

                }
            }, {
                $sort: {
                    title: 1
                }
            },
            function (err, order) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {


                    var obj = {
                        totalUser: user.length,
                        totalRestaurant: restaurant.length,
                        totalOrganization: organization.length,
                        totalCurrentMonthOrder: order.length
                    }

                    callback({
                        "response_code": 2000,
                        "response_message": "Admin Analytics",
                        "response_data": obj
                    });
                }
            });



        //console.log(user);

    },
    partnerDashBoard: async function (data, callback) {

        var d = new Date(),
            year = d.getFullYear(),
            month = d.getMonth();

        let restaurant = await restaurantScema.find({
            restaurant_manager_id: data.restaurant_manager_id
        }, function (err, restaurant) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        let MenuCategory = await MenuCategoryScema.find({
            user_id: data.restaurant_manager_id
        }, function (err, restaurant) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })
        var restaurant_ids = [];
        async.forEach(restaurant, function (item, callback) {

            restaurant_ids.push(item._id);

            callback()
        })
        console.log("restaurant_ids", restaurant_ids);

        let MenuItem = await MenuItemSchema.find({
            restaurant_id: {
                '$in': restaurant_ids
            }
        }, function (err, restaurant) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        await orderSchema.aggregate({
                $project: {
                    _id: 1,
                    restaurant_id: 1,
                    orderStatus: 1,
                    "year": {
                        "$year": "$createdAt"
                    },
                    "month": {
                        "$month": "$createdAt"
                    },
                }
            }, {
                $match: {
                    year: year,
                    month: month + 1,
                    restaurant_id: {
                        '$in': restaurant_ids
                    }

                }
            }, {
                $sort: {
                    title: 1
                }
            },
            function (err, order) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    let delivered_orders = 0;
                    let cancel_orders = 0;

                    async.forEach(order, function (item, callback) {

                        if (item.orderStatus == 'Delivered') {
                            delivered_orders++;
                        } else if (item.orderStatus == 'Cancel') {
                            cancel_orders++;
                        }

                        callback()
                    })

                    var obj = {
                        totalMenuItem: MenuItem.length,
                        totalRestaurant: restaurant.length,
                        totalMenuCategory: MenuCategory.length,
                        totalCurrentMonthOrder: order.length,
                        totalCMDeliveredOrder: delivered_orders,
                        totalCMCancelOrder: cancel_orders
                    }

                    callback({
                        "response_code": 2000,
                        "response_message": "Partner Analytics",
                        "response_data": obj
                    });
                }
            });




    }

}
module.exports = dashboardModels;