import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { NATIVE_TAB_ID, nativeTabDefinition, nativeTabDescription } from '../src/client/native-sidebar-contract.ts'
import { KLINE_TAB_ID, KLINE_TAB_TITLE_EN, KLINE_TAB_TITLE_ZH, klineTabTitle } from '../src/client/sidebar-integration.ts'

const nativeSource = readFileSync(new URL('../src/client/native-sidebar.tsx', import.meta.url), 'utf8')
const router = readFileSync(new URL('../src/client/index.tsx', import.meta.url), 'utf8')

test('the native tab type keeps the host kind and the product label apart', () => {
  const definition = nativeTabDefinition()
  assert.equal(definition.id, NATIVE_TAB_ID)
  assert.equal(definition.id, 'ftshare-kline')
  assert.equal(definition.kind, KLINE_TAB_ID)
  assert.equal(definition.priority, 'extension')
  assert.equal(definition.title('sidebar://ftshare-kline:chart'), klineTabTitle(globalThis.navigator?.language ?? ''))
  assert.equal(klineTabTitle('zh-CN'), KLINE_TAB_TITLE_ZH)
  assert.equal(klineTabTitle('en-US'), KLINE_TAB_TITLE_EN)
  // A page type: opened by kind through openTab, never claimed by an address glob.
  assert.ok(!('patterns' in definition))
})

test('the guide entry is how a person reaches the chart without any floating launcher', () => {
  const [entry] = nativeTabDefinition().guide ?? []
  assert.ok(entry, 'the type contributes a guide entry')
  assert.equal(entry.id, NATIVE_TAB_ID)
  assert.equal(entry.order, 120)
  assert.equal(entry.title(), klineTabTitle(globalThis.navigator?.language ?? ''))
  assert.equal(entry.description?.(), nativeTabDescription(globalThis.navigator?.language ?? ''))
  assert.equal(nativeTabDescription('zh-CN'), '行情图表与关键点位分析')
  assert.equal(nativeTabDescription('en-US'), 'Market chart and key-level analysis')
})

test('both registration stages are one unit keyed by the implementation id', () => {
  assert.match(nativeSource, /ctx\.inject\(\['sidebarRightTabs', 'sidebarRight', 'slots'\]/)
  assert.match(nativeSource, /tabs\.register\(nativeTabDefinition\(\)\)/)
  assert.match(nativeSource, /name: 'sidebar\.right\.pane\.tab',\s*\n\s*key: NATIVE_TAB_ID,/)
  assert.match(nativeSource, /inject: \(sessionId: string\) => \(\{ sessions: ctx\.sessions, sessionId \}\)/)
  // A failed body registration rolls the type back instead of leaving an empty pane behind.
  assert.match(nativeSource, /for \(const dispose of disposers\.reverse\(\)\) dispose\(\)/)
  assert.match(nativeSource, /disposeType\?\.\(\)/)
  assert.match(nativeSource, /available: \(\) => registry !== undefined/)
})

test('the chart opens by kind through the host navigation face, never through a third-party sidebar', () => {
  assert.match(nativeSource, /navigation\?\.openTab\(KLINE_TAB_ID\)/)
  assert.match(nativeSource, /if \(readAutoOpen\(\)\) bridge\.open\(\)/)
  assert.ok(!nativeSource.includes("from 'dsh-better-sidebar'"))
})

test('the body draws the shared chart against the tab own conversation', () => {
  assert.match(nativeSource, /const visible = useTabInfo\(\)\.tab\.visible/)
  assert.match(nativeSource, /data-dsh-kline-tab=""/)
  assert.match(nativeSource, /<KlineTabContent key=\{sessionId\} sessions=\{sessions\} conversationId=\{sessionId\} \/>/)
  assert.match(nativeSource, /mode: 'better-sidebar', available: true/)
})

test('the router prefers the host own column over the Better Sidebar bridge', () => {
  assert.match(router, /const native = registerNativeSidebar\(ctx, emit\)/)
  assert.match(router, /const nativeTab = useSyncExternalStore\(subscribe, \(\) => native\.available\(\)\)/)
  assert.match(router, /const available = nativeTab \|\| isSidebarUsable\(sidebar\)/)
  assert.match(router, /\{nativeTab && <NativeSidebarBridgeView bridge=\{native\} sessions=\{ctx\.sessions\} \/>\}/)
  assert.match(router, /\{!nativeTab && sidebar && <BetterSidebarBridge service=\{sidebar\} sessions=\{ctx\.sessions\} \/>\}/)
})
