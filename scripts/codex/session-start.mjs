import { handleSessionStart } from './workspace-state.mjs'

function failClosed(message) {
  return {
    continue: false,
    stopReason: message,
    systemMessage: message,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: message,
    },
  }
}

try {
  const inputText = await new Promise((resolve, reject) => {
    let value = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      value += chunk
    })
    process.stdin.on('end', () => resolve(value))
    process.stdin.on('error', reject)
  })
  const input = JSON.parse(inputText)
  process.stdout.write(`${JSON.stringify(handleSessionStart(input))}\n`)
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  process.stdout.write(
    `${JSON.stringify(failClosed(`Current Flow workspace isolation failed closed: ${detail}`))}\n`,
  )
}
