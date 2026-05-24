#!/bin/bash

echo "🔄 Starting SentryRBAC setup inside Codespaces..."

# 1. Update and install MariaDB (Fully compatible MySQL drop-in)
echo "📦 Installing MariaDB Server..."
sudo apt-get update
sudo apt-get install -y mariadb-server mariadb-client

# 2. Start MariaDB Service
echo "🚀 Starting MariaDB Service..."
sudo service mariadb start || sudo service mysql start

# 3. Configure Database Permissions (Allow root TCP connection without password)
echo "🔑 Configuring database permissions..."
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '' WITH GRANT OPTION;"
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '';"
sudo mysql -e "FLUSH PRIVILEGES;"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS rbac_db;"

# 4. Install Bun.js globally
echo "🍞 Installing Bun.js..."
sudo npm install -g bun

# 5. Install Project Dependencies & Compile CSS
echo "⚡ Installing project packages and compiling styles..."
bun install
bun run build:css

echo "✅ Setup complete! Ready to start the server."
