module.exports = {
    init: function (app) {
        app.get("/projects",async (_, res) =>
            res.render("projects/index", {projects: await app.database.projects()}))

        app.post("/projects/create", this.onProjectCreate);
        app.get("/projects/create", this._render("projects/create"))
    },

    _render: function (name) {
        return (req, res) => res.render(name);
    },

    onProjectCreate: function (req, res) {
        console.log(req.fields);
        // todo - redirect to project page
        res.redirect("/");
    }
}