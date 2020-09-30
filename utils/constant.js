module.exports.STATUS_CONSTANTS = {
    REGISTER_SUCCESS: 1,
    REGISTER_FAIL: -1,
    AUTHENTICATION_FAILED: -2,
    USER_AUTHENTICATED: 2,
    USER_ALREADY_EXIST: 3,
    USER_DOES_NOT_EXIST: -3,
    INTERNAl_DB_ERROR: -5,
    IMAGE_UPLOADED_SUCCESSFULLY: 4,
    IMAGE_UPLOADED_FAILED: -4,
    SESSION_EXPIRED: -8,
    ACCOUNT_NOT_VERIFIED: -1,
    FAIL: 0,
    LOGIN_TYPES: {
        FB: 'FB',
        GOOGLE: 'GOOGLE',
        NORMAL: 'NORMAL'
    }
};
module.exports.STATUS_MESSAGES = {
    REGISTER_SUCCESS: "User Successfully created.",
    REGISTER_FAIL: "Could not save user please check.",
    USER_AUTHENTICATED: "User Successfully Logged in.",
    USER_ALREADY_EXIST: "Sorry...! user already exist.",
    INTERNAl_DB_ERROR: "Internal DB error.",
    IMAGE_UPLOADED_FAILED: "Image uploaded Failed",
    SESSION_EXPIRED: "Sorry...! your session has timed out , please login again",
    AUTHENTICATION_FAILED: "Authentication failed",
    SUCCESSFULLY_CREATED: "Successfully created",
    ERROR_SAVING: "Could not save to to database please check",
    ALREADY_EXISTS: "Already exits",
    NOT_FOUND: "Not found",
    LOGGED_OUT: "Logout successfull",
    USER_DOES_NOT_EXIST: "User does not exist",
    IMAGE_UPLOADED_SUCCESSFULLY: "Image uploaded and updated successfully",
    EMAIL_REQUIRED: "Please add a valid email",
    USER_REQUIRED: "Please add a valid user name",
    USERTYPE_REQUIRED: "Please add a user type",
    PASSWORD_REQUIRED: "Please provide a passord",
    ACCOUNT_NOT_VERIFIED: "Sorry...! Your email has not been verified yet"
}
module.exports = {
    randomSrting: (length, chars) => {
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }
}