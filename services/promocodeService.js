var PromocodeModels = require('../models/promocode');

var PromocodeService = {

//#region Promocode

    addPromocodeService: function (promocodeData, callback) {
    PromocodeModels.addPromocodeModel(promocodeData, function (res) {
        callback(res);
    })
    },
    listPromocodeService: function (promocodeData, callback) {
        PromocodeModels.promocodeList(promocodeData, function (res) {
            callback(res);
        })
    },
    editPromocodeService: function (promocodeData, callback) {
        PromocodeModels.editPromocodeModel(promocodeData, function (res) {
            callback(res);
        })
    },
    deletePromocodeService: function (promocodeData, callback) {
        PromocodeModels.deletePromocodeModel(promocodeData, function (res) {
            callback(res);
        })
    },    
    getAllPromocodeService: function (promocodeData, callback) {
        PromocodeModels.getAllPromocodeModel(promocodeData, function (res) {
            callback(res);
        })
    },
    getPromocodeByMonthService: function (promocodeData, callback) {
        PromocodeModels.getPromocodeByMonthModel(promocodeData, function (res) {
            callback(res);
        })
    },
    applyPromocodeService: function (promocodeData, callback) {
        PromocodeModels.applyPromocodeModel(promocodeData, function (res) {
            callback(res);
        })
        
    },
    deletePromocodeLogService: function (promocodeData, callback) {
        PromocodeModels.deletePromocodeLogModel(promocodeData, function (res) {
            callback(res);
        })        
    }
//#endregion Promocode

};
module.exports = PromocodeService;