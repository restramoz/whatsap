const isDocker = process.env.DOCKER === 'true' || process.env.HF_SPACE_ID;

module.exports = {
  apps: [
    {
      name: 'web-app',
      cwd: '/app/web-app-standalone',
      script: 'server.js',
      env: {
        PORT: 7860,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'wa-service',
      cwd: '/app/wa-service',
      script: 'index.js',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      },
      // Auto restart jika crash
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    }
  ]
};
