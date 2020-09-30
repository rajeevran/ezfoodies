var RestaurantModels = require('../models/restaurant');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var async = require("async");
var RestaurantService = {
    restaurantList: function (data, callback) {

        RestaurantModels.restaurantAll(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    // restaurantDetails: function (data, callback) {
    //     RestaurantSchema.findOne({
    //         _id: data._id
    //     }).exec(function (err, result) {
    //         if (err) {
    //             callback({
    //                 "response_code": 5005,
    //                 "response_message": "INTERNAL DB ERROR",
    //                 "response_data": []

    //             });
    //         } else {
    //             callback({
    //                 "response_code": 2000,
    //                 "response_message": "Restaurant Details",
    //                 "response_data": result

    //             });
    //         }
    //     })
    // },
    // EditRestaurant: function (data, callback) {
    //     RestaurantSchema.update({
    //             _id: data._id
    //         }, {
    //             $set: {
    //                 name: data.name,
    //                 address: data.address,
    //                 operating_hours: data.operating_hours,
    //                 location: data.location,
    //                 short_desc: data.short_desc
    //             }
    //         },
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
    //                     "response_message": "Description has been updated.",
    //                     "response_data": result,
    //                     "data": data

    //                 });
    //             }
    //         });
    // },
    //Insert Organization
    AddRestaurant: function (data, fileData, callback) {
        if (!data.name || typeof data.name === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide name",
                "response": []
            });
        } else if (!data.restaurant_manager_id || typeof data.restaurant_manager_id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select restaurant manager",
                "response": []
            });
        } else {

            //console.log('ss',JSON.parse(data.opening_hours));
            data.opening_hours = JSON.parse(data.opening_hours);
            //data.contact_timing = JSON.parse(data.contact_timing);
            data.closing_days = JSON.parse(data.closing_days);
            data.restaurant_type = JSON.parse(data.restaurant_type);
            data._id = new ObjectID;

            RestaurantModels.addRestaurant(data, fileData, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }

    },
    updateRestaurant: function (data, fileData, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide name",
                "response": []
            });
        } else {


            //console.log('ss',JSON.parse(data.opening_hours));
            data.opening_hours = JSON.parse(data.opening_hours);
            //data.contact_timing = JSON.parse(data.contact_timing);
            data.closing_days = JSON.parse(data.closing_days);
            data.restaurant_type = JSON.parse(data.restaurant_type);
            RestaurantModels.updateRestaurant(data, fileData, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }

    },
    // Update Restaurant Status
    updateRestaurantStatus: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide status",
                "response": []
            });
        } else {


            RestaurantModels.updateRestaurantStatus(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }
    },
    // Update Restaurant Reward
    updateRestaurantReward: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else if (!data.rewardId || typeof data.rewardId === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide rewardId",
                "response": []
            });
        } else {


            RestaurantModels.updateRestaurantReward(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }
    },
    // Update Restaurant Feature
    updateRestaurantFeature: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else if (!data.featured || typeof data.featured === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide featured status",
                "response": []
            });
        } else {


            RestaurantModels.updateRestaurantFeature(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }
    },
    // Update Restaurant Busy Mode
    updateRestaurantMode: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else if (!data.busy_mode || typeof data.busy_mode === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide mode",
                "response": []
            });
        } else {


            RestaurantModels.updateRestaurantMode(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }
    },
    updateRestaurantPreOrder: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide restaurant id",
                "response": []
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide status",
                "response": []
            });
        } else {


            RestaurantModels.updateRestaurantPreOrder(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }
    },
    deleteRestaurant: function (id, callback) {
        if (!id || typeof id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {
            RestaurantModels.deleteRestaurant(id, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });
        }
    }

};
module.exports = RestaurantService;