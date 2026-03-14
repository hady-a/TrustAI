#!/bin/bash

# TrustAI Stop Script
# This script stops all services started by start.sh

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# PID file
PID_FILE="$PROJECT_ROOT/.trustai_pids"

# Function to print colored messages
print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process if it exists
kill_process() {
    local pid=$1
    local name=$2
    
    if [ -z "$pid" ]; then
        return
    fi
    
    # Check if process exists
    if ps -p "$pid" > /dev/null 2>&1; then
        print_info "Stopping $name (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null || true
        
        # Wait up to 5 seconds for graceful shutdown
        local count=0
        while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
            sleep 0.5
            count=$((count + 1))
        done
        
        # Force kill if still running
        if ps -p "$pid" > /dev/null 2>&1; then
            print_warning "Force killing $name (PID: $pid)..."
            kill -KILL "$pid" 2>/dev/null || true
            sleep 1
        fi
        
        if ! ps -p "$pid" > /dev/null 2>&1; then
            print_success "$name stopped"
        else
            print_error "Failed to stop $name"
        fi
    fi
}

# Function to kill processes by name
kill_by_name() {
    local process_name=$1
    local display_name=$2
    
    if command_exists pgrep; then
        local pids=$(pgrep -f "$process_name" || true)
        if [ -n "$pids" ]; then
            print_info "Stopping $display_name..."
            echo "$pids" | xargs kill -TERM 2>/dev/null || true
            
            # Wait for graceful shutdown
            sleep 2
            
            # Force kill any remaining processes
            pids=$(pgrep -f "$process_name" || true)
            if [ -n "$pids" ]; then
                print_warning "Force killing remaining $display_name processes..."
                echo "$pids" | xargs kill -KILL 2>/dev/null || true
            fi
            
            # Verify
            pids=$(pgrep -f "$process_name" || true)
            if [ -z "$pids" ]; then
                print_success "$display_name stopped"
            else
                print_error "Some $display_name processes may still be running"
            fi
        fi
    fi
}

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Stopping TrustAI Services...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

STOPPED_COUNT=0

# Stop services using PIDs from the file
if [ -f "$PID_FILE" ]; then
    print_info "Reading saved process IDs..."
    
    # Read PIDs from file
    while IFS= read -r pid; do
        if [ -n "$pid" ] && [ "$pid" != "6379" ]; then
            kill_process "$pid" "Service"
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        fi
    done < "$PID_FILE"
    
    # Clean up PID file
    rm -f "$PID_FILE"
else
    print_info "No saved process IDs found. Searching by process name..."
fi

# Kill by process name as fallback or additional cleanup
echo -e "\n${BLUE}Cleaning up any remaining services...${NC}\n"

# Kill Node processes (backend/frontend)
if command_exists pgrep; then
    # Kill npm processes for node apps
    node_pids=$(pgrep -f "npm.*run.*dev" || true)
    if [ -n "$node_pids" ]; then
        print_info "Stopping Node.js services..."
        echo "$node_pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        node_pids=$(pgrep -f "npm.*run.*dev" || true)
        if [ -n "$node_pids" ]; then
            echo "$node_pids" | xargs kill -KILL 2>/dev/null || true
        fi
        print_success "Node.js services stopped"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    fi
    
    # Kill uvicorn (AI service)
    uvicorn_pids=$(pgrep -f "uvicorn" || true)
    if [ -n "$uvicorn_pids" ]; then
        print_info "Stopping AI service..."
        echo "$uvicorn_pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        uvicorn_pids=$(pgrep -f "uvicorn" || true)
        if [ -n "$uvicorn_pids" ]; then
            echo "$uvicorn_pids" | xargs kill -KILL 2>/dev/null || true
        fi
        print_success "AI service stopped"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    fi
fi

# Stop Redis (only if we started it)
if command_exists redis-cli; then
    print_info "Checking Redis status..."
    
    redis_info=$(redis-cli ping 2>/dev/null || true)
    if [ "$redis_info" = "PONG" ]; then
        print_info "Stopping Redis..."
        redis-cli shutdown 2>/dev/null || true
        sleep 1
        
        redis_info=$(redis-cli ping 2>/dev/null || true)
        if [ -z "$redis_info" ]; then
            print_success "Redis stopped"
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        else
            print_warning "Redis may still be running"
        fi
    else
        print_info "Redis is not running"
    fi
fi

# Clean up log files (optional)
if [ "$1" = "--clean" ]; then
    print_info "Cleaning up log files..."
    rm -f "$PROJECT_ROOT/.backend.log"
    rm -f "$PROJECT_ROOT/.frontend.log"
    rm -f "$PROJECT_ROOT/.ai-service.log"
    rm -f "$PROJECT_ROOT/.redis.log"
    print_success "Log files cleaned"
fi

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
if [ $STOPPED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Stopped $STOPPED_COUNT service(s)${NC}"
else
    echo -e "${YELLOW}⚠ No services found running${NC}"
fi
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

print_info "All TrustAI services have been stopped"
echo -e "\n${BLUE}To view recent logs, check:${NC}"
echo -e "   ${YELLOW}.backend.log${NC}"
echo -e "   ${YELLOW}.frontend.log${NC}"
echo -e "   ${YELLOW}.ai-service.log${NC}"
echo -e "   ${YELLOW}.redis.log${NC}"

echo -e "\n${BLUE}To start services again, run:${NC}"
echo -e "   ${YELLOW}./start.sh${NC}\n"
