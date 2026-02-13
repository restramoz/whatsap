module.exports = {
    apps: [
        // ── INGRID BRAIN (Next.js) ──
        {
            name: "ingrid-brain",
            cwd: "./web-app",
            script: "node_modules/.bin/next",
            args: "start",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
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
            },
        },
    ],
};
