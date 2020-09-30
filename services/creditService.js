var CreditSystemModels = require('../models/creditSystem');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var async = require("async");
var creditService = {
    creditSystemList: function (data, callback) {

        CreditSystemModels.creditSystemList(data, function (result) {
            callback({
                "success": result.response_code == 2000 ? true : false,
                "STATUSCODE": result.response_code,
                "message": result.response_message,
                "response": result.response_data
            })
        });
    },
    addCreditSystem: function (data, callback) {
        if (!data.order_type || typeof data.order_type === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select order type",
                "response": []
            });
        } else if (!data.type || typeof data.type === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select type",
                "response": []
            });
        } else if (!data.discount_amount || typeof data.discount_amount === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide discount amount",
                "response": []
            });
        } else if (!data.min_amount || typeof data.min_amount === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide minimum amount",
                "response": []
            });
        } else if (!data.days || typeof data.days === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide days",
                "response": []
            });
        } else if (!data.reason || typeof data.reason === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide reason",
                "response": []
            });
        } else {


            data._id = new ObjectID;

            CreditSystemModels.addCreditSystem(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }

    },
    updateCreditSystem: function (data, callback) {
        console.log('updtaed data----', data)

        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide credit id",
                "response": []
            });
        } else if (!data.order_type || typeof data.order_type === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select order type",
                "response": []
            });
        } else if (!data.type || typeof data.type === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please select type",
                "response": []
            });
        } else if (!data.discount_amount || typeof data.discount_amount === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide discount amount",
                "response": []
            });
        } else if (!data.min_amount || typeof data.min_amount === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide minimum amount",
                "response": []
            });
        } else if (!data.days || typeof data.days === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide days",
                "response": []
            });
        } else if (!data.reason || typeof data.reason === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide reason",
                "response": []
            });
            // } else if (!data.allowed_times || typeof data.allowed_times === undefined) {

            //     data.allowed_times = 0;
            //     callback({
            //         "success": false,
            //         "STATUSCODE": 5002,
            //         "message": "please provide allowed_times",
            //         "response": []
            //     });

            // } else if (!data.dead_line || typeof data.dead_line === undefined) {

            //     data.dead_line = 'no';
            //     callback({
            //         "success": false,
            //         "STATUSCODE": 5002,
            //         "message": "please provide dead_line",
            //         "response": []
            //     });

        } else {

            if (!data.allowed_times || typeof data.allowed_times === undefined) {
                data.allowed_times = 0;
            }
            if (!data.dead_line || typeof data.dead_line === undefined) {
                data.dead_line = 'no';
            }

            CreditSystemModels.updateCreditSystem(data, function (result) {
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
    updateCreditStatus: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide credit id",
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


            CreditSystemModels.updateCreditStatus(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }
    },
    //Update User Credit System
    updateUserCredit: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide credit id",
                "response": []
            });
        } else if (!data.userID || typeof data.userID === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide user id",
                "response": []
            });
        } else {


            CreditSystemModels.updateUserCredit(data, function (result) {
                callback({
                    "success": result.response_code == 2000 ? true : false,
                    "STATUSCODE": result.response_code,
                    "message": result.response_message,
                    "response": result.response_data
                })
            });


        }
    },
    //Apply Credit Discount
    applyCreditDiscount: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.creditId || typeof data.creditId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide credit id",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            CreditSystemModels.applyCreditDiscount(data, function (result) {
                callback(result);

            });
        }

    },
    //Update Credit Discount
    updateCreditDiscount: (data, callback) => {
        if (!data.creditLogId || typeof data.creditLogId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide credit log id",
                "response_data": {}
            });
        } else if (!data.orderId || typeof data.orderId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide order id",
                "response_data": {}
            });
        } else {
            CreditSystemModels.updateCreditDiscount(data, function (result) {
                callback(result);

            });
        }

    },
    //Delete Credit Discount
    deleteCreditDiscount: (data, callback) => {
        if (!data.creditLogId || typeof data.creditLogId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide credit log id",
                "response_data": {}
            });
        } else {
            CreditSystemModels.deleteCreditDiscount(data, function (result) {
                callback(result);

            });
        }

    },
};
module.exports = creditService;