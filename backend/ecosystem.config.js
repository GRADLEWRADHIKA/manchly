module.exports = {
  apps: [
    {
      name: "machly-backend",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
        HTTPS_PORT: 443,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
        HTTPS_PORT: 443,
      },
      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Advanced PM2 features
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};

