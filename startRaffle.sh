#!/bin/bash

# NX Raffle Party - Startup Script

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Always run from the project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}🎰 Starting Raffle...${NC}\n"

# Check dependencies
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    echo -e "${YELLOW}   Download it from https://nodejs.org and try again.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. It usually comes with Node.js.${NC}"
    echo -e "${YELLOW}   Download Node.js from https://nodejs.org and try again.${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies (one-time setup)...${NC}"
    npm install
fi

if [ ! -d "lottery-ui/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies (one-time setup)...${NC}"
    cd lottery-ui && npm install && cd ..
fi

# Cleanup handler — kills backend when script exits (frontend kills itself)
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
    kill "$BACKEND_PID" 2>/dev/null || true
    echo -e "${GREEN}✅ Stopped.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend in background
echo -e "${GREEN}🚀 Starting backend...${NC}"
npm run server &
BACKEND_PID=$!
sleep 2

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check for errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Raffle is live!${NC}"
echo -e "${YELLOW}   Open: http://localhost:3000${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop${NC}\n"

# Start frontend in foreground (blocking)
cd lottery-ui && npm start
cd ..

cleanup
