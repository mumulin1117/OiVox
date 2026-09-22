import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

function emptyDatabase() {
  return { version: 2, users: [], sessions: [], registrationResults: [] }
}

export class AccountStore {
  constructor(filePath) {
    this.filePath = filePath
    this.data = emptyDatabase()
    this.queue = Promise.resolve()
  }

  async open() {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8'))
      if (!Array.isArray(parsed.users) || !Array.isArray(parsed.sessions)) throw new Error('Invalid account data file')
      if (!Array.isArray(parsed.registrationResults)) parsed.registrationResults = []
      this.data = parsed
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await this.persist()
    }
    return this
  }

  async update(change) {
    const task = this.queue.then(async () => {
      const result = await change(this.data)
      await this.persist()
      return result
    })
    this.queue = task.catch(() => {})
    return task
  }

  async persist() {
    await mkdir(dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(this.data, null, 2)}\n`, { mode: 0o600 })
    await rename(temporaryPath, this.filePath)
  }
}
