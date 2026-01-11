import { describe, it, expect } from 'vitest'
import { spawn } from 'child_process'
import { join } from 'path'
import { readFileSync } from 'fs'

const PROJECT_ROOT = join(__dirname, '..')
const TIMEOUT_MS = 30000 // 30 seconds

describe('npm run refresh integration', () => {
  it(
    'completes without hanging',
    async () => {
      const result = await runRefreshWithTimeout(TIMEOUT_MS)

      expect(result.timedOut).toBe(false)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Done')
      expect(result.stdout).toContain('Matches:')
    },
    TIMEOUT_MS + 5000
  )

  it('saves valid data files', async () => {
    const terminlistePath = join(PROJECT_ROOT, 'data', 'terminliste.json')
    const metadataPath = join(PROJECT_ROOT, 'data', 'metadata.json')

    // Check files exist and are valid JSON
    const terminliste = JSON.parse(readFileSync(terminlistePath, 'utf-8'))
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'))

    expect(Array.isArray(terminliste)).toBe(true)
    expect(terminliste.length).toBeGreaterThan(0)
    expect(metadata).toHaveProperty('lastUpdated')
    expect(metadata).toHaveProperty('matchesCount')
    expect(metadata).toHaveProperty('teamsCount')
    expect(metadata.matchesCount).toBe(terminliste.length)
  }, 10000)
})

interface RunResult {
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
}

function runRefreshWithTimeout(timeoutMs: number): Promise<RunResult> {
  return new Promise((resolve) => {
    const stdout: string[] = []
    const stderr: string[] = []
    let timedOut = false

    const proc = spawn('npm', ['run', 'refresh'], {
      cwd: PROJECT_ROOT,
      shell: true,
    })

    const timeout = setTimeout(() => {
      timedOut = true
      proc.kill('SIGTERM')
    }, timeoutMs)

    proc.stdout.on('data', (data) => stdout.push(data.toString()))
    proc.stderr.on('data', (data) => stderr.push(data.toString()))

    proc.on('close', (exitCode) => {
      clearTimeout(timeout)
      resolve({
        exitCode,
        stdout: stdout.join(''),
        stderr: stderr.join(''),
        timedOut,
      })
    })
  })
}
