import { build } from 'vite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

// Use the application's bundler for the SDK, then Node's built-in test runner.
// The temporary bundle never enters the application or production output.
const directory = await mkdtemp(join(tmpdir(), 'stellar-heist-tests-'))
try {
  await build({
    configFile: false, publicDir: false, logLevel: 'warn', ssr: { noExternal: true },
    build: {
      ssr: 'tests/wallet.test.ts', outDir: directory, emptyOutDir: true,
      rolldownOptions: { output: { entryFileNames: 'wallet.test.mjs' } },
    },
  })
  const result = spawnSync(process.execPath, [join(directory, 'wallet.test.mjs')], { stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally { await rm(directory, { recursive: true, force: true }) }
