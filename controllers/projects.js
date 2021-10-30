const fs = require("fs/promises");
const marked = require("marked");
const createDOMPurify = require('dompurify');
const {JSDOM} = require('jsdom');

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
        app.post("/projects/create", authConstants.isAdmin, this.onPostProject);
        app.get("/projects/create", authConstants.isAdmin, (req, res) => res.render("projects/create", {user: req.oidc.user}));

        app.get("/projects/:name", this.onGetProject);
        app.get("/projects/:name/downloads", this.onGetDownloads);
        app.get("/projects/:name/downloads/create", authConstants.isAdmin, this.onGetDownloadsCreate);
        app.post("/projects/:name/downloads/create", authConstants.isAdmin, this.onPostDownloadsCreate);
    },

    onGetProject: async function (req, res, next) {
        const project = await req.app.database.getProjectById(req.params.name);
        next(project == null ?
            createError(404, "That project doesn't exist.") :
            res.render("projects/project", {
                project: project,
                longdesc: DOMPurify.sanitize(marked(project.longdesc ?? "")),
                user: req.oidc.user
            }));
    },

    onPostProject: async function (req, res, next) {
        if (["project_name", "description", "longdesc"].find(f => typeof req.fields[f] === "undefined")) {
            next(createError(400))
        }

        try {
            const name = await req.app.database.addProject(req.fields);
            res.redirect(`/projects/${name}`);
        } catch (ex) {
            next(createError(500, ex));
        }
    },

    onGetDownloads: async function (req, res, next) {
        const project = await req.app.database.getProjectById(req.params.name);
        if (project === null) {
            next(createError(404, "That project doesn't exist."));
            return;
        }
        const updates = await req.app.database.getProjectUpdates(project.id);

        next(res.render("projects/downloads/index", {
            project: project,
            user: req.oidc.user,
            updates: updates
        }));
    },

    onGetDownloadsCreate: async function (req, res, next) {
        const project = await req.app.database.getProjectById(req.params.name);
        if (project === null) {
            next(createError(404, "That project doesn't exist."));
            return;
        }
        next(res.render("projects/downloads/create", {
            user: req.oidc.user
        }));
    },

    onPostDownloadsCreate: async function (req, res, next) {
        const project = await req.app.database.getProjectById(req.params.name);
        if (project === null) {
            next(createError(404, "That project doesn't exist."));
            return;
        }

        if (["version", "description"].find(f => typeof req.fields[f] === "undefined")) {
            next(createError(400))
        }

        try {
            const updateId = await req.app.database.addProjectUpdate(project.id, req.fields);
            for (let file of req.files["file[]"]) {
                const id = await req.app.database.generateIdForFile(updateId, file.name);
                await fs.copyFile(file.path, `${process.env.PWD}/filestore/${id}`);
            }
            res.redirect(`/projects/${req.params.name}`);
        } catch (ex) {
            next(createError(500, ex));
        }
    }
}