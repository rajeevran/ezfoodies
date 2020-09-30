var mongoose = require("mongoose");
var addToCartSchema = require('../schema/temporaryCarts');
var MenuItemSchema = require('../schema/menu_items');
var restaurantScema = require('../schema/restaurant');
var restaurantMngrScema = require('../models/restaurantManager');
var orderSchema = require('../schema/order');
var RewardSchema = require('../schema/rewards');
var UserSchema = require('../schema/users');
var async = require("async");
var config = require('../config');
var mailProperty = require('../modules/sendMail');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var orderid = require('order-id')('mysecret')
var NotificationSchema = require('../schema/notifications');
var NotificationModels = require('../models/notification');
var pushNotification = require('../modules/pushNotification');
var rewardsFacilitySchema = require('../schema/rewards');
var UserSettingSchema = require('../schema/userSetting');
var temporaryCloverSchema = require('../schema/temporaryClover');
var temporaryCartPromoClover = require('../schema/temporaryCartPromoClover');

var orderModels = {
    addToCart: function (data, callback) {
        if (data) {
            data.discard_item = data.discard_item != undefined ? data.discard_item : false;
            var productName = null;
            var productPrice = null;
            var addon_items_array = [];
            async.waterfall([
                    function (nextCb) {
                        // Checking if restaurant is closed
                        restaurantScema.findOne({
                            _id: data.restaurant_id

                        }, function (err, restaurant) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": err,
                                    "response_data": {}
                                });

                            } else {
                                if (restaurant.status == 'Hidden') {
                                    callback({
                                        "response_code": 2009,
                                        "response_message": "Reataurant is closed. Please try others restaurant.",
                                        "response_data": {}
                                    });
                                } else {
                                    // Checking if Menu item out-stock 
                                    MenuItemSchema.findOne({
                                            _id: data.productId
                                        }, {
                                            name: 1,
                                            stock: 1,
                                            price: 1,
                                            total_quantity: 1,
                                            customize_items: 1
                                        },
                                        function (err, menuItemDetails) {
                                            if (err) {
                                                nextCb(null, err);
                                            } else {
                                                if (menuItemDetails.stock == "In-stock") {
                                                    var productQty = menuItemDetails.total_quantity;
                                                    productName = menuItemDetails.name;
                                                    productPrice = menuItemDetails.price;
                                                    if (parseInt(productQty) >= parseInt(data.qty)) {
                                                        // First checking different restaurent product already in cart item or not
                                                        if (data.discard_item == false) {
                                                            addToCartSchema.findOne({
                                                                    userId: data.userId
                                                                }, {
                                                                    restaurant_id: 1
                                                                },
                                                                function (err, allData) {
                                                                    if (err) {
                                                                        callback({
                                                                            "response_code": 5005,
                                                                            "response_message": "INTERNAL DB ERROR",
                                                                            "response_data": {}
                                                                        });
                                                                    } else {
                                                                        if (allData != null) {

                                                                            if (allData.restaurant_id == data.restaurant_id) {
                                                                                nextCb(null, {
                                                                                    "response_code": 2000,
                                                                                    "response_data": menuItemDetails
                                                                                });
                                                                            } else {

                                                                                callback({
                                                                                    "response_code": 2008,
                                                                                    "response_message": "Your cart contains dishes from other restaurant. Do you want to discard the selection and add dishes from current restaurant?",
                                                                                });
                                                                            }
                                                                        } else {

                                                                            nextCb(null, {
                                                                                "response_code": 2000,
                                                                                "response_data": menuItemDetails
                                                                            });
                                                                        }
                                                                    }
                                                                });
                                                        } else {
                                                            nextCb(null, {
                                                                "response_code": 2000,
                                                                "response_data": {}
                                                            });
                                                        }
                                                    } else {
                                                        callback({
                                                            "response_code": 5001,
                                                            "response_message": productQty == 1 ? "Only " + productQty + " dish available" : "Only " + productQty + " dishes available",
                                                            "response_data": {}
                                                        });
                                                    }
                                                } else {
                                                    callback({
                                                        "response_code": 5002,
                                                        "response_message": "Stock is not available",
                                                        "response_data": {}
                                                    });
                                                }
                                            }
                                        });
                                }
                            }
                        });

                    },
                    function (response, nextCb) {
                        if (response.response_code == 2000) {
                            // Second delete other restaurent product
                            if (data.discard_item == true) {
                                addToCartSchema.remove({
                                        userId: data.userId
                                    },
                                    function (err, result) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": "INTERNAL DB ERROR",
                                                "response_data": {}
                                            });
                                        } else {
                                            if (result == null) {
                                                callback({
                                                    "response_code": 5002,
                                                    "response_message": "No record found",
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
                            } else {
                                nextCb(null, {
                                    "response_code": 2000,
                                    "response_data": response.response_data
                                });
                            }
                        }
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {
                            var query = {
                                userId: data.userId,
                                productId: data.productId,
                                addon: data.addon
                            };
                            if (data.addon_items != null || data.addon_items != undefined) {
                                query["addon_items"] = data.addon_items


                                async.forEach(data.addon_items, function (addon_item, callback) {

                                    async.forEach(arg1.response_data.customize_items, function (customize_item, callback) {

                                        if (addon_item == customize_item._id) {
                                            addon_items_array.push({
                                                _id: customize_item._id,
                                                name: customize_item.name,
                                                price: customize_item.price
                                            });

                                            //addon_total.push(customize_item.price != null ? customize_item.price : 0);
                                        }
                                        callback();
                                    });
                                    callback();

                                });
                            }


                            addToCartSchema.findOne(query, {
                                    qty: 1
                                },
                                function (err, cartRes) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        if (cartRes == null) {
                                            data._id = new ObjectID;
                                        } else {
                                            data._id = cartRes._id;
                                            data.qty = parseInt(cartRes.qty) + parseInt(data.qty);

                                        }



                                        addToCartSchema.update({
                                                _id: data._id
                                            }, {
                                                $set: {
                                                    userId: data.userId,
                                                    productId: data.productId,
                                                    productName: productName,
                                                    qty: data.qty,
                                                    price: productPrice,
                                                    addon: data.addon,
                                                    addon_items_details: addon_items_array,
                                                    restaurant_id: data.restaurant_id,
                                                    addon_items: data.addon_items
                                                }
                                            }, {
                                                upsert: true
                                            },
                                            function (err, result) {
                                                if (err) {
                                                    nextCb(null, err)
                                                } else {

                                                    nextCb(null, {
                                                        "response_code": 2000,
                                                        "response_data": {}
                                                    });

                                                }
                                            }
                                        )
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
                            "response_message": "Product added successfully.",
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
    cartList: async function (data, callback) {
        if (data) {

            addToCartSchema.aggregate({
                    $match: {
                        userId: data.userId
                    }
                }, {
                    $lookup: {
                        from: 'restaurantmenus',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'Product'
                    }

                }, {
                    $lookup: {
                        from: 'restaurants',
                        localField: 'restaurant_id',
                        foreignField: '_id',
                        as: 'Restaurant'
                    }
                }, {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'User'
                    }
                }, {
                    $project: {
                        _id: 1,
                        productId: 1,
                        qty: 1,
                        addon: 1,
                        addon_items: 1,
                        restaurant_id: 1,
                        'Product.name': 1,
                        'Product.price': 1,
                        'Product.stock': 1,
                        'Product.menu_logo': 1,
                        'Product.total_quantity': 1,
                        'Product.customize_items': 1,
                        'Product.regular_time': 1,
                        'Restaurant._id': 1,
                        'Restaurant.name': 1,
                        'Restaurant.restaurant_logo': 1,
                        'Restaurant.status': 1,
                        'Restaurant.busy_mode': 1,
                        'Restaurant.rewardId': 1,
                        'User._id': 1,
                        'User.name': 1,
                        'User.email': 1,
                        'User.phone_no': 1,
                        'User.rewardPoint': 1,
                        'User.redeemReward': 1
                        // "Restaurant": { $not: { $ne: [] }
                        // result: { $not: { $eq : ["Restaurant" , " "] } }
                    }
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {

                        var list = [];
                        var total = [];
                        var approx_time = [0];
                        var itemTotal = '';
                        var restaurant_details = [];
                        var clover_details = [];
                        var user_details = [];
                        //var totalPoint = 0;
                        //var totalQuantoty = 0;
                        var c = 0;
                        if (result.length > 0) {
                            async.forEach(result, function (item, callBack) {
                                var addon_items_array = [];
                                var addon_total = [0];
                                if (item.Product[0].stock == "In-stock") {
                                    var stock = 'yes';
                                    if (parseInt(item.Product[0].total_quantity) >= parseInt(item.qty)) {
                                        var quantity = 'yes';
                                        approx_time.push(item.Product[0].regular_time * parseInt(item.qty));
                                        if (item.addon === true) {

                                            async.forEach(item.addon_items, function (addon_item, callback) {

                                                async.forEach(item.Product[0].customize_items, function (customize_item, callback) {

                                                    if (addon_item == customize_item._id) {
                                                        addon_items_array.push({
                                                            _id: customize_item._id,
                                                            name: customize_item.name,
                                                            price: customize_item.price
                                                        });

                                                        addon_total.push(customize_item.price != null ? customize_item.price : 0);
                                                    }
                                                    callback();
                                                });
                                                callback();

                                            });

                                            itemTotal = parseInt(item.Product[0].price) * parseInt(item.qty) + addon_total.reduce((sum, elem) => sum + elem);
                                            //Total with addon
                                            total.push(parseInt(item.Product[0].price) * parseInt(item.qty) + addon_total.reduce((sum, elem) => sum + elem));

                                        } else {
                                            itemTotal = parseInt(item.Product[0].price) * parseInt(item.qty);
                                            // Total with out addon
                                            total.push(parseInt(item.Product[0].price) * parseInt(item.qty));
                                        }
                                    } else {
                                        var quantity = item.Product[0].total_quantity == 1 ? "Only " + item.Product[0].total_quantity + " dish available" : "Only " + item.Product[0].total_quantity + " dishes available";
                                    }
                                } else {
                                    var stock = 'no';
                                }



                                restaurant_details = [{
                                    _id: item.Restaurant.length > 0 ? item.Restaurant[0]._id : null,
                                    name: item.Restaurant.length > 0 ? item.Restaurant[0].name : null,
                                    restaurant_logo: item.Restaurant.length > 0 ? config.liveUrl + item.Restaurant[0].restaurant_logo : null,
                                    status: item.Restaurant.length > 0 ? item.Restaurant[0].status : null,
                                    busy_mode: item.Restaurant.length > 0 ? item.Restaurant[0].busy_mode : null
                                }];

                                user_details = [{
                                    name: item.User.length > 0 ? item.User[0].name : null,
                                    email: item.User.length > 0 ? item.User[0].email : null,
                                    country_code: item.User.length > 0 ? item.User[0].country_code : null,
                                    phone_no: item.User.length > 0 ? item.User[0].phone_no : null

                                }];

                                list[c] = {
                                    cartId: item._id,
                                    productId: item.productId,
                                    cartProductQty: item.qty,
                                    addon: item.addon,
                                    addon_items_array: addon_items_array,
                                    itemTotal: itemTotal,
                                    restaurant_id: item.restaurant_id,
                                    // totalPoint: item.totalPoint,
                                    productName: item.Product.length > 0 ? item.Product[0].name : null,
                                    productPrice: item.Product.length > 0 ? item.Product[0].price : null,
                                    productImage: item.Product.length > 0 ? config.liveUrl + item.Product[0].menu_logo : null,
                                    stockAvl: stock,
                                    quantityAvl: quantity


                                }
                                //totalPoint = parseInt(totalPoint + item.totalPoint);
                                //totalQuantoty = parseInt(totalQuantoty + item.qty);
                                c++;
                                callBack();
                            }, async function (err, content) {


                                //console.log('----result User---------',result[0].User)
                                //console.log('----result Restaurant---',result[0].Restaurant)
                                let userRewardPoint = 0
                                let userRedeemReward = 0
                                let restaurantRewardId = ''
                                let restaurantBasedRewardPoint = 0
                                let defaultClover = ''
                                let resTaurantBasedClover = ''
                                let defaultCloverPoint = ''
                                let resTaurantBasedCloverPoint = ''
                                let userId = ''
                                console.log('------result[0].User.length-----', result[0].User.length)
                                if (result[0].User.length > 0) {
                                    userId = result[0].User[0]._id
                                    console.log('--------cart userId-------', userId)
                                    await temporaryCartPromoClover.remove({
                                        userId: userId
                                    })

                                    await temporaryCloverSchema.remove({
                                        userId: userId
                                    });

                                    userRewardPoint = result[0].User[0].rewardPoint !== undefined ? result[0].User[0].rewardPoint : 0
                                    userRedeemReward = result[0].User[0].redeemReward !== undefined ? result[0].User[0].redeemReward : 0
                                    userRewardPoint = parseInt(userRewardPoint) - parseInt(userRedeemReward)

                                    let totalAmount = total.reduce(function (acc, val) {
                                        return acc + val;
                                    }, 0)

                                    defaultClover = await defaultUserClover(result[0].User[0]._id, totalAmount)
                                    console.log('----defaultClover---', defaultClover)

                                    //rewardsFacilityname:'',
                                    // rewardsFacilityType:''

                                    if (result[0].Restaurant.length > 0) {
                                        restaurantRewardId = result[0].Restaurant[0].rewardId !== undefined ? result[0].Restaurant[0].rewardId : null
                                        resTaurantBasedClover = await RestaurantBasedClover(result[0].User[0]._id, result[0].Restaurant[0]._id, restaurantRewardId)
                                        console.log('----resTaurantBasedClover---', resTaurantBasedClover)


                                        // 3 .  maximum clover = 3000
                                        let rewardsFacilityType = resTaurantBasedClover[0].response_data.rewardsFacilityType
                                        console.log('----rewardsFacilityType----', rewardsFacilityType)

                                        if (rewardsFacilityType == 'flat') {
                                            resTaurantBasedCloverPoint = resTaurantBasedClover[0].response_data.additionalUserCLover
                                            defaultCloverPoint = defaultClover[0].response_data.earnClover

                                            restaurantBasedRewardPoint = parseInt(defaultCloverPoint) + parseInt(resTaurantBasedCloverPoint)

                                        } else if (rewardsFacilityType == 'order') {
                                            // 2 .  clover = timesOfClover * (clover from 2nd order placed from this restaurant)
                                            let isSuccess = resTaurantBasedClover[0].response_data.isSuccess
                                            let timesOfClover = resTaurantBasedClover[0].response_data.timesOfClover
                                            let noOfDays = resTaurantBasedClover[0].response_data.noOfDays
                                            let orderProvided = resTaurantBasedClover[0].response_data.orderProvided
                                            let orderDependsOn = resTaurantBasedClover[0].response_data.orderDependsOn
                                            let timeLimitation = resTaurantBasedClover[0].response_data.timeLimitation
                                            let notificationDateOn = resTaurantBasedClover[0].response_data.notificationDateOn
                                            let maxCloverPoint = resTaurantBasedClover[0].response_data.maxCloverPoint
                                            console.log('----isSuccess----', isSuccess)

                                            if (isSuccess === true) {

                                                console.log('----timesOfClover----', timesOfClover)
                                                defaultCloverPoint = defaultClover[0].response_data.earnClover
                                                resTaurantBasedCloverPoint = parseInt(timesOfClover) * parseInt(defaultCloverPoint)
                                                restaurantBasedRewardPoint = parseInt(defaultCloverPoint) + parseInt(resTaurantBasedCloverPoint)
                                                console.log('----restaurantBasedRewardPoint----', restaurantBasedRewardPoint)

                                                if (restaurantBasedRewardPoint > maxCloverPoint) {
                                                    restaurantBasedRewardPoint = parseInt(defaultCloverPoint)
                                                }

                                            } else {
                                                restaurantBasedRewardPoint = parseInt(defaultCloverPoint)

                                            }
                                        } else if (rewardsFacilityType == 'redeem') {
                                            //resTaurantBasedCloverPoint = resTaurantBasedClover[0].response_data.clover
                                            defaultCloverPoint = defaultClover[0].response_data.earnClover

                                            restaurantBasedRewardPoint = parseInt(defaultCloverPoint)

                                        }

                                    }

                                }


                                clover_details = [{
                                    restaurantBasedRewardPoint: restaurantBasedRewardPoint,
                                    userRewardPoint: userRewardPoint,
                                    defaultClover: defaultClover[0].response_data,
                                    resTaurantBasedClover: resTaurantBasedClover[0].response_data

                                }];

                                let cartResponse = {
                                    "response_code": 2000,
                                    "response_message": "Cart list",
                                    "response_data": {
                                        list: list,
                                        cartTotal: total.reduce(function (acc, val) {
                                            return acc + val;
                                        }, 0),
                                        restaurant_details: restaurant_details,
                                        clover_details: clover_details,
                                        user_details: user_details,
                                        approx_time: approx_time.reduce((sum, elem) => sum + elem)
                                    }
                                }


                                var rewardsclover = {};
                                rewardsclover._id = new ObjectID;
                                rewardsclover.cartDetails = cartResponse;
                                rewardsclover.userId = userId;
                                console.log('rewardsclover--', rewardsclover)
                                await temporaryCartPromoClover.create(rewardsclover)

                                callback(cartResponse);
                            });
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Cart is empty",
                                "response_data": {}
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
    cartQuatityUpdate: function (data, callback) {
        if (data) {

            async.waterfall([
                    function (nextCb) {
                        addToCartSchema.findOne({
                                userId: data.userId,
                                _id: data.cartId
                            }, {
                                _id: 1,
                                restaurant_id: 1,
                                addon: 1,
                                addon_items: 1,
                                productId: 1,
                                qty: 1
                            },
                            function (err, res) {
                                if (err) {
                                    nextCb(null, err);
                                } else {

                                    // Checking if restaurant is closed
                                    restaurantScema.findOne({
                                        _id: res.restaurant_id

                                    }, function (err, restaurant) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": err,
                                                "response_data": {}
                                            });

                                        } else {
                                            if (restaurant.status == 'Hidden') {
                                                callback({
                                                    "response_code": 2009,
                                                    "response_message": "Reataurant is closed. Please try others restaurant.",
                                                    "response_data": {}
                                                });
                                            } else {
                                                MenuItemSchema.findOne({
                                                        _id: res.productId,
                                                        stock: "In-stock"
                                                    }, {
                                                        stock: 1,
                                                        total_quantity: 1

                                                    },
                                                    function (err, productDetails) {
                                                        if (err) {
                                                            callback({
                                                                "response_code": 5005,
                                                                "response_message": "INTERNAL DB ERROR",
                                                                "response_data": {}
                                                            });
                                                        } else {
                                                            if (productDetails != null) {
                                                                var productQty = productDetails.total_quantity;
                                                                var updateQty = parseInt(data.qty);
                                                                if (parseInt(productQty) >= parseInt(updateQty)) {


                                                                    nextCb(null, {
                                                                        "response_code": 2000,
                                                                        "response_data": productDetails
                                                                    });


                                                                } else {
                                                                    callback({
                                                                        "response_code": 5001,
                                                                        "response_message": productQty == 1 ? "Only " + productQty + " dish available" : "Only " + productQty + " dishes available",
                                                                        "response_data": {}
                                                                    });
                                                                }


                                                            } else {

                                                                callback({
                                                                    "response_code": 5002,
                                                                    "response_message": "Stock is not available",
                                                                    "response_data": {}
                                                                });
                                                            }
                                                        }
                                                    });
                                            }
                                        }
                                    });


                                }
                            });
                    },
                    function (arg1, nextCb) {
                        if (arg1.response_code == 2000) {


                            addToCartSchema.update({
                                    _id: data.cartId
                                }, {
                                    $set: {
                                        qty: data.qty
                                    }
                                },
                                function (err, result) {
                                    if (err) {
                                        nextCb(null, {
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": err
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
                            "response_data": err
                        });
                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Product quantity updated successfully.",
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

    beforeCheckOut: async function (data, callback) {
        if (data) {

            var restaurant_status = [];
            let cart_items = await addToCartSchema.find({
                userId: data.userId
            }).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            if (cart_items.length > 0) {
                for (let index = 0; index < cart_items.length; index++) {

                    let restaurant_id = cart_items[index].restaurant_id;
                    let productId = cart_items[index].productId;

                    let restaurant_item = await restaurantScema.findOne({
                        _id: restaurant_id
                    }, function (err, restaurant) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": err,
                                "response_data": {}
                            });

                        } else {
                            if (restaurant == null) {

                                restaurant_status.push({
                                    "success": false,
                                    "response_code": 2009,
                                    "response_message": "Reataurant is closed. Please try others restaurant.",
                                    "response_data": {}
                                });


                            } else if (restaurant.status == 'Hidden') {

                                restaurant_status.push({
                                    "success": false,
                                    "response_code": 2009,
                                    "response_message": "Reataurant is closed. Please try others restaurant.",
                                    "response_data": {}
                                });


                            }
                        }
                    })

                    let menu_item = await MenuItemSchema.findOne({
                            _id: productId,
                            stock: "In-stock"
                        }, {
                            name: 1,
                            stock: 1,
                            total_quantity: 1
                        },
                        function (err, productDetails) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": err,
                                    "response_data": {}
                                });
                            } else {

                                if (productDetails != null) {
                                    var productQty = productDetails.total_quantity;
                                    var itemQty = parseInt(cart_items[index].qty);
                                    if (parseInt(itemQty) > parseInt(productQty)) {

                                        restaurant_status.push({
                                            "success": false,
                                            "response_code": 5001,
                                            "response_message": productQty == 1 ? "Only " + productQty + " dish available of " + productDetails.name : "Only " + productQty + " dishes available of " + productDetails.name,
                                            "response_data": {}
                                        });



                                    } else {

                                        restaurant_status.push({
                                            "success": true,
                                            "response_code": 2000,
                                            "response_message": "Checkout successfully procceed",
                                            "response_data": {}
                                        });

                                    }

                                } else {

                                    restaurant_status.push({
                                        "success": false,
                                        "response_code": 5002,
                                        "response_message": "stock is not available",
                                        "response_data": {}
                                    });
                                }
                            }
                        });
                }
            }

            async.forEach(restaurant_status, function (item, callBack) {

                if (item.success == false) {

                    return callback({
                        "response_code": item.response_code,
                        "response_message": item.response_message,
                        "response_data": item.response_data
                    });
                }
                if (item.success == true) {

                    return callback({
                        "response_code": item.response_code,
                        "response_message": item.response_message,
                        "response_data": item.response_data
                    });
                }

                //callBack();
            })



            // var return_obj = [];

            // addToCartSchema.find({
            //         userId: data.userId,
            //     }).exec(function (err, res) {
            //             if (err) {
            //                 callback({
            //                     "response_code": 5005,
            //                     "response_message": err,
            //                     "response_data": {}
            //                 });
            //             } else {
            //                 var a = [];
            //                 // Checking if restaurant is closed

            //                 async.forEach(res, function (item, callBack) {

            //                             console.log("restaurant", item.restaurant_id);
            //                             restaurantScema.findOne({
            //                                 _id: item.restaurant_id

            //                             }, function (err, restaurant) {
            //                                 if (err) {
            //                                     return_obj = {
            //                                         "response_code": 5005,
            //                                         "response_message": err,
            //                                         "response_data": {}
            //                                     };

            //                                 } else {

            //                                     if (restaurant.status == 'Hidden') {
            //                                         console.log("restaurant.status", restaurant.status);
            //                                         a.push({
            //                                             "response_code": 2009,
            //                                             "response_message": "Reataurant is closed. Please try others restaurant.",
            //                                             "response_data": {}
            //                                         });
            //                                         return_obj = {
            //                                             "response_code": 2009,
            //                                             "response_message": "Reataurant is closed. Please try others restaurant.",
            //                                             "response_data": {}
            //                                         };
            //                                         console.log("a", a);
            //                                     } else {
            //                                         MenuItemSchema.findOne({
            //                                                 _id: item.productId,
            //                                                 stock: "In-stock"
            //                                             }, {
            //                                                 name: 1,
            //                                                 stock: 1,
            //                                                 total_quantity: 1
            //                                             },
            //                                             function (err, productDetails) {
            //                                                 if (err) {
            //                                                     return_obj = {
            //                                                         "response_code": 5005,
            //                                                         "response_message": "INTERNAL DB ERROR",
            //                                                         "response_data": {}
            //                                                     };
            //                                                 } else {
            //                                                     if (productDetails != null) {
            //                                                         var productQty = productDetails.total_quantity;
            //                                                         var itemQty = parseInt(item.qty);
            //                                                         if (parseInt(itemQty) > parseInt(productQty)) {

            //                                                             return_obj = {
            //                                                                 "response_code": 5001,
            //                                                                 "response_message": productQty == 1 ? "Only " + productQty + " dish available of " + productDetails.name : "Only " + productQty + " dishes available of " + productDetails.name,
            //                                                                 "response_data": {}
            //                                                             };

            //                                                         }

            //                                                     } else {

            //                                                         return_obj = {
            //                                                             "response_code": 5002,
            //                                                             "response_message": productDetails.name + " stock is not available",
            //                                                             "response_data": {}
            //                                                         };
            //                                                     }
            //                                                 }
            //                                             });
            //                                     }
            //                                 }
            //                             });

            //             callBack();
            //         }, function (err, content) {
            //             if (err) {
            //                 callback({
            //                     "response_code": 5005,
            //                     "response_message": "INTERNAL DB ERROR",
            //                     "response_data": {}
            //                 });
            //             } else {
            //                 console.log("return_obj", a);
            //                 if (return_obj != null) {
            //                     callback({
            //                         "response_code": return_obj.response_code,
            //                         "response_message": return_obj.response_message,
            //                         "response_data": return_obj.response_data
            //                     });
            //                 } else {
            //                     callback({
            //                         "response_code": 2000,
            //                         "response_message": "Checkout successfully procceed",
            //                         "response_data": {}
            //                     });
            //                 }

            //             }
            //         });



            //     }
            // });

            // async.waterfall([
            //         function (nextCb) {

            //             addToCartSchema.find({
            //                 userId: data.userId,
            //             }).exec(function (err, res) {
            //                 if (err) {
            //                     nextCb(null, err);
            //                 } else {

            //                     // Checking if restaurant is closed

            //                     async.forEach(res, function (item, callBack) {
            //                         console.log("restaurant", item.restaurant_id);
            //                         restaurantScema.findOne({
            //                             _id: item.restaurant_id

            //                         }, function (err, restaurant) {
            //                             if (err) {
            //                                 nextCb(null, {
            //                                     "response_code": 5005,
            //                                     "response_message": err,
            //                                     "response_data": {}
            //                                 });

            //                             } else {
            //                                 console.log("restaurant.status", restaurant.status);
            //                                 if (restaurant.status == 'Hidden') {
            //                                     console.log("restaurant.status", restaurant.status);
            //                                     nextCb(null, {
            //                                         "response_code": 2009,
            //                                         "response_message": "Reataurant is closed. Please try others restaurant.",
            //                                         "response_data": {}
            //                                     });
            //                                 } else {
            //                                     MenuItemSchema.findOne({
            //                                             _id: item.productId,
            //                                             stock: "In-stock"
            //                                         }, {
            //                                             name: 1,
            //                                             stock: 1,
            //                                             total_quantity: 1

            //                                         },
            //                                         function (err, productDetails) {
            //                                             if (err) {
            //                                                 nextCb(null, {
            //                                                     "response_code": 5005,
            //                                                     "response_message": "INTERNAL DB ERROR",
            //                                                     "response_data": {}
            //                                                 });
            //                                             } else {
            //                                                 if (productDetails != null) {
            //                                                     var productQty = productDetails.total_quantity;
            //                                                     var itemQty = parseInt(item.qty);
            //                                                     if (parseInt(itemQty) > parseInt(productQty)) {


            //                                                         nextCb(null, {
            //                                                             "response_code": 5001,
            //                                                             "response_message": productQty == 1 ? "Only " + productQty + " dish available of " + productDetails.name : "Only " + productQty + " dishes available of " + productDetails.name,
            //                                                             "response_data": {}
            //                                                         });

            //                                                     }


            //                                                 } else {

            //                                                     nextCb(null, {
            //                                                         "response_code": 5002,
            //                                                         "response_message": productDetails.name + " stock is not available",
            //                                                         "response_data": {}
            //                                                     });
            //                                                 }
            //                                             }
            //                                         });
            //                                 }
            //                             }
            //                         });

            //                         callBack();
            //                     }, function (err, content) {
            //                         if (err) {
            //                             nextCb(null, err);
            //                         } else {
            //                             nextCb(null, {
            //                                 "response_code": 2000,
            //                                 "response_data": {}
            //                             });
            //                         }
            //                     });

            //                 }
            //             });
            //         },

            //     ],
            //     function (err, result) {
            //         if (err) {
            //             callback({
            //                 "response_code": 5005,
            //                 "response_message": "INTERNAL DB ERROR",
            //                 "response_data": err
            //             });
            //         } else {
            //             callback({
            //                 "response_code": 2000,
            //                 "response_message": "Checkout successfully procceed",
            //                 "response_data": {}
            //             });
            //         }
            //     });
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },

    checkOut: async function (data, callback) {

        if (data) {
            console.log("checkoutData", data);

            let restaurant = await restaurantScema.findOne({
                _id: data.restaurant_id

            }, function (err, restaurant) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            if (restaurant.status == 'Hidden') {
                callback({
                    "response_code": 2009,
                    "response_message": "Reataurant is closed. Please try others restaurant.",
                    "response_data": {}
                });
            }


            let carts = await addToCartSchema.find({
                userId: data.userId
            }).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            data.orderDetails = carts;



            let restaurantMngr = await restaurantMngrScema.findOne({
                _id: restaurant.restaurant_manager_id
            }, function (err, restaurantMngr) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })


            let user = await UserSchema.findOne({
                _id: data.userId
            }, function (err, user) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })
            let orderDetails = '';
            if (data.parentOrderId) {

                orderDetails = await orderSchema.findOne({
                    _id: data.parentOrderId

                }, function (err, order) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });

                    } else {
                        var team = order.teamOrderUserList;
                        team.push(order.userId);
                        const index = team.indexOf(data.userId);
                        if (index > -1) {
                            team.splice(index, 1);
                        }
                        data.teamOrderUserList = team;
                        data.orderType = 'JOIN-TEAM-ORDER';
                    }
                })
            }



            new orderSchema(data).save(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                } else {

                    addToCartSchema.remove({
                        userId: data.userId
                    }, function (err, addToCartSchema) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": err,
                                "response_data": {}
                            });

                        }
                    })

                    if (data.parentOrderId) {

                        orderDetails.childOrderIds.push(data._id)

                        orderSchema.update({
                                _id: data.parentOrderId
                            }, {
                                $set: {
                                    childOrderIds: orderDetails.childOrderIds
                                }
                            },
                            function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                }
                            }
                        )
                    }

                    // Email the restaurant manager about order
                    mailProperty('restautantOrderRecivedMail')(restaurantMngr.email, {
                        name: restaurantMngr.name,
                        restaurant_name: restaurant.name,
                        customer_name: user.name,
                        site_url: config.liveUrl,
                    }).send();

                    callback({
                        "response_code": 2000,
                        "response_message": "Submitted successfully.",
                        "response_data": {}
                    });

                }
            })

            // let createPayment = await orderSchema.create({
            //     data
            // }, function (err, restaurantMngr) {
            //     if (err) {
            //         callback({
            //             "response_code": 5005,
            //             "response_message": err,
            //             "response_data": {}
            //         });

            //     }
            // })

            // if (createPayment) {

            //     let emptyCart = await addToCartSchema.remove({
            //         userId: data.userId
            //     }, function (err, restaurantMngr) {
            //         if (err) {
            //             callback({
            //                 "response_code": 5005,
            //                 "response_message": err,
            //                 "response_data": {}
            //             });

            //         }
            //     })

            //     // Email the restaurant manager about order

            //     mailProperty('restautantOrderRecivedMail')(restaurantMngr.email, {
            //         name: restaurantMngr.name,
            //         restaurant_name: restaurant.name,
            //         customer_name: user.name,
            //         site_url: config.liveUrl,
            //     }).send();

            //     callback({
            //         "response_code": 2000,
            //         "response_message": "Submitted successfully.",
            //         "response_data": {}
            //     });
            // } else {
            //     callback({
            //         "response_code": 5005,
            //         "response_message": "INTERNAL DB ERROR",
            //         "response_data": {}
            //     });
            // }



        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }

    },
    currentOrderList: function (data, callback) {
        if (data) {
            orderSchema.aggregate({
                    $match: {
                        userId: data.userId
                    }
                }, {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'User'
                    }
                }, {
                    $lookup: {
                        from: 'restaurantmenus',
                        localField: 'orderDetails.productId',
                        foreignField: '_id',
                        as: 'restaurant_menus'
                    }
                }, {
                    $lookup: {
                        from: 'restaurants',
                        localField: 'restaurant_id',
                        foreignField: '_id',
                        as: 'restaurants'
                    }
                }, {
                    "$addFields": {
                        menu_image: "$restaurant_menus.menu_logo"
                    }
                }, {
                    $limit: 2
                }, {
                    $sort: {
                        "createdAt": -1
                    }
                }, {
                    $project: {
                        _id: 1,
                        createdAt: 1,
                        orderId: 1,
                        // paymentId: 1,
                        userId: 1,
                        orderDetails: 1,
                        transactionAmount: 1,
                        transactionFees: 1,
                        message: 1,
                        paymentMode: 1,
                        paymentStatus: 1,
                        orderStatus: 1,
                        user_details: {
                            '$arrayElemAt': [
                                [{
                                    _id: {
                                        '$arrayElemAt': ['$User._id', 0]
                                    },
                                    name: {
                                        '$arrayElemAt': ['$User.name', 0]
                                    },
                                    email: {
                                        '$arrayElemAt': ['$User.email', 0]
                                    },
                                    phone_no: {
                                        '$arrayElemAt': ['$User.phone_no', 0]
                                    }
                                }], 0
                            ]
                        },
                        restaurants_details: {
                            '$arrayElemAt': [
                                [{
                                    _id: {
                                        '$arrayElemAt': ['$restaurants._id', 0]
                                    },
                                    name: {
                                        '$arrayElemAt': ['$restaurants.name', 0]
                                    },
                                    restaurant_logo: {
                                        '$arrayElemAt': ['$restaurants.restaurant_logo', 0]
                                    },
                                    lat: {
                                        '$arrayElemAt': ['$restaurants.lat', 0]
                                    },
                                    long: {
                                        '$arrayElemAt': ['$restaurants.long', 0]
                                    },
                                    address: {
                                        '$arrayElemAt': ['$restaurants.address', 0]
                                    }
                                }], 0
                            ]
                        },
                    }
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });
                    } else {
                        if (result.length > 0) {
                            callback({
                                "response_code": 2000,
                                "response_message": "Order details found successfully.",
                                "response_data": result
                            });
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Order details not exist",
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
    orderList: function (data, callback) {


        var page = 1,
            limit = 20,
            maxDistance = 10,
            query = {};
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.sortby) {
            sort_field = data.sortby;
        }

        if (data._id) {
            query['_id'] = data._id;
        }
        if (data.orderId) {
            query['orderId'] = data.orderId;
        }
        if (data.orderStatus) {
            query['orderStatus'] = data.orderStatus;
        }
        if (data.userId) {
            query['userId'] = data.userId;
        }
        if (data.restaurant_id) {

            query['restaurant_id'] = {
                '$in': data.restaurant_id
            };
        }
        var aggregate = orderSchema.aggregate();
        aggregate.match(query);

        // aggregate.lookup({
        //     from: 'orders',
        //     localField: 'childOrderIds',
        //     foreignField: '_id',
        //     as: 'teamOrders'
        // });

        aggregate.lookup({
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'User'
        });
        aggregate.lookup({
            from: 'organisationteams',
            localField: 'team_id',
            foreignField: '_id',
            as: 'organisationteam'
        });

        aggregate.lookup({
            from: 'restaurants',
            localField: 'restaurant_id',
            foreignField: '_id',
            as: 'restaurants'
        });

        aggregate.unwind({
            path: "$teamOrderUserList",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'users',
            localField: 'teamOrderUserList',
            foreignField: '_id',
            as: 'teamOrder-UserList'
        });

        aggregate.unwind({
            path: "$teamOrder-UserList",
            preserveNullAndEmptyArrays: true
        });
        aggregate.unwind(
            "$orderDetails"
        );
        aggregate.lookup({
            from: 'restaurantmenus',
            localField: 'orderDetails.productId',
            foreignField: '_id',
            as: 'restaurant_menus'
        });
        aggregate.unwind(
            "$restaurant_menus"
        );
        // aggregate.addFields({
        //     // "$orderDetails.menu_image": "$restaurant_menus.menu_logo"
        //     menu_image: "$restaurant_menus.menu_logo"
        // });

        aggregate.unwind({
            path: "$childOrderIds",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'orders',
            localField: 'childOrderIds',
            foreignField: '_id',
            as: 'teamMemberOrder'
        });

        aggregate.unwind({
            path: "$teamMemberOrder",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'users',
            localField: 'teamMemberOrder.userId',
            foreignField: '_id',
            as: 'teamUser'
        });

        aggregate.unwind(
            "$teamMemberOrder.orderDetails"
        );
        aggregate.lookup({
            from: 'restaurantmenus',
            localField: 'teamMemberOrder.orderDetails.productId',
            foreignField: '_id',
            as: 'team_restaurant_menus'
        });
        aggregate.unwind(
            "$team_restaurant_menus"
        );

        aggregate.lookup({
            from: 'orders',
            localField: 'childOrderIds',
            foreignField: '_id',
            as: 'teamMemberOrder1'
        });
        aggregate.unwind({
            path: "$teamMemberOrder1",
            preserveNullAndEmptyArrays: true
        });


        aggregate.group({
            "_id": "$_id",

            teamMemberOrder: {
                $addToSet: "$teamMemberOrder1" //{$arrayElemAt:["$teamMemberOrder",0]}
            },
            team_restaurant_menus: {
                "$addToSet": "$team_restaurant_menus"
            },

            teamUser: {
                $addToSet: {
                    $arrayElemAt: [
                        [{
                            _id: {
                                '$arrayElemAt': ['$teamUser._id', 0]
                            },
                            name: {
                                '$arrayElemAt': ['$teamUser.name', 0]
                            },

                            pfImage: {
                                $cond: {
                                    if: {
                                        $in: [false, "$teamUser.profile_image_updated"]
                                    },
                                    then: {
                                        $cond: {
                                            if: {
                                                $in: ["NORMAL", "$User.type"]
                                            },
                                            then: {
                                                $cond: { // Checking if user type normal and profile image not uploaded
                                                    if: {
                                                        $in: ["", "$teamUser.profile_image"]
                                                    },
                                                    then: config.liveUrl + config.userDemoPicPath,
                                                    else: {
                                                        $concat: [config.liveUrl, {
                                                            "$arrayElemAt": ["$teamUser.profile_image", 0]
                                                        }]
                                                    }
                                                }
                                            },
                                            else: {
                                                $cond: { // Checking if user type social and image not uploaded
                                                    if: {
                                                        $eq: [
                                                            [{
                                                                '$arrayElemAt': ['$teamUser.socialLogin.image', 0]
                                                            }, 0], ""
                                                        ]
                                                    },
                                                    then: config.liveUrl + config.userDemoPicPath,
                                                    else: {
                                                        '$arrayElemAt': [{
                                                            '$arrayElemAt': ['$teamUser.socialLogin.image', 0]
                                                        }, 0]

                                                    }
                                                }
                                            }

                                        }
                                    },
                                    else: {
                                        $concat: [config.liveUrl, {
                                            "$arrayElemAt": ["$teamUser.profile_image", 0]
                                        }]
                                    }
                                }
                            },
                            email: {
                                '$arrayElemAt': ['$teamUser.email', 0]
                            },
                            phone_no: {
                                $concat: [{
                                    "$arrayElemAt": ["$teamUser.country_code", 0]
                                }, {
                                    "$arrayElemAt": ["$teamUser.phone_no", 0]
                                }]
                            }
                        }], 0
                    ]
                }
            },
            orderId: {
                "$first": "$orderId"
            },
            // paymentId: {
            //     "$first": "$paymentId"
            // },
            userId: {
                "$first": "$userId"
            },
            buyer_name: {
                "$first": "$buyer_name"
            },
            buyer_email: {
                "$first": "$buyer_email"
            },
            order_Details: {
                "$addToSet": "$orderDetails"
            },
            transactionAmount: {
                "$first": "$transactionAmount"
            },
            transactionFees: {
                "$first": "$transactionFees"
            },
            message: {
                "$first": "$message"
            },
            paymentMode: {
                "$first": "$paymentMode"
            },
            paymentStatus: {
                "$first": "$paymentStatus"
            },
            orderStatus: {
                "$first": "$orderStatus"
            },
            orderType: {
                "$first": "$orderType"
            },
            teamOrderUserList: {
                "$addToSet": "$teamOrder-UserList"
            },
            team_details: {
                "$first": "$organisationteam"
            },
            User: {
                "$first": "$User"
            },
            restaurant_menus: {
                "$addToSet": "$restaurant_menus"
            },
            restaurants: {
                "$first": "$restaurants"
            },
            team_order_arrived: {
                "$first": "$team_order_arrived"
            },
            createdAt: {
                "$first": "$createdAt"
            },
            childOrderIds: {
                "$addToSet": "$childOrderIds",
            },


        });


        // aggregate.group({
        //     "_id": "$teamMemberOrder._id",
        //     team_order_Details: {
        //         "$addToSet": "$teamMemberOrder.orderDetails"
        //     },
        //     team_restaurant_menus: {
        //         "$addToSet": "$team_restaurant_menus"
        //     },
        // });

        aggregate.project({
            _id: 1,
            team_restaurant_menus: 1,
            teamMemberOrder: 1,
            teamUser: 1,
            createdAt: 1,
            orderId: 1,
            // paymentId: 1,
            userId: 1,
            buyer_name: 1,
            buyer_email: 1,
            order_Details: 1,
            transactionAmount: 1,
            transactionFees: 1,
            message: 1,
            paymentMode: 1,
            paymentStatus: 1,
            orderStatus: 1,
            orderType: 1,
            teamOrderUserList: 1,
            team_details: 1,
            team_order_arrived: 1,
            superFoodie: {
                $cond: {
                    if: {
                        $or: [{
                                $eq: ["$childOrderIds", []]
                            },
                            {
                                $eq: ["$childOrderIds", null]
                            }
                        ]
                    },
                    then: false,
                    else: true
                }
            },
            user_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$User._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$User.name', 0]
                        },
                        pfImage: {
                            $cond: {
                                if: {
                                    $in: [false, "$User.profile_image_updated"]
                                },
                                then: {
                                    $cond: {
                                        if: {
                                            $in: ["NORMAL", "$User.type"]
                                        },
                                        then: {
                                            $cond: { // Checking if user type normal and profile image not uploaded
                                                if: {
                                                    $in: ["", "$User.profile_image"]
                                                },
                                                then: config.liveUrl + config.userDemoPicPath,
                                                else: {
                                                    $concat: [config.liveUrl, {
                                                        "$arrayElemAt": ["$User.profile_image", 0]
                                                    }]
                                                }
                                            }
                                        },
                                        else: {
                                            $cond: { // Checking if user type social and image not uploaded
                                                if: {
                                                    $eq: [
                                                        [{
                                                            '$arrayElemAt': ['$User.socialLogin.image', 0]
                                                        }, 0], ""
                                                    ]
                                                },
                                                then: config.liveUrl + config.userDemoPicPath,
                                                else: {
                                                    '$arrayElemAt': [{
                                                        '$arrayElemAt': ['$User.socialLogin.image', 0]
                                                    }, 0]

                                                }
                                            }
                                        }

                                    }
                                },
                                else: {
                                    $concat: [config.liveUrl, {
                                        "$arrayElemAt": ["$User.profile_image", 0]
                                    }]
                                }
                            }
                        },
                        email: {
                            '$arrayElemAt': ['$User.email', 0]
                        },
                        phone_no: {
                            $concat: [{
                                "$arrayElemAt": ["$User.country_code", 0]
                            }, {
                                "$arrayElemAt": ["$User.phone_no", 0]
                            }]
                        },
                        // pfImage1: {
                        //     $switch: {
                        //         branches: [{
                        //                 case: {
                        //                     $and: [{
                        //                             $in: ["", "$User.profile_image"]
                        //                         },
                        //                         {
                        //                             $eq: [
                        //                                 ['$User.socialLogin.image', 0], ""
                        //                             ]
                        //                         }
                        //                     ]

                        //                 },
                        //                 then: config.liveUrl + config.userDemoPicPath
                        //             },
                        //             {
                        //                 case: {
                        //                     $and: [{
                        //                             $in: ["", "$User.profile_image"]
                        //                         },
                        //                         {
                        //                             $ne: [
                        //                                 ['$User.socialLogin.image', 0], ""
                        //                             ]
                        //                         }
                        //                     ]
                        //                 },
                        //                 then: ["$User.socialLogin.image", 0]
                        //             },
                        //             {
                        //                 case: {
                        //                     "$eq": ["FB", "$User.type"]
                        //                 },
                        //                 then: ["$User.socialLogin.image", 0]
                        //             }
                        //         ],
                        //         default: config.liveUrl + config.userDemoPicPath
                        //     }
                        // },

                    }], 0
                ]
            },
            restaurants_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$restaurants._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$restaurants.name', 0]
                        },
                        restaurant_logo: {
                            '$arrayElemAt': ['$restaurants.restaurant_logo', 0]
                        },
                        contact_info: {
                            '$arrayElemAt': ['$restaurants.contact_info', 0]
                        },
                        email: {
                            '$arrayElemAt': ['$restaurants.email', 0]
                        },
                        lat: {
                            '$arrayElemAt': ['$restaurants.lat', 0]
                        },
                        long: {
                            '$arrayElemAt': ['$restaurants.long', 0]
                        },
                        address: {
                            '$arrayElemAt': ['$restaurants.address', 0]
                        }
                    }], 0
                ]
            },
            restaurant_menus: "$restaurant_menus",

            // total: {
            //     // "$sum": "$passengers.times",
            //     $multiply: ["$restaurant_menus.price", "$orderDetails.qty"]
            // }
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }
        orderSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                async.forEach(results, function (item, callback) {
                    if (item.teamOrderUserList.length > 0) {

                        async.forEach(item.teamOrderUserList, function (user, callback) {

                            if (user.profile_image_updated == false) {
                                if (user.type == "NORMAL") {
                                    if (user.profile_image == '') {
                                        user.profile_image = config.liveUrl + config.userDemoPicPath;
                                    } else {
                                        user.profile_image = config.liveUrl + user.profile_image;
                                    }

                                } else {
                                    user.profile_image = user.socialLogin[0].image;
                                }

                            } else {
                                user.profile_image = config.liveUrl + user.profile_image;
                            }

                            if (user.profile_image == '' || user.profile_image == null) {
                                user.profile_image = config.liveUrl + config.userDemoPicPath;
                            }
                            callback()
                        })

                        if (item.teamMemberOrder != null && item.teamMemberOrder.length > 0) {
                            async.forEach(item.teamMemberOrder, function (tOrder, callback) {

                                async.forEach(item.teamUser, function (user, callback) {
                                    if (user._id == tOrder.userId) {
                                        tOrder.user_details = user
                                    }
                                    callback()
                                })

                                async.forEach(tOrder.orderDetails, function (orderItem, callback) {

                                    async.forEach(item.team_restaurant_menus, function (restaurant_menu, callback) {
                                        if (orderItem.productId == restaurant_menu._id) {

                                            orderItem.menu_logo = restaurant_menu.menu_logo
                                        }
                                        callback()
                                    })
                                    callback()
                                })

                                callback()
                            })
                        }

                    }

                    async.forEach(item.order_Details, function (order_Detail, callback) {

                        async.forEach(item.restaurant_menus, function (restaurant_menu, callback) {
                            if (order_Detail.productId == restaurant_menu._id) {

                                order_Detail.menu_logo = restaurant_menu.menu_logo
                            }
                            callback()
                        })

                        callback()
                    })


                    callback()
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
                    "response_message": "Order list found successfully.",
                    "response_data": data
                });
            }
        });
    },
    teamOrderList: function (data, callback) {

        var page = 1,
            limit = 20,
            maxDistance = 10,
            query = {};

        query['_id'] = {
            $in: data
        }
        var aggregate = orderSchema.aggregate();
        aggregate.match(query);

        aggregate.lookup({
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'User'
        });

        aggregate.unwind(
            "$orderDetails"
        );
        aggregate.lookup({
            from: 'restaurantmenus',
            localField: 'orderDetails.productId',
            foreignField: '_id',
            as: 'restaurant_menus'
        });
        aggregate.unwind(
            "$restaurant_menus"
        );

        aggregate.group({
            "_id": "$_id",

            orderId: {
                "$first": "$orderId"
            },
            // paymentId: {
            //     "$first": "$paymentId"
            // },
            userId: {
                "$first": "$userId"
            },
            buyer_name: {
                "$first": "$buyer_name"
            },
            buyer_email: {
                "$first": "$buyer_email"
            },
            order_Details: {
                "$addToSet": "$orderDetails"
            },
            User: {
                "$first": "$User"
            },
            restaurant_menus: {
                "$addToSet": "$restaurant_menus"
            },
            createdAt: {
                "$first": "$createdAt"
            },


        });
        aggregate.project({
            _id: 1,
            createdAt: 1,
            orderId: 1,
            // paymentId: 1,
            userId: 1,
            buyer_name: 1,
            buyer_email: 1,
            order_Details: 1,
            user_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$User._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$User.name', 0]
                        },

                        pfImage: {
                            $cond: {
                                if: {
                                    $in: ["NORMAL", "$User.type"]
                                },
                                then: {
                                    $cond: {
                                        if: {
                                            $in: ["", "$User.profile_image"]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$User.profile_image", 0]
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
                                                    '$arrayElemAt': ['$User.socialLogin.image', 0]
                                                }, 0], " "
                                            ]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            '$arrayElemAt': [{
                                                '$arrayElemAt': ['$User.socialLogin.image', 0]
                                            }, 0]

                                        }
                                    }
                                }
                            }
                        },
                        email: {
                            '$arrayElemAt': ['$User.email', 0]
                        },
                        phone_no: {
                            $concat: [{
                                "$arrayElemAt": ["$User.country_code", 0]
                            }, {
                                "$arrayElemAt": ["$User.phone_no", 0]
                            }]
                        }
                    }], 0
                ]
            },
            restaurant_menus: "$restaurant_menus",

            // total: {
            //     // "$sum": "$passengers.times",
            //     $multiply: ["$restaurant_menus.price", "$orderDetails.qty"]
            // }
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }
        orderSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                async.forEach(results, function (item, callback) {

                    async.forEach(item.order_Details, function (order_Detail, callback) {

                        async.forEach(item.restaurant_menus, function (restaurant_menu, callback) {
                            if (order_Detail.productId == restaurant_menu._id) {

                                order_Detail.menu_logo = restaurant_menu.menu_logo
                            }
                            callback()
                        })

                        callback()
                    })


                    callback()
                })

                //return results;

                // var data = {
                //     docs: results,
                //     pages: pageCount,
                //     total: count,
                //     limit: limit,
                //     page: page
                // }
                callback({
                    "response_code": 2000,
                    "response_message": "Order list found successfully111.",
                    "response_data": results
                });
            }
        });
    },
    orderDeleveredCnf: async function (data, callback) {

        let orderDetails = await orderSchema.findOne({
            _id: data._id

        }, function (err, order) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        if (orderDetails != null) {

            if (orderDetails.orderType == 'TEAM' && orderDetails.childOrderIds.length > 0) {
                // This is team order

                let total_clover_earn = 250 * orderDetails.childOrderIds.length;
                orderDetails.childOrderIds.push(orderDetails._id);



                let allorderDetails = await orderSchema.find({
                    _id: {
                        $in: orderDetails.childOrderIds
                    }

                }, function (err, order) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });

                    }
                })
                // defaultClover = await defaultUserClover(orderDetails.userId, orderDetails.transactionAmount)
                // console.log('----defaultClover---', defaultClover)
                // console.log("allorderDetails", allorderDetails)
                async.forEach(allorderDetails, function (order, callback) {

                    orderSchema.update({
                            _id: order._id
                        }, {
                            $set: {
                                orderStatus: 'Delivered'
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

                                mailProperty('orderStatusChange')(order.buyer_email, {
                                    name: order.buyer_name,
                                    orderId: order.orderId,
                                    orderStatus: 'Delivered',
                                    email: order.buyer_email,
                                    site_url: config.liveUrl,
                                    date: new Date()
                                }).send();
                            }
                        })

                    callback()
                }, function (err, content) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {

                        // UserSchema.update({
                        //         _id: orderDetails.userId
                        //     }, {
                        //         $set: {
                        //             rewardPoint: total_clover_earn
                        //         }
                        //     },
                        //     function (err, result) {

                        //     })

                        callback({
                            "response_code": 2000,
                            "response_message": "Order Received successfully.",
                            "response_data": {}
                        });
                    }
                })


            } else {
                // This is solo order

                orderSchema.update({
                        _id: orderDetails._id
                    }, {
                        $set: {
                            orderStatus: 'Delivered'
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

                            mailProperty('orderStatusChange')(orderDetails.buyer_email, {
                                name: orderDetails.buyer_name,
                                orderId: data.orderId,
                                orderStatus: 'Delivered',
                                email: orderDetails.buyer_email,
                                site_url: config.liveUrl,
                                date: new Date()
                            }).send();


                            callback({
                                "response_code": 2000,
                                "response_message": "Order Received successfully.",
                                "response_data": {}
                            });
                        }
                    })
            }


        } else {
            callback({
                "response_code": 5002,
                "response_message": "No data found",
                "response_data": {}
            });
        }

    },
    foodArriveNotification: async function (data, callback) {

        let order = await orderSchema.findOne({
            orderId: data.orderId

        }, function (err, restaurant) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        if (order != null && order.team_order_arrived == false) {
            let Users = order.teamOrderUserList;

            let userList = await UserSchema.find({
                _id: {
                    $in: Users
                }
            }).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            if (userList.length > 0) {
                var message = 'A team member ' + order.buyer_name + ' has bring your order.Please collect the order.';
                var title = 'Order Arrived';
                var notification_code = 1003;
                async.forEach(userList, function (item, callBack) {
                    var pushData = {
                        deviceId: item.devicetoken,
                        user_id: item._id,
                        title: title,
                        message: message,
                        notification_code: notification_code,
                        profile_image: config.liveUrl + config.userDemoPicPath
                    }
                    var addData = {
                        _id: new ObjectID,
                        user_id: item._id,
                        notification_code: notification_code,
                        message: message,
                        title: title,
                        notification_for: 'user',
                        team_join_request_details: {
                            user_id: item._id
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

                    // mailProperty('teamNameChangeRequest')(item.email, {
                    //     name: item.name,
                    //     request_user_name: name,
                    //     suggested_teamName: data.suggested_name,
                    //     site_url: config.liveUrl,
                    // }).send();

                    callBack();
                }, function (err, content) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });
                    } else {
                        orderSchema.update({
                                orderId: data.orderId
                            }, {
                                $set: {
                                    team_order_arrived: true,
                                }
                            },
                            function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": err,
                                        "response_data": {}
                                    });
                                } else {
                                    orderModels.orderList(data, function (response) {
                                        callback(response)
                                    })
                                }
                            })


                    }
                });
            }
        }

    },

    cartProductDelete: function (data, callback) {
        if (data) {
            addToCartSchema.findOneAndRemove({
                    _id: data.cartId,
                    userId: data.userId
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "No record found",
                                "response_data": {}
                            });
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Product deleted from cart",
                                "response_data": result
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
    emptyCart: function (data, callback) {
        if (data) {
            addToCartSchema.remove({
                    userId: data.userId
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "No record found",
                                "response_data": {}
                            });
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Product deleted from cart",
                                "response_data": result
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

    changeOrderStatus: function (data, callback) {
        orderSchema.findOne({
                _id: data._id
            },
            function (err, orderDetails) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    if (orderDetails == null) {
                        callback({
                            "response_code": 5002,
                            "response_message": "No data found",
                            "response_data": {}
                        });
                    } else {
                        orderSchema.update({
                                _id: data._id
                            }, {
                                $set: {
                                    orderStatus: data.orderStatus,
                                    additional_wait_time: data.additional_wait_time ? data.additional_wait_time : null,
                                    order_reject_reason: data.order_reject_reason ? data.order_reject_reason : null
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

                                    mailProperty('orderStatusChange')(orderDetails.buyer_email, {
                                        name: orderDetails.buyer_name,
                                        orderId: orderDetails.orderId,
                                        orderStatus: data.orderStatus == 'Cancel' ? 'Cancelled' : data.orderStatus,
                                        email: orderDetails.buyer_email,
                                        site_url: config.liveUrl,
                                        date: new Date()
                                    }).send();

                                    if (orderDetails.orderType == "TEAM") {

                                        orderModels.teamJoinRequestToOrder(orderDetails, function (response) {
                                            callback(response)
                                        })

                                    }

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Data updated successfully.",
                                        "response_data": {}
                                    });
                                }
                            }
                        )
                    }
                }
            }
        )
    },

    teamJoinRequestToOrder: async function (data, callback) {


        let userList = await UserSchema.find({
            _id: {
                $in: data.teamOrderUserList
            }
        }).exec(function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })



        let restaurant = await restaurantScema.findOne({
            _id: data.restaurant_id

        }, function (err, restaurant) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        })

        if (userList.length > 0) {
            var message = data.buyer_name + ' has place an order from ' + restaurant.name + '.Join Order.';
            var title = 'Join Team Order';
            var notification_code = 1004;
            async.forEach(userList, function (item, callBack) {
                var pushData = {
                    deviceId: item.devicetoken,
                    user_id: item._id,
                    title: title,
                    message: message,
                    notification_code: notification_code,
                    profile_image: config.liveUrl + config.userDemoPicPath,
                    teamOrder: {
                        restaurant_id: data.restaurant_id,
                        parentOrderId: data._id
                    }
                }
                // var addData = {
                //     _id: new ObjectID,
                //     user_id: item._id,
                //     notification_code: notification_code,
                //     message: message,
                //     title: title,
                //     notification_for: 'user',
                //     team_join_request_details: {
                //         user_id: data.userId
                //     },
                //     teamOrder: {
                //         restaurant_id: data.restaurant_id,
                //         parentOrderId: data._id
                //     }
                // }

                if (item.apptype == 'IOS') {
                    pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                        console.log('pushStatus', pushStatus);
                    });
                } else if (item.apptype = 'ANDROID') {
                    pushNotification.androidTeamOrderPushNotification(pushData, function (pushStatus) {
                        console.log('pushStatus', pushStatus);
                    });
                }

                // Email the Team Name Change Request Notification

                // mailProperty('teamNameChangeRequest')(item.email, {
                //     name: item.name,
                //     request_user_name: name,
                //     suggested_teamName: data.suggested_name,
                //     site_url: config.liveUrl,
                // }).send();

                callBack();
            }, function (err, content) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });
                } else {

                    callback({
                        "response_code": 2000,
                        "response_message": "Data updated successfully.",
                        "response_data": {}
                    });

                }
            });
        }

    },

}
async function defaultUserClover(userId, transactionAmount) {
    console.log('transactionAmount', transactionAmount)
    let validatedResponse = []
    let checkResponse = []
    let checkSettingResponse = []
    let rewardsFacilityname = ''

    let userQuery = await UserSchema.findOne({
            _id: userId
            //gold_member:'yes'
        })
        .exec(async function (err, result) {

            if (err) {
                checkResponse.push({
                    response_code: 5005,
                    response_data: err
                })

            } else {
                checkResponse.push({
                    response_code: 2000,
                    response_data: result
                })

            }
        });
    //console.log('checkResponse[0].response_data.length--', checkResponse)
    if (checkResponse[0].response_data.gold_member == 'yes') {
        //Gold foodie
        rewardsFacilityname = 'Gold foodie'
        let userSettingQuery = await UserSettingSchema.findOne({
                userType: 'gold'
            })
            .exec(async function (err, result) {

                if (err) {
                    checkSettingResponse.push({
                        response_code: 5005,
                        response_data: err
                    })

                } else {
                    checkSettingResponse.push({
                        response_code: 2000,
                        response_data: result
                    })

                }
            });

    } else {
        //Clover
        rewardsFacilityname = 'Clover'

        let userSettingQuery = await UserSettingSchema.findOne({
                userType: 'normal'
            })
            .exec(async function (err, result) {

                if (err) {
                    checkSettingResponse.push({
                        response_code: 5005,
                        response_data: err
                    })

                } else {
                    checkSettingResponse.push({
                        response_code: 2000,
                        response_data: result
                    })

                }
            });
    }

    console.log('----checkSettingResponse----', checkSettingResponse)

    let promise = new Promise(function (resolve, reject) {

            checkSettingResponse.map(async function (data) {

                // true condition
                if (data.response_code == '2000') {

                    let clover = data.response_data.clover
                    let discount = data.response_data.discount
                    console.log('----checkSettingResponse clover----', clover)
                    console.log('----checkSettingResponse discount----', discount)

                    let earnClover = parseFloat(parseFloat(transactionAmount) / parseFloat(discount)) * parseFloat(clover)
                    console.log('----checkSettingResponse earnClover----', earnClover)


                    result = {
                        discount: discount,
                        clover: clover,
                        earnClover: Math.round(parseFloat(earnClover).toFixed(2)),
                        rewardsFacilityname: rewardsFacilityname,
                        rewardsFacilityType: 'User'
                    }

                    validatedResponse.push({
                        response_code: 2000,
                        response_data: result
                    })

                } else {
                    result = {
                        discount: 0,
                        clover: 0,
                        earnClover: 0,
                        rewardsFacilityname: '',
                        rewardsFacilityType: ''
                    }

                    validatedResponse.push({
                        response_code: 5002,
                        response_data: result
                    })

                }
                console.log('checked response--->', validatedResponse)

                resolve(validatedResponse)
                return validatedResponse

            })
        })
        .then(res => res)

    return promise
}

async function RestaurantBasedClover(userId, restaurantId, rewardsFacilityId) {
    console.log('RestaurantBasedClover')
    let validatedResponse = []
    let checkResponse = []
    let checkSettingResponse = []
    let rewardsFacilityname = ''

    if (rewardsFacilityId) {
        let rewardsQuery = await rewardsFacilitySchema.findOne({
                _id: rewardsFacilityId,
                enable: 'yes'
            })
            .exec(async function (err, result) {

                if (err) {
                    checkResponse.push({
                        response_code: 5005,
                        response_data: err
                    })

                } else {
                    checkResponse.push({
                        response_code: 2000,
                        response_data: result
                    })

                }
            })

        let promise = new Promise(function (resolve, reject) {

                checkResponse.map(async function (data) {

                    // true condition
                    if (data.response_code == '2000') {
                        let clover = data.response_data.clover
                        let discount = data.response_data.discount
                        let rewardsFacilityname = data.response_data.name
                        let rewardsFacilityType = data.response_data.type
                        let additionalUserCLover = 0
                        if (rewardsFacilityType == 'flat') {
                            additionalUserCLover = data.response_data.additionalUserCLover

                            result = {
                                isSuccess: true,
                                discount: discount,
                                clover: clover,
                                additionalUserCLover: additionalUserCLover,
                                rewardsFacilityname: rewardsFacilityname,
                                rewardsFacilityType: rewardsFacilityType
                            }
                        } else if (rewardsFacilityType == 'order') {
                            let noOfDays = 0
                            let success = false
                            let timesOfClover = data.response_data.timesOfClover
                            let orderProvided = data.response_data.orderProvided
                            let orderDependsOn = data.response_data.orderDependsOn
                            let timeLimitation = data.response_data.timeLimitation
                            let notificationDateOn = data.response_data.notificationDateOn
                            let maxCloverPoint = data.response_data.maxCloverPoint

                            // Schema --->  1.timesOfClover=25
                            // --->  2.orderProvided       = 2 order
                            // --->  3.timeLimitation      = 7 days
                            // --->  4.orderDependsOn      = 1 order
                            // --->  5.notificationDate    = 4 days
                            // --->  7.maxCloverPoint      = 3000

                            // 1 .  if( duration between 1st order (orderDependsOn) and 2nd order (orderProvided) is 7 days (timeLimitaion)  )

                            let noOfOrderDetails = await orderSchema
                                .find({
                                    userId: userId,
                                    restaurant_id: restaurantId
                                })
                                .sort({
                                    createdAt: -1
                                })

                            let orderCreatedDate = noOfOrderDetails[0].createdAt
                            let noOfOrder = parseInt(noOfOrderDetails.length) + 1

                            console.log('---noOfOrderDetails----', noOfOrderDetails)
                            console.log('---orderCreatedDate----', orderCreatedDate)
                            console.log('---noOfOrder----', noOfOrder)
                            console.log('---orderProvided----', orderProvided)

                            if (noOfOrder == orderProvided) {

                                let noOfDaysDetails = await orderSchema.aggregate([{
                                        $project: {
                                            _id: 0,
                                            dayssince: {
                                                $trunc: {
                                                    $divide: [{
                                                        $subtract: [new Date(), orderCreatedDate]
                                                    }, 1000 * 60 * 60 * 24]
                                                }
                                            }
                                        }
                                    }

                                ]);

                                noOfDays = noOfDaysDetails.length > 0 ? noOfDaysDetails[0].dayssince : 0

                                console.log('---noOfDays----', noOfDays)
                                if (noOfDays <= timeLimitation) {
                                    success = true


                                } else {
                                    timesOfClover = 0
                                    orderProvided = 0
                                    orderDependsOn = 0
                                    timeLimitation = 0
                                    notificationDateOn = 0
                                    maxCloverPoint = 0
                                }


                            } else {
                                timesOfClover = 0
                                orderProvided = 0
                                orderDependsOn = 0
                                timeLimitation = 0
                                notificationDateOn = 0
                                maxCloverPoint = 0
                            }




                            result = {
                                isSuccess: success,
                                timesOfClover: timesOfClover,
                                noOfDays: noOfDays,
                                orderProvided: orderProvided,
                                orderDependsOn: orderDependsOn,
                                timeLimitation: timeLimitation,
                                notificationDateOn: notificationDateOn,
                                maxCloverPoint: maxCloverPoint,
                                rewardsFacilityname: rewardsFacilityname,
                                rewardsFacilityType: rewardsFacilityType
                            }

                        } else if (rewardsFacilityType == 'redeem') {
                            result = {
                                isSuccess: true,
                                discount: discount,
                                clover: clover,
                                rewardsFacilityname: rewardsFacilityname,
                                rewardsFacilityType: rewardsFacilityType
                            }
                        }


                        validatedResponse.push({
                            response_code: 2000,
                            response_data: result
                        })

                    } else {
                        result = {
                            discount: 0,
                            clover: 0,
                            additionalUserCLover: 0,
                            rewardsFacilityname: '',
                            rewardsFacilityType: ''
                        }

                        validatedResponse.push({
                            response_code: 5002,
                            response_data: result
                        })

                    }
                    console.log('checked response--->', validatedResponse)

                    resolve(validatedResponse)
                    return validatedResponse

                })
            })
            .then(res => res)

        return promise
    } else {

        let output = {
            discount: 0,
            clover: 0,
            additionalUserCLover: 0,
            rewardsFacilityname: '',
            rewardsFacilityType: ''
        }

        validatedResponse.push({
            response_code: 2000,
            response_data: output
        })
        return validatedResponse
    }
}

module.exports = orderModels;