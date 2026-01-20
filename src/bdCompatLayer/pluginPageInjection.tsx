/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { PlusIcon } from "@components/Icons";
import { Button } from "@components/Button";
import { React } from "@webpack/common";
import { FSUtils } from "./utils";
import { compat_logger } from "./utils";

// Module-level variable to store the observer for cleanup
let toolbarObserver: MutationObserver | null = null;

export function ImportBDPluginButton() {
    return React.createElement(
        Button,
        {
            size: Button.Sizes.SMALL,
            onClick: async () => {
                try {
                    await FSUtils.importFile("//BD/plugins", true, false, ".js");
                } catch (error) {
                    compat_logger.error("Failed to import plugin:", error);
                }
            }
        },
        React.createElement(PlusIcon, { width: 16, height: 16, style: { marginRight: "4px" } }),
        "Import BD Plugin"
    );
}

export function ImportBulkPluginsButton() {
    return React.createElement(
        Button,
        {
            size: Button.Sizes.SMALL,
            onClick: async () => {
                try {
                    await FSUtils.importFile("//BD/plugins", true, true, ".js");
                } catch (error) {
                    compat_logger.error("Failed to import plugins:", error);
                }
            }
        },
        React.createElement(PlusIcon, { width: 16, height: 16, style: { marginRight: "4px" } }),
        "Import Bulk Plugins"
    );
}

export function injectPluginPageButtons() {
    try {
        // Use MutationObserver to watch for the plugins page
        const observer = new MutationObserver(() => {
            // Look for common elements on the plugins page
            // Try multiple selectors for better compatibility
            const pluginsPage = 
                document.querySelector('[role="tabpanel"][aria-label*="Plugin"], [role="tabpanel"][aria-label*="plugin"]') ||
                document.querySelector('[class*="contentColumn"]') ||
                document.querySelector('div[class*="plugins"]');
            
            if (!pluginsPage) return;
            
            // Check if we already injected
            if (document.getElementById("bd-compat-toolbar")) return;
            
            // Create toolbar with proper CSS classes
            const toolbar = document.createElement("div");
            toolbar.id = "bd-compat-toolbar";
            toolbar.className = "bd-compat-import-toolbar";
            
            // Add styles via style element instead of inline
            if (!document.getElementById("bd-compat-toolbar-styles")) {
                const style = document.createElement("style");
                style.id = "bd-compat-toolbar-styles";
                style.textContent = `
                    .bd-compat-import-toolbar {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 16px;
                        flex-wrap: wrap;
                    }
                    .bd-compat-import-btn {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        padding: 2px 16px;
                        border-radius: 3px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        background-color: var(--brand-experiment);
                        color: white;
                        border: none;
                        transition: background-color 0.2s;
                    }
                    .bd-compat-import-btn:hover {
                        background-color: var(--brand-experiment-560);
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Create buttons with cleaner implementation
            const createButton = (text: string, isBulk: boolean) => {
                const btn = document.createElement("button");
                btn.className = "bd-compat-import-btn";
                
                // Create icon element safely
                const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                icon.setAttribute("width", "16");
                icon.setAttribute("height", "16");
                icon.setAttribute("viewBox", "0 0 24 24");
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("fill", "currentColor");
                path.setAttribute("d", "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z");
                icon.appendChild(path);
                
                // Create text element safely
                const textNode = document.createTextNode(text);
                
                btn.appendChild(icon);
                btn.appendChild(textNode);
                
                btn.onclick = async () => {
                    try {
                        await FSUtils.importFile("//BD/plugins", true, isBulk, ".js");
                    } catch (error) {
                        compat_logger.error("Failed to import:", error);
                    }
                };
                return btn;
            };
            
            toolbar.appendChild(createButton("Import BD Plugin", false));
            toolbar.appendChild(createButton("Import Bulk Plugins", true));
            
            // Insert toolbar at the beginning of the plugins page
            pluginsPage.insertBefore(toolbar, pluginsPage.firstChild);
            
            compat_logger.log("Plugin import toolbar injected");
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Store observer in module-level variable for cleanup
        toolbarObserver = observer;
        
        compat_logger.log("Plugin page button observer started");
    } catch (error) {
        compat_logger.error("Failed to inject plugin page buttons:", error);
    }
}

export function unInjectPluginPageButtons() {
    try {
        if (toolbarObserver) {
            toolbarObserver.disconnect();
            toolbarObserver = null;
        }
        
        const toolbar = document.getElementById("bd-compat-toolbar");
        if (toolbar) {
            toolbar.remove();
        }
        
        const styles = document.getElementById("bd-compat-toolbar-styles");
        if (styles) {
            styles.remove();
        }
        
        compat_logger.log("Plugin page buttons removed");
    } catch (error) {
        compat_logger.error("Failed to remove plugin page buttons:", error);
    }
}
