var PaymentModels = require('../models/payment');

var PaymentService = {

//#region Payment

    addPaymentService: function (paymentData, callback) {
    PaymentModels.addPaymentModel(paymentData, function (res) {
        callback(res);
    })
    },
    listPaymentService: function (paymentData, callback) {
        PaymentModels.listPaymentModel(paymentData, function (res) {
            callback(res);
        })
    },
    editPaymentService: function (paymentData, callback) {
        PaymentModels.editPaymentModel(paymentData, function (res) {
            callback(res);
        })
    },
    deletePaymentService: function (paymentData, callback) {
        PaymentModels.deletePaymentModel(paymentData, function (res) {
            callback(res);
        })
    },    
    getAllPaymentService: function (paymentData, callback) {
        PaymentModels.getAllPaymentModel(paymentData, function (res) {
            callback(res);
        })
    },
    getPaymentByMonthService: function (paymentData, callback) {
        PaymentModels.getPaymentByMonthModel(paymentData, function (res) {
            callback(res);
        })
    },
    
//#endregion Payment

};
module.exports = PaymentService;