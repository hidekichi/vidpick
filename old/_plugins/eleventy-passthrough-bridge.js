// eleventy-passthrough-bridge.js
import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';

export default function EleventyPassthroughBridge(eleventyConfig, userOptions = {}) {
  const passthroughEntries = [];
  const verbose = userOptions.verbose ?? false;
  const projectRoot = process.cwd(); // ← プロジェクトルートを基準にする

  const _orig = eleventyConfig.addPassthroughCopy.bind(eleventyConfig);
  eleventyConfig.addPassthroughCopy = function (entry, copyOptions = {}) {
    passthroughEntries.push({ entry, copyOptions });
    return _orig(entry, copyOptions);
  };

  eleventyConfig.on('eleventy.after', async ({ dir, runMode }) => {
    if (runMode !== 'build') return;

    if (verbose) console.log('[passthrough-bridge] Restoring passthrough files after Vite...');

    for (const { entry } of passthroughEntries) {
      await restoreEntry(entry, dir.input, dir.output, projectRoot, verbose);
    }
  });
}

async function restoreEntry(entry, inputDir, outputDir, projectRoot, verbose) {
  try {
    if (typeof entry === 'string') {
      const isGlob = fg.isDynamicPattern(entry);

      // cwd はプロジェクトルート、entryはそのまま使う
      const files = await fg(isGlob ? entry : `${entry}/**/*`, {
        cwd: projectRoot,
        dot: true,
        onlyFiles: true,
      });

      for (const file of files) {
        // inputDir プレフィックス（例: "src/"）を除去してdestを計算
        const inputPrefix = inputDir.endsWith('/') ? inputDir : inputDir + '/';
        const destRelative = file.startsWith(inputPrefix)
          ? file.slice(inputPrefix.length)
          : file;

        const src = path.join(projectRoot, file);
        const dest = path.join(projectRoot, outputDir, destRelative);

        await fs.ensureDir(path.dirname(dest));
        await fs.copy(src, dest, { overwrite: true });
        if (verbose) console.log(`  [restore] ${src} → ${dest}`);
      }
    } else if (typeof entry === 'object' && entry !== null) {
      for (const [srcRel, destRel] of Object.entries(entry)) {
        const srcAbs = path.resolve(projectRoot, srcRel);
        const destAbs = path.resolve(projectRoot, outputDir, destRel || path.basename(srcRel));

        const stat = await fs.stat(srcAbs).catch(() => null);
        if (!stat) continue;

        if (stat.isDirectory()) {
          const files = await fg('**/*', { cwd: srcAbs, dot: true, onlyFiles: true });
          for (const f of files) {
            const src = path.join(srcAbs, f);
            const dest = path.join(destAbs, f);
            await fs.ensureDir(path.dirname(dest));
            await fs.copy(src, dest, { overwrite: true });
            if (verbose) console.log(`  [restore] ${src} → ${dest}`);
          }
        } else {
          await fs.ensureDir(path.dirname(destAbs));
          await fs.copy(srcAbs, destAbs, { overwrite: true });
          if (verbose) console.log(`  [restore] ${srcAbs} → ${destAbs}`);
        }
      }
    }
  } catch (err) {
    console.error('[passthrough-bridge] Error restoring entry:', entry, err);
  }
}
