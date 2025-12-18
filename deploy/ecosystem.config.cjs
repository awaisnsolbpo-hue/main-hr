// PM2 Ecosystem Configuration
// Run with: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'hr-backend',
      cwd: '/var/www/hr-app/backend',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_file: '/var/www/hr-app/backend/.env',
      error_file: '/var/log/hr-app/backend-error.log',
      out_file: '/var/log/hr-app/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
  ],
};

