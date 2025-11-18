import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import parseDiff from "diffparser";

const exec = promisify(execFile);

const execWithInheritedStdio = (command: string, args: string[], options: any = {}) => {
    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { stdio: "inherit", ...options });
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`${command} exited with code ${code}`));
            }
        });
    })
};

async function fileExists(p: string) {
    try {
        await fs.access(p);
        return true;
    } catch (a) {
        return false;
    }
}

async function ensurePnpm() {
    try {
        await exec("pnpm", ["--version"]);
    } catch {
        throw new Error("pnpm not installed");
    }
}

async function safeRmdir(dir: string) {
    if (await fileExists(dir)) {
        await fs.rm(dir, { recursive: true, force: true });
    }
}

async function copyDir(from: string, to: string) {
    await fs.mkdir(to, { recursive: true });
    const entries = await fs.readdir(from, { withFileTypes: true });

    for (const e of entries) {
        const src = path.join(from, e.name);
        const dst = path.join(to, e.name);
        if (e.name === ".git") continue;
        if (e.isDirectory()) {
            await copyDir(src, dst);
        } else {
            await fs.copyFile(src, dst);
        }
    }
}

async function readPatch(file: string) {
    const text = await fs.readFile(file, "utf8");
    return parseDiff(text);
}

async function applyParsedPatch(root: string, patches: ReturnType<typeof parseDiff>) {
    for (const p of patches) {
        const filePath = path.join(root, p.to);
        let original = "";

        try {
            original = await fs.readFile(filePath, "utf8");
        } catch {
            throw new Error(`Target file not found for patch: ${p.to}`);
        }

        const lines = original.split("\n");

        for (const chunk of p.chunks) {
            let cursor = chunk.oldStart - 1;

            for (const change of chunk.changes) {
                if (change.type === "del") {
                    lines.splice(cursor, 1);
                } else if (change.type === "add") {
                    lines.splice(cursor, 0, change.content.replace(/^\+ /, " ").replace(/^\+/, ""));
                    cursor++;
                } else {
                    cursor++;
                }
            }
        }

        await fs.writeFile(filePath, lines.join("\n"));
    }
}

async function gitHash(dir: string) {
    const { stdout } = await exec("git", ["rev-parse", "--short", "HEAD"], { cwd: dir });
    return stdout.trim();
}

async function run() {
    await ensurePnpm();

    console.log("Warning: this will delete dist/. You have 5 seconds to cancel.");
    await new Promise(r => setTimeout(r, 5000));

    const builderHash = await gitHash(".");
    const baseDir = path.resolve("base/Vencord");
    const distDir = path.resolve("dist/Vencord");

    await safeRmdir("./dist");
    await fs.mkdir("./dist");
    await copyDir(baseDir, distDir);

    const baseHash = await gitHash(baseDir);

    const patchTargets = [
        { file: "src/patch-webpack.patch", target: "src/webpack/patchWebpack.ts" },
        { file: "src/patch-csp.patch", target: "src/main/csp/index.ts" },
        { file: "src/patch-package_json.patch", target: "package.json" },
        { file: "src/patch-banImportPlugin.patch", target: "scripts/build/common.mjs" }
    ];

    for (const item of patchTargets) {
        const diffParsed = await readPatch(item.file);
        try {
            await applyParsedPatch(".", diffParsed);
        } catch (e) {
            throw new Error(`Patch failed for ${item.target}: ${(e as Error).message}`);
        }
    }

    await copyDir("src/bdCompatLayer", path.join(distDir, "src/plugins/bdCompatLayer"));

    await exec("git", ["init"], { cwd: distDir });
    await exec("git", ["remote", "add", "origin", "https://github.com/Vendicated/Vencord"], { cwd: distDir });

    await execWithInheritedStdio("pnpm", ["i"], { cwd: distDir });
    process.env.VENCORD_HASH = `${baseHash} (BetterVencord patchset built by ${builderHash})`;

    await execWithInheritedStdio("pnpm", ["build", "--standalone"], { cwd: distDir });
    await execWithInheritedStdio("pnpm", ["buildWeb"], { cwd: distDir });

    console.log("Build complete.");
    console.log("Base:", baseHash);
    console.log("Patchset:", builderHash);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
