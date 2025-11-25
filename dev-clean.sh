#!/bin/bash

echo "🧹 Cleaning up Next.js processes and cache..."

# Kill all Next.js related processes
echo "🔥 Killing Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "postcss.js" 2>/dev/null || true

# Kill any process using port 3000
echo "🔌 Freeing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Remove lock files and cache
echo "🗑️ Removing cache and lock files..."
rm -f .next/dev/lock 2>/dev/null || true
rm -rf .next/cache 2>/dev/null || true

# Wait a moment
sleep 2

echo "🚀 Starting clean Next.js server..."
npm run dev
