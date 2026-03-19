#!/bin/bash
# link-to-foundry.sh
# This script creates a symbolic link between your project and the Foundry VTT systems folder.

SYSTEM_ID="tams"
FOUNDRY_SYSTEMS_PATH="$HOME/.local/share/FoundryVTT/Data/systems"
PROJECT_PATH=$(pwd)
TARGET_PATH="$FOUNDRY_SYSTEMS_PATH/$SYSTEM_ID"

echo "Attempting to link $SYSTEM_ID to Foundry VTT..."

if [ ! -d "$FOUNDRY_SYSTEMS_PATH" ]; then
    echo "ERROR: Foundry VTT systems folder not found at $FOUNDRY_SYSTEMS_PATH"
    echo "Please ensure Foundry VTT is installed and has been run at least once."
    exit 1
fi

if [ -L "$TARGET_PATH" ]; then
    echo "Symlink already exists. Re-linking..."
    rm "$TARGET_PATH"
elif [ -d "$TARGET_PATH" ]; then
    echo "A directory already exists at $TARGET_PATH. Backing it up to ${TARGET_PATH}.bak..."
    mv "$TARGET_PATH" "${TARGET_PATH}.bak"
fi

ln -s "$PROJECT_PATH" "$TARGET_PATH"

if [ $? -eq 0 ]; then
    echo "SUCCESS: Linked $PROJECT_PATH to $TARGET_PATH"
    echo "You can now see your changes instantly in Foundry VTT (restart or refresh F5)."
else
    echo "FAILED to create symlink."
    exit 1
fi
