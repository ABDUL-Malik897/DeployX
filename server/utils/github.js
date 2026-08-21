const fs = require("fs");
const path = require("path");
const { App } = require("@octokit/app");

let privateKey;
if (process.env.GITHUB_PRIVATE_KEY) {
    privateKey = process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n");
} else {
    const privateKeyPath = path.resolve(process.env.GITHUB_PRIVATE_KEY_PATH);
    privateKey = fs.readFileSync(privateKeyPath, "utf8");
}

const githubApp = new App({
    appId: process.env.GITHUB_APP_ID,
    privateKey
});

module.exports = githubApp;