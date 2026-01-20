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

let originalToolbarComponent: any = null;

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
            const pluginsHeader = document.querySelector('[class*="bd-plugins-header"], [class*="plugins-"] h2');
            if (!pluginsHeader) return;
            
            // Check if we already injected
            if (document.getElementById("bd-compat-toolbar")) return;
            
            // Create toolbar
            const toolbar = document.createElement("div");
            toolbar.id = "bd-compat-toolbar";
            toolbar.style.cssText = "display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;";
            
            // We'll inject vanilla buttons instead of React components for simplicity
            const createButton = (text: string, isBulk: boolean) => {
                const btn = document.createElement("button");
                btn.className = "vc-button vc-button-size-small vc-button-color-brand";
                btn.style.cssText = "display: flex; align-items: center; gap: 4px; padding: 2px 16px; border-radius: 3px; font-size: 14px; font-weight: 500; cursor: pointer; background-color: var(--brand-experiment); color: white; border: none;";
                btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>${text}`;
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
            
            // Insert toolbar before the plugins header
            pluginsHeader.parentElement?.insertBefore(toolbar, pluginsHeader);
            
            compat_logger.log("Plugin import toolbar injected");
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Store observer for cleanup
        (window as any).__bdCompatToolbarObserver = observer;
        
        compat_logger.log("Plugin page button observer started");
    } catch (error) {
        compat_logger.error("Failed to inject plugin page buttons:", error);
    }
}

export function unInjectPluginPageButtons() {
    try {
        const observer = (window as any).__bdCompatToolbarObserver;
        if (observer) {
            observer.disconnect();
            delete (window as any).__bdCompatToolbarObserver;
        }
        
        const toolbar = document.getElementById("bd-compat-toolbar");
        if (toolbar) {
            toolbar.remove();
        }
        
        compat_logger.log("Plugin page buttons removed");
    } catch (error) {
        compat_logger.error("Failed to remove plugin page buttons:", error);
    }
}
