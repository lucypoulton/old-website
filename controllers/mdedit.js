module.exports = {
    init: function (app) {
        app.get("/edit", this.onGetEdit);
    },

    onGetEdit: function (req, res) {
        res.render("edit", {
            filename: req.query.file
        });
    }
}
