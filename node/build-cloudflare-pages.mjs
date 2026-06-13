import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "dist-cloudflare");

const COPY_DIRS = [
	"bestiary",
	"css",
	"data",
	"fonts",
	"homebrew",
	"icon",
	"items",
	"js",
	"lib",
	"prerelease",
	"search",
	"spells",
];

const COPY_FILE_PATTERNS = [
	/^_headers$/,
	/^_redirects$/,
	/^robots\.txt$/,
	/^manifest\.webmanifest$/,
	/^open-search\.xml$/,
	/^browserconfig\.xml$/,
	/^sw\.js$/,
	/^sw-injector\.js$/,
	/^favicon(?:-[\w-]+)?\.(?:ico|png|svg)$/,
	/^android-chrome-[\w-]+\.png$/,
	/^apple-touch-icon(?:-[\w-]+)?\.png$/,
	/^mstile-[\w-]+\.png$/,
	/^maskable_icon\.png$/,
	/\.html$/,
];

const shouldCopyFile = fileName => COPY_FILE_PATTERNS.some(pattern => pattern.test(fileName));

const copyPath = async (from, to) => {
	const stat = await fs.stat(from);
	if (stat.isDirectory()) {
		await fs.mkdir(to, {recursive: true});
		const entries = await fs.readdir(from);
		for (const entry of entries) await copyPath(path.join(from, entry), path.join(to, entry));
		return;
	}

	await fs.mkdir(path.dirname(to), {recursive: true});
	await fs.copyFile(from, to);
};

await fs.rm(OUT_DIR, {recursive: true, force: true});
await fs.mkdir(OUT_DIR, {recursive: true});

for (const dirName of COPY_DIRS) {
	const src = path.join(ROOT, dirName);
	try {
		await copyPath(src, path.join(OUT_DIR, dirName));
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
	}
}

const rootEntries = await fs.readdir(ROOT, {withFileTypes: true});
for (const entry of rootEntries) {
	if (!entry.isFile() || !shouldCopyFile(entry.name)) continue;
	await copyPath(path.join(ROOT, entry.name), path.join(OUT_DIR, entry.name));
}

console.log(`Cloudflare Pages output written to ${path.relative(ROOT, OUT_DIR)}`);