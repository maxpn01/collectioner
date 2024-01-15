require('dotenv').config();
const path = require("path");
const execSync = require('child_process').execSync;

execSync(`meilisearch.exe --master-key="${process.env.MEILI_MASTER_KEY}"`, { stdio: [0, 1, 2], cwd: path.join(__dirname, "meilisearch") });