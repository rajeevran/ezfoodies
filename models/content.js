var mongoose = require("mongoose");
var ContentSchema = require('../schema/contents');
var BannerSchema = require('../schema/banner');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var async = require("async");
var ContentModels = {
    addContent: function (data, callback) {

        if (data) {
            ContentSchema.count({
                content_type: data.content_type
            }).exec(function (err, resCount) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    if (resCount > 0) {
                        callback({
                            "response_code": 2008,
                            "response_message": "Content already exist.Please modify that.",
                            "response_data": {}
                        });
                    } else {

                        new ContentSchema(data).save(function (err, result) {
                            if (err) {

                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {

                                callback({
                                    "response_code": 2000,
                                    "response_message": "Content Add Successfully",
                                    "response_data": result
                                });
                            }
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
    contentDetails: function (data, callback) {
        ContentSchema.findOne({
            content_type: data.content_type
        }, {
            title: 1,
            description: 1,
            content_type: 1,
            home_page_slider: 1
        }).exec(function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": []
                });
            } else {
                callback({
                    "response_code": 2000,
                    "response_message": "Content Details",
                    "response_data": result
                });
            }
        });
    },
    contentList: function (callback) {
        ContentSchema.find(
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
                        "response_message": "Content list",
                        "response_data": result
                    });
                }
            });
    },
    editContent: function (data, fileData, callback) {

        async.waterfall([
                function (nextCb) {
                    ContentSchema.findOne({
                            content_type: data.content_type,
                            _id: data._id
                        },
                        function (err, resData) {
                            if (err) {
                                nextcb(err);
                            } else {
                                if (resData == null) {
                                    callback({
                                        "success": false,
                                        "STATUSCODE": 5002,
                                        "message": "Data not found",
                                        "response": []
                                    });
                                } else {
                                    data.home_page_slider = resData.home_page_slider;

                                    if (fileData) {

                                        var images = fileData;
                                        var timeStamp = Date.now();
                                        var folderpath = config.uploadSliderPicPath;
                                        var imagePath = config.sliderPicPath;
                                        var count = 0;
                                        var imagesArray = [];
                                        if (images) {
                                            //if (images.length != undefined) {

                                            async.each(images, function (file, callback) {
                                                console.log('single file', file);
                                                let split = file
                                                    .mimetype
                                                    .split("/");
                                                if (split[1] = "jpeg" || "png" || "jpg") {
                                                    count = count + 1;
                                                    var ext = file.name.slice(file.name.lastIndexOf('.'));
                                                    var fileName = timeStamp + `_${count}${ext}`;
                                                    file.mv(
                                                        folderpath + fileName,
                                                        function (err) {
                                                            if (err) {
                                                                callback({
                                                                    "success": false,
                                                                    "STATUSCODE": 5005,
                                                                    "message": "Image not uploaded",
                                                                });
                                                            } else {
                                                                imagesArray.push(imagePath + fileName);
                                                                console.log('File processed');
                                                                callback();
                                                            }
                                                        });
                                                } else {
                                                    callback({
                                                        "success": false,
                                                        "STATUSCODE": 5002,
                                                        "message": "MIME type not allowed please upload jpg or png file",
                                                    });
                                                }
                                            }, function (err) {
                                                if (err) {
                                                    console.log('A file failed to process');
                                                } else {
                                                    console.log('All files have been processed successfully');
                                                    data.home_page_slider = imagesArray;
                                                    // let home_page_slider = `./public/${resData.home_page_slider}`;

                                                    // if (fs.existsSync(home_page_slider)) {
                                                    //     fs.unlink(home_page_slider, (err) => {
                                                    //         if (err) throw err;
                                                    //         console.log('successfully deleted');
                                                    //     });
                                                    // }
                                                    nextCb(null, {
                                                        "response_code": 2000,
                                                        "response_data": resData

                                                    });
                                                }
                                            });

                                            //}


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
                        ContentSchema.update({
                                _id: data._id,
                                content_type: data.content_type
                            }, {
                                $set: {
                                    title: data.title,
                                    description: data.description,
                                    home_page_slider: data.home_page_slider
                                }
                            },
                            function (err, result) {
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
                        "success": false,
                        "STATUSCODE": 5005,
                        "message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    callback({
                        "success": true,
                        "STATUSCODE": 2000,
                        "message": "Updated Successfully",
                        "response_data": {}
                    });
                }
            });

    },
    addBanner: function (data, callback) {

        if (data) {
            new BannerSchema(data).save(function (err, result) {
                if (err) {

                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {

                    callback({
                        "response_code": 2000,
                        "response_message": "Banner Add Successfully",
                        "response_data": result
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
    bannerList: function (data, callback) {

        var page = 1,
            limit = 20,
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
        if (data.slider_type) {
            query['slider_type'] = data.slider_type;
        }


        var aggregate = BannerSchema.aggregate();
        aggregate.match(query);

        aggregate.unwind({
            path: "$restaurant_ids",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'restaurants',
            localField: 'restaurant_ids',
            foreignField: '_id',
            as: 'restaurants'
        });
        aggregate.unwind({
            path: "$restaurants",
            preserveNullAndEmptyArrays: true
        });
        aggregate.group({
            "_id": "$_id",
            opening_hours: {
                "$first": "$opening_hours"
            },
            slider_type: {
                "$first": "$slider_type"
            },
            home_page_slider: {
                "$first": "$home_page_slider"
            },
            restaurant_ids: {
                "$addToSet": "$restaurant_ids"
            },
            restaurants: {
                "$addToSet": "$restaurants"
            },
        });
        aggregate.project({
            _id: 1,
            opening_hours: 1,
            slider_type: 1,
            home_page_slider: 1,
            restaurant_ids: 1,
            restaurants: "$restaurants",
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }
        BannerSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
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
                    "response_code": 2000,
                    "response_message": "Slider list",
                    "response_data": data
                });
            }
        });

    },
    editBanner: function (data, fileData, callback) {


        if (fileData != null && fileData.slider) {
            var imageFile = fileData.slider;
            var timeStamp = Date.now();
            var folderpath = config.uploadSliderPicPath;
            var fileName = timeStamp + imageFile.name;
            var imagePath = config.sliderPicPath;

            let split = imageFile
                .mimetype
                .split("/");

            if (split[1] = "jpeg" || "png" || "jpg") {
                imageFile.mv(
                    folderpath + fileName,
                    function (err) {

                        if (err) {
                            callback({
                                "success": false,
                                "STATUSCODE": 5005,
                                "message": "Image not uploaded",
                            });
                        } else {
                            data.home_page_slider = imagePath + fileName;

                            BannerSchema.update({
                                    _id: data._id
                                }, {
                                    $set: {
                                        opening_hours: data.opening_hours,
                                        restaurant_ids: data.restaurant_ids,
                                        home_page_slider: data.home_page_slider,
                                        slider_type: data.slider_type
                                    }
                                },
                                function (err, result) {
                                    if (err) {
                                        callback({
                                            "success": false,
                                            "STATUSCODE": 5005,
                                            "message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {

                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Banner Updated Successfully",
                                            "response_data": {}
                                        });
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
        } else {

            BannerSchema.update({
                    _id: data._id
                }, {
                    $set: {
                        opening_hours: data.opening_hours,
                        restaurant_ids: data.restaurant_ids,
                        slider_type: data.slider_type
                    }
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "success": false,
                            "STATUSCODE": 5005,
                            "message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {

                        callback({
                            "response_code": 2000,
                            "response_message": "Banner Updated Successfully",
                            "response_data": {}
                        });
                    }
                });
        }
    }
}
module.exports = ContentModels;