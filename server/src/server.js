import { resolve } from 'node:path'
import { AccountStore } from './store.js'
import { createOiVoxApp } from './app.js'
import { seedTestAccount } from './testAccount.js'
import { OIVOX_SIGNAL_CONTRACT } from '../../src/services/oivoxSignalContract.js'

const host = process.env.OIVOX_SERVER_HOST || '127.0.0.1'
const port = Number(process.env.OIVOX_SERVER_PORT || 3102)
const sessionHours = Number(process.env.OIVOX_SESSION_HOURS || 24)
const dataFile = resolve(process.cwd(), process.env.OIVOX_DATA_FILE || './server/data/oivox-accounts.json')
const allowedOrigins = (process.env.OIVOX_CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,null').split(',').map((item) => item.trim()).filter(Boolean)

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('OIVOX_SERVER_PORT must be a valid port.')
if (!Number.isFinite(sessionHours) || sessionHours < 1 || sessionHours > 168) throw new Error('OIVOX_SESSION_HOURS must be between 1 and 168.')

const store = await new AccountStore(dataFile).open()
await seedTestAccount(store)
const server = createOiVoxApp({ store, sessionHours, allowedOrigins })
server.listen(port, host, () => {
  console.log(`OiVox account server: http://${host}:${port}`)
  console.log(`Health check: http://${host}:${port}${OIVOX_SIGNAL_CONTRACT.routes.pulse}`)
})
