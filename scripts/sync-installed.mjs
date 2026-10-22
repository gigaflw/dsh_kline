#!/usr/bin/env node
/**
 * Copy the built client half into the kline package already installed in a DSH
 * profile, so the running desktop app loads this checkout on its next start.
 *
 * Why not a `link:` dependency: a DSH profile typically installs kline as a
 * nested dependency of a bundle, and a link to a worktree makes the host
 * hot-reload the client module whenever this directory is rebuilt — a reload
 * that lands on a half-written file breaks the entry. Copying keeps the
 * running app on a stable snapshot; re-run this script after a build and
 * restart the app.
 *
 * Only `lib/` and `view/` are copied: the host half is unchanged by UI work,
 * and both directories are what the browser and the chart route read. The
 * target directories are replaced as a whole — a partial copy (say, from a
 * checkout that knows only one host) must never leave orphan modules behind.
 *
 *   node scripts/sync-installed.mjs [--profile-dir ~/.dsh/profiles/desktop] [--target <pkg>]
 */
import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const args = process.argv.slice(2)
const argValue = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
const profileDir = resolve(argValue('--profile-dir') ?? process.env.DSH_PROFILE_DIR ?? join(homedir(), '.dsh/profiles/desktop'))

if (!existsSync(join(profileDir, 'package.json'))) throw new Error('找不到 desktop profile：' + profileDir)
if (!existsSync(join(packageRoot, 'lib/client.js'))) throw new Error('还没有构建产物：先运行 pnpm build:sidebar')

function entries(dir) {
  try { return readdirSync(dir) } catch { return [] }
}

/**
 * A profile vendors plugins either flat or nested under a bundle, so look one
 * and two levels deep instead of naming a particular bundle. `--target` wins
 * when the layout is neither.
 */
function findInstalled() {
  const explicit = argValue('--target')
  if (explicit !== undefined) return resolve(explicit)
  const flat = join(profileDir, 'node_modules/@ftshare-lab/dsh-kline')
  if (existsSync(join(flat, 'package.json'))) return flat
  const modules = join(profileDir, 'node_modules')
  for (const name of entries(modules)) {
    const roots = name.startsWith('@')
      ? entries(join(modules, name)).map(scoped => join(modules, name, scoped))
      : [join(modules, name)]
    for (const root of roots) {
      const nested = join(root, 'node_modules/@ftshare-lab/dsh-kline')
      if (existsSync(join(nested, 'package.json'))) return nested
    }
  }
  const vendor = join(profileDir, 'vendor/dsh-kline')
  return existsSync(join(vendor, 'package.json')) ? vendor : undefined
}

const installed = findInstalled()
if (installed === undefined) throw new Error('profile 里找不到已安装的 @ftshare-lab/dsh-kline（可用 --target 指定）')
// The copy is destructive, so only ever touch the kline package itself.
const manifest = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'))
if (manifest.name !== '@ftshare-lab/dsh-kline') throw new Error(`目标不是 dsh-kline 包：${installed} (${manifest.name})`)

for (const dir of ['lib', 'view']) {
  const target = join(installed, dir)
  rmSync(target, { recursive: true, force: true })
  cpSync(join(packageRoot, dir), target, { recursive: true })
}
console.log('synced lib/ + view/ ->', installed)
console.log('lib files:', entries(join(packageRoot, 'lib')).length, '| view files:', entries(join(packageRoot, 'view')).length)
console.log('现在完全退出并重开 DSH，宿主面板会加载这份客户端产物。')
