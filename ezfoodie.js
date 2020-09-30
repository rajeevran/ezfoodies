var express = require('express');
var fileUpload = require('express-fileupload');
var mongoose = require('mongoose');
var bodyparser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var methodOverride = require('method-override');
var _ = require('lodash');
var fs = require('fs');
const socketIo = require("socket.io");
var apiService = require('./services/apiService');
var fs = require('fs');
var i18n = require('./i18n');
var config = require("./config");
var rp = require('request-promise');

//var apiService = require('./services/apiService');
//========================Create the application======================
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// This line is from the Node.js HTTPS documentation.

var credentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/fullchain.pem', 'utf8')
  };
var server = require('https').createServer(credentials, app);
//server.setTimeout(10 * 60 * 1000);
var io = require('socket.io').listen(server);

//var server = require('http').createServer(app);
//==============Add middleware necessary for REST API's===============
app.use(bodyparser.json({limit: '50mb'}));
app.use(bodyparser.urlencoded(
    {
        limit: '50mb',
        parameterLimit: 100000, 
        extended: true 
    }));
app.use(bodyparser.json());
app.use(fileUpload());
app.use(cookieParser());
app.use(methodOverride('X-HTTP-Method-Override'));
//==========Add module to recieve file from angular to node===========
//app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(express.static(__dirname + '/public'));
//===========================CORS support==============================
app.use(function (req, res, next) {
    req.setEncoding('utf8');
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, user_id, authtoken");
    //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    res.setHeader("Access-Control-Allow-Credentials", true);

    if ('OPTIONS' == req.method) {
        res.sendStatus(200)
       // res.send(200);
    } else {
        next();
    }
});

//=========================Load the routes===============================
// var apiRoutesUser = require('./routes/apiRoutesUser.js')(app, express);
// var apiRoutesInstaller = require('./routes/apiRoutesInstaller.js')(app, express);

// app.use('/apiUser', apiRoutesUser);
// app.use('/apiInstaller', apiRoutesInstaller);

//i18n module as middleware //
app.use(i18n);
//i18n module as middleware //

var apiRoutes = require('./routes/apiRoutes.js');
app.use('/api', apiRoutes);


var adminRoutes = require('./routes/adminRoutes.js');
app.use('/admin', adminRoutes);

// var adminRoutes = require('./routes/adminRoutes.js')(app, express);
// app.use('/admin', adminRoutes);

// var adminRoutes = require('./routes/adminRoutes.js')(app, express);
// app.use('/admin', adminRoutes);
//=========================Load the views================================
app.get("*", function (req, res) {
    res.redirect('https://' + req.headers.host + req.url);
    res.sendFile(__dirname + '/public/client/views/index.html');
});
//===========================Connect to MongoDB==========================
// producation config or local config
var producationString = "mongodb://" + config.production.username + ":" + config.production.password + "@" + config.production.host + ":" + config.production.port + "/" + config.production.dbName + "?authSource=" + config.production.authDb;
//var producationString = config.local.database;
var options = {
    useNewUrlParser: true
};
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
var db = mongoose.connect(producationString, options, function (err) {
    if (err) {
        console.log(err + "connection failed");
    } else {
        console.log('Connected to database ');
    }
});
//mongo on connection emit
mongoose.connection.on('connected', function (err) {
    console.log("mongo Db conection successfull");
});
//mongo on error emit
mongoose.connection.on('error', function (err) {
    console.log("MongoDB Error: ", err);
});
//mongo on dissconnection emit
mongoose.connection.on('disconnected', function () {
    console.log("mongodb disconnected and trying for reconnect");
    mongoose.connectToDatabase();
});
mongoose.set('debug', false);

//===========================Connect to MongoDB==========================
//===========================Socket====================================

nicknames = {};
connected_user = [];
io.sockets.on('connection', function (socket) {
    console.log(socket.id + 'a user connected');

    //connection.push(socket);

    socket.on('join_order', function (data) {
        console.log("data.user_id", data);
        socket.join(data._id);
        //socket.join('order room');

    });

    socket.on('order_list', function (data) {
        console.log("enter data", data);
        var options = {
            method: 'POST',
            uri: config.liveUrl + 'admin/order-list',
            form: {
                _id: data._id
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-access-token': data.authToken
            },
            json: true,
            rejectUnauthorized: false,
            requestCert: true
        };
        rp(options)
            .then(function (repos) {
                
                // console.log("socket", socket);
                // console.log("socket.id", socket.id);
                if (repos.STATUSCODE === 2000) {
                    console.log("repos_2000", repos);
                    console.log("repos.docs[0].userId",repos.response.docs[0].userId);
                    //io.sockets.in(data._id).emit('orderDetails', repos);
                    if(repos.response.docs[0].userId != undefined || repos.response.docs[0].userId != null ){
                        console.log("enter socket", data);
                        io.sockets.in(repos.response.docs[0].userId).emit('orderDetails', repos);
                    }
                    
                    //io.sockets.in('order room').emit('orderDetails', repos);
                    //socket.emit('restaurantStatus', repos);
                } else {
                    socket.emit('orderDetails', repos);
                }
            })
            .catch(function (err) {

                console.log('err', err);
            });

        //}
    });

    socket.on('restStatus', function (data) {
        //console.log("data", data);
        var options = {
            method: 'PUT',
            uri: config.liveUrl + 'admin/update-restaurant-status',
            form: {
                _id: data._id,
                status: data.status
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-access-token': data.authToken
            },
            json: true,
            rejectUnauthorized: false,
            requestCert: true
        };
        rp(options)
            .then(function (repos) {
                // console.log("socket", socket);
                // console.log("socket.id", socket.id);
                if (repos.STATUSCODE === 2000) {
                    console.log("repos_2000", repos);
                    io.sockets.in("order room").emit('restaurantStatus', repos);
                    //io.sockets.in(data._id).emit('restaurantStatus', repos);
                    socket.emit('restaurantStatus', repos);
                } else {
                    //socket.emit('restaurantStatus', repos);
                }
            })
            .catch(function (err) {

                console.log('err', err);
            });

        //}
    });

    // TeamChat Start

    //new user 
    socket.on('new user', function (data, callback) {

        //console.log("connected------>", nicknames)


        socket.join(data.user_id);

        const index = connected_user.indexOf(data.user_id);

        if (index == -1) {
            connected_user.push(data.user_id);
        }

        updateNicknames();


        // if (nicknames.hasOwnProperty(data.user_id)) { //We check if data received is in nicknames array
        //     //callback(false);
        //     return false;
        // } else {
        //     //callback(true);
        //     socket.nickname = data.user_id;
        //     nicknames[socket.nickname] = {
        //         online: true
        //     }; //Then we put an object with a variable online

        //     console.log('user connected: ' + socket.nickname);
        //     //  io.emit('update_personal', nicknames + ': Online');

        //     updateNicknames();
        //     console.log("connected stage 2------>", nicknames)
        // }
    });

    // update all user name

    function updateNicknames() {
        io.sockets.emit('chatUserList', connected_user);

    }

    // Get Message

    socket.on('previous chat list', function (data) {

        var options = {
            method: 'POST',
            uri: config.liveUrl + 'api/get-team-chat',
            form: {
                to_user: data.to_user,
                from_user: data.from_user
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-access-token': data.authToken
            },
            json: true,
            rejectUnauthorized: false,
            requestCert: true
        };

        rp(options)
            .then(function (repos) {

                if (repos.response_code === 2000) {
                    io.sockets.in(data.to_user).emit('chat list', repos);
                    io.sockets.in(data.from_user).emit('chat list', repos);
                    socket.emit('chat list', repos);
                } else {
                    socket.emit('chat list', repos);
                }
            })
            .catch(function (err) {

                console.log('err', err);
            });
    });

    // send message 

    socket.on('send message', function (data) {

        console.log("send message data", data);

        const index = connected_user.indexOf(data.to_user);
        let user_online = false;
        if (index > -1) {
            user_online = true;
        }

        var options = {
            method: 'POST',
            uri: config.liveUrl + 'api/add-team-chat',
            form: {
                to_user: data.to_user,
                from_user: data.from_user,
                message: data.message,
                user_online: user_online
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-access-token': data.authToken
            },
            json: true,
            rejectUnauthorized: false,
            requestCert: true
        };
        rp(options)
            .then(function (repos) {

                if (repos.response_code === 2000) {

                    var options = {
                        method: 'POST',
                        uri: config.liveUrl + 'api/get-team-chat',
                        form: {
                            to_user: data.to_user,
                            from_user: data.from_user
                        },
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded',
                            'x-access-token': data.authToken
                        },
                        json: true,
                        rejectUnauthorized: false,
                        requestCert: true
                    };

                    rp(options)
                        .then(function (repos) {

                            if (repos.response_code === 2000) {

                                // io.to(data.to_user).to(data.from_user).emit('chat list', repos);
                                io.sockets.in(data.to_user).emit('chat list', repos);
                                io.sockets.in(data.from_user).emit('chat list', repos);
                                socket.emit('chat list', repos);
                            } else {
                                socket.emit('chat list', repos);
                            }
                        })
                        .catch(function (err) {

                            console.log('err', err);
                        });


                } else {
                    socket.emit('chat list', repos);
                }
            })
            .catch(function (err) {

                console.log('err', err);
            });
    });

    // TeamChat End

    socket.on('food_arrive_notify', function (data) {
        console.log("data", data);
        var options = {
            method: 'POST',
            uri: config.liveUrl + 'api/food-arrived-notification',
            form: {
                orderId: data.orderId,
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-access-token': data.authToken
            },
            json: true,
            rejectUnauthorized: false,
            requestCert: true
        };

        rp(options)
            .then(function (repos) {
                console.log("repos", repos);
                if (repos.response_code === 2000) {
                    socket.emit('order list', repos);
                } else {
                    socket.emit('order list', repos);
                }
            })
            .catch(function (err) {

                console.log('err', err);
            });
    });

    //disconnected service
    //console.log("io.sockets.sockets11",io.sockets.sockets);

    socket.on('kick', function (data) {

        const index = connected_user.indexOf(data.user_id);
        if (index > -1) {
            connected_user.splice(index, 1);
            console.log(data.user_id + "has been kick");
            updateNicknames();
        } else {
            console.log(data.user_id + "not exist");
        }
    });
    socket.on('leave_order', function (data) {

        socket.leave(data._id);
    });

    socket.on('disconnect', function (data) {
        console.log(socket.id + 'a user connected');


        updateNicknames();

    });




    // socket.on('disconnect', function () {
    //     console.log("connected_user stage 2------>", connected_user);
    // });
});

//===========================Socket====================================
app.set('port', config.port);
console.log('config.port',config.port);
server.listen(app.get('port'), function (err) {
    if (err) {
        throw err;
    }
    else {
        console.log("Server is AS running at http://localhost:" + app.get('port'));
    }
});

var obj = {
    restaurantid: 123,
    eeeee: 123
}

server.timeout = 500000000; 