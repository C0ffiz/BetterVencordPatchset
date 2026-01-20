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

let unpatchPluginsPage: (() => void) | null = null;

export function ImportBDPluginButton() {
    return (
        <Button
            size={Button.Sizes.SMALL}
            onClick={async () => {
                try {
                    await FSUtils.importFile("//BD/plugins", true, false, ".js");
                } catch (error) {
                    compat_logger.error("Failed to import plugin:", error);
                }
            }}
        >
            <PlusIcon width={16} height={16} style={{ marginRight: "4px" }} />
            Import BD Plugin
        </Button>
    );
}

export function ImportBulkPluginsButton() {
    return (
        <Button
            size={Button.Sizes.SMALL}
            onClick={async () => {
                try {
                    await FSUtils.importFile("//BD/plugins", true, true, ".js");
                } catch (error) {
                    compat_logger.error("Failed to import plugins:", error);
                }
            }}
        >
            <PlusIcon width={16} height={16} style={{ marginRight: "4px" }} />
            Import Bulk Plugins
        </Button>
    );
}

export function injectPluginPageButtons() {
    try {
        // Find the Plugins settings component
        const PluginsTab = Vencord.Plugins.plugins.Settings;
        
        if (!PluginsTab) {
            compat_logger.error("Could not find Settings plugin");
            return;
        }

        // Store the original component
        const originalComponent = PluginsTab.options?.plugins?.component;
        
        if (!originalComponent) {
            compat_logger.error("Could not find plugins component");
            return;
        }

        // Create a wrapper that adds our buttons
        PluginsTab.options.plugins.component = function PluginsWithBDButtons(props: any) {
            return (
                <>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                        <ImportBDPluginButton />
                        <ImportBulkPluginsButton />
                    </div>
                    {React.createElement(originalComponent, props)}
                </>
            );
        };

        // Create unpatch function
        unpatchPluginsPage = () => {
            if (PluginsTab.options?.plugins) {
                PluginsTab.options.plugins.component = originalComponent;
            }
        };

        compat_logger.log("Plugin page buttons injected successfully");
    } catch (error) {
        compat_logger.error("Failed to inject plugin page buttons:", error);
    }
}

export function unInjectPluginPageButtons() {
    if (unpatchPluginsPage) {
        unpatchPluginsPage();
        unpatchPluginsPage = null;
    }
}
