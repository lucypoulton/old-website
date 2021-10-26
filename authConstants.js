const createError = require("http-errors");

module.exports = {
    isAdmin: function (req, res, next) {
        if (req.oidc.user === undefined) {
            res.oidc.login();
        } else if (req.oidc.user?.roles.includes("Website-Admin")) {
            next();
        } else {
            next(createError(400, "You don't have access to this page."))
        }
    }
}