#!/usr/bin/env node

/*! Open Git Remote URL */

const childProcess = require('node:child_process');
const os           = require('node:os');
const util         = require('node:util');

/**
 * Supports Terminal Link
 * 
 * @return {boolean} Terminal Link Is Supported Or Not
 */
const supportsTerminalLink = () => {
  // VSCode Terminal
  if(process.env.TERM_PROGRAM === 'vscode') return true;
  
  // Windows Terminal
  if(process.env.WT_SESSION != null) return true;
  
  return false;
};

/**
 * Create Terminal Link
 * 
 * @param {string} text Text
 * @param {string} url URL
 * @return {string} Termianl Link
 */
const createTerminalLink = (text, url) => {
  const osc = '\u001B]';
  const bel = '\u0007';
  const sep = ';';
  
  return [osc, '8', sep, sep, url, bel, text, osc, '8', sep, sep, bel].join('');
};

/**
 * Get Git Remote URL
 * 
 * @return {Promise<string | null>} Git Remote URL Or Null
 */
const getGitRemoteUrl = async () => {
  const result = await util.promisify(childProcess.exec)('git remote get-url origin').catch(_error => null);
  if(result == null) return null;
  
  const url = result.stdout.split('\n').find(line => line.trim() !== '');  // Find One
  if(url == null) return null;
  
  return url;
};

/**
 * Has Show Only Flag
 * 
 * @return {boolean} Show Only Or Not
 */
const hasShowOnlyFlag = () => {
  const args = process.argv.slice(2);
  return ['--show-only', '-s'].includes(args[0]);
};

/**
 * Open
 * 
 * @param {string} URL
 */
const open = async url => {
  let processName = null;
  let cliArguments = [];
  
  if(process.platform === 'darwin') {  // MacOS
    processName = 'open';
    cliArguments.push(url);
  }
  else if(process.platform === 'linux' && os.release().toLowerCase().includes('microsoft')) {  // WSL
    processName = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
    cliArguments.push('Start', url);
  }
  else if(process.platform === 'win32') {  // Windows (GitBash)
    processName = 'cmd';
    cliArguments.push('/s', '/c', 'Start', '""', '/b', `"${url}"`);
  }
  else {  // Maybe Linux, Find xdg-open
    const result = await util.promisify(childProcess.exec)('which xdg-open').catch(_error => null);
    if(result != null) {
      const xdgOpenPath = result.stdout.trim();
      processName = xdgOpenPath;
      cliArguments.push(url);
    }
  }
  
  if(processName == null) return console.error('No Method Available For Opening ' + url);
  
  const subProcess = childProcess.spawn(processName, cliArguments, { detached: true, stdio: 'ignore', windowsVerbatimArguments: true });
  subProcess.unref();
};

// Main
(async () => {
  const url = await getGitRemoteUrl();
  if(url == null) return console.log('Open Git Remote URL : Cannot Find Git Remote URL');
  
  console.log('Open Git Remote URL : ' + supportsTerminalLink() ? createTerminalLink(url, url) : url);
  if(!hasShowOnlyFlag()) await open(url);
})();
