// Exports an async method responsible for setting up MySQL.

const database = require("mysql2/promise");
const config = require("./config.json");
const fs = require("fs/promises");

module.exports = {
    _pool: database.createPool(config.mysql),

    _urlBlockedChars: /[^a-z0-9]+/g,

    generateUrlName(name) {
        return name.toLowerCase().replaceAll(this._urlBlockedChars, "-")
    },

    async init(app) {
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

    async projects() {
        const conn = await this._pool.getConnection();
        const [results] = await conn.execute("SELECT * FROM projects");
        conn.release();
        return results;
    },

    async getProjectById(urlName) {
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

    async addProject(project) {
        const conn = await this._pool.getConnection();
        const name = this.generateUrlName(project.project_name);
        await conn.execute(
            "INSERT INTO projects (project_name, display_name, description, longdesc) VALUES (?, ?, ?, ?)",
            [name, project.project_name, project.description, project.longdesc]);
        conn.release();
        return name;
    },

    async getStoredFileById(fileId) {
        const conn = await this._pool.getConnection();
        const [results] = await conn.execute("SELECT * FROM stored_files WHERE id=?", [fileId]);
        conn.release();

        return results.length === 0 ? null : results[0];
    },

    async getProjectUpdates(projectId) {
        const conn = await this._pool.getConnection();
        const [updates] = await conn.execute("SELECT * FROM updates WHERE project=?", [projectId]);
        const [files] = await conn.execute("SELECT stored_files.* FROM stored_files, updates WHERE updates.project='?'", [projectId]);
        for (let file of files) {
            let update = updates.find(upd => upd.id === file.update_id);
            if (update == null) continue;
            if (!update.files) update.files = [];
            update.files.push(file);
        }
        return updates;
    },

    async setProjectDescription(projectId, newDescription) {
        const conn = await this._pool.getConnection();
        await conn.execute("UPDATE projects SET longdesc=? WHERE id=?", [newDescription, projectId]);
        conn.release();
    },

    async addProjectUpdate(projectId, update) {
        const conn = await this._pool.getConnection();
        await conn.execute("INSERT INTO updates (version, project, description) VALUES (?, ?, ?)",
            [update.version, projectId, update.description]);
        conn.release();
    },

    async generateIdForFile(projectId, fileName) {
        const conn = await this._pool.getConnection();
        await conn.execute("INSERT INTO stored_files (update_id, originalName) VALUES (?, ?)",
            [projectId, fileName]);
        const [id] = await conn.execute("SELECT LAST_INSERT_ID();");
        conn.release();
        return id;
    }
}