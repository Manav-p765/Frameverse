module.exports = {
    apps: [
        {
            name: "api-server",
            script: "./apiServer.js",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "socket-server",
            script: "./socketServer.js",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "worker-server",
            script: "./workerServer.js",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
            }
        }
    ]
};
