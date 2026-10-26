#!/usr/bin/env node
// Docs/code consistency guard: keeps README, CHANGELOG and the packed file
// list from drifting away from package.json and the tool schema.
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (name) => readFileSync(join(root, name), 'utf8')
const fail = (message) => {
  console.error('docs-check: ' + message)
  process.exitCode = 1
}

const pkg = JSON.parse(read('package.json'))
const readme = read('README.md')
const changelog = read('CHANGELOG.md')
const host = read('lib/index.js')

// 1. packed files cover every entry point we ship
const required = ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'README.md', 'LICENSE', 'CHANGELOG.md']
for (const file of required) {
  if (!pkg.files.includes(file)) fail('package.json files[] is missing ' + file)
  if (!existsSync(join(root, file))) fail('missing file ' + file)
}
if (pkg.dsh?.bundle?.patch !== './cordis.patch.yml') fail('dsh.bundle.patch must point at cordis.patch.yml')
if (!pkg.exports?.['./client']) fail('exports["./client"] is required by the client loader')

// 2. README documents every tool parameter and the answer shape
const params = ['title', 'html', 'flow', 'data', 'timeoutMs', 'height', 'actions']
for (const name of params) {
  if (!host.includes(name + ':')) fail('tool schema lost parameter ' + name)
  if (!readme.includes(name)) fail('README does not document parameter ' + name)
}
for (const token of ['answer.state', 'answer.payload', 'answer.comments', 'dshVisual.root', 'dshVisual.setState']) {
  if (!readme.includes(token)) fail('README does not document ' + token)
}
if (!readme.includes('dsh plugin --profile desktop add')) fail('README lost the install command')

// 3. the published version is the version the changelog headlines
const top = changelog.split('\n').find((line) => /^##\s/.test(line)) || ''
if (!top.includes(pkg.version)) fail('CHANGELOG head "' + top.trim() + '" does not match package version ' + pkg.version)
if (!readme.includes(pkg.name)) fail('README never mentions the package name')

if (process.exitCode) process.exit(process.exitCode)
console.log('docs-check: ok (' + required.length + ' shipped files, ' + params.length + ' parameters documented, version ' + pkg.version + ')')
