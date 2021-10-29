const authConstants = require("../authConstants");

module.exports = {
    init: function (app) {
        app.get("/projects/:name/edit", authConstants.isAdmin, this.getProjectEdit);
        app.post("/projects/:name/edit", authConstants.isAdmin, this.postProjectEdit);
    },

    getProjectEdit: async function (req, res) {
        const project = await req.app.database.getProjectById(req.params.name);

        if (project == null) res.status(404);

        else res.render("edit", {
            filename: `${project.display_name} description`,
            contents: project.longdesc,
            user: req.oidc.user
        });
    },

    postProjectEdit: async function (req, res) {
        const project = await req.app.database.getProjectById(req.params.name);

        if (typeof req.fields.content === "undefined") res.status(400);
        else if (project == null) res.status(404);
        else {
            await req.app.database.setProjectDescription(project.id, req.fields.content)
            res.redirect(`/projects/${project.project_name}`);
        }
    }
}
