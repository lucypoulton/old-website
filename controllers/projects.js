const marked = require("marked");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const createError = require("http-errors");
const authConstants = require("../authConstants");
module.exports = {
    init: function (app) {
        app.get("/projects", async (req, res) =>
            res.render("projects/index", {
                projects: await app.database.projects(),
                user: req.oidc.user
            })
        );

        // ordering is important here
        app.post("/projects/create", authConstants.isAdmin, this.onProjectCreate);
        app.get("/projects/create", authConstants.isAdmin, (req, res) => res.render("projects/create", {user: req.oidc.user}));

        app.get("/projects/:name", this.onGetProject);
    },

    onGetProject: async function (req, res) {
        const project = await req.app.database.getProjectById(req.params.name);
        if (project == null) res.status(404);
        else res.render("projects/project", {
            project: project,
            longdesc: DOMPurify.sanitize(marked(project.longdesc ?? "")),
            user: req.oidc.user
        });
    },

    onProjectCreate: async function (req, res, next) {
        if (["project_name", "description", "longdesc"].find(f => typeof req.fields[f] === "undefined")) {
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