const isDocker = process.env.DOCKER === 'true' || process.env.HF_SPACE_ID;

module.exports = {
    apps: [
        // ── INGRID BRAIN (Next.js) ──
        {
            name: "ingrid-brain",
            cwd: isDocker ? "./web-app-standalone/web-app" : "./web-app",
            script: isDocker ? "server.js" : "node_modules/.bin/next",
            args: isDocker ? "" : "start",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
                PORT: process.env.PORT || 7860,
                HOSTNAME: "0.0.0.0",
            },
        },

        // ── INGRID WA SERVICE (WhatsApp Connector) ──
        {
            name: "ingrid-wa",
            cwd: "./wa-service",
            script: "index.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
                PORT: 3001,
            },
        },
    ],
};
