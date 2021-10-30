module.exports = {
    init: function (app) {
        app.get("/", async (req, res) => {
            res.render("index", {
                user: req.oidc.user,
                projects: await app.database.projects()
            });
        })
    }
}