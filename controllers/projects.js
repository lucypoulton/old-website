const createError = require("http-errors");
module.exports = {
    init: function (app) {
        app.get("/projects", async (_, res) =>
            res.render("projects/index", {projects: await app.database.projects()})
        );

        // ordering is important here
        app.post("/projects/create", this.onProjectCreate);
        app.get("/projects/create", this._render("projects/create"));

        app.get("/projects/:name", this.onGetProject);
    },

    _render: function (name) {
        return (req, res) => res.render(name);
    },

    onGetProject: async function (req, res) {
        res.render("projects/project", {project: await req.app.database.getProjectById(req.params.name)});
    },

    onProjectCreate: async function (req, res, next) {
        if (["project_name", "description"].find(f => typeof req.fields[f] === "undefined")) {
            next(createError(400))
        }

        try {
            const name = await req.app.database.addProject(req.fields);
            res.redirect(`/projects/${name}`);
        } catch (ex) {
            next(createError(500, ex));
        }
    }
}