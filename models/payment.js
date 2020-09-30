var PaymentSchema = require('../schema/payments');
var TemporaryCartsSchema = require('../schema/temporaryCarts');
var UsersSchema = require('../schema/users');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var PaymentModels = {

    //#region Payment

        addPaymentModel: async function (data, callback) {
                                
            if (data) {


                     //add
                    let objAddData = {}

                    if(!data.paymentId)
                    {
                        callback({
                            success: false,
                            STATUSCODE: 4200,
                            message: "Please Provide paymentId",
                            response: [{"error":"Please Provide paymentId"}]
                        });

                    }else{

                        objAddData["paymentId"] = data.paymentId;

                    }

                    if(!data.userId)
                    {
                        callback({
                            success: false,
                            STATUSCODE: 4200,
                            message: "Please Provide userId",
                            response: [{"error":"Please Provide userId"}]
                        });
                    }else{
                        let users = await  UsersSchema.find({_id:data.userId})

                        objAddData["userDetails"] = users;

                        let carts = await  TemporaryCartsSchema.find({userId:data.userId})

                        objAddData["orderDetails"] = carts;
                    }


                  if(!data.authCode)
                  {
                      callback({
                          success: false,
                          STATUSCODE: 4200,
                          message: "Please Provide authCode",
                          response: [{"error":"Please Provide authCode"}]
                      });
                      
                  }else{

                      objAddData["authCode"] = data.authCode;

                  }

                  if(!data.transactionAmount)
                  {
                      callback({
                          success: false,
                          STATUSCODE: 4200,
                          message: "Please Provide transactionAmount",
                          response: [{"error":"Please Provide transactionAmount"}]
                      });
                      
                  }else{

                      objAddData["transactionAmount"] = data.transactionAmount;

                  }

                  objAddData["transactionFees"] = data.transactionFees?data.transactionFees:0.00;
                  objAddData["currency"] = data.currency?data.currency:'';
                  objAddData["message"] = data.message?data.message:'';
                  objAddData["paymentDate"] = data.paymentDate;
                  objAddData["paymentMode"] = data.paymentMode;
                  objAddData["paymentStatus"] = data.paymentStatus?data.paymentStatus:'Succeed';

                 let createPayment = await PaymentSchema.create(objAddData)

                 if(createPayment){

                            // To remove Cart
                            // if(data.paymentStatus == 'Succeed')
                            // {
                            //     await  TemporaryCartsSchema.remove({userId:data.userId})
                                
                            // }

                            callback({
                                success: true,
                                STATUSCODE: 2000,
                                message: "Submitted successfully.",
                                response: createPayment
                            });
                 }else{
                            callback({
                                success: false,
                                STATUSCODE: 4200,
                                message: "Error.",
                                response: {}
                            });                     
                 }



                 }

        },
        listPaymentModel: async function (data, callback) {
            var searchArray = [];
            var combineResponse = [];
            console.log('data--',data)
            if(data.searchTerm){
                searchArray.push({'page': new RegExp(data.searchTerm, 'i')});
            }
            else{
                searchArray.push({})
            }
            
            var qry = {$or: searchArray};
            

        let paymentList = await PaymentSchema.find(qry)
            .skip(data.offset).limit(data.limit).exec(function (err, res) {
                if(err){
                    callback({
                        success: false,
                        STATUSCODE: 4200,
                        message: "something went wrong!",
                        response: err
                    });
                }else{
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success",
                        totalData: res.length,
                        response: res
                    })
                }
            })

           
        },
        editPaymentModel: async function (data, callback) {
            var obj = data.options;
            //console.log(obj);
            
            var answer = 0
            var answer_key = 0;
            var counter = 0;

            //console.log("answer",answer);
            
            let [city] = await Promise.all([

                getLatLong (data.latitude,data.longitude,'PaymentSchema')
                .then(res => res)
            ]);
            
            console.log('city---',city)

            if(data){
                PaymentSchema.update(
                    {_id: data._id},
                    {
                        $set:{
                            month: data.month,
                            fajrOpen: data.fajrOpen,
                            fajrIqamah: data.fajrIqamah,
                            zuhrOpen: data.zuhrOpen,
                            zuhrIqamah: data.zuhrIqamah,
                            dhuhrOpen: data.dhuhrOpen,
                            dhuhrIqamah: data.dhuhrIqamah,
                            maghribOpen: data.maghribOpen,
                            maghribIqamah: data.maghribIqamah,
                            ishaOpen: data.ishaOpen,
                            ishaIqamah: data.ishaIqamah,                                        
                            sunrise: data.sunrise,
                            sunset: data.sunset,
                            longitude:  data.longitude,
                            latitude:  data.latitude,
                            address: data.address,
                            prayers:data.prayers,
                            city:city,
                            prayersMonth:data.prayersMonth,
                            prayersSunrise:data.prayersSunrise,
                            prayersSunset:data.prayersSunset,
                            location:  data.location
                         
                        }
                    }
                ).then(r =>{
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
            }
        },

        deletePaymentModel: async function (data, callback) {
            var obj = data.options;
            //console.log(obj);
            
            var answer = 0
            var answer_key = 0;
            var counter = 0;

            //console.log("answer",answer);
            
            if(data){
                PaymentSchema.deleteOne({ _id:data._id  })
                .then(r =>{
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "Success"
                    });
                })
            }
        },


        getAllPaymentModel: async function (data, callback) {

            var todayDate = new Date().toISOString().slice(0,10);
            //console.log('todayDate--',todayDate)
            console.log('prayer data-->',data)
            console.log('prayer data lat-->',data.lat)
            console.log('prayer data long-->',data.long)
            console.log('prayer data module-->',data.modules)
            //let city = ''
            let [city] = await Promise.all([

                getLatLong (data.lat,data.long,data.modules)
                .then(res => res)
            ]);
            console.log('prayer city-->',city)

            let monthData= data.month?data.month:todayDate ;
           // console.log('monthData-->',monthData)
            var d=new Date(monthData); 
            var m=d.getMonth()+1;
            var y=d.getFullYear();
            // console.log('month-->',m)
            // console.log('year-->',y)

           let currentMonth = await PaymentSchema.aggregate(
               [
                {$project: {  month : {$month: '$month'},  year: { $year: "$month" }}},
                {$match: { 
                    
                    $and: [
                        { month: m},
                        { year: y}
                        ]                
                }}
                
              ]
              );
 
            console.log('currentMonth--->',currentMonth)

            if(currentMonth.length>0)
            {

                PaymentSchema.find({_id:currentMonth[0]._id, city:city})
                    .select('prayersMonth prayers prayersSunrise prayersSunset location longitude latitude city createdAt updatedAt')
                    .lean(true)
                //PaymentSchema.find()
                    .then(res =>{
                        if(res.length>0)
                        {
                            callback({
                                success: true,
                                STATUSCODE: 2000,
                                message: "Success",
                                response: res
                            });
                        }else{
                            callback({
                                success: true,
                                STATUSCODE: 2000,
                                message: "No prayer in this month",
                                response: []
                            });
                        }

                    })
                    .catch(err => {
                        callback({
                            success: false,
                            STATUSCODE: 4200,
                            message: "something went wrong!",
                            response: err
                        });
                    })
            }else{
                    callback({
                        success: true,
                        STATUSCODE: 2000,
                        message: "No prayer in this month",
                        response: []
                    });
            }
            
        }, 
}
module.exports = PaymentModels;