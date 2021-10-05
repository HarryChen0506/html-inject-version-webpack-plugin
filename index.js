const fs = require('fs')
const child_process = require('child_process')
const { resolve } = require('path')

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => resolve(appDirectory, relativePath);

const getPackageInfo = () => {
  const appPackageJsonPath = resolveApp('package.json')
  const appPackageJson = require(appPackageJsonPath)
  return appPackageJson
}

// git-name-rev - 查找给定转速的符号名称
// git name-rev --name-only HEAD 这个命令会在终端输出你当前的版本或标签信息。
const getGitInfo = () => {
  const commandMap = {
    version: "git name-rev --name-only HEAD",
    commitId: "git show -s --format=%H",
    commitName: "git show -s --format=%cn",
    commitDate: "git show -s --format=%cd",
    message: `git log --pretty=format:"%s" -1`
    // email: "git show -s --format=%ce",
  }
  const getCommandInfo = (command) => {
    return child_process.execSync(commandMap[command]).toString().trim()
  }

  const gitInfo = Object.keys(commandMap).reduce((total, current) => {
    total[current] = getCommandInfo(current)
    return total
  }, {})

  return {
    ...gitInfo,
    buildDate: new Date().toString()
  }
}

/**
 * @params {
 *  target: Array 目标文件格式 如：[index.html]
 *  commit: Boolean 是否支持将git commit 信息以注释的方式注入到html文件中
 *  version: Boolean 是否支持将version信息以javascript的方式注入到html文件中
 * }
 * 
 */
class HtmlInjectVersionPlugin {

  pluginName = 'htmlInjectVersionPlugin'

  static defaultOptions = {
    target: ['index.html'],
    commit: true,
    version: true
  }

  constructor(options) {
    this.options = {
      ...HtmlInjectVersionPlugin.defaultOptions,
      ...options
    }
  }

  getGitContent = () => {
    try {
      const gitInfo = getGitInfo()
      const content = `<!--${JSON
        .stringify(gitInfo, null, 4)
        .replace(/^\{/, '')
        .replace(/\}$/, '')
        }-->`
      return content
    } catch (e) {
      console.error('getGitContent fail')
      return ''
    }
  }

  getVersionContent = () => {
    try {
      const packageInfo = getPackageInfo()
      const { version, name } = packageInfo || {}
      const content = `<script>
    window.__VERSION__ = \`${version}\`;
    console.log('%c%s', 'color: white; background: green', \`[${name}] version: v${version}\`);
</script>`
      return content
    } catch (e) {
      console.error('getVersionContent fail')
      return ''
    }
  }

  processAsset = (compiler, file, buffer) => {
    const { commit, version } = this.options
    let mainContent = ''
    if (Buffer.isBuffer(buffer)) {
      mainContent = buffer.toString()
    } else if (typeof buffer === 'object' && Buffer.isBuffer(buffer.content)) {
      mainContent = buffer.content.toString()
    }
    const versionContent = version ? this.getVersionContent() : ''
    const gitContent = commit ? this.getGitContent() : ''
    const res = `${mainContent}\r\n${versionContent}\r\n${gitContent}`
    try {
      fs.writeFileSync(resolve(compiler.outputPath, file), res)
    } catch (err) {
      console.error('fs.writeFileSync error:', err)
    }
  }

  apply(compiler) {
    compiler.hooks.assetEmitted.tap(this.pluginName, (file, buffer) => {
      if (!compiler.outputPath) {
        return
      }
      const { target } = this.options
      if (!Array.isArray(target)) {
        console.error('target should be a array!')
        return
      }
      target.forEach(v => {
        if (new RegExp(v).test(file)) {
          this.processAsset(compiler, file, buffer)
        }
      })
    })
  }
}

module.exports = HtmlInjectVersionPlugin