// Exports an async method responsible for setting up MySQL.

const database = require("mysql2/promise");
const config = require("./config.json");
const fs = require("fs/promises");

module.exports = {
    _pool: database.createPool(config.mysql),

    init: async function (app) {
        try {
            await fs.mkdir("filestore");
        } catch (_) {}
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
    }
}