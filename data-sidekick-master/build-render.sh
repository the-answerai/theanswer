#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Copy the Render-specific .npmrc file
echo "Copying Render-specific .npmrc file..."
cp .npmrc-render .npmrc

# Install server dependencies
echo "Installing server dependencies..."
pnpm install

# Try to approve builds for specific packages
echo "Approving builds for specific packages..."
echo "y" | pnpm approve-builds @ffmpeg-installer/linux-x64 es5-ext ngrok || true

# Update client's pnpm-lock.yaml file
echo "Updating client's pnpm-lock.yaml file..."
node update-client-lock.js

# Install client dependencies
echo "Installing client dependencies..."
cd client

# Copy the Render-specific .npmrc file to client directory
echo "Copying Render-specific .npmrc file to client directory..."
cp ../.npmrc-render .npmrc

# Use --no-frozen-lockfile to address the lockfile mismatch
echo "Installing client dependencies with --no-frozen-lockfile..."
pnpm install --no-frozen-lockfile

# Increase Node.js memory limit for the build
echo "Setting Node.js memory limit to 4GB..."
export NODE_OPTIONS="--max-old-space-size=4096"

# Build the client
echo "Building client..."
pnpm run build

# Verify the build output
if [ -d "dist" ]; then
  echo "Client build successful! dist directory exists."
else
  echo "Error: dist directory not found after build!"
  exit 1
fi

# Return to the root directory
cd ..

echo "Build completed successfully!"
