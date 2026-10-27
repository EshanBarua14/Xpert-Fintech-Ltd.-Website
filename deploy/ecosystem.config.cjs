// PM2 settings for a Namecheap VPS (not used on cPanel shared hosting, where Passenger runs app.js).
// Nginx (or Apache) forwards https://xpertfintech.com to 127.0.0.1:3000.
module.exports = {
  apps: [
    {
      name: "xpertfintech",
      script: "app.js",
      cwd: __dirname,
      instances: 1,
      max_memory_restart: "700M",
      env: { PORT: "3000", BIND_HOST: "127.0.0.1" },
    },
  ],
};
