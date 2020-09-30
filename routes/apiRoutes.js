'use strict';
var express = require("express");
var apiService = require('../services/apiService');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('../config');
var secretKey = config.secretKey;
var paymentService = require('../services/paymentService');
var promocodeService = require('../services/promocodeService');
var rewardsFacilityService = require('../services/rewardsFacilityService');
var creditService = require('../services/creditService');

var api = express.Router();
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({
  extended: false
}));
api.post('/test-push-notification', function (req, res) {
  apiService.checkPushNotify(req.body, function (response) {
    res.send(response);
  });
});
// Content page
api.get('/cms', function (req, res) {
  apiService.cms(function (response) {
    response.response_message = res.__(response.response_message);
    res.send(response);
  });
});

//rewardsFacility list routes
api.get('/rewardsFacility-list', function (req, res) {
  rewardsFacilityService.listRewardsFacilityService(function (response) {
    res.send(response);
  });
});

//Check Email Exists
api.post('/check-email', function (req, res) {
  apiService.checkEmail(req.body, function (response) {
    response.response_message = res.__(response.response_message);
    res.send(response);
  });
});
//Check Phone No Exists
api.post('/check-phone-number', function (req, res) {
  apiService.checkPhoneNo(req.body, function (response) {
    response.response_message = res.__(response.response_message);
    res.send(response);
  });
});
//Register
api.post('/register', function (req, res) {
  //console.log('locale', res.__('Email address already exist'));
  apiService.register(req.body, function (response) {
    response.response_message = res.__(response.response_message);
    res.send(response);
  });
});
//Email Verification
api.post('/emailVerification', function (req, res) {
  apiService.emailVerification(req.body, function (response) {
    response.response_message = res.__(response.response_message);
    res.send(response);
  });
});
//Resend email verification code
api.post('/resendEmailVerifyCode', function (req, res) {
  apiService.resendEmailVerifyCode(req.body, function (response) {
    response.response_message = res.__(response.response_message);
    res.send(response);
  });
});
//login
api.post('/login', function (req, res) {
  apiService.login(req.body, function (response) {
    response.response_message = res.__(response.response_message);
    res.send(response);
  });
});
/*******************************
 * User Social Login
 * @method: POST
 * @request params
 *      email
 * @url: /api/social-login
 ********************************/
api.post('/social-login', (req, res) => {

  apiService.socialRegister(req.body, function (response) {
    res.send(response);
  });
});
//Forgot password
api.post('/forgotPassword', function (req, res) {
  apiService.forgotPassword(req.body, function (response) {
    res.send(response);
  });
});
// Verify otp
// for forgotpassword
// api.post('/verifyOtp', function (req, res) {
//   apiService.verifyOtp(req.body, function (response) {
//     res.send(response);
//   });
// });
//Reset password
api.post('/resetPassword', function (req, res) {
  apiService.resetPassword(req.body, function (response) {
    res.send(response);
  });
});
/**************************
 * user verify account
 * @method: POST
 *     token
 * @url: /api/vreset-email
 **************************/
api.post('/reset-email', function (req, res) {
  apiService.verifyAccount(req.body, function (response) {
    res.send(response);
  });
});

/******************************
 *  Middleware to check token
 ******************************/
api.use(function (req, res, next) {

  //console.log('req.body------>',req.body)
  //console.log('req.headers------>',req.headers)
  //console.log('req.query------>',req.query)

  var token = req.body.authtoken || req.query.authtoken || req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, secretKey, function (err, decoded) {
      if (err) {
        res.send({
          response_code: 4000,
          response_message: "Session timeout! Please login again.",
          response_data: err
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.send({
      "response_code": 5002,
      "response_message": "Please provide required information"
    });
  }
});
/******************************
 *  Middleware to check token
 ******************************/
//list promotional banner
api.post('/list-promotional-banner', function (req, res) {
  apiService.bannerList(req.body, function (response) {
    res.send(response);
  });
});
// View Profile
api.post('/viewProfile', function (req, res) {
  apiService.viewProfile(req.body, function (result) {
    res.send(result);
  })
});
// Edit Profile Image
api.post('/editProfileImage', function (req, res) {
  apiService.editProfileImage(req.body, req.files, function (result) {
    res.send(result);
  })
});
// Claim Gold Membership
api.post('/claim-gold-membership', function (req, res) {
  apiService.goldMembership(req.body, function (response) {
    res.send(response);
  });
});
// Change password
api.post('/changePassword', function (req, res) {
  apiService.changePassword(req.body, function (result) {
    res.send(result);
  });
});
// Change email request
api.post('/changeEmail', function (req, res) {
  apiService.changeEmailReq(req.body, function (result) {
    res.send(result);
  });
});
// Change Phone No Request
api.post('/changePhoneNo', function (req, res) {
  apiService.changePhoneNoReq(req.body, function (result) {
    res.send(result);
  });
});
// Change Phone No
api.post('/change-phone-no', function (req, res) {
  apiService.changePhoneNo(req.body, function (result) {
    res.send(result);
  });
});
// Edit Profile
api.post('/editProfile', function (req, res) {
  apiService.editProfile(req.body, function (result) {
    res.send(result);
  });
});
// Delete User Request
api.post('/delete-user-request', function (req, res) {
  apiService.deleteUserRequest(req.body, function (response) {
    res.send(response);
  });
});
// View Organization
api.get('/organizationAll', function (req, res) {
  apiService.organizationAll(req.query, function (result) {
    res.send(result);
  })
});
// Register New Organization
api.post('/organization', function (req, res) {
  apiService.organization(req.body, function (result) {
    res.send(result);
  })
});
// Register User to new Organization
api.post('/register-to-organization', function (req, res) {
  apiService.registerToOrganization(req.body, function (result) {
    res.send(result);
  })
});
// Get Organization by user 
api.get('/user-organization', function (req, res) {
  apiService.getUserOrganization(req.query, function (result) {
    res.send(result);
  });
});
//Exit from active organization
api.post('/exit-organization', function (req, res) {
  apiService.exitOrganization(req.body, function (result) {
    res.send(result);
  });
});
//Set active team by user and Organization
api.post('/set-active-organization', function (req, res) {
  apiService.setActiveOrganization(req.body, function (result) {
    res.send(result);
  });
});
// Register Organization Team
api.post('/team', function (req, res) {
  apiService.organizationTeam(req.body, req.files, function (result) {
    res.send(result);
  })
});
// Register User to new Team
api.post('/register-to-team', function (req, res) {
  apiService.registerToTeam(req.body, function (result) {
    res.send(result);
  })
});
// Accept/Reject User Team Join Request
api.post('/team-join-request-status-change', function (req, res) {
  apiService.teamJoinStatusChange(req.body, function (result) {
    res.send(result);
  })
});
// Get Team List
api.get('/teamAll', function (req, res) {
  apiService.teamAll(req.query, function (result) {
    res.send(result);
  });
});
// Get Team List by Organization
// api.get('/organization-team', function (req, res) {
//   apiService.getOrganizationTeam(req.query, function (result) {
//     res.send(result);
//   });
// });

// Get User List of a Team
api.get('/team-user-list', function (req, res) {
  apiService.teamUserList(req.query, function (result) {
    res.send(result);
  });
});
//Get Team List by user and Organization
api.get('/user-team', function (req, res) {
  apiService.getUserTeam(req.query, function (result) {
    res.send(result);
  });
});
//Set active team by user and Organization
api.post('/set-active-team', function (req, res) {
  apiService.setActiveTeam(req.body, function (result) {
    res.send(result);
  });
});
// Current Team Member List
api.post('/current-team-member-list', function (req, res) {
  apiService.currentTeamMemberList(req.body, function (response) {
    res.send(response);
  });
});
//Exit from active team
api.post('/exit-team', function (req, res) {
  apiService.exitTeam(req.body, function (result) {
    res.send(result);
  });
});
// Team Name Change Request
api.post('/team-name-change-request', function (req, res) {
  apiService.teamNameChangeReq(req.body, function (result) {
    res.send(result);
  })
});
// Team Name Change Vote
api.post('/team-name-change-vote', function (req, res) {
  apiService.teamNameChangeVote(req.body, function (result) {
    res.send(result);
  })
});
//Notification list
api.post('/notificationlist', function (req, res) {
  apiService.notificationlist(req.body, function (result) {
    res.send(result);
  });
});
//All Restaurant List
api.get('/list-restaurant', function (req, res) {
  apiService.restaurantList(req.query, function (response) {
    res.send(response);
  });
});
//Restaurant  Filter List
api.get('/filter-restaurant-list', function (req, res) {
  apiService.filterRestaurantList(req.query, function (response) {
    res.send(response);
  });
});
// Add Favourite Restaurant
api.post('/add-favourite-restaurant', function (req, res) {
  apiService.addFavouriteRestaurant(req.body, function (result) {
    res.send(result);
  });
});
// Remove Favourite Restaurant
api.delete('/remove-favourite-restaurant', function (req, res) {
  apiService.removeFavouriteRestaurant(req.body, function (result) {
    res.send(result);
  });
});
// Favourite Restaurant List
api.get('/favourite-restaurant-list', function (req, res) {
  apiService.favouriteRestaurantList(req.query, function (result) {
    res.send(result);
  });
});
//Notification list
api.get('/notification-list', function (req, res) {
  //console.log('notification req.query---',req.query)
  apiService.notificationlist(req.query, function (result) {
    res.send(result);
  });
});
//Notification status change
api.post('/notificationstatuschange', function (req, res) {
  apiService.notificationstatuschange(req.body, function (result) {
    res.send(result);
  });
});

//Get Menu Category
api.get('/get-menu-category', function (req, res) {
  apiService.menuCatList(req.query, function (response) {
    res.send(response);
  });
});

//All Menu List
api.post('/menu-list', function (req, res) {
  apiService.menuList(req.body, function (response) {
    res.send(response);
  });
});

// Add to cart
api.post('/addTocart', function (req, res) {
  apiService.addTocart(req.body, function (response) {
    res.send(response);
  });
});
//Cart list
api.post('/cartList', function (req, res) {
  apiService.cartList(req.body, function (response) {
    res.send(response);
  });
});
// Product qty update in cart
api.post('/cartQuatityUpdate', function (req, res) {
  apiService.cartQuatityUpdate(req.body, function (response) {
    res.send(response);
  });
});
// Product delete from cart
api.post('/cartProductDelete', function (req, res) {
  apiService.cartProductDelete(req.body, function (response) {
    res.send(response);
  });
});
// Product delete from cart
api.post('/emptyCart', function (req, res) {
  apiService.emptyCart(req.body, function (response) {
    res.send(response);
  });
});
// Before Order checkout
api.post('/before-check-out', function (req, res) {
  apiService.beforeCheckOut(req.body, function (response) {
    res.send(response);
  });
});
// Apply Credit Discount
api.post('/apply-credit-discount', function (req, res) {
  creditService.applyCreditDiscount(req.body, function (response) {
    res.send(response);
  });
});
// Update Credit Discount
api.post('/update-credit-discount', function (req, res) {
  creditService.updateCreditDiscount(req.body, function (response) {
    res.send(response);
  });
});
// Delete Credit Discount
api.post('/delete-credit-discount', function (req, res) {
  creditService.deleteCreditDiscount(req.body, function (response) {
    res.send(response);
  });
});
// Order checkout
api.post('/check-out', function (req, res) {
  apiService.checkOut(req.body, function (response) {
    res.send(response);
  });
});
// Current Order Details
api.get('/current-order-list', function (req, res) {
  apiService.currentOrderList(req.query, function (response) {
    res.send(response);
  });
});
// Order list
api.post('/order-list', function (req, res) {
  apiService.orderList(req.body, function (response) {
    res.send(response);
  });
});
// Food Arrived Notification
api.post('/food-arrived-notification', function (req, res) {
  apiService.foodArriveNotification(req.body, function (response) {
    res.send(response);
  });
});
// Order Delivered Confirmation
api.post('/order-delivered-confirmation', function (req, res) {
  apiService.orderDeleveredCnf(req.body, function (response) {
    res.send(response);
  });
});
// Add Team Chat
api.post('/add-team-chat', function (req, res) {
  apiService.addTeamChat(req.body, function (response) {
    res.send(response);
  });
});
// Current Order Details
api.post('/get-team-chat', function (req, res) {
  apiService.getTeamChat(req.body, function (response) {
    res.send(response);
  });
});
// After payment completed
// api.post('/addPayment', function (req, res) {
//   paymentService.addPaymentService(req.body, function (response) {
//     res.send(response);
//   });
// });
// api.post('/listPayment', function (req, res) {
//   paymentService.listPaymentService(req.body, function (response) {
//     res.send(response);
//   });
// });

//Get Clovers Scheme
api.get('/get-clover-scheme', function (req, res) {
  apiService.cloversSchemeList(req.query, function (response) {
    res.send(response);
  });
});





// Recycling Product type listing
api.post('/recyclingProductTypeList', function (req, res) {
  apiService.recyclingProductTypeList(function (response) {
    res.send(response);
  });
});
//Recycling product add
api.post('/recyclingProductAdd', function (req, res) {
  apiService.recyclingProductAdd(req.body, req.files, function (result) {
    res.send(result);
  });
});
//Recycling product list by user
api.post('/recyclingProductListByUser', function (req, res) {
  apiService.recyclingProductListByUser(req.body, function (result) {
    res.send(result);
  });
});
// Cause listing
api.post('/causeList', function (req, res) {
  apiService.causeList(req.body, function (response) {
    res.send(response);
  });
});
//Cause details
api.post('/causeDetail', function (req, res) {
  apiService.causeDetail(req.body, function (result) {
    res.send(result);
  });
});
//Vendor listing
api.post('/vendorList', function (req, res) {
  apiService.vendorList(req.body, function (response) {
    res.send(response);
  });
});
//Vendor details
api.post('/vendorDetail', function (req, res) {
  apiService.vendorDetail(req.body, function (result) {
    res.send(result);
  });
});
//Home page
api.post('/home', function (req, res) {
  apiService.home(function (result) {
    res.send(result);
  });
});
// Product Category list
api.post('/productCategoryList', function (req, res) {
  apiService.productCategoryList(function (response) {
    res.send(response);
  });
});
// Product list
api.post('/productList', function (req, res) {
  apiService.productList(req.body, function (response) {
    res.send(response);
  });
});
//Product Details
api.post('/productDetail', function (req, res) {
  apiService.productDetail(req.body, function (response) {
    res.send(response);
  });
});

// Add shipping address
api.post('/addShippingAddress', function (req, res) {
  apiService.addShippingAddress(req.body, function (response) {
    res.send(response);
  });
});
// Details of shipping address
api.post('/viewShippingAddress', function (req, res) {
  apiService.viewShippingAddress(req.body, function (response) {
    res.send(response);
  });
});

// Contact Us
api.post('/contactUs', function (req, res) {
  apiService.contactUs(req.body, function (response) {
    res.send(response);
  });
});
// Featured Ads list
api.post('/featuredAdsList', function (req, res) {
  apiService.featuredAdsList(req.body, function (response) {
    res.send(response);
  });
});

//apply promocode routes
api.post('/apply-promocode', function (req, res) {

  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  let data = {
    ...req.body,
    decoded: req.decoded,
    authtoken: token
  }

  promocodeService.applyPromocodeService(data, function (response) {
    res.send(response);
  });

});

// 
//delete Promocode Log routes
api.post('/delete-promocodelog', function (req, res) {

  promocodeService.deletePromocodeLogService(req.body, function (response) {
    res.send(response);
  });

});

//promocode list routes
api.get('/promocode-list', function (req, res) {
  promocodeService.listPromocodeService(function (response) {
    res.send(response);
  });
});

//apply rewardsFacility routes
api.post('/apply-rewardsFacility', function (req, res) {

  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  let data = {
    ...req.body,
    decoded: req.decoded,
    authtoken: token
  }

  rewardsFacilityService.applyRewardsFacilityService(data, function (response) {
    res.send(response);
  });

});

//delete Rewards Log routes
api.post('/delete-rewardsFacilitylog', function (req, res) {

  rewardsFacilityService.deleteRewardsFacilityLogService(req.body, function (response) {
    res.send(response);
  });

});



module.exports = api