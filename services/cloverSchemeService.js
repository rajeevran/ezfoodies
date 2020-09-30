var CloversEarnScema = require('../schema/cloversEarnSchem');
var MenuItemModel = require('../models/menuItem');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var async = require("async");
var fs = require('fs');
var CloversSchemeService = {

    cloversSchemeList: function (data, callback) {
        var query = {};
        var sortby = -1;
        if (data._id) {
            query['_id'] = data._id;
        }
        if (data.sortby) {
            sortby = data.sortby;
        }

        CloversEarnScema.find(query, {
                _id: 1,
                name: 1,
                sub_title: 1,
                clovers_point: 1,
                applicable: 1,
                status: 1
            })
            .sort({
                'createdAt': sortby
            })
            .exec(function (err, result) {
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
                        "message": "Clovers Schema List",
                        "response": result
                    })
                }
            });

    },

    addCloversScheme: function (data, callback) {
        if (!data.name || typeof data.name === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide name",
                "response": []
            });
        } else if (!data.clovers_point || typeof data.clovers_point === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide clover point",
                "response": []
            });
        } else if (!data.type || typeof data.type === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide clover type",
                "response": []
            });
        } else {

            CloversEarnScema.findOne({
                    type: data.type
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
                        if (resData == null) {


                            data._id = new ObjectID;

                            new CloversEarnScema(data).save(function (err, result) {

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
                        } else {
                            callback({
                                "success": false,
                                "STATUSCODE": 5002,
                                "message": "Same Clovers Sceme Already Exist",
                                "response": []
                            });
                        }
                    }
                }
            )


        }
    },

    editCloversScheme: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {

            CloversEarnScema.update({
                    _id: data._id
                }, {
                    $set: {
                        name: data.name,
                        sub_title: data.sub_title,
                        clovers_point: data.clovers_point

                    }
                },
                function (err, resUpdate) {
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
                            "message": "Updated Successfully",
                        })
                    }
                });

        }
    },
    updateCloversSchemeStatus: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
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

            CloversEarnScema.update({
                    _id: data._id
                }, {
                    $set: {
                        status: data.status

                    }
                },
                function (err, resUpdate) {
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
                            "message": "Status Updated Successfully",
                        })
                    }
                });

        }
    },
    deleteCloversScheme: function (id, callback) {
        if (!id || typeof id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide id",
                "response": []
            });
        } else {
            CloversEarnScema.findOne({
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


                            CloversEarnScema.remove({
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
                                            "message": "Deleted successfully",
                                            "response": []
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "success": false,
                                "STATUSCODE": 5002,
                                "message": "Data Not found",
                                "response": []
                            });
                        }
                    }
                }
            )
        }
    },

};
module.exports = CloversSchemeService;