module.exports = {
    init: function (app) {
        app.get("/", function (_, res) {
            res.render("index");
        })
    }
}