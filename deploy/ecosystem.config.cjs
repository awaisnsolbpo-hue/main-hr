// PM2 config for backend
module.exports = {
  apps: [{
    name: 'hr-backend',
    cwd: '/root/hr-app/backend',
    script: 'src/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
