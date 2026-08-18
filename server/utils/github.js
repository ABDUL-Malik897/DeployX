const fs = require("fs");
const path = require("path");
const { App } = require("@octokit/app");

const privateKeyPath = path.resolve(process.env.GITHUB_PRIVATE_KEY_PATH);
const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const githubApp = new App({
    appId: process.env.GITHUB_APP_ID,
    privateKey
});

module.exports = githubApp;