var express = require("express");
var jwt = require('jsonwebtoken');
var Admin = require('../models/admin');
var adminService = require('../services/adminService');
var restaurantManagerService = require('../services/restaurantManagerService');
var restraurantService = require('../services/restaurantService');
var restraurantCatService = require('../services/restaurantCatService');
var cloversSchemaService = require('../services/cloverSchemeService');
var menuService = require('../services/menuService');
var paymentService = require('../services/paymentService');
var promocodeService = require('../models/promocode');
var rewardsFacilityService = require('../services/rewardsFacilityService');

var bodyParser = require('body-parser');
var config = require('../config');
var async = require("async");
var secretKey = config.secretKey;

module.exports = function (app, express) {

  var admin = express.Router();
  admin.use(bodyParser.json());
  admin.use(bodyParser.urlencoded({
    extended: false
  }));
  admin.get('/test', function (req, res, next) {
    res.json({
      success: true,
      message: "Admin routes is working"
    });
  });

  admin.post('/adminSignup', function (req, res) {
    var adminData = req.body;
    adminService.adminSignup(adminData, function (response) {
      res.send(response);
    });
  });
  admin.post('/adminLogin', function (req, res) {
    var adminData = req.body;
    adminService.adminLogin(adminData, function (response) {
      response.message = res.__(response.message)
      res.send(response);
    });
  });
  admin.post('/forgotpassLinksend', function (req, res) {
    var adminData = req.body;
    adminService.forgotpassLinksend(adminData, function (response) {
      res.send(response);
    });
  });
  admin.post('/adminForgotPassword', function (req, res) {
    var adminData = req.body;
    adminService.adminForgotPassword(adminData, function (response) {
      res.send(response);
    });
  });



  //Restaurant Manager Login Routes 
  admin.post('/restManagerLogin', function (req, res) {
    var restaurantManagerData = req.body;
    restaurantManagerService.restaurantManagerLogin(restaurantManagerData, function (response) {
      res.send(response);
    });
  });

  //Restaurant Manager Forgot password Linksend Routes 
  admin.post('/restMngForgtpassLinkSend', function (req, res) {
    var restaurantManagerData = req.body;
    restaurantManagerService.restaurantManagerforgotpassLinksend(restaurantManagerData, function (response) {
      res.send(response);
    });
  });
  /******************************
   *  Middleware to check token
   ******************************/
  admin.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, secretKey, function (err, decoded) {
        if (err) {
          res.send({
            STATUSCODE: 4002,
            success: false,
            error: true,
            message: "Failed to authenticate or token expired."
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      res.send({
        success: false,
        error: true,
        message: "Please provide token"
      });
    }
  });
  /******************************
   *  Middleware to check token
   ******************************/

  admin.post('/adminChangePassword', function (req, res) {
    adminService.adminChangePassword(req.body, function (response) {
      res.send(response);
    });
  });

  //add content
  admin.post('/addContent', function (req, res) {
    adminService.addContent(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //list content
  admin.post('/listContent', function (req, res) {
    adminService.listContent(function (response) {
      res.send(response);
    });
  });

  //Details content
  admin.post('/detailsContent', function (req, res) {
    adminService.detailsContent(req.body, function (response) {
      res.send(response);
    });
  });

  //edit content
  admin.post('/editContent', function (req, res) {
    adminService.editContent(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //**********************************************************
  //  Restaurant Manager  Code After Login 
  //***************************************************** */

  //Restaurant Manager signup Routes 
  admin.post('/restManagerSignup', function (req, res) {
    var restaurantManagerData = req.body;
    restaurantManagerService.restaurantManagerSignup(restaurantManagerData, function (response) {
      res.send(response);
    });
  });
  // View Restaurant Manager Profile
  admin.post('/view-restaurant-manager-profile', function (req, res) {
    restaurantManagerService.viewRestManagerProfile(req.body, function (result) {
      res.send(result);
    })
  });
  // Edit Restaurant Manager Profile
  admin.post('/edit-restaurant-manager', function (req, res) {

    restaurantManagerService.editRestaurantManager(req.body, function (result) {
      res.send(result);
    })
  });
  // Restaurant Manager Block/Unblock
  admin.post('/restaurant-manager-status-change', function (req, res) {

    restaurantManagerService.changeStatusRestaurantManager(req.body, function (result) {
      res.send(result);
    })
  });
  //Restaurant Manager Change Password  Routes 
  admin.post('/restaurantManagerChangePassword', function (req, res) {
    restaurantManagerService.restaurantManagerChangePassword(req.body, function (response) {
      res.send(response);
    });
  });

  //List of Restaurant Manager Routes 
  admin.post('/restaurant-manager-list', function (req, res) {
    var restaurantManagerData = req.body;
    restaurantManagerService.restaurantManagerList(restaurantManagerData, function (response) {
      res.send(response);
    });
  });


  //Add Restaurant
  admin.post('/add-restaurant', function (req, res) {

    restraurantService.AddRestaurant(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //Update Restaurant
  admin.put('/update-restaurant', function (req, res) {
    restraurantService.updateRestaurant(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //Update Restaurant Status
  admin.put('/update-restaurant-status', function (req, res) {
    restraurantService.updateRestaurantStatus(req.body, function (response) {
      res.send(response);

    });
  });
  //Update Restaurant Status
  admin.put('/update-restaurant-feature', function (req, res) {
    restraurantService.updateRestaurantFeature(req.body, function (response) {
      res.send(response);

    });
  });
  //Update Restaurant Reward
  admin.put('/update-restaurant-reward', function (req, res) {
    restraurantService.updateRestaurantReward(req.body, function (response) {
      res.send(response);

    });
  });
  //Update Restaurant Mode
  admin.put('/update-restaurant-busy-mode', function (req, res) {
    restraurantService.updateRestaurantMode(req.body, function (response) {
      res.send(response);
    });
  });

  //Update Pre Order Restaurant
  admin.put('/change-restaurant-pre-order-status', function (req, res) {
    restraurantService.updateRestaurantPreOrder(req.body, function (response) {
      res.send(response);
    });
  });

  //All Restaurant List
  admin.get('/list-restaurant', function (req, res) {
    restraurantService.restaurantList(req.query, function (response) {
      res.send(response);
    });
  });
  //Delete Restaurant
  admin.delete('/delete-restaurant/:id', function (req, res) {
    var Id = req.params.id;
    restraurantService.deleteRestaurant(Id, function (response) {
      res.json(response);
    });
  });

  //Get Menu Category icon
  admin.get('/get-menu-category-icon', function (req, res) {
    menuService.menuCatIconList(req.query, function (response) {
      response.message = res.__(response.message)
      res.send(response);
    });
  });

  //Add Menu Category icon
  admin.post('/add-menu-category-icon', function (req, res) {
    menuService.addMenuCatIcon(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //Get Menu Category
  admin.get('/get-menu-category', function (req, res) {
    menuService.menuCatList(req.query, function (response) {
      response.message = res.__(response.message)
      res.send(response);
    });
  });
  //Add Menu Category
  admin.post('/add-menu-category', function (req, res) {
    menuService.addMenuCat(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //Edit Menu Category
  admin.put('/edit-menu-category', function (req, res) {
    menuService.editMenuCat(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //Delete Restaurant
  admin.delete('/delete-menu-category/:id', function (req, res) {
    var Id = req.params.id;
    menuService.deleteMenuCat(Id, function (response) {
      res.json(response);
    });
  });

  //Add Restaurant Menu
  admin.post('/add-restaurant-menu', function (req, res) {
    menuService.addMenu(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //Edit Restaurant Menu
  admin.put('/edit-restaurant-menu', function (req, res) {
    menuService.editMenu(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //Update Restaurant Status
  admin.put('/update-restaurant-menu-stock', function (req, res) {
    menuService.updateMenuStock(req.body, function (response) {
      res.send(response);
    });
  });

  //All Menu List
  admin.post('/menu-list', function (req, res) {
    menuService.menuList(req.body, function (response) {
      res.send(response);
    });
  });

  //Get Restaurant Category
  admin.get('/get-restaurant-type', function (req, res) {
    restraurantCatService.restaurantCatList(req.query, function (response) {
      response.message = res.__(response.message)
      // async.forEach(response.response, function (item, callback) {
      //   item.name = res.__(item.name);
      //   callback();
      // });
      res.send(response);
    });
  });
  //Add Restaurant Category
  admin.post('/add-restaurant-type', function (req, res) {
    restraurantCatService.addRestaurantCat(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //Edit Restaurant Category
  admin.put('/edit-restaurant-type', function (req, res) {
    restraurantCatService.editRestaurantCat(req.body, req.files, function (response) {
      res.send(response);
    });
  });

  //Delete Restaurant Category
  admin.delete('/delete-restaurant-type/:id', function (req, res) {
    var Id = req.params.id;
    restraurantCatService.deleteRestaurantCat(Id, function (response) {
      res.json(response);
    });
  });

  // Get Restaurant Details
  // admin.get('/get-restaurant-details', function (req, res) {
  //   restraurantService.restaurantDetails(req.query, function (response) {
  //     res.send(response);
  //   });
  // });

  //list User
  admin.post('/listUser', function (req, res) {
    adminService.listUser(req.body, function (response) {
      res.send(response);
    });
  });

  //User Details
  admin.post('/detailsUser', function (req, res) {
    adminService.detailsUser(req.body, function (response) {
      res.send(response);
    });
  });

  // Delete User
  admin.post('/delete-user', function (req, res) {
    adminService.deleteUser(req.body, function (response) {
      res.send(response);
    });
  });

  //Block User
  admin.post('/blockUser', function (req, res) {
    adminService.blockUser(req.body, function (response) {
      res.send(response);
    });
  });

  // View Organization
  admin.get('/organizationAll', function (req, res) {
    adminService.organizationAll(req.query, function (result) {
      res.send(result);
    })
  });

  // Get Organization by user 
  admin.get('/user-organization', function (req, res) {
    adminService.getUserOrganization(req.query, function (result) {
      res.send(result);
    });
  });

  // Edit Organization
  admin.post('/edit-organization', function (req, res) {
    adminService.editOrganization(req.body, function (result) {
      res.send(result);
    })
  });

  // Get Team List
  admin.get('/teamAll', function (req, res) {
    adminService.teamAll(req.query, function (result) {
      res.send(result);
    });
  });

  // Get User List of a Team
  admin.get('/team-user-list', function (req, res) {
    adminService.teamUserList(req.query, function (result) {
      res.send(result);
    });
  });

  //Change Team Status
  admin.post('/change-team-status', function (req, res) {
    adminService.changeTeamStatus(req.body, function (response) {
      res.send(response);
    });
  });

  //Get Clovers Scheme
  admin.get('/get-clover-scheme', function (req, res) {
    cloversSchemaService.cloversSchemeList(req.query, function (response) {
      response.message = res.__(response.message)
      res.send(response);
    });
  });
  //Add Clovers Scheme
  admin.post('/add-clover-scheme', function (req, res) {
    cloversSchemaService.addCloversScheme(req.body, function (response) {
      res.send(response);
    });
  });
  //Edit Clovers Scheme
  admin.put('/edit-clover-scheme', function (req, res) {
    cloversSchemaService.editCloversScheme(req.body, function (response) {
      res.send(response);
    });
  });
  //Edit Clovers Scheme
  admin.put('/edit-clover-scheme-status', function (req, res) {
    cloversSchemaService.updateCloversSchemeStatus(req.body, function (response) {
      res.send(response);
    });
  });
  //Delete Clovers Scheme
  admin.delete('/delete-clover-scheme/:id', function (req, res) {
    var Id = req.params.id;
    cloversSchemaService.deleteCloversScheme(Id, function (response) {
      res.json(response);
    });
  });



  // Add Recycling product type
  admin.post('/recyclingProductTypeAdd', function (req, res) {
    adminService.recyclingProductTypeAdd(req.body, function (response) {
      res.send(response);
    });
  });
  // List Recycling product type
  admin.post('/recyclingProductTypeList', function (req, res) {
    adminService.recyclingProductTypeList(req.body, function (response) {
      res.send(response);
    });
  });
  // Edit Recycling product type
  admin.post('/recyclingProductTypeEdit', function (req, res) {
    adminService.recyclingProductTypeEdit(req.body, function (response) {
      res.send(response);
    });
  });
  // Delete Recycling product type
  admin.post('/recyclingProductTypeDelete', function (req, res) {
    adminService.recyclingProductTypeDelete(req.body, function (response) {
      res.send(response);
    });
  });
  // List Recycling product 
  admin.post('/recyclingProductList', function (req, res) {
    adminService.recyclingProductList(req.body, function (response) {
      res.send(response);
    });
  });
  //Recycling product Details
  admin.post('/recyclingProductDetails', function (req, res) {
    adminService.recyclingProductDetails(req.body, function (response) {
      res.send(response);
    });
  });
  //Add Cause 
  admin.post('/addCause', function (req, res) {
    adminService.addCause(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //Edit Cause 
  admin.post('/editCause', function (req, res) {
    adminService.editCause(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  // List Cause
  admin.post('/listCause', function (req, res) {
    adminService.listCause(req.body, function (response) {
      res.send(response);
    });
  });
  //Upload Cause Doc
  admin.post('/uploadDocCause', function (req, res) {
    adminService.uploadDocCause(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //Cause Details
  admin.post('/detailCause', function (req, res) {
    adminService.detailCause(req.body, function (response) {
      res.send(response);
    });
  });
  // Delete Cause
  admin.post('/deleteCause', function (req, res) {
    adminService.deleteCause(req.body, function (response) {
      res.send(response);
    });
  });
  // Delete Cause Document
  admin.post('/deleteCauseDocument', function (req, res) {
    adminService.deleteCauseDocumentService(req.body, function (response) {
      res.send(response);
    });
  });
  // Delete Cause Image
  admin.post('/deleteCauseImage', function (req, res) {
    adminService.deleteCauseImageService(req.body, function (response) {
      res.send(response);
    });
  });
  //Add Vendor
  admin.post('/addVendor', function (req, res) {
    adminService.addVendor(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //Edit Vendor
  admin.post('/editVendor', function (req, res) {
    adminService.editVendor(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  // Set featured vendor
  admin.post('/setFeatureVendor', function (req, res) {
    adminService.setFeatureVendor(req.body, function (response) {
      res.send(response);
    });
  });
  //Delete Vendor
  admin.post('/deleteVendor', function (req, res) {
    adminService.deleteVendor(req.body, function (response) {
      res.send(response);
    });
  });
  // List Vendor
  admin.post('/listVendor', function (req, res) {
    adminService.listVendor(req.body, function (response) {
      res.send(response);
    });
  });
  //Vendor Details
  admin.post('/detailVendor', function (req, res) {
    adminService.detailVendor(req.body, function (response) {
      res.send(response);
    });
  });
  //Add Product category 
  admin.post('/productCategoryAdd', function (req, res) {
    adminService.productCategoryAdd(req.body, function (response) {
      res.send(response);
    });
  });
  //List Product category 
  admin.post('/productCategoryList', function (req, res) {
    adminService.productCategoryList(req.body, function (response) {
      res.send(response);
    });
  });
  // Edit Product category 
  admin.post('/productCategoryEdit', function (req, res) {
    adminService.productCategoryEdit(req.body, function (response) {
      res.send(response);
    });
  });
  // Delete Product category 
  admin.post('/productCategoryDelete', function (req, res) {
    adminService.productCategoryDelete(req.body, function (response) {
      res.send(response);
    });
  });
  // Add product
  admin.post('/addProduct', function (req, res) {
    adminService.addProduct(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //Edit Product 
  admin.post('/editProduct', function (req, res) {
    adminService.editProduct(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //List Product
  admin.post('/productList', function (req, res) {
    adminService.productList(req.body, function (response) {
      res.send(response);
    });
  });
  // Set popular product
  admin.post('/setPopularProduct', function (req, res) {
    adminService.setPopularProduct(req.body, function (response) {
      res.send(response);
    });
  });
  //Product Details
  admin.post('/DetailProduct', function (req, res) {
    adminService.DetailProduct(req.body, function (response) {
      res.send(response);
    });
  });
  //Delete Product
  admin.post('/DeleteProduct', function (req, res) {
    adminService.DeleteProduct(req.body, function (response) {
      res.send(response);
    });
  });
  // Delete Product Image
  admin.post('/deleteProductImage', function (req, res) {
    adminService.deleteProductImageService(req.body, function (response) {
      res.send(response);
    });
  });
  //List Order
  admin.post('/order-list', function (req, res) {
    adminService.orderList(req.body, function (response) {
      res.send(response);
    });
  });
  //Change Order Status
  admin.post('/change-order-status', function (req, res) {
    adminService.changeOrderStatus(req.body, function (response) {
      res.send(response);
    });
  });
  // Get Admin Dashboard Analytics 
  admin.get('/admin-dashboard-analytics', function (req, res) {
    adminService.getAdminDashboardAnalytics(req.query, function (result) {
      res.send(result);
    });
  });
  // Get Partner Dashboard Analytics 
  admin.get('/partner-dashboard-analytics', function (req, res) {
    adminService.getPartnerDashboardAnalytics(req.query, function (result) {
      res.send(result);
    });
  });
  //Add Ads
  admin.post('/addAds', function (req, res) {
    adminService.addAds(req.body, req.files, function (response) {
      res.send(response);
    });
  });
  //List Ads
  admin.post('/adsList', function (req, res) {
    adminService.adsList(req.body, function (response) {
      res.send(response);
    });
  });
  // Set featured Ads
  admin.post('/setFeatureAds', function (req, res) {
    adminService.setFeatureAds(req.body, function (response) {
      res.send(response);
    });
  });
  //Delete Ads
  admin.post('/DeleteAds', function (req, res) {
    adminService.DeleteAds(req.body, function (response) {
      res.send(response);
    });
  });
  //Edit Ads
  admin.post('/editAds', function (req, res) {
    adminService.editAds(req.body, req.files, function (response) {
      res.send(response);
    });
  });


  //#region for Payment


  // admin.post('/addPayment', function (req, res) {
  //   var adminData = req.body;
  //   paymentService.addPaymentService(adminData, function (response) {
  //     res.send(response);
  //   });
  // });

  // admin.post('/listPayment', function (req, res) {
  //   var adminData = req.body;
  //   paymentService.listPaymentService(adminData, function (response) {
  //     res.send(response);
  //   });
  // })

  // admin.post('/editPayment', function (req, res) {
  //   var adminData = req.body;
  //   paymentService.editPaymentService(adminData, function (response) {
  //     res.send(response);
  //   });
  // })

  // admin.post('/deletePayment', function (req, res) {
  //   var adminData = req.body;
  //   paymentService.deletePaymentService(adminData, function (response) {
  //     res.send(response);
  //   });
  // })

  // admin.post('/get-all-payment', function (req, res) {
  //   var adminData = req.body;
  //   paymentService.getAllPaymentService(adminData, function (response) {
  //     res.send(response);
  //   });
  // })

  //promocode list routes
  admin.get('/promocode-list', function (req, res) {
    promocodeService.promocodeList(function (response) {
      res.send(response);
    });
  });
  //add promocode  routes
  admin.post('/add-promocode', function (req, res) {
    promocodeService.addPromocode(req.body, function (response) {
      res.send(response);
    });
  });
  //edit promocode  routes
  admin.put('/edit-promocode', function (req, res) {
    promocodeService.editPromocode(req.body, function (response) {
      res.send(response);
    });
  });
  //get details promocode  routes
  admin.post('/promocode-details', function (req, res) {
    promocodeService.promocodeDetails(req.body, function (response) {
      res.send(response);
    });
  });
  //Delete promocode  routes
  admin.delete('/delete-promocode', function (req, res) {
    promocodeService.deletePromocode(req.body, function (response) {
      res.send(response);
    });
  });
  //change status of promocode
  admin.post('/edit-status', function (req, res) {
    promocodeService.editStatus(req.body, function (response) {
      res.send(response);
    });
  });
  //apply promocode routes
  admin.post('/apply-promocode', function (req, res) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    let data = {
      ...req.body,
      userauthtoken: token
    }

    promocodeService.applyPromocode(data, function (response) {
      res.send(response);
    });

  });

  //rewardsFacility list routes
  admin.get('/rewardsFacility-list', function (req, res) {
    rewardsFacilityService.listRewardsFacilityService(function (response) {
      res.send(response);
    });
  });
  //add rewardsFacility  routes
  admin.post('/add-rewardsFacility', function (req, res) {
    rewardsFacilityService.addRewardsFacilityService(req.body, function (response) {
      res.send(response);
    });
  });
  //edit rewardsFacility  routes
  admin.put('/edit-rewardsFacility', function (req, res) {
    rewardsFacilityService.editRewardsFacilityService(req.body, function (response) {
      res.send(response);
    });
  });
  //get details rewardsFacility  routes
  admin.post('/rewardsFacility-details', function (req, res) {
    rewardsFacilityService.detailsRewardsFacilityService(req.body, function (response) {
      res.send(response);
    });
  });
  //Delete rewardsFacility  routes
  admin.delete('/delete-rewardsFacility', function (req, res) {
    rewardsFacilityService.deleteRewardsFacilityService(req.body, function (response) {
      res.send(response);
    });
  });
  //change status of rewardsFacility
  admin.post('/edit-rewardsFacilitystatus', function (req, res) {
    rewardsFacilityService.editRewardsFacilityStatus(req.body, function (response) {
      res.send(response);
    });
  });
  return admin;
}