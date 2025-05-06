#!/bin/bash

echo "Building all services..."

npm run pretty && npm run lint

for service in services/*/; do
  echo "Building $service..."
  cd "$service"
  
  echo "Installing dependencies for $service..."
  npm install

  # Compile TypeScript
  npm run build

  cd - > /dev/null
done

sam build

echo "✅ All services built successfully."
