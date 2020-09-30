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
var CreditSystemScema = require('../schema/creditSystem');
var CreditAppliedLogScema = require('../schema/cretidAppliedLogSchema');
const {
    createInvoice
} = require("../createInvoice");

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
                        'Restaurant.pre_order_accepted': 1,
                        'Restaurant.opening_hours': 1,
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
                        var totalQuantity = [];
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
                                    busy_mode: item.Restaurant.length > 0 ? item.Restaurant[0].busy_mode : null,
                                    pre_order_accepted: item.Restaurant.length > 0 ? item.Restaurant[0].pre_order_accepted : 'no',
                                    opening_hours: item.Restaurant.length > 0 ? item.Restaurant[0].opening_hours : null
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
                                //console.log('------result[0].User.length-----', result[0].User.length)
                                if (result[0].User.length > 0) {
                                    userId = result[0].User[0]._id
                                    //console.log('--------cart userId-------', userId)
                                    //await temporaryCartPromoClover.remove({userId: userId })       

                                    //await temporaryCloverSchema.remove({userId: userId });  

                                    userRewardPoint = result[0].User[0].rewardPoint !== undefined ? result[0].User[0].rewardPoint : 0
                                    userRedeemReward = result[0].User[0].redeemReward !== undefined ? result[0].User[0].redeemReward : 0
                                    userRewardPoint = parseInt(userRewardPoint) - parseInt(userRedeemReward)

                                    let totalAmount = total.reduce(function (acc, val) {
                                        return acc + val;
                                    }, 0)

                                    defaultClover = await defaultUserClover(result[0].User[0]._id, totalAmount)
                                    //console.log('----defaultClover---', defaultClover)

                                    //rewardsFacilityname:'',
                                    // rewardsFacilityType:''

                                    if (result[0].Restaurant.length > 0) {
                                        restaurantRewardId = result[0].Restaurant[0].rewardId !== undefined ? result[0].Restaurant[0].rewardId : null
                                        resTaurantBasedClover = await RestaurantBasedClover(result[0].User[0]._id, result[0].Restaurant[0]._id, restaurantRewardId)
                                        //console.log('----resTaurantBasedClover---', resTaurantBasedClover)


                                        // 3 .  maximum clover = 3000
                                        let rewardsFacilityType = resTaurantBasedClover[0].response_data.rewardsFacilityType
                                        //console.log('----rewardsFacilityType----', rewardsFacilityType)

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
                                            //console.log('----isSuccess----', isSuccess)

                                            if (isSuccess === true) {

                                                //console.log('----timesOfClover----', timesOfClover)
                                                defaultCloverPoint = defaultClover[0].response_data.earnClover
                                                resTaurantBasedCloverPoint = parseInt(timesOfClover) * parseInt(defaultCloverPoint)
                                                restaurantBasedRewardPoint = parseInt(defaultCloverPoint) + parseInt(resTaurantBasedCloverPoint)
                                                //console.log('----restaurantBasedRewardPoint----', restaurantBasedRewardPoint)

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




                                let cartResponse = ''

                                let cartIds = list.map((list) => list.cartId)
                                let totalCartQuantity = (list.map((list) => list.cartProductQty))
                                    .reduce(function (accumulator, qty) {
                                        return accumulator + qty;
                                    }, 0)


                                //console.log('----totalCartQuantity--->', totalCartQuantity)

                                let validatedCartOrderQuery = await temporaryCloverSchema.findOne({
                                    cartIds: cartIds,
                                    userId: userId,
                                    totalCartQuantity: totalCartQuantity
                                }).sort({
                                    updatedAt: -1
                                })
                                if (validatedCartOrderQuery !== null) {

                                    // promoLogclover.cartAmount        = calculatedAmount;
                                    // promoLogclover.amountDeducted    = subTotal;
                                    // Task 1 Quantity     ---> increased/decreased

                                    cartResponse = {
                                        "response_code": 2000,
                                        "response_message": "Cart list",
                                        "response_data": {
                                            list: list,
                                            subTotal: total.reduce(function (acc, val) {
                                                return acc + val;
                                            }, 0),
                                            cartTotal: parseFloat(validatedCartOrderQuery.cartAmount).toFixed(2),
                                            amountDeducted: parseFloat(validatedCartOrderQuery.amountDeducted).toFixed(2),
                                            userRewardPoint: validatedCartOrderQuery.userRewardPoint,
                                            promologId: validatedCartOrderQuery.promologId,
                                            rewardlogIds: validatedCartOrderQuery.rewardlogIds,

                                            promocode: validatedCartOrderQuery.promocode,
                                            restaurantBasedRewardPoint: restaurantBasedRewardPoint,

                                            promocodeDeductedAmount: validatedCartOrderQuery.promocodeDeductedAmount,
                                            rewardDeductedAmount: validatedCartOrderQuery.rewardDeductedAmount,
                                            deductedRedeemPoint: validatedCartOrderQuery.deductedRedeemPoint,
                                            totalCartQuantity: validatedCartOrderQuery.totalCartQuantity,
                                            restaurant_details: restaurant_details,
                                            clover_details: clover_details,
                                            user_details: user_details,
                                            approx_time: approx_time.reduce((sum, elem) => sum + elem)
                                        }
                                    }


                                } else {
                                    let deleteCartOrderQuery = await temporaryCloverSchema.remove({
                                        userId: userId
                                    })

                                    let cartListResponse = {
                                        list: list,


                                        subTotal: total.reduce(function (acc, val) {
                                            return acc + val;
                                        }, 0),
                                        cartTotal: total.reduce(function (acc, val) {
                                            return acc + val;
                                        }, 0),
                                        amountDeducted: 0.00,
                                        userRewardPoint: userRewardPoint,
                                        restaurantBasedRewardPoint: restaurantBasedRewardPoint,
                                        promologId: '',
                                        promocode: '',
                                        rewardlogIds: [],

                                        promocodeDeductedAmount: 0,
                                        rewardDeductedAmount: 0,
                                        deductedRedeemPoint: 0,
                                        totalCartQuantity: totalCartQuantity,
                                        restaurant_details: restaurant_details,
                                        clover_details: clover_details,
                                        user_details: user_details,
                                        approx_time: approx_time.reduce((sum, elem) => sum + elem)
                                    }

                                    let promo_response_data = {
                                        ...cartListResponse,
                                        "promologId": "",
                                        "promocodeAmountDeducted": 0,
                                        "amountRedeemed": 0,
                                        "appliedClover": ''

                                    }


                                    var promoLogclover = {};
                                    promoLogclover._id = new ObjectID;
                                    promoLogclover.cartDetails = JSON.parse(JSON.stringify(promo_response_data));

                                    promoLogclover.restaurantId = restaurant_details[0]._id;
                                    promoLogclover.userId = userId;
                                    promoLogclover.isPromocodeApplied = false;
                                    promoLogclover.isRewardApplied = false;
                                    promoLogclover.cartIds = cartIds;
                                    promoLogclover.cartAmount = total.reduce(function (acc, val) {
                                        return acc + val;
                                    }, 0);
                                    promoLogclover.amountDeducted = 0;
                                    promoLogclover.userRewardPoint = userRewardPoint;
                                    promoLogclover.userRewardPoint = userRewardPoint;
                                    promoLogclover.promocode = "";
                                    promoLogclover.promologId = "";
                                    promoLogclover.promocodeDeductedAmount = 0;
                                    promoLogclover.rewardDeductedAmount = 0;
                                    promoLogclover.rewardlogIds = []
                                    promoLogclover.deductedRedeemPoint = 0,
                                        promoLogclover.totalCartQuantity = totalCartQuantity,

                                        promoLogclover.data = JSON.parse(JSON.stringify({
                                            subTotal: 0,
                                            promologId: "",
                                            promocodeAmountDeducted: 0,
                                            amountRedeemed: 0,
                                            appliedClover: ''
                                        }))


                                    let createCartOrderQuery = await temporaryCloverSchema.create(promoLogclover)


                                    cartResponse = {
                                        "response_code": 2000,
                                        "response_message": "Cart list",
                                        "response_data": {
                                            list: list,


                                            subTotal: total.reduce(function (acc, val) {
                                                return acc + val;
                                            }, 0),
                                            cartTotal: total.reduce(function (acc, val) {
                                                return acc + val;
                                            }, 0),
                                            amountDeducted: 0.00,
                                            userRewardPoint: userRewardPoint,
                                            restaurantBasedRewardPoint: restaurantBasedRewardPoint,
                                            promologId: '',
                                            promocode: '',
                                            rewardlogIds: [],

                                            promocodeDeductedAmount: 0,
                                            rewardDeductedAmount: 0,
                                            deductedRedeemPoint: 0,
                                            totalCartQuantity: totalCartQuantity,

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
                                    rewardsclover.cartIds = JSON.parse(JSON.stringify(cartIds));
                                    console.log('rewardsclover--', rewardsclover)


                                    let checkCartApplied = await temporaryCartPromoClover.findOne({
                                        cartIds: cartIds,
                                        userId: userId
                                    })
                                    if (checkCartApplied === null) {

                                        await temporaryCartPromoClover.create(rewardsclover)
                                    }
                                }


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

            //console.log("cart_items", cart_items);

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



            var list = [];
            async.forEach(restaurant_status, function (item, callBack) {



                var hasFalseKeys = Object.keys(item).some(k => !item[k]);

                if (hasFalseKeys) {

                    list.push({
                        "response_code": item.response_code,
                        "response_message": item.response_message,
                        "response_data": item.response_data
                    });

                }


                callBack();
            }, async function (err, content) {


                if (list.length > 0) {
                    callback({
                        "response_code": list[0].response_code,
                        "response_message": list[0].response_message,
                        "response_data": {}
                    });
                }

                let Response_data = {};
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                } else {



                    let user = await UserSchema.findOne({
                        _id: data.userId
                    }, function (err, result) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": err,
                                "response_data": {}
                            });

                        }
                    })

                    if (user.creditId != null || user.creditId != undefined) {

                        let orderType = data.orderType == 'JOIN-TEAM-ORDER' ? 'TEAM' : data.orderType;

                        let creditSystem = await CreditSystemScema.findOne({
                            _id: user.creditId,
                            order_type: orderType
                        }, function (err, result) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": err,
                                    "response_data": {}
                                });

                            }
                        })


                        if (creditSystem != null && creditSystem.enable == 'yes' && creditSystem.days.indexOf(new Date().getDay()) != -1) {

                            let creditLog = await CreditAppliedLogScema.findOne({
                                creditId: creditSystem._id,
                                userId: data.userId
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": err,
                                        "response_data": {}
                                    });

                                }
                            })
                            //console.log("creditLog", creditLog);
                            let creditUsed = creditLog != null ? creditLog.length : 0;

                            if (creditSystem.type == "single_time" && creditUsed < 1) {

                                if (creditSystem.dead_line == 'yes') {

                                    const today = new Date().getTime();
                                    const minDate = new Date(creditSystem.date.openingTime).getTime();
                                    const maxDate = new Date(creditSystem.date.closingTime).getTime();

                                    if (today >= minDate && today <= maxDate) {

                                        Response_data = {
                                            creditId: creditSystem._id,
                                            discount_amount: creditSystem.discount_amount,
                                            min_cart_amount: creditSystem.min_amount
                                        }

                                    }

                                } else {
                                    Response_data = {
                                        creditId: creditSystem._id,
                                        discount_amount: creditSystem.discount_amount,
                                        min_cart_amount: creditSystem.min_amount
                                    }
                                }

                            }
                            if (creditSystem.type == "multiple_time" && creditUsed < creditSystem.allowed_times) {

                                if (creditSystem.dead_line == 'yes') {

                                    const today = new Date().getTime();
                                    const minDate = new Date(creditSystem.date.openingTime).getTime();
                                    const maxDate = new Date(creditSystem.date.closingTime).getTime();

                                    if (today >= minDate && today <= maxDate) {

                                        Response_data = {
                                            creditId: creditSystem._id,
                                            discount_amount: creditSystem.discount_amount,
                                            min_cart_amount: creditSystem.min_amount
                                        }

                                    }

                                } else {
                                    Response_data = {
                                        creditId: creditSystem._id,
                                        discount_amount: creditSystem.discount_amount,
                                        min_cart_amount: creditSystem.min_amount
                                    }
                                }

                            }
                            if (creditSystem.type == "unlimited_time") {

                                if (creditSystem.dead_line == 'yes') {

                                    const today = new Date().getTime();
                                    const minDate = new Date(creditSystem.date.openingTime).getTime();
                                    const maxDate = new Date(creditSystem.date.closingTime).getTime();

                                    if (today >= minDate && today <= maxDate) {

                                        Response_data = {
                                            creditId: creditSystem._id,
                                            discount_amount: creditSystem.discount_amount,
                                            min_cart_amount: creditSystem.min_amount
                                        }

                                    }

                                } else {
                                    Response_data = {
                                        creditId: creditSystem._id,
                                        discount_amount: creditSystem.discount_amount,
                                        min_cart_amount: creditSystem.min_amount
                                    }
                                }

                            }

                        }

                    }
                }


                callback({
                    "response_code": 2000,
                    "response_message": "Checkout successfully procceed",
                    "response_data": Response_data
                });

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

            let promoClovers = await temporaryCloverSchema.find({
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
            console.log('-----promoClovers---->', promoClovers)
            data.promoClovers = promoClovers;

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
                        data.team_id = order.team_id;
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

                    temporaryCloverSchema.remove({
                        userId: data.userId
                    }, function (err, result) {
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
            query['orderId'] = new RegExp(data.orderId, 'i');
        }
        if (data.buyer_email) {
            query['buyer_email'] = new RegExp(data.buyer_email, 'i');

        }
        if (data.buyer_name) {
            query['buyer_name'] = new RegExp(data.buyer_name, 'i');
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

        aggregate.unwind({
            path: "$teamMemberOrder.orderDetails",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'restaurantmenus',
            localField: 'teamMemberOrder.orderDetails.productId',
            foreignField: '_id',
            as: 'team_restaurant_menus'
        });

        aggregate.unwind({
            path: "$team_restaurant_menus",
            preserveNullAndEmptyArrays: true
        });

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
            invoice: {
                "$first": "$invoice"
            },


        });



        aggregate.project({
            _id: 1,
            teamMemberOrder: 1,
            team_restaurant_menus: 1,
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
                            $ifNull: [{
                                '$arrayElemAt': ['$restaurants.restaurant_logo', 0]
                            }, config.restaurantDemoLogoPath]
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
                        },
                        pre_order_accepted: {
                            '$arrayElemAt': ['$restaurants.pre_order_accepted', 0]
                        },
                    }], 0
                ]
            },
            restaurant_menus: "$restaurant_menus",
            invoice: {
                $cond: { // Checking if user type social and image not uploaded
                    if: {
                        $eq: ["$invoice", null]
                    },
                    then: "$invoice",
                    else: {
                        $concat: [config.liveUrl, "$invoice"]
                    },
                }
            }

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

    createInvoice: function (data, callback) {

        // const invoice = {
        //     shipping: {
        //         name: "John Doe",
        //         address: "1234 Main Street",
        //         city: "San Francisco",
        //         state: "CA",
        //         country: "US",
        //         postal_code: 94111
        //     },
        //     items: [{
        //             item: "TC 100",
        //             quantity: 2,
        //             amount: 6000
        //         },
        //         {
        //             item: "USB_EXT",
        //             quantity: 1,
        //             amount: 2000
        //         }
        //     ],
        //     subtotal: 8000,
        //     paid: 0,
        //     invoice_nr: 1234
        // };


        createInvoice(data, config.uploadInvoicePath + data.invoice_name);

        //callback(true);

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

            let restDetails = await restaurantScema.findOne({
                _id: orderDetails.restaurant_id

            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            if (orderDetails.orderType == 'TEAM' && orderDetails.childOrderIds.length > 0) {
                // This is team order

                let foodride_bonus_clover = 250 * orderDetails.childOrderIds.length;
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
                var invoice_list = [];



                //console.log("allorderDetails", allorderDetails)
                async.forEach(allorderDetails, function (order, callback) {

                        let invoice_name = "Ezfoodie-Order-" + order.orderId + ".pdf";
                        //invoice_list = await teamDelivery(order, restDetails, invoice_name);
                        orderSchema.update({
                                _id: order._id
                            }, {
                                $set: {
                                    orderStatus: 'Delivered',
                                    invoice: config.InvoicePath + invoice_name
                                }
                            },
                            async function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    if (restDetails != null || restDetails != undefined) {

                                        if (order.orderDetails.length > 0) {

                                            var mail_body = '';
                                            var items = [];
                                            var invoiceItemTotal = [0];
                                            async.forEach(order.orderDetails, function (item, callBack) {
                                                var itemTotal = '';
                                                let addon_name = [];
                                                let addon_total = [0];
                                                mail_body += `<li style="margin-bottom: 27px;color: #9a9a9a; font-size: 10px;"><span style="display: block; color: #4f4f4f; font-size: 13px;">` + item.productName
                                                if (item.addon == true) {

                                                    async.forEach(item.addon_items_details, function (customize_item, callBack) {
                                                        addon_name.push(customize_item.name);
                                                        addon_total.push(customize_item.price != null ? customize_item.price : 0);
                                                        callBack();
                                                    });

                                                    mail_body += `<br><span style="font-size: 10px;color:#7cb044;">Addons:` + addon_name.toString() + `</span></span>`
                                                    itemTotal = parseInt(item.price) * parseInt(item.qty) + addon_total.reduce((sum, elem) => sum + elem);
                                                    invoiceItemTotal.push(itemTotal);
                                                } else {
                                                    mail_body += '</span>'
                                                    itemTotal = parseInt(item.price) * parseInt(item.qty);
                                                    invoiceItemTotal.push(itemTotal);
                                                }
                                                items.push({
                                                    item: item.productName,
                                                    quantity: item.qty,
                                                    amount: itemTotal
                                                });
                                                mail_body += `<span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;">` + itemTotal + `</span>(` + item.qty + ` X ` + itemTotal + `)</li>`;
                                                callBack();
                                            });


                                        }

                                        let promocode = order.promoClovers != undefined ? order.promoClovers : [];
                                        let totalEarnReward = 0;
                                        let totalDeductReward = 0;
                                        let promo_invoice = null;
                                        let clover_invoice = null;
                                        if (promocode.length > 0) {
                                            async.forEach(promocode, function (item, callBack) {

                                                promo_invoice = item.promocode != '' ? {
                                                    name: item.promocode,
                                                    discount: item.promocodeDeductedAmount
                                                } : null;
                                                clover_invoice = item.rewardDeductedAmount != 0 ? item.rewardDeductedAmount : null;
                                                promocode = item.promocode != '' ? '<li style="margin-bottom: 27px; font-weight:700"><span style="display: block; color: #4f4f4f; font-size: 13px;">Promo - (' + item.promocode + ')</span><span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;">$' + item.promocodeDeductedAmount + '</span></li>' : '';
                                                promocode += item.rewardDeductedAmount != 0 ? '<li style="margin-bottom: 27px; font-weight:700"><span style="display: block; color: #4f4f4f; font-size: 13px;">Clover Discount</span><span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;">$' + item.rewardDeductedAmount + '</span></li>' : '';
                                                totalEarnReward = item.cartDetails.restaurantBasedRewardPoint;
                                                totalDeductReward = item.deductedRedeemPoint;
                                                callBack();
                                            });

                                        }



                                        let User = await UserSchema.findOne({
                                            _id: order.userId
                                        }, function (err, result) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": err,
                                                    "response_data": {}
                                                });

                                            }
                                        })

                                        let invoice = {
                                            User: {
                                                name: User.name,
                                                email: User.email,
                                                phone: User.country_code + '-' + User.phone_no,
                                            },
                                            restaurant: {
                                                name: restDetails.name,
                                                address: restDetails.address
                                            },
                                            items: items,
                                            tax: order.transactionFees,
                                            subtotal: invoiceItemTotal.reduce((sum, elem) => sum + elem),
                                            promo: promo_invoice,
                                            clover: clover_invoice,
                                            total: order.transactionAmount + order.transactionFees,
                                            paid: 0,
                                            invoice_nr: order.orderId,
                                            invoice_name: invoice_name
                                        };




                                        var totalEarn = User.rewardPoint + totalEarnReward;
                                        var totalBalance = User.redeemReward + totalDeductReward;
                                        if (order.userId == orderDetails.userId) {

                                            totalEarn = totalEarn + foodride_bonus_clover;

                                        }
                                        await UserSchema.update({
                                                _id: User._id
                                            }, {
                                                $set: {
                                                    rewardPoint: totalEarn,
                                                    redeemReward: totalBalance
                                                }
                                            },
                                            function (err, result) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": err,
                                                        "response_data": {}
                                                    });

                                                }
                                            })

                                        new Promise((resolve, reject) => {
                                            mailProperty('orderDelivered')(order.buyer_email, {
                                                name: order.buyer_name,
                                                orderId: order.orderId,
                                                orderStatus: 'Delivered',
                                                email: order.buyer_email,
                                                restaurant_name: restDetails.name,
                                                restaurant_logo: restDetails.restaurant_logo == null ? config.liveUrl + config.restaurantDemoLogoPath : config.liveUrl + restDetails.restaurant_logo,
                                                restaurant_address: restDetails.address,
                                                order_body: mail_body,
                                                invoice_link: config.liveUrl + config.InvoicePath + invoice_name,
                                                promocode: promocode,
                                                transactionAmount: order.transactionAmount,
                                                transactionFees: order.transactionFees,
                                                total: order.transactionAmount + order.transactionFees,
                                                site_url: config.liveUrl,
                                                date: new Date()
                                            }).send();
                                        });

                                        setTimeout(() => {
                                            orderModels.createInvoice(invoice, function (response) {

                                            })
                                        }, 5000);

                                    }

                                }
                            })

                        callback()
                    },
                    function (err, content) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": {}
                            });
                        } else {

                            callback({
                                "response_code": 2000,
                                "response_message": "Order Received successfully.",
                                "response_data": invoice_list
                            });
                        }
                    })




            } else {
                // This is solo order
                let invoice_name = "Ezfoodie-Order-" + orderDetails.orderId + ".pdf";
                orderSchema.update({
                        _id: orderDetails._id
                    }, {
                        $set: {
                            orderStatus: 'Delivered',
                            invoice: config.InvoicePath + invoice_name
                        }
                    },
                    async function (err, result) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": {}
                            });
                        } else {

                            if (restDetails != null || restDetails != undefined) {

                                if (orderDetails.orderDetails.length > 0) {

                                    var mail_body = '';
                                    var items = [];
                                    var invoiceItemTotal = [0];
                                    async.forEach(orderDetails.orderDetails, function (item, callBack) {
                                        var itemTotal = '';
                                        let addon_name = [];
                                        let addon_total = [0];
                                        mail_body += `<li style="margin-bottom: 27px;color: #9a9a9a; font-size: 10px;"><span style="display: block; color: #4f4f4f; font-size: 13px;">` + item.productName
                                        if (item.addon == true) {

                                            async.forEach(item.addon_items_details, function (customize_item, callBack) {
                                                addon_name.push(customize_item.name);
                                                addon_total.push(customize_item.price != null ? customize_item.price : 0);
                                                callBack();
                                            });

                                            mail_body += `<br><span style="font-size: 10px;color:#7cb044;">Addons:` + addon_name.toString() + `</span></span>`
                                            itemTotal = parseInt(item.price) * parseInt(item.qty) + addon_total.reduce((sum, elem) => sum + elem);
                                            invoiceItemTotal.push(itemTotal);
                                        } else {
                                            mail_body += '</span>'
                                            itemTotal = parseInt(item.price) * parseInt(item.qty);
                                            invoiceItemTotal.push(itemTotal);
                                        }

                                        mail_body += `<span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;">` + itemTotal + `</span>(` + item.qty + ` X ` + itemTotal + `)</li>`;

                                        items.push({
                                            item: item.productName,
                                            quantity: item.qty,
                                            amount: itemTotal
                                        });

                                        callBack();
                                    });


                                }
                                let promocode = orderDetails.promoClovers != undefined ? orderDetails.promoClovers : [];
                                let totalEarnReward = 0;
                                let totalDeductReward = 0;

                                let promo_invoice = null;
                                let clover_invoice = null;
                                if (promocode.length > 0) {
                                    async.forEach(promocode, function (item, callBack) {
                                        promo_invoice = item.promocode != '' ? {
                                            name: item.promocode,
                                            discount: item.promocodeDeductedAmount
                                        } : null;
                                        clover_invoice = item.rewardDeductedAmount != 0 ? item.rewardDeductedAmount : null;
                                        promocode = item.promocode != '' ? '<li style="margin-bottom: 27px; font-weight:700"><span style="display: block; color: #4f4f4f; font-size: 13px;">Promo - (' + item.promocode + ')</span><span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;">$' + item.promocodeDeductedAmount + '</span></li>' : '';
                                        promocode += item.rewardDeductedAmount != 0 ? '<li style="margin-bottom: 27px; font-weight:700"><span style="display: block; color: #4f4f4f; font-size: 13px;">Clover Discount</span><span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;">$' + item.rewardDeductedAmount + '</span></li>' : '';
                                        totalEarnReward = item.cartDetails.restaurantBasedRewardPoint;
                                        totalDeductReward = item.deductedRedeemPoint;

                                        callBack();
                                    });

                                }



                                let User = await UserSchema.findOne({
                                    _id: orderDetails.userId
                                }, function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": err,
                                            "response_data": {}
                                        });

                                    }
                                })


                                var invoice = {
                                    User: {
                                        name: User.name,
                                        email: User.email,
                                        phone: User.country_code + '-' + User.phone_no,
                                    },
                                    restaurant: {
                                        name: restDetails.name,
                                        address: restDetails.address
                                    },
                                    items: items,
                                    tax: orderDetails.transactionFees,
                                    subtotal: invoiceItemTotal.reduce((sum, elem) => sum + elem),
                                    promo: promo_invoice,
                                    clover: clover_invoice,
                                    total: orderDetails.transactionAmount + orderDetails.transactionFees,
                                    paid: 0,
                                    invoice_nr: orderDetails.orderId,
                                    invoice_name: invoice_name
                                };



                                setTimeout(() => {
                                    orderModels.createInvoice(invoice, function (response) {

                                    })
                                }, 5000);



                                var totalEarn = User.rewardPoint + totalEarnReward;
                                var totalBalance = User.redeemReward + totalDeductReward;
                                await UserSchema.update({
                                        _id: User._id
                                    }, {
                                        $set: {
                                            rewardPoint: totalEarn,
                                            redeemReward: totalBalance
                                        }
                                    },
                                    function (err, result) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": err,
                                                "response_data": {}
                                            });

                                        }
                                    })

                                new Promise((resolve, reject) => {
                                    mailProperty('orderDelivered')(orderDetails.buyer_email, {
                                        name: orderDetails.buyer_name,
                                        orderId: orderDetails.orderId,
                                        orderStatus: 'Delivered',
                                        email: orderDetails.buyer_email,
                                        restaurant_name: restDetails.name,
                                        restaurant_logo: restDetails.restaurant_logo == null ? config.liveUrl + config.restaurantDemoLogoPath : config.liveUrl + restDetails.restaurant_logo,
                                        restaurant_address: restDetails.address,
                                        order_body: mail_body,
                                        invoice_link: config.liveUrl + config.InvoicePath + invoice_name,
                                        promocode: promocode,
                                        transactionAmount: orderDetails.transactionAmount,
                                        transactionFees: orderDetails.transactionFees,
                                        total: orderDetails.transactionAmount + orderDetails.transactionFees,
                                        site_url: config.liveUrl,
                                        date: new Date()
                                    }).send()
                                });



                                // setTimeout(() => {
                                //     orderModels.createInvoice(invoice, function (response) {
                                //         console.log("response11", response);
                                //     })
                                // }, 3000);


                            }

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
                                    var restaurant_name = null;
                                    restaurantScema.findOne({
                                            _id: orderDetails.restaurant_id
                                        },
                                        function (err, restDetails) {


                                            if (err) {
                                                console.log(err);
                                            } else {
                                                restaurant_name = restDetails.name;
                                                if (orderDetails.orderDetails.length > 0) {

                                                    var mail_body = '';
                                                    async.forEach(orderDetails.orderDetails, function (item, callBack) {
                                                        var itemTotal = '';
                                                        let addon_name = [];
                                                        let addon_total = [0];
                                                        mail_body += `<tr style="height:55px">\
                                                                <td style="padding: 2%;font-weight: bold;font-size: 15px; text-align: center;border-bottom: 3px solid #e9e9e9;">` + item.productName
                                                        if (item.addon == true) {

                                                            async.forEach(item.addon_items_details, function (customize_item, callBack) {
                                                                addon_name.push(customize_item.name);
                                                                addon_total.push(customize_item.price != null ? customize_item.price : 0);
                                                                callBack();
                                                            });

                                                            mail_body += `<br><span style="font-size: 10px;color:#7cb044;">Addons:` + addon_name.toString() + `</span></td>`
                                                            itemTotal = parseInt(item.price) * parseInt(item.qty) + addon_total.reduce((sum, elem) => sum + elem);
                                                        } else {
                                                            mail_body += '</td>'
                                                            itemTotal = parseInt(item.price) * parseInt(item.qty);
                                                        }

                                                        mail_body += `<td style="padding: 2%;font-weight: bold;font-size: 15px; text-align: center;border-bottom: 3px solid #e9e9e9;">` + item.qty + `</td>\
                                                                <td style="padding: 2%;font-weight: bold;font-size: 15px; text-align: right;border-bottom: 3px solid #e9e9e9;">` + itemTotal + `</td>\
                                                            </tr>`;
                                                        callBack();
                                                    });


                                                }


                                                mailProperty('orderStatusChange')(orderDetails.buyer_email, {
                                                    name: orderDetails.buyer_name,
                                                    orderId: orderDetails.orderId,
                                                    orderStatus: data.orderStatus == 'Cancel' ? 'Cancelled' : data.orderStatus,
                                                    email: orderDetails.buyer_email,
                                                    restaurant_name: restaurant_name,
                                                    order_body: mail_body,
                                                    transactionAmount: orderDetails.transactionAmount,
                                                    transactionFees: orderDetails.transactionFees,
                                                    total: orderDetails.transactionAmount + orderDetails.transactionFees,
                                                    site_url: config.liveUrl,
                                                    date: new Date()
                                                }).send();
                                            }
                                        })




                                    if (orderDetails.orderType == "TEAM" && data.orderStatus != 'Cancel') {

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

    //console.log('----checkSettingResponse----', checkSettingResponse)

    let promise = new Promise(function (resolve, reject) {

            checkSettingResponse.map(async function (data) {

                // true condition
                if (data.response_code == '2000') {

                    let clover = data.response_data.clover
                    let discount = data.response_data.discount
                    // console.log('----checkSettingResponse clover----', clover)
                    // console.log('----checkSettingResponse discount----', discount)

                    let earnClover = parseFloat(parseFloat(transactionAmount) / parseFloat(discount)) * parseFloat(clover)
                    //console.log('----checkSettingResponse earnClover----', earnClover)


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
                //console.log('checked response--->', validatedResponse)

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
                        let clover = data.response_data.clover != null ? data.response_data.clover : 0;
                        let discount = data.response_data.discount != null ? data.response_data.discount : 0
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

                            // console.log('---noOfOrderDetails----', noOfOrderDetails)
                            // console.log('---orderCreatedDate----', orderCreatedDate)
                            // console.log('---noOfOrder----', noOfOrder)
                            // console.log('---orderProvided----', orderProvided)

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