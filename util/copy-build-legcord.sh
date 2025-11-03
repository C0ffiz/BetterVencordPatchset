#!/bin/bash

destination_folder="$HOME/.config/legcord/plugins/1loader/dist"
source_folder="./dist/Vencord/dist"

cp -f "$source_folder/browser.js" "$destination_folder/bundle.js"
cp -f "$source_folder/browser.css" "$destination_folder/bundle.css"
