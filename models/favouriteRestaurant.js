var FavouriteRestaurantSchema = require('../schema/favouriteRestaurant');
require('../schema/temporaryCarts')
var FavouriteRestaurantModels = {


    //Favourite Restaurant listing
    favouriteRestaurantList: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }

        if (data.user_id) {
            query['user_id'] = data.user_id;
        }

        var aggregate = FavouriteRestaurantSchema.aggregate();
        aggregate.match(query);
        aggregate.lookup({
            from: 'restaurants',
            localField: 'restaurant_id',
            foreignField: '_id',
            as: 'restaurant'
        });
        aggregate.sort({
            'createdAt': -1
        })
        aggregate.project({
            _id: 1,
            restaurant_id: 1,
            user_id: 1,
            restaurant_details: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$restaurant.name', 0]
                        },
                        logo: {
                            '$arrayElemAt': ['$restaurant.restaurant_logo', 0]
                        },
                        restaurant_type: {
                            '$arrayElemAt': ['$restaurant.restaurant_type', 0]
                        },
                        status: {
                            '$arrayElemAt': ['$restaurant.status', 0]
                        },
                    }], 0
                ]
            },
        });
        var options = {
            page: page,
            limit: limit
        }

        FavouriteRestaurantSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Favourite Restaurant list",
                    "response_data": data
                });
            }
        });

    },

    // },
    addFavouriteRestaurant: function (data, callback) {
        if (data) {

            FavouriteRestaurantSchema.find({
                restaurant_id: data.restaurant_id,
                user_id: data.user_id,
            }, {}).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    if (result.length > 0) {
                        callback({
                            "response_code": 2008,
                            "response_message": "Restaurant already in your favourite list .",
                            "response_data": {}
                        });
                    } else {
                        new FavouriteRestaurantSchema(data).save(function (err, result) {
                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {

                                callback({
                                    "response_code": 2000,
                                    "response_message": "Restaurant Added to Favourite List",
                                    "response_data": {}
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
    removeFavouriteRestaurant: function (data, callback) {
        query = {};
        if (data) {
            if (data._id) {
                query['_id'] = data._id;
            } else {
                query['user_id'] = data.user_id;
                query['restaurant_id'] = data.restaurant_id;
            }
            FavouriteRestaurantSchema.find(query, {}).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {

                    if (result.length > 0) {
                        FavouriteRestaurantSchema.remove({
                                _id: result[0]._id
                            },
                            async function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Restaurant removed from your favourite list successfully",
                                        "response_data": {}
                                    });
                                }
                            }
                        )
                    } else {
                        callback({
                            "response_code": 2008,
                            "response_message": "Restaurant not in your favourite list .",
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

}
module.exports = FavouriteRestaurantModels;