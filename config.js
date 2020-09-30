module.exports = {
    "port": 1425,
    "secretKey": "hyrgqwjdfbw4534efqrwer2q38945765",
    "link_expire": 172800,
    production: {
        username: 'brain1uMMong0User',
        password: 'PL5qnU9nuvX0pBa',
        host: 'nodeserver.brainiuminfotech.com',
        port: '27017',
        dbName: 'ezfoodie',
        authDb: 'admin'
    },
    email: {
        database: "mongodb://localhost:27017/ezfoodie",
        MAIL_USERNAME: "liveapp.brainium@gmail.com",
        MAIL_PASS: "YW5kcm9pZDIwMTY"
    },
    twillow: {
        live: {
            accountSid: "AC60641b0365287e334555796ca998d402",
            authToken: "a702091fd4c8089a7f7e80ff6ae2dfed",
            from_no: "+12062600506"
        },
        test: {
            accountSid: "AC3f4b8426a5026d7441f19a8b6c68fc18",
            authToken: "823efaec212bb07953b54a00f87a8ebd",
            from_no: "+15005550006"
        }
    },
    google_location_options: {
        provider: 'google',
        // Optional depending on the providers 
        httpAdapter: 'https', // Default 
        apiKey: 'AIzaSyAZrlEyL0r3AX-KVpZCRBEINPtQQ9wIZhI',
        // This api key needs to change before live because it is taken from another project
        formatter: null // 'gpx', 'string', ... 
    },
    uploadInvoicePath: "public/uploads/invoice/",
    InvoicePath: "uploads/invoice/",
    restaurantDemoLogoPath: "uploads/dummy/dummy_restaurant_logo.jpg",
    restaurantDemoBannerPath: "uploads/dummy/dummy_restaurant_banner.jpg",
    menuDemoLogoPath: "uploads/dummy/Menu_item_default_logo.jpg",
    userDemoPicPath: "uploads/dummy/demo-profile.png",
    uploadProfilepicPath: "public/uploads/profilepic/",
    profilepicPath: "uploads/profilepic/",
    uploadteamidproofPath: "public/uploads/teamidproof/",
    teamidproofPath: "uploads/teamidproof/",
    uploadRestaurantPicPath: "public/uploads/restaurantpic/",
    RestaurantPicPath: "uploads/restaurantpic/",
    RestaurantQRPicPath: "uploads/restaurantpic/qr/",
    uploadRestaurantQRPicPath: "public/uploads/restaurantpic/qr/",
    uploadRestaurantCatPicPath: "public/uploads/restaurantpic/restaurant_category/",
    RestaurantCatPicPath: "uploads/restaurantpic/restaurant_category/",
    uploadMenuCatPicPath: "public/uploads/menu/menu_category/",
    MenuCatPicPath: "uploads/menu/menu_category/",
    uploadDefaultMenuCatIconPath: "public/uploads/menu/menu_category/default_icon/",
    defaultMenuCatIconPath: "uploads/menu/menu_category/default_icon/",
    uploadMenuItemPicPath: "public/uploads/menu/menu_item/",
    MenuItemPath: "uploads/menu/menu_item/",
    uploadSliderPicPath: "public/uploads/home_slider/",
    sliderPicPath: "uploads/home_slider/",
    uploadRecyclingProductpicPath: "public/uploads/recyclingproductpic/",
    recyclingProductpicPath: "uploads/recyclingproductpic/",
    uploadBarCodepicPath: "public/uploads/barcodepic/",
    barCodepicPath: "uploads/barcodepic/",
    uploadCausepicPath: "public/uploads/cause/",
    causepicPath: "uploads/cause/",
    uploadProductpicPath: "public/uploads/product/",
    productpicPath: "uploads/product/",
    uploadCauseDocPath: "public/uploads/cause/doc/",
    causeDocPath: "uploads/cause/doc/",
    uploadCompanyLogoPath: "public/uploads/vendor/",
    companyLogoPath: "uploads/vendor/",
    uploadAdsImagePath: "public/uploads/ads/",
    AdsImagePath: "uploads/ads/",
    socketUrl: "https://nodeserver.brainiuminfotech.com:1426/",
    liveUrl: "https://nodeserver.brainiuminfotech.com:1425/",
    baseUrl: "https://nodeserver.brainiuminfotech.com/dibyendu/ezfoodie/admin/#/",
    logPath: "/ServiceLogs/admin.debug.log",
    dev_mode: true,
    __root_dir: __dirname,
    __site_url: '',
    limit: 10

}