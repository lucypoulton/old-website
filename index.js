const express = require("express");
const formidable = require('express-formidable');
const expressLayouts = require("express-ejs-layouts")
const logger = require("morgan")
const path = require("path");
const cookieParser = require("cookie-parser");
const {auth} = require("express-openid-connect");
const config = require("./config.json");
const createError = require("http-errors");

const app = express();

// view engine
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('view engine', 'ejs');

// middleware
app.use(logger("dev"));
app.use(auth({
        ...config.oidc,
        authRequired: false,
        idpLogout: true,
        errorOnRequiredAuth: true
    })
);
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/files', express.static('filestore'));
app.use(formidable({
    encoding: "utf-8",
    multiples: true
}))

// mysql setup
require("./database").init(app).then(() => {
    console.log("Database initialised")

    // TODO - add routers here
    require("./controllers/index").init(app);
    require("./controllers/projects").init(app);
    require("./controllers/mdedit").init(app);

    app.use(function (req, res, next) {
        next(createError(404));
    });

// error handler
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error', {user: req.oidc.user});
    });


    app.listen(config.port, () => console.log(`Listening on port ${config.port}`));
});





