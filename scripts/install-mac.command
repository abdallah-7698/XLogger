#!/bin/bash

# XLogger macOS Installer
# Double-click this file to install XLogger

clear
echo "================================"
echo "  XLogger Installer"
echo "================================"
echo ""

# Find the .app — look in the same folder as this script, then common locations
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_PATH=""

for search_dir in "$SCRIPT_DIR" "$HOME/Downloads" "/Volumes"; do
    found=$(find "$search_dir" -maxdepth 3 -name "XLogger.app" -type d 2>/dev/null | head -1)
    if [ -n "$found" ]; then
        APP_PATH="$found"
        break
    fi
done

if [ -z "$APP_PATH" ]; then
    echo "❌ Could not find XLogger.app"
    echo "   Please make sure the DMG is mounted or XLogger.app is in Downloads."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Found: $APP_PATH"
echo ""

# Copy to Applications
echo "→ Copying to /Applications..."
cp -R "$APP_PATH" /Applications/ 2>/dev/null
if [ $? -ne 0 ]; then
    echo "  Needs admin permission..."
    sudo cp -R "$APP_PATH" /Applications/
fi

# Remove quarantine flag
echo "→ Removing quarantine flag..."
xattr -cr /Applications/XLogger.app

echo ""
echo "✅ XLogger installed successfully!"
echo ""
echo "→ Opening XLogger..."
open /Applications/XLogger.app

sleep 2
