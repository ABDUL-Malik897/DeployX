const { spawn } = require("child_process");

const runCommand = (command, args, cwd, customEnv = {}, onLog) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: false,
            env: {
                ...process.env,
                ...customEnv
            }
        });

        let failed = false;

        const handleOutput = (data, isError = false) => {
            const output = data.toString();

            if (onLog) {
                onLog(output);
            }

            if (isError) {
                console.error(output);
            } else {
                console.log(output);
            }
        };

        child.stdout.on("data", (data) => {
            handleOutput(data, false);
        });

        child.stderr.on("data", (data) => {
            handleOutput(data, true);
        });

        child.on("error", (error) => {
            failed = true;
            reject(error);
        });

        child.on("close", (code) => {
            if (failed) {
                return;
            }

            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `Command failed with exit code ${code}`
                    )
                );
            }
        });
    });
};

module.exports = runCommand;