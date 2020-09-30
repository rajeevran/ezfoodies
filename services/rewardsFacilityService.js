var RewardsFacilityModels = require('../models/rewards');

var RewardsFacilityService = {

    //#region RewardsFacility
    // addRewardsFacility,rewardsFacilityList,rewardsFacilityDetails,editRewardsFacility,editStatus,
    // deleteRewardsFacility,deleteRewardsFacilityLogModel,applyRewardsFacilityModel
    addRewardsFacilityService: function (rewardsFacilityData, callback) {
        RewardsFacilityModels.addRewardsFacility(rewardsFacilityData, function (res) {
            callback(res);
        })
    },
    listRewardsFacilityService: function (rewardsFacilityData, callback) {
        RewardsFacilityModels.rewardsFacilityList(rewardsFacilityData, function (res) {
            callback(res);
        })
    },
    editRewardsFacilityService: function (rewardsFacilityData, callback) {
        RewardsFacilityModels.editRewardsFacility(rewardsFacilityData, function (res) {
            callback(res);
        })
    },
    detailsRewardsFacilityService: function (rewardsFacilityData, callback) {
        
        RewardsFacilityModels.rewardsFacilityDetails(rewardsFacilityData, function (res) {
            callback(res);
        })
    },
    deleteRewardsFacilityService: function (rewardsFacilityData, callback) {
        RewardsFacilityModels.deleteRewardsFacility(rewardsFacilityData, function (res) {
            callback(res);
        })
    },
    applyRewardsFacilityService: function (rewardsFacilityData, callback) {
        RewardsFacilityModels.applyRewardsFacilityModel(rewardsFacilityData, function (res) {
            callback(res);
        })

    },
    editRewardsFacilityStatus: function (rewardsFacilityData, callback) {
        RewardsFacilityModels.editRewardsFacilityStatusModel(rewardsFacilityData, function (res) {
            callback(res);
        })
    },
    deleteRewardsFacilityLogService: function (rewardsFacilityData, callback) {
        RewardsFacilityModels.deleteRewardsFacilityLogModel(rewardsFacilityData, function (res) {
            callback(res);
        })
    }
    //#endregion RewardsFacility

};
module.exports = RewardsFacilityService;