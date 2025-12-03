module.exports = {
    apps: [
      {
        name: "seguros-colte",
        script: "dist/index.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "1500M", // PM2 vigila aquí (techo duro)
        // 👇 ESTA ES LA LÍNEA MÁGICA QUE FALTA 👇
        node_args: "--max-old-space-size=1280", // Node limpia aquí (techo suave, aprox 1.2GB)
        env: {
            NODE_ENV: "production",
            PORT: 3033,
        },
      },
    ],
};