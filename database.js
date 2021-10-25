// Exports an async method responsible for setting up MySQL.

const database = require("mysql2/promise");
const config = require("./config.json");
const fs = require("fs/promises");

module.exports = {
    _pool: database.createPool(config.mysql),

    _urlBlockedChars: /[^a-z0-9]+/g,

    generateUrlName: function (name) {
        return name.toLowerCase().replaceAll(this._urlBlockedChars, "-")
    },

    init: async function (app) {
        try {
            await fs.mkdir("filestore");
        } catch (_) {
        }
        const conn = await this._pool.getConnection();
        const files = (await fs.readdir("migrations")).filter(f => f.endsWith(".sql")).sort();

        for (const fileName of files) {
            const queries = await fs.readFile(`migrations/${fileName}`, {encoding: "utf-8"});
            for (const query of queries.split(";")) {
                const trimmed = query.trim();
                if (trimmed !== "") await this._pool.query(query);
            }
        }
        conn.release()
        app.database = this;
    },

    projects: async function () {
        const conn = await this._pool.getConnection();
        const [results] = await conn.execute("SELECT * FROM projects");
        conn.release();
        return results;
    },

    getProjectById: async function (urlName) {
        const conn = await this._pool.getConnection();
        const [results] = await conn.execute("SELECT * FROM projects WHERE project_name=?", [urlName]);
        if (results.length === 0) {
            conn.release();
            return null;
        }
        const project = results[0];

        const linksQuery = await conn.execute("SELECT * FROM project_links WHERE project=?", [project.id]);
        project.links = linksQuery[0];
        conn.release();
        return project;
    },

    addProject: async function (project) {
        const conn = await this._pool.getConnection();
        const name = this.generateUrlName(project.project_name);
        await conn.execute(
            "INSERT INTO projects (project_name, display_name, description) VALUES (?, ?, ?)",
            [name, project.project_name, project.description]);
        conn.release();
        return name;
    }
}