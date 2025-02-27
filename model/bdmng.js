const Database = require("better-sqlite3");
const db = new Database("../Inmobiliaria-casos.db");
exports.db = db;