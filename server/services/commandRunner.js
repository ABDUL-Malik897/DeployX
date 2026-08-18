const { spawn } = require("child_process");

const runCommand = (command, args, cwd, customEnv) => {

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: false,
            env: {
                ...process.env,
                ...customEnv
            }
        });
        let logs = "";
        child.stdout.on("data", (data) => {
            const output = data.toString();
            logs += output;
            console.log(output);
        });
        child.stderr.on("data", (data) => {
            const output = data.toString();
            logs += output;
            console.error(output);
        });
        child.on("error", (error) => {
            reject(error);
        });
        child.on("close", (code) => {
            if (code === 0) {
                resolve(logs);
            } else {
                reject(new Error(`Command failed with exit code ${code}\n${logs}`));
            }
        });
    });
};

module.exports = runCommand;