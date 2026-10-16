const { execSync } = require('node:child_process')

function getCommit() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA
  }

  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

module.exports = { getCommit }
