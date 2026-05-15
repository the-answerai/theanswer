#!/usr/bin/env node

/* eslint-disable no-console */

import { spawnSync, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs, { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { ensureBwsInstalled } from './bws-dotenv.js';
import {
  promptForProject,
  updateEnvironmentBwsSection,
  determineEnvironment,
  normalizeEnvironment,
  readConfigFile,
  log
} from './project-selector.js';
import { execBwsCommandWithRetrySync } from './bws-retry-utils.js';
import {
  parseProjectIds,
  parseProjectIdsDetailed,
  parseEnvironmentOutput,
  serializeEnvRecordToPlaintext
} from './bws-env-utils.js';

/** Encrypted `.env.secure.*` files written by secureRun / loadBwsProjectSecrets use serializeEnvRecordToPlaintext. */
const PARSE_SECURE_FILE = { stripSerializedContinuationSpace: true };
// Import functions from project-selector module

// Get the directory name in ESM
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Global suppression: mute all secure-run output while preserving wrapped command output
const SUPPRESS_ALL =
  process.env.BWS_SUPPRESS_ALL === 'true' || process.env.BWS_SUPPRESS_ALL === '1';

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

if (SUPPRESS_ALL) {
  console.log = () => {};
  console.warn = () => {};
  // Do NOT suppress errors; keep them visible
  // console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}

const multiProjectFailFast =
  process.env.BWS_MULTI_PROJECT_FAIL_FAST === 'true' ||
  process.env.BWS_MULTI_PROJECT_FAIL_ON_PARTIAL === 'true';

function logParsedProjectIds(context, raw) {
  const d = parseProjectIdsDetailed(raw);
  if (d.skippedInvalid.length) {
    log('warn', `[${context}] Skipped non-UUID segments: ${d.skippedInvalid.join(', ')}`);
  }
  if (d.skippedDuplicates.length) {
    log('warn', `[${context}] Skipped duplicate UUIDs: ${d.skippedDuplicates.join(', ')}`);
  }
  if (d.ids.length) {
    log('debug', `[${context}] Parsed ${d.ids.length} project ID(s)`);
  }
  return d.ids;
}

/** After CLI env restore, child processes get a single primary UUID in BWS_PROJECT_ID; full list in BWS_PROJECT_IDS when multi. */
function normalizeBwsProjectIdForChild() {
  const raw = process.env.BWS_PROJECT_ID;
  if (!raw) {
    delete process.env.BWS_PROJECT_IDS;
    return;
  }
  const ids = parseProjectIdsDetailed(raw).ids;
  if (ids.length === 0) return;
  process.env.BWS_PROJECT_ID = ids[0];
  if (ids.length > 1) {
    process.env.BWS_PROJECT_IDS = ids.join(',');
  } else {
    delete process.env.BWS_PROJECT_IDS;
  }
}

// Helper function to get BWS organization ID with fallback
function getBwsOrgId() {
  return process.env.BWS_ORG_ID || 'YOUR_BWS_ORG_ID_HERE';
}

// Helper function to get BWS machine accounts URL
function getMachineAccountsUrl() {
  const orgId = getBwsOrgId();
  if (orgId === 'YOUR_BWS_ORG_ID_HERE') {
    return "\nPlease set BWS_ORG_ID environment variable to access your organization's machine accounts.\n";
  }
  return `\nhttps://vault.bitwarden.com/#/sm/${orgId}/machine-accounts\n`;
}

// Wrapper function to handle environment variable fallback - see README.md for BWS_NO_OVERRIDE option
async function readConfigFileWithFallback() {
  const hasToken = process.env.BWS_ACCESS_TOKEN;
  const noOverride = process.env.BWS_NO_OVERRIDE === 'true';
  const cacheFile = path.join(dirname, '.bwsconfig.cache');
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  // Skip BWS override if BWS_NO_OVERRIDE is set
  if (noOverride) {
    log('debug', 'BWS_NO_OVERRIDE=true, skipping BWS config update');
  }
  // Check cache before hitting BWS
  else if (hasToken) {
    // Check if cache exists and is still valid
    let skipUpdate = false;
    try {
      if (fs.existsSync(cacheFile)) {
        const cacheStats = fs.statSync(cacheFile);
        const cacheAge = Date.now() - cacheStats.mtimeMs;
        if (cacheAge < cacheTimeout) {
          log(
            'debug',
            `BWS config cache is still valid (${Math.round(cacheAge / 1000)}s old), skipping update`
          );
          skipUpdate = true;
        }
      }
    } catch (err) {
      // Ignore cache errors, just proceed with update
    }

    if (!skipUpdate) {
      try {
        log('debug', 'Checking BWS for _bwsconfig_json secrets...');
        // Get all secrets using BWS with retry logic
        const output = execBwsCommandWithRetrySync(
          `${getBwsCommand()} secret list -t ${process.env.BWS_ACCESS_TOKEN} --output json`,
          { encoding: 'utf8' },
          'Config secrets fetch'
        );

        // Clean output of any ANSI codes
        const cleanOutput = output.replace(/\u001B\[\d+m/g, '').trim();
        const secrets = JSON.parse(cleanOutput);

        // Look for all _bwsconfig_json secrets (could be _bwsconfig_json, _bwsconfig_json_1, etc.)
        const configSecrets = secrets.filter((secret) => secret.key.startsWith('_bwsconfig_json'));

        if (configSecrets.length > 0) {
          log(
            'debug',
            `Found ${configSecrets.length} _bwsconfig_json secret(s), parsing and merging content...`
          );

          // Parse all configs and merge them
          const mergedConfig = { projects: [] };
          const projectMap = new Map(); // Use Map to track projects by platform+projectName

          for (const configSecret of configSecrets) {
            try {
              log('debug', `Processing secret: ${configSecret.key}`);
              const configContent = JSON.parse(configSecret.value);

              if (configContent.projects && Array.isArray(configContent.projects)) {
                for (const project of configContent.projects) {
                  const projectKey = `${project.platform}:${project.projectName}`;

                  if (projectMap.has(projectKey)) {
                    // Merge bwsProjectIds with existing project
                    const existingProject = projectMap.get(projectKey);
                    existingProject.bwsProjectIds = {
                      ...existingProject.bwsProjectIds,
                      ...project.bwsProjectIds
                    };
                    log('debug', `Merged bwsProjectIds for project: ${project.projectName}`);
                  } else {
                    // Add new project
                    projectMap.set(projectKey, { ...project });
                    log('debug', `Added new project: ${project.projectName}`);
                  }
                }
              }
            } catch (parseError) {
              log('error', `Failed to parse secret ${configSecret.key}: ${parseError.message}`);
            }
          }

          // Convert map back to array
          mergedConfig.projects = Array.from(projectMap.values());

          // Always update the local file with BWS secrets
          const configPath = path.join(process.cwd(), 'bwsconfig.json');
          await fsPromises.writeFile(configPath, JSON.stringify(mergedConfig, null, 2));

          // Touch the cache file to mark successful update
          fs.writeFileSync(cacheFile, '');

          const secretNames = configSecrets.map((s) => s.key).join(', ');
          log('info', `✓ Updated bwsconfig.json from BWS secrets: ${secretNames}`);
          log(
            'info',
            `✓ Merged ${mergedConfig.projects.length} project(s) with combined environments`
          );

          return mergedConfig;
        } else {
          log('debug', '_bwsconfig_json secret not found in BWS');
        }
      } catch (bwsError) {
        log('error', `Failed to retrieve _bwsconfig_json from BWS: ${bwsError.message}`);
      }
    } // end if (!skipUpdate)
  }

  // Fall back to reading local config file
  try {
    return await readConfigFile();
  } catch (error) {
    log('debug', `readConfigFile failed with error: ${error.message}`);
    throw error;
  }
}

// Add flag to detect nested execution
const isNestedExecution = process.env.BWS_SECURE_RUN_ACTIVE === 'true';
// Set flag to prevent nested full executions
process.env.BWS_SECURE_RUN_ACTIVE = 'true';

// Check if this is a nested execution and log it
if (isNestedExecution) {
  log('info', 'Detected nested secure-run execution - using parent environment');
}

// 1) Explicitly load .env from the repo root (../../.env) in case we're running from a subdirectory
const dotenvPath = path.join(dirname, '../../.env');
dotenv.config({ path: dotenvPath, quiet: true });

// Platform detection
const isNetlify = process.env.NETLIFY === 'true';
const isVercel = process.env.VERCEL === '1';
const isDebug = process.env.DEBUG === 'true';

// Add this near the top of the file with other imports
const DEBUG = process.env.DEBUG === 'true';

// Progress bar system for secure-run
let secureRunProgressLength = 0;
let isProgressActive = false;
let suppressConsole = false;

// Store original console methods
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

// Override console during progress to prevent interference
const enableProgressMode = () => {
  if (!process.env.DEBUG && !SUPPRESS_ALL) {
    suppressConsole = true;
    // Override stdout/stderr to suppress everything except our progress bar
    process.stdout.write = function (chunk, ...args) {
      if (typeof chunk === 'string' && (chunk.includes('[█') || chunk.includes('\r'))) {
        // Allow progress bar updates through
        return originalStdout.call(this, chunk, ...args);
      }
      // Suppress everything else
      return true;
    };

    process.stderr.write = function (chunk, ...args) {
      // Only allow critical errors through
      if (typeof chunk === 'string' && chunk.toLowerCase().includes('critical')) {
        return originalStderr.call(this, chunk, ...args);
      }
      return true;
    };
  }
};

const disableProgressMode = () => {
  if (suppressConsole) {
    suppressConsole = false;
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
};

const showSecureRunProgress = (phase, current, total, message = '') => {
  if (SUPPRESS_ALL || process.env.DEBUG === 'true') return; // Skip in suppress mode or debug mode

  isProgressActive = true;
  const percentage = ((current / total) * 100).toFixed(0);
  const barWidth = 25;
  const filledWidth = Math.round((current / total) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

  // Keep messages short and concise
  let shortMessage = '';
  if (message) {
    if (message.includes('environments')) {
      const match = message.match(/(\d{1,3}\/\d{1,3})/);
      shortMessage = match ? ` ${match[1]}` : '';
    } else if (message.includes('Connecting')) {
      shortMessage = ' connecting...';
    } else if (message.includes('Processing')) {
      shortMessage = ' processing...';
    } else if (message.includes('Finalizing')) {
      shortMessage = ' finalizing...';
    }
  }

  let progressText = `[${bar}] ${percentage}% | ${phase}${shortMessage}`;

  // Ensure text doesn't exceed 60 chars to prevent wrapping
  if (progressText.length > 60) {
    progressText = progressText.substring(0, 57) + '...';
  }

  // Clear the previous line and write the new progress
  process.stdout.write('\r' + ' '.repeat(secureRunProgressLength) + '\r' + progressText);
  secureRunProgressLength = progressText.length;
};

const clearSecureRunProgress = () => {
  disableProgressMode(); // Restore normal console output
  if (secureRunProgressLength > 0) {
    process.stdout.write('\r' + ' '.repeat(secureRunProgressLength) + '\r');
    secureRunProgressLength = 0;
  }
  isProgressActive = false;
};

// Add this function before setupEnvironment
async function ensureRequiredVariablesFile() {
  log('info', 'Scanning codebase for required environment variables...');

  const scanResult = spawnSync(
    'node',
    [path.join(dirname, 'check-vars', 'requiredRuntimeVars.js')],
    {
      stdio: SUPPRESS_ALL ? 'ignore' : 'inherit',
      env: process.env
    }
  );

  if (scanResult.status !== 0) {
    throw new Error('Failed to scan for required environment variables');
  }

  const requiredVariablesPath = path.join(dirname, 'requiredVars.env');
  if (!fs.existsSync(requiredVariablesPath)) {
    throw new Error('Required variables file was not generated');
  }

  log('info', 'Required variables file generated successfully');
}

// After loading dotenv but before setupEnvironment
async function createRequiredVariablesFile() {
  try {
    const environmentPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(environmentPath)) {
      log('warn', 'No .env file found to create requiredVars.env');
      return;
    }

    const environmentContent = fs.readFileSync(environmentPath, 'utf8');
    const variables = environmentContent
      .split('\n')
      .filter(
        (line) =>
          // Keep only non-empty lines that aren't comments and contain an equals sign
          line.trim() && !line.trim().startsWith('#') && line.includes('=')
      )
      .map((line) => line.split('=')[0].trim()); // Extract just the variable names

    // Create the requiredVars.env file in the correct location
    const requiredVariablesPath = path.join(dirname, 'requiredVars.env');
    const requiredVariablesContent = variables.join('\n');

    fs.writeFileSync(requiredVariablesPath, requiredVariablesContent);
    log('info', `Created requiredVars.env with ${variables.length} variables`);
  } catch (error) {
    log('error', `Failed to create requiredVars.env: ${error.message}`);
    throw error;
  }
}

// 1) Add this helper function *before* any place you call spawnSync or execSync with "bws"
function getBwsCommand() {
  const binDir = path.join(process.cwd(), 'node_modules', '.bin');
  const exePath = path.join(binDir, 'bws.exe');

  if (process.platform === 'win32' && fs.existsSync(exePath)) {
    return exePath; // Use bws.exe on Windows
  }

  // Otherwise fallback to the script name "bws" for non-Windows
  return path.join(binDir, 'bws');
}

// Add helper to validate BWS token
async function validateBwsToken() {
  if (!process.env.BWS_ACCESS_TOKEN) {
    // prettier-ignore
    {
      console.warn('\u001B[33m╔════════════════════════════════════════════════════════╗\u001B[0m');
      console.warn('\u001B[33m║                                                        ║\u001B[0m');
      console.warn('\u001B[33m║             WARNING: BWS TOKEN MISSING                 ║\u001B[0m');
      console.warn('\u001B[33m║                                                        ║\u001B[0m');
      console.warn('\u001B[33m║ To use BWS features:                                   ║\u001B[0m');
      console.warn('\u001B[33m║ 1. Log in to vault.bitwarden.com                       ║\u001B[0m');
      console.warn('\u001B[33m║ 2. Go to Secrets Manager > Machine Accounts            ║\u001B[0m');
      console.warn('\u001B[33m║ 3. Create or copy your machine access token            ║\u001B[0m');
      console.warn('\u001B[33m║ 4. Add to .env: BWS_ACCESS_TOKEN=your_token            ║\u001B[0m');
      console.warn('\u001B[33m║                                                        ║\u001B[0m');
      console.warn('\u001B[33m║ For now, continuing with only .env values...           ║\u001B[0m');
      console.warn('\u001B[33m║                                                        ║\u001B[0m');
      console.warn('\u001B[33m╚════════════════════════════════════════════════════════╝\u001B[0m');
      console.warn(
        '\nVisit the link below to create your token: \n' +
          getMachineAccountsUrl()
      );
    }
    return false;
  }

  try {
    // Use retry logic for BWS token validation
    execBwsCommandWithRetrySync(
      `${getBwsCommand()} project list -t ${process.env.BWS_ACCESS_TOKEN}`,
      { stdio: 'ignore' },
      'Token validation'
    );
    return true;
  } catch {
    // prettier-ignore
    {
      console.error('\u001B[31m╔════════════════════════════════════════════════════════╗\u001B[0m');
      console.error('\u001B[31m║                                                        ║\u001B[0m');
      console.error('\u001B[31m║             CRITICAL BWS TOKEN ERROR                   ║\u001B[0m');
      console.error('\u001B[31m║                                                        ║\u001B[0m');
      console.error('\u001B[31m║ Your BWS_ACCESS_TOKEN appears to be invalid:           ║\u001B[0m');
      console.error('\u001B[31m║ 1. Check if token has expired                          ║\u001B[0m');
      console.error('\u001B[31m║ 2. Verify token permissions in vault.bitwarden.com     ║\u001B[0m');
      console.error('\u001B[31m║ 3. Generate new token if needed                        ║\u001B[0m');
      console.error('\u001B[31m║ 4. Ensure token has read access to required projects   ║\u001B[0m');
      console.error('\u001B[31m║                                                        ║\u001B[0m');
      console.error('\u001B[31m║ For now, continuing with only .env values...           ║\u001B[0m');
      console.error('\u001B[31m║                                                        ║\u001B[0m');
      console.error('\u001B[31m╚════════════════════════════════════════════════════════╝\u001B[0m');
      console.error(
        '\nVisit the link below to check or regenerate your token: \n' +
          getMachineAccountsUrl()
      );
    }
    return false;
  }
}

// Add this helper function for environment status display
function printEnvironmentSummary() {
  const environment = process.env.BWS_ENV || 'local';
  const project = process.env.BWS_PROJECT || 'none';
  const testVariable = process.env.BWS_TEST_VAR || process.env.BWS_SECRET_TEST_VAR;

  // FAIL if testVariable is not set
  if (!testVariable) {
    console.error(
      '\u001B[31m╔══════════════════════════════════════════════════════════╗\u001B[0m'
    );
    console.error(
      '\u001B[31m║                                                          ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║             CRITICAL ERROR: TEST VARIABLE                ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║                                                          ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║      BWS_TEST_VAR or BWS_SECRET_TEST_VAR must be set     ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║                                                          ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║  ERROR: Missing test variable indicates a critical issue  ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║  - Secrets may have failed to load properly              ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║  - Environment configuration may be incorrect            ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║  - BWS connection or authentication may have failed      ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║  - Project configuration may be missing or invalid       ║\u001B[0m'
    );
    console.error(
      '\u001B[31m║                                                          ║\u001B[0m'
    );
    console.error(
      '\u001B[31m╚══════════════════════════════════════════════════════════╝\u001B[0m'
    );
    process.exit(1);
  }

  const idInfo = parseProjectIdsDetailed(process.env.BWS_PROJECT_ID || '');
  let projectId = process.env.BWS_PROJECT_ID || 'none';
  if (idInfo.ids.length === 1) projectId = idInfo.ids[0];
  else if (idInfo.ids.length > 1) {
    projectId = `${idInfo.ids[0]} (+${idInfo.ids.length - 1} more)`;
  }

  // Cyan color code
  const cyan = '\x1b[36m';
  const reset = '\x1b[0m';

  // Simplified ASCII-only approach with cyan coloring
  // Add newline before summary if progress bar was active
  if (secureRunProgressLength > 0) {
    console.log('\n');
  } else {
    console.log('');
  }
  console.log(`${cyan}${'='.repeat(85)}${reset}`);
  console.log(`${cyan}  CURRENT ENVIRONMENT SUMMARY${reset}`);
  console.log(`${cyan}${'='.repeat(85)}${reset}`);
  console.log('');
  console.log(`${cyan}  Project           : ${reset}${project}`);
  console.log(`${cyan}  BWS_ENV           : ${reset}${environment}`);
  console.log(`${cyan}  BWS Project ID    : ${reset}${projectId}`);
  console.log(`${cyan}  BWS_TEST_VAR      : ${reset}${testVariable}`);
  console.log('');
  console.log(`${cyan}${'='.repeat(85)}${reset}`);
  console.log('');
}

// At the start of execution, store ALL original environment variables
const originalEnvironment = { ...process.env };
let originalEnvironmentFileContent = ''; // Store original .env file content

// Helper function to get project ID(s) with fallback to first available
// Returns comma-separated string to maintain backward compatibility
function getProjectIdWithFallback(project, environment) {
  let projectId = project.bwsProjectIds?.[environment];

  // If no project ID found for the specific environment, fall back to first available
  if (!projectId && project.bwsProjectIds) {
    const availableProjectIds = Object.values(project.bwsProjectIds).filter((id) => id);
    if (availableProjectIds.length > 0) {
      projectId = availableProjectIds[0];
      log(
        'info',
        `No project ID found for environment '${environment}', using fallback: ${projectId}`
      );
    }
  }

  // Return as-is (supports both single UUID and comma-separated UUIDs)
  return projectId;
}

// Keep original setupEnvironment but enhance with platform support
async function setupEnvironment(options = { isPlatformBuild: false }) {
  log('info', 'Creating project-specific secure files...');

  // Save original .env file content if it exists
  const environmentPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(environmentPath)) {
    originalEnvironmentFileContent = await fsPromises.readFile(environmentPath, 'utf8');
  }

  if (options.isPlatformBuild) {
    log('debug', 'Running platform-specific setup...');
  }

  // Initialize tracking of created files
  process.env.BWS_CREATED_FILES = '[]';

  // Track which project IDs have already been loaded to avoid redundant API calls
  const loadedProjectIds = new Set();

  // Generate ephemeral encryption key if not exists
  if (!process.env.BWS_EPHEMERAL_KEY) {
    process.env.BWS_EPHEMERAL_KEY = crypto.randomBytes(32).toString('hex');
  }

  // Direct BWS_PROJECT_ID bypass - if valid UUID(s) provided, use them directly
  const directProjectIds = process.env.BWS_PROJECT_ID
    ? logParsedProjectIds('direct BWS_PROJECT_ID', process.env.BWS_PROJECT_ID)
    : [];

  if (directProjectIds.length > 0) {
    const isMultiple = directProjectIds.length > 1;
    log(
      'info',
      `Using direct BWS_PROJECT_ID${isMultiple ? 's' : ''}: ${directProjectIds.join(', ')}`
    );

    // Enable progress mode to suppress console interference
    enableProgressMode();

    // Show incremental progress during loading
    showSecureRunProgress('Environment Setup', 4.0, 6, `Loading primary environment secrets`);
    await new Promise((resolve) => setTimeout(resolve, 200));

    showSecureRunProgress('Environment Setup', 4.3, 6, `Connecting to BWS...`);
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Load secrets from all project IDs with overlay strategy (later IDs win)
    const allDecryptedVariables = {};
    const directLoadFailures = [];

    for (const [index, projectId] of directProjectIds.entries()) {
      const progressLabel = isMultiple ? `[${index + 1}/${directProjectIds.length}]` : '';
      showSecureRunProgress(
        'Environment Setup',
        4.3 + (0.4 * (index + 1)) / directProjectIds.length,
        6,
        `${progressLabel} Loading secrets from project ${index + 1}`
      );

      const ok = await loadBwsProjectSecrets(projectId);
      if (ok) {
        loadedProjectIds.add(projectId);
        log('info', `${progressLabel} Successfully loaded BWS project ${projectId}`);
      } else {
        directLoadFailures.push(projectId);
        log('error', `${progressLabel} Failed to load secrets for project ${projectId}`);
        if (isMultiple && multiProjectFailFast) {
          process.exit(1);
        }
      }

      const sourceFile = `.env.secure.${projectId}`;
      if (fs.existsSync(sourceFile)) {
        const content = fs.readFileSync(sourceFile, 'utf8');
        const decrypted = decryptContent(content, process.env.BWS_EPHEMERAL_KEY);
        const decryptedVariables = parseEnvironmentOutput(decrypted, PARSE_SECURE_FILE);
        Object.assign(allDecryptedVariables, decryptedVariables);

        log(
          'debug',
          `${progressLabel} Merged ${
            Object.keys(decryptedVariables).length
          } keys from project ${projectId}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (directLoadFailures.length > 0 && isMultiple && !multiProjectFailFast) {
      log(
        'warn',
        `Multi-project: ${
          directLoadFailures.length
        } project load(s) failed (${directLoadFailures.join(
          ', '
        )}). Overlay may be incomplete. Set BWS_MULTI_PROJECT_FAIL_FAST=true to abort on first failure.`
      );
    }

    const envLabelDirect = process.env.BWS_ENV || 'local';
    if (isMultiple && Object.keys(allDecryptedVariables).length > 0) {
      const mergedPlain = serializeEnvRecordToPlaintext(allDecryptedVariables);
      fs.writeFileSync(
        `.env.secure.${envLabelDirect}`,
        encryptContent(mergedPlain, process.env.BWS_EPHEMERAL_KEY),
        { encoding: 'utf-8' }
      );
      log('debug', `Wrote merged .env.secure.${envLabelDirect} for multi-project mapping`);
    }

    // Apply merged variables (do not override existing process.env)
    for (const [key, value] of Object.entries(allDecryptedVariables)) {
      if (!(key in process.env)) {
        process.env[key] = value ?? '';
      }
    }

    log(
      'debug',
      `Total merged keys from direct BWS_PROJECT_ID${isMultiple ? 's' : ''}: ${
        Object.keys(allDecryptedVariables).length
      }`
    );

    // Always show incremental progress to 100%, regardless of additional environments
    showSecureRunProgress('Environment Setup', 5.0, 6, `Configuring environment variables...`);
    await new Promise((resolve) => setTimeout(resolve, 200));

    showSecureRunProgress('Environment Setup', 5.5, 6, `Finalizing configuration...`);
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Load additional project environments if we have config
    try {
      const config = await readConfigFileWithFallback();
      if (config && config.projects) {
        const project = config.projects.find((p) => p.projectName === process.env.BWS_PROJECT);
        if (project) {
          const currentEnv = process.env.BWS_ENV || 'local';

          // Parse comma-separated project IDs and filter out already loaded ones
          const additionalProjectIds = Object.entries(project.bwsProjectIds)
            .filter(([env, projectIdString]) => env !== currentEnv && projectIdString)
            .flatMap(([env, projectIdString]) => {
              const projectIds = parseProjectIds(projectIdString);
              return projectIds.filter((id) => !loadedProjectIds.has(id)).map((id) => [env, id]);
            });

          if (additionalProjectIds.length > 0) {
            let processedCount = 0;
            const totalCount = additionalProjectIds.length;

            for (const [env, additionalProjectId] of additionalProjectIds) {
              processedCount++;
              showSecureRunProgress(
                'Environment Setup',
                5.5 + (0.4 * processedCount) / totalCount, // 5.5 to 5.9
                6,
                `Loading additional secrets ${processedCount}/${totalCount} (${env})`
              );

              if (!loadedProjectIds.has(additionalProjectId)) {
                const ok = await loadBwsProjectSecrets(additionalProjectId);
                if (ok) loadedProjectIds.add(additionalProjectId);
              }
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        }
      }
    } catch (error) {
      // If config loading fails, just continue with the single environment
      log('debug', `Could not load additional environments: ${error.message}`);
    }

    // Show final completion and keep it visible
    showSecureRunProgress('Ready', 6, 6, 'Environment configured');
    // Brief pause to show 100% completion, then keep it visible
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Disable progress mode before environment summary
    disableProgressMode();
    // Add environment summary (keep progress bar visible)
    printEnvironmentSummary();
    return; // Exit early, bypassing all project selection logic
  }

  try {
    const config = await readConfigFileWithFallback();
    if (!config || !config.projects) {
      throw new Error('Invalid configuration file');
    }

    // Determine environment early
    const environment = determineEnvironment();
    process.env.BWS_ENV = environment;
    log('debug', `Using environment: ${environment}`);

    // Check for SITE_NAME early and filter projects if it exists (BEFORE downloading any secrets)
    let projectsToUse = [...config.projects];

    if (process.env.SITE_NAME) {
      log('info', `Detected SITE_NAME=${process.env.SITE_NAME}`);

      // Find the project matching SITE_NAME
      const siteNameMatch = config.projects.find(
        (project) => project.projectName === process.env.SITE_NAME
      );

      if (siteNameMatch) {
        log('info', `Found matching project for SITE_NAME: ${process.env.SITE_NAME}`);
        // Only use this project
        projectsToUse = [siteNameMatch];

        // Force BWS_PROJECT to match SITE_NAME for all operations
        process.env.BWS_PROJECT = process.env.SITE_NAME;
        log('info', `Forced BWS_PROJECT=${process.env.SITE_NAME} to match SITE_NAME`);
      } else {
        // CRITICAL CHANGE: Fail immediately if SITE_NAME doesn't match any project
        log(
          'error',
          `Critical Error: No project found matching SITE_NAME: ${process.env.SITE_NAME}`
        );
        process.exit(1);
      }
    } else if (process.env.BWS_PROJECT) {
      // When SITE_NAME is not available but BWS_PROJECT is set, use it to filter projects
      log('info', `No SITE_NAME found, using BWS_PROJECT=${process.env.BWS_PROJECT}`);

      const projectMatch = config.projects.find(
        (project) => project.projectName === process.env.BWS_PROJECT
      );

      if (projectMatch) {
        log('info', `Found matching project for BWS_PROJECT: ${process.env.BWS_PROJECT}`);
        // Only use this project for the rest of the process
        projectsToUse = [projectMatch];
      } else {
        // Auto-update: BWS_PROJECT doesn't match, use what's available in BWS config
        if (config.projects.length === 0) {
          log('error', 'Critical Error: No projects found in BWS configuration');
          process.exit(1);
        }

        log('warn', `BWS_PROJECT '${process.env.BWS_PROJECT}' not found in BWS config`);
        log('info', `Auto-updating to available project: ${config.projects[0].projectName}`);

        // Update BWS_PROJECT to match what's actually available
        process.env.BWS_PROJECT = config.projects[0].projectName;
        projectsToUse = config.projects;

        // This will trigger updateEnvironmentBwsSection to fix the .env file
        log(
          'info',
          `✓ Updated BWS_PROJECT from '${process.env.BWS_PROJECT}' to '${config.projects[0].projectName}'`
        );
        log('info', `✓ Will update .env file with correct project and environment options`);
      }
    } else if (isNetlify || isVercel) {
      // CRITICAL CHANGE: Fail build immediately if neither SITE_NAME nor BWS_PROJECT is set
      log(
        'error',
        `Critical Error: Neither SITE_NAME nor BWS_PROJECT environment variable is set. For platform builds, one of these must be specified.`
      );
      process.exit(1);
    }

    // Call promptForProject which will:
    // 1. Check process.env.BWS_PROJECT first
    // 2. If not set, check for project in .env file
    // 3. If still not found, prompt user to select a project (if multiple)
    // 4. Update .env file with selected project

    // Temporarily disable progress mode to allow project selection prompt to display
    disableProgressMode();
    const selectedProject = await promptForProject(projectsToUse);
    // Re-enable progress mode after project selection
    enableProgressMode();
    process.env.BWS_PROJECT = selectedProject.projectName;

    // When neither SITE_NAME nor BWS_PROJECT was initially set, we need to filter projects now
    // that we have a selection from promptForProject
    if (projectsToUse.length > 1) {
      log(
        'info',
        `Multiple projects were available, filtering to only use selected project: ${process.env.BWS_PROJECT}`
      );
      projectsToUse = [selectedProject];
    }

    // Ensure we know which project IDs we need to load for the selected project
    const projectIdsToLoad = new Set();
    const selectedProjectConfig = config.projects.find(
      (p) => p.projectName === process.env.BWS_PROJECT
    );
    if (selectedProjectConfig && selectedProjectConfig.bwsProjectIds) {
      Object.values(selectedProjectConfig.bwsProjectIds).forEach((id) => {
        if (id) {
          parseProjectIds(id).forEach((pid) => projectIdsToLoad.add(pid));
        }
      });
      log('debug', `Will load secrets for project IDs: ${[...projectIdsToLoad].join(', ')}`);
    }

    // Get unique platforms from config
    const platforms = new Set(projectsToUse.map((p) => p.platform.toLowerCase()));

    // Create global .env.secure with platform tokens
    if (process.env.BWS_ACCESS_TOKEN) {
      try {
        const result = spawnSync(
          getBwsCommand(),
          ['secret', 'list', '-t', process.env.BWS_ACCESS_TOKEN],
          {
            encoding: 'utf8',
            env: {
              ...process.env,
              NO_COLOR: '1',
              FORCE_COLOR: '0',
              TERM: 'dumb' // Add this to further discourage color output
            },
            stdio: SUPPRESS_ALL ? 'ignore' : undefined
          }
        );

        if (result.status === 0) {
          // Always clean the output, even without DEBUG
          const cleanOutput = result.stdout.replaceAll(/\u001B\[\d+m/g, '').trim();

          try {
            const secrets = JSON.parse(cleanOutput);
            const platformTokens = {};
            const platformsFound = [];

            // Only load tokens for the platform we're on
            if (isNetlify && platforms.has('netlify')) {
              const netlifyToken = secrets.find((s) => s.key === 'NETLIFY_AUTH_TOKEN');
              if (netlifyToken) {
                platformTokens.NETLIFY_AUTH_TOKEN = netlifyToken.value;
                platformsFound.push('Netlify');
              }
            }
            if (isVercel && platforms.has('vercel')) {
              const vercelToken = secrets.find((s) => s.key === 'VERCEL_AUTH_TOKEN');
              if (vercelToken) {
                platformTokens.VERCEL_AUTH_TOKEN = vercelToken.value;
                platformsFound.push('Vercel');
              }
            }

            // Only create .env.secure if we found tokens for our platform
            if (Object.keys(platformTokens).length > 0) {
              const content = Object.entries(platformTokens)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
              const cipherText = encryptContent(content, process.env.BWS_EPHEMERAL_KEY);
              fs.writeFileSync('.env.secure', cipherText);
              log('info', `✓ Successfully loaded auth tokens for: ${platformsFound.join(', ')}`);
            }
          } catch (error) {
            log('warn', `Failed to parse secrets: ${error.message}`);
          }
        }
      } catch (error) {
        log('warn', `Failed to create global .env.secure: ${error.message}`);
      }
    }

    // For platform builds, process each project
    if (isNetlify || isVercel) {
      // Save original environment values if they exist
      const originalEnvironment_ = {
        BWS_ENV: process.env.BWS_ENV,
        BWS_PROJECT: process.env.BWS_PROJECT,
        BWS_PROJECT_ID: process.env.BWS_PROJECT_ID,
        BWS_ACCESS_TOKEN: process.env.BWS_ACCESS_TOKEN
      };

      // Re-use filtered projects from above - no need to filter again
      let projectsToProcess = projectsToUse;

      // Enable progress mode to suppress console interference
      enableProgressMode();

      for (const [projectIndex, project] of projectsToProcess.entries()) {
        showSecureRunProgress(
          'Environment Setup',
          4,
          6,
          `Processing project ${projectIndex + 1}/${projectsToProcess.length} (${
            project.projectName
          })`
        );
        log('info', `\n=== Processing ${project.projectName} ===`);

        // Create the standard environment files for this project
        const environmentMappings = {
          prod: project.bwsProjectIds.prod,
          dev: project.bwsProjectIds.dev,
          local: project.bwsProjectIds.local
        };

        // Track if any secrets were successfully loaded
        let secretsLoaded = false;

        // Parse and expand comma-separated project IDs for each environment
        const environmentsToLoad = Object.entries(environmentMappings)
          .filter(([_, projectIdString]) => projectIdString)
          .flatMap(([env, projectIdString]) => {
            const projectIds = parseProjectIds(projectIdString);
            return projectIds.map((id) => [env, id]);
          });

        let envProcessedCount = 0;

        // Group by environment to merge secrets properly
        const envGroups = {};
        for (const [environment_, projectId] of environmentsToLoad) {
          if (!envGroups[environment_]) {
            envGroups[environment_] = [];
          }
          envGroups[environment_].push({ projectId });
        }

        for (const [environment_, envData] of Object.entries(envGroups)) {
          envProcessedCount++;
          // Calculate incremental progress from 4.0 (67%) towards 6.0 (100%)
          const progressStep = 4 + (2 * envProcessedCount) / Object.keys(envGroups).length;
          showSecureRunProgress(
            'Environment Setup',
            progressStep,
            6,
            `Loading project secrets ${envProcessedCount}/${
              Object.keys(envGroups).length
            } (${environment_})`
          );

          // Load all project IDs for this environment with overlay strategy
          const mergedVariables = {};
          for (const { projectId } of envData) {
            // Only load this project ID if we haven't already
            if (!loadedProjectIds.has(projectId)) {
              const success = await loadBwsProjectSecrets(projectId);
              if (success) {
                secretsLoaded = true;
                loadedProjectIds.add(projectId);
              } else {
                log(
                  'error',
                  `Failed to load secrets for project ${projectId} (environment ${environment_})`
                );
                if (multiProjectFailFast && envData.length > 1) {
                  process.exit(1);
                }
              }
            } else {
              secretsLoaded = true;
            }

            // Merge secrets with overlay strategy
            const sourceFile = `.env.secure.${projectId}`;
            if (fs.existsSync(sourceFile)) {
              const content = fs.readFileSync(sourceFile, 'utf8');
              const decrypted = decryptContent(content, process.env.BWS_EPHEMERAL_KEY);
              const decryptedVariables = parseEnvironmentOutput(decrypted, PARSE_SECURE_FILE);

              // Later project IDs override earlier ones
              Object.assign(mergedVariables, decryptedVariables);
            }
          }

          // Write merged environment file (safe for multiline values)
          if (Object.keys(mergedVariables).length > 0) {
            const mergedContent = serializeEnvRecordToPlaintext(mergedVariables);
            const cipherText = encryptContent(mergedContent, process.env.BWS_EPHEMERAL_KEY);
            const targetFile = `.env.secure.${environment_}`;
            fs.writeFileSync(targetFile, cipherText);
            log(
              'debug',
              `Created ${targetFile} with ${Object.keys(mergedVariables).length} merged secrets`
            );
          }
        }

        // CRITICAL: If no secrets were loaded for this project, fail immediately
        if (!secretsLoaded) {
          log(
            'error',
            `Critical Error: No secrets could be loaded for project ${project.projectName}`
          );
          log('error', `BWS project IDs may be invalid or inaccessible`);
          log('error', `Configuration shows: ${JSON.stringify(project.bwsProjectIds)}`);
          process.exit(1);
        }

        // Set current project in environment
        process.env.BWS_PROJECT = project.projectName;

        // Enhanced platform operations
        log('info', `Syncing platform variables for ${project.projectName}...`);
        const updateResult = spawnSync(
          'node',
          [path.join(dirname, 'update-environments', 'updateEnvVars.js')],
          {
            stdio: SUPPRESS_ALL ? 'ignore' : 'inherit',
            env: process.env
          }
        );

        // Clean up the standard environment files after processing this project
        if (!process.env.DEBUG) {
          for (const environment_ of ['prod', 'dev', 'local']) {
            const file = `.env.secure.${environment_}`;
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
              log('debug', `Cleaned up ${file}`);
            }
          }
        }
      }

      // After all platform operations, restore original values if they existed
      if (
        originalEnvironment_.BWS_ENV ||
        originalEnvironment_.BWS_PROJECT ||
        originalEnvironment_.BWS_PROJECT_ID ||
        originalEnvironment_.BWS_ACCESS_TOKEN
      ) {
        if (originalEnvironment_.BWS_ENV) {
          process.env.BWS_ENV = originalEnvironment_.BWS_ENV;
        }
        if (originalEnvironment_.BWS_PROJECT) {
          process.env.BWS_PROJECT = originalEnvironment_.BWS_PROJECT;
        }
        if (originalEnvironment_.BWS_PROJECT_ID) {
          process.env.BWS_PROJECT_ID = originalEnvironment_.BWS_PROJECT_ID;
        }
        if (originalEnvironment_.BWS_ACCESS_TOKEN) {
          process.env.BWS_ACCESS_TOKEN = originalEnvironment_.BWS_ACCESS_TOKEN;
        }

        // Load the environment based on restored values
        if (originalEnvironment_.BWS_PROJECT && originalEnvironment_.BWS_ENV) {
          const project = config.projects.find(
            (p) => p.projectName === originalEnvironment_.BWS_PROJECT
          );
          if (project) {
            let projectIdString = project.bwsProjectIds[originalEnvironment_.BWS_ENV];

            // If no project ID found for the specific environment, fall back to first available
            if (!projectIdString && project.bwsProjectIds) {
              const availableProjectIds = Object.values(project.bwsProjectIds).filter((id) => id);
              if (availableProjectIds.length > 0) {
                projectIdString = availableProjectIds[0];
                log(
                  'info',
                  `No project ID found for environment '${originalEnvironment_.BWS_ENV}', using fallback: ${projectIdString}`
                );
              }
            }

            if (projectIdString) {
              const projectIds = parseProjectIds(projectIdString);
              const mergedVariables = {};

              for (const projectId of projectIds) {
                const sourceFile = `.env.secure.${projectId}`;
                if (fs.existsSync(sourceFile)) {
                  const content = fs.readFileSync(sourceFile, 'utf8');
                  const decrypted = decryptContent(content, process.env.BWS_EPHEMERAL_KEY);
                  Object.assign(
                    mergedVariables,
                    parseEnvironmentOutput(decrypted, PARSE_SECURE_FILE)
                  );
                }
              }

              Object.assign(process.env, mergedVariables);
              if (projectIds.length > 0) {
                process.env.BWS_PROJECT_ID = projectIds[0];
                if (projectIds.length > 1) {
                  process.env.BWS_PROJECT_IDS = projectIds.join(',');
                } else {
                  delete process.env.BWS_PROJECT_IDS;
                }
              }

              log(
                'info',
                `Restored ${Object.keys(mergedVariables).length} variables for ${
                  originalEnvironment_.BWS_ENV
                } environment`
              );
            }
          }
        }
      }

      // Show final completion and keep it visible
      showSecureRunProgress('Ready', 6, 6, 'Environment configured');
      // Brief pause to show 100% completion, then keep it visible
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Disable progress mode before environment summary
      disableProgressMode();
      // Print final environment state (keep progress bar visible)
      printEnvironmentSummary();
    } else {
      // For local development, handle single project
      // First validate BWS token before prompting
      const isValidToken = await validateBwsToken();

      if (!isValidToken) {
        log('info', 'No valid BWS_ACCESS_TOKEN found, continuing with .env values only');
        return;
      }

      // BWS_PROJECT should already be set by now, but check again just to be safe
      if (!process.env.BWS_PROJECT) {
        log('warn', 'BWS_PROJECT not set - this should not happen, prompting for selection');
        await promptForProject(config.projects);
      }

      const projectName = process.env.BWS_PROJECT;
      const project = config.projects.find((p) => p.projectName === projectName);
      if (!project) {
        throw new Error(`Project ${projectName} not found in config`);
      }

      // For local development, prioritize loading the current environment first
      const environment = process.env.BWS_ENV || 'local';
      const currentProjectIdString = getProjectIdWithFallback(project, environment);

      if (currentProjectIdString) {
        const currentProjectIds = logParsedProjectIds(
          `bwsProjectIds[${environment}]`,
          currentProjectIdString
        );
        const isMultiple = currentProjectIds.length > 1;
        const localLoadFailures = [];

        // Enable progress mode to suppress console interference
        enableProgressMode();

        // Start the incremental progress at 67% (4/6)
        showSecureRunProgress(
          'Environment Setup',
          4,
          6,
          `Loading primary environment secrets (${environment})`
        );

        log(
          'debug',
          `Loading secrets for current environment: ${environment} (project ID${
            isMultiple ? 's' : ''
          }: ${currentProjectIds.join(', ')})`
        );

        const allDecryptedVariables = {};

        for (const [index, projectId] of currentProjectIds.entries()) {
          if (!loadedProjectIds.has(projectId)) {
            const progressLabel = isMultiple ? `[${index + 1}/${currentProjectIds.length}]` : '';
            log('debug', `${progressLabel} Loading secrets from project ${projectId}`);

            const ok = await loadBwsProjectSecrets(projectId);
            if (ok) {
              loadedProjectIds.add(projectId);
            } else {
              localLoadFailures.push(projectId);
              log('error', `${progressLabel} Failed to load secrets for project ${projectId}`);
              if (isMultiple && multiProjectFailFast) {
                process.exit(1);
              }
            }
          }

          const sourceFile = `.env.secure.${projectId}`;
          if (fs.existsSync(sourceFile)) {
            const content = fs.readFileSync(sourceFile, 'utf8');
            const decrypted = decryptContent(content, process.env.BWS_EPHEMERAL_KEY);
            Object.assign(
              allDecryptedVariables,
              parseEnvironmentOutput(decrypted, PARSE_SECURE_FILE)
            );
          }
        }

        if (localLoadFailures.length > 0 && isMultiple && !multiProjectFailFast) {
          log(
            'warn',
            `Multi-project: ${
              localLoadFailures.length
            } project load(s) failed (${localLoadFailures.join(
              ', '
            )}). Overlay may be incomplete. Set BWS_MULTI_PROJECT_FAIL_FAST=true to abort.`
          );
        }

        if (isMultiple && Object.keys(allDecryptedVariables).length > 0) {
          fs.writeFileSync(
            `.env.secure.${environment}`,
            encryptContent(
              serializeEnvRecordToPlaintext(allDecryptedVariables),
              process.env.BWS_EPHEMERAL_KEY
            ),
            { encoding: 'utf-8' }
          );
          log('debug', `Wrote merged .env.secure.${environment} for multi-project mapping`);
        }

        if (currentProjectIds.length > 0) {
          process.env.BWS_PROJECT_ID = currentProjectIds[0];
          if (currentProjectIds.length > 1) {
            process.env.BWS_PROJECT_IDS = currentProjectIds.join(',');
          } else {
            delete process.env.BWS_PROJECT_IDS;
          }
        }

        for (const [key, value] of Object.entries(allDecryptedVariables)) {
          if (!(key in process.env)) {
            process.env[key] = value ?? '';
          }
        }

        log(
          'debug',
          `Loaded ${
            Object.keys(allDecryptedVariables).length
          } total keys for local development (merged)`
        );
      } else {
        log('warn', `No project ID found for environment ${environment} and no fallback available`);
      }

      // Then load any other project IDs that might be needed
      // Parse each projectId string to handle comma-separated values
      const additionalProjectIds = Object.entries(project.bwsProjectIds)
        .filter(([env, projectIdString]) => env !== environment && projectIdString)
        .flatMap(([env, projectIdString]) => {
          const projectIds = parseProjectIds(projectIdString);
          return projectIds.filter((id) => !loadedProjectIds.has(id)).map((id) => [env, id]);
        });

      if (additionalProjectIds.length > 0) {
        let processedCount = 0;
        const totalCount = additionalProjectIds.length + 1; // +1 for current environment already loaded

        for (const [env, projectId] of additionalProjectIds) {
          processedCount++;
          // Calculate incremental progress from 4.0 (67%) towards 6.0 (100%)
          const progressStep = 4 + (2 * processedCount) / totalCount; // 4.0 to 6.0
          showSecureRunProgress(
            'Environment Setup',
            progressStep,
            6,
            `Loading secrets ${processedCount + 1}/${totalCount} environments (${env})`
          );

          // Brief delay to show progress update
          await new Promise((resolve) => setTimeout(resolve, 100));

          log(
            'debug',
            `Loading additional secrets for ${projectName} (${env}) project ID: ${projectId}`
          );
          const ok = await loadBwsProjectSecrets(projectId);
          if (ok) loadedProjectIds.add(projectId);
        }
      }

      // Show validation progress bar before environment summary (visual timing fix)
      showSecureRunProgress('Validation', 5, 6, 'Validating environment variables');
      // Brief pause to show validation progress
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Show final completion and keep it visible
      showSecureRunProgress('Ready', 6, 6, 'Environment configured');
      // Brief pause to show 100% completion, then keep it visible
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Disable progress mode before environment summary
      disableProgressMode();
      // Add environment summary (keep progress bar visible)
      printEnvironmentSummary();
    }

    // After all BWS and platform operations, restore original environment variables
    for (const [key, value] of Object.entries(originalEnvironment)) {
      process.env[key] = value;
    }

    // If we stored an original BWS_ENV value in debug mode, use it for the file restore
    if (process.env.ORIGINAL_BWS_ENV) {
      log('debug', `Restoring original BWS_ENV value: ${process.env.ORIGINAL_BWS_ENV}`);
      // Find the project
      const config = await readConfigFileWithFallback();
      const project = config.projects.find((p) => p.projectName === process.env.BWS_PROJECT);
      if (project) {
        // Update the .env file with the original environment
        await updateEnvironmentBwsSection(project, process.env.ORIGINAL_BWS_ENV);
      }
    }

    // Restore original .env file content
    await restoreOriginalEnvironmentFile();
  } catch (error) {
    log('error', `Failed to setup environment: ${error.message}`);
  }
}

// 4) If you also want to demonstrate decrypting from .env.secure, do it now in memory:
function decryptContent(encrypted, encryptionKey) {
  const [nonceBase64, authTagBase64, data] = encrypted.split(':');
  const nonce = Buffer.from(nonceBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), nonce);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Make the .env.secure verification optional
if (fs.existsSync('.env.secure') && process.env.BWS_ACCESS_TOKEN && process.env.BWS_EPHEMERAL_KEY) {
  try {
    const encryptedText = fs.readFileSync('.env.secure', 'utf8');
    const checkPlain = decryptContent(encryptedText, process.env.BWS_EPHEMERAL_KEY);
    log('debug', 'Verified .env.secure decryption in memory...');
  } catch (error) {
    log('warn', `[WARN] Decryption from .env.secure failed. Skipping this step: ${error.message}`);
  }
}

// Add this function near the other crypto functions
function encryptContent(content, encryptionKey) {
  const nonce = crypto.randomBytes(12); // 12 bytes is optimal for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), nonce);
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${nonce.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/** Fetch secrets for one BWS project UUID and write `.env.secure.<projectId>` (encrypted). */
async function loadBwsProjectSecrets(projectId) {
  if (!projectId) {
    log('error', 'Critical Error: Missing projectId');
    return false;
  }

  if (!process.env.BWS_ACCESS_TOKEN) {
    log('error', 'Critical Error: BWS_ACCESS_TOKEN not set');
    return false;
  }

  try {
    log('debug', `Loading secrets for project ${projectId}...`);

    const output = execBwsCommandWithRetrySync(
      `${getBwsCommand()} secret list -t ${
        process.env.BWS_ACCESS_TOKEN
      } ${projectId} --output json`,
      { encoding: 'utf-8' },
      `Loading secrets for ${projectId}`
    );

    let bwsSecrets;
    try {
      bwsSecrets = JSON.parse(output || '[]');
      if (!Array.isArray(bwsSecrets) || bwsSecrets.length === 0) {
        log('error', `Critical Error: No secrets found for projectId ${projectId}`);
        return false;
      }
    } catch (parseError) {
      log('error', `Critical Error: Invalid secrets JSON for ${projectId}: ${parseError.message}`);
      return false;
    }

    const record = Object.fromEntries(
      bwsSecrets.map(({ key, value }) => [key, value === undefined || value === null ? '' : value])
    );
    const environmentContent = serializeEnvRecordToPlaintext(record);

    if (process.env.BWS_EPHEMERAL_KEY && environmentContent) {
      const cipherText = encryptContent(environmentContent, process.env.BWS_EPHEMERAL_KEY);
      fs.writeFileSync(`.env.secure.${projectId}`, cipherText, {
        encoding: 'utf-8'
      });

      if (process.env.DEBUG === 'true') {
        log('debug', `Created .env.secure.${projectId} with ${bwsSecrets.length} secrets`);
      }
      return true;
    }
    log(
      'error',
      `Critical Error: Failed to create secure file for ${projectId} - missing encryption key or empty content`
    );
    return false;
  } catch (error) {
    if (error?.message?.includes('404 Not Found')) {
      log('error', `Critical Error: Project ${projectId}: not found or no access`);
      return false;
    }

    log('error', `Critical Error: Failed to load secrets for ${projectId}: ${error.message}`);
    if (process.env.DEBUG === 'true') {
      if (error?.stdout) {
        log('debug', 'stdout:', error.stdout.toString());
      }
      if (error?.stderr) {
        log('debug', 'stderr:', error.stderr.toString());
      }
      log('debug', 'Error:', error?.message || 'Unknown error');
    }
    return false;
  }
}

// Add this helper function to handle loading the secure env file
function loadSecureEnvironment(environment) {
  const secureFile = `.env.secure.${environment}`;
  if (fs.existsSync(secureFile)) {
    log('debug', `Loading ${environment} environment secrets...`);
    const encryptedText = fs.readFileSync(secureFile, 'utf8');
    const decrypted = decryptContent(encryptedText, process.env.BWS_EPHEMERAL_KEY);

    // Load decrypted vars into process.env
    const parsedVariables = parseEnvironmentOutput(decrypted, PARSE_SECURE_FILE);
    for (const [key, value] of Object.entries(parsedVariables)) {
      if (key) {
        process.env[key.trim()] = value ?? '';
      }
    }
    log('debug', `${environment} environment secrets loaded into process.env`);
  } else {
    log('warn', `Warning: No ${environment} environment secrets found (${secureFile})`);
  }
}

// Move cleanup function to top level
function cleanupSecureFiles(verbose = false) {
  try {
    // Clean up all .env.secure.* files and .env.secure (encrypted artifacts in consumer repo cwd)
    const files = fs.readdirSync(process.cwd());
    for (const file of files) {
      if (file === '.env.secure' || file.startsWith('.env.secure.')) {
        fs.unlinkSync(path.join(process.cwd(), file));
        if (verbose || process.env.DEBUG === 'true') {
          log('debug', `Cleaned up ${file}`);
        }
      }
    }
  } catch (error) {
    if (verbose || process.env.DEBUG === 'true') {
      log('warn', `Error during cleanup: ${error.message}`);
    }
  }
}

/**
 * Remove transient `.env.secure` / `.env.secure.*` files after secrets are in process.env.
 * Nested secure-run (child) skips — parent owns cleanup.
 * Set BWS_KEEP_SECURE_FILES=true to leave files for debugging (not recommended in CI).
 */
function finalizeBwsSecureArtifactsCleanup(verbose = false) {
  if (isNestedExecution) {
    return;
  }
  if (process.env.BWS_KEEP_SECURE_FILES === 'true') {
    if (process.env.DEBUG === 'true') {
      log('debug', 'BWS_KEEP_SECURE_FILES=true — skipping removal of .env.secure* files');
    }
    return;
  }
  cleanupSecureFiles(verbose);
}

// Add function to restore original .env file content
async function restoreOriginalEnvironmentFile() {
  try {
    // Only restore the BWS_ENV value if it was temporarily changed
    if (process.env.ORIGINAL_BWS_ENV && process.env.BWS_ENV !== process.env.ORIGINAL_BWS_ENV) {
      const environmentPath = path.join(process.cwd(), '.env');

      if (fs.existsSync(environmentPath)) {
        const content = await fsPromises.readFile(environmentPath, 'utf8');
        const lines = content.split('\n');

        // Find and update the BWS_ENV line
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          if (line.trim().startsWith('BWS_ENV=') && !line.startsWith('#')) {
            // Get comment if any
            const parts = line.split('#');
            const comment = parts.length > 1 ? `# ${parts.slice(1).join('#').trim()}` : '';

            // Replace with original value
            lines[index] = `BWS_ENV=${process.env.ORIGINAL_BWS_ENV}     ${comment}`;
            break;
          }
        }

        // Write back the file with just the BWS_ENV updated
        await fsPromises.writeFile(environmentPath, lines.join('\n'));
        log('debug', `Restored original BWS_ENV value: ${process.env.ORIGINAL_BWS_ENV}`);
      }
    } else {
      if (process.env.DEBUG === 'true') {
        log('debug', 'No environment variables need to be restored');
      }
    }
  } catch (error) {
    log('debug', `Error handling environment variables: ${error.message}`);
  }
}

// Update handleUploadCommand function to check for both formats
async function handleUploadCommand() {
  // Check if either --clearvars or --clear-vars was passed
  const clearVariables =
    process.argv.includes('--clearvars') || process.argv.includes('--clear-vars');

  // Run the upload-secrets script with clearvars if specified
  const uploadScript = path.join(dirname, 'upload-to-bws', 'upload-secrets.js');
  const arguments_ = clearVariables ? ['--clearvars'] : [];

  const result = spawnSync('node', [uploadScript, ...arguments_], {
    stdio: SUPPRESS_ALL ? 'ignore' : 'inherit',
    env: process.env
  });

  // Exit with the same status as the upload script
  process.exit(result.status);
}

// Main execution
(async () => {
  try {
    // Parse command line arguments
    const arguments_ = process.argv.slice(2);

    // Enhanced detection for upload-secrets command that works across package managers
    if (arguments_[0] === '--upload-secrets') {
      await handleUploadCommand();
      return;
    }

    // Define total progress steps (available to both nested and non-nested)
    const totalSteps = 6;
    let currentStep = 0;

    // Ensure BWS is installed before doing anything else
    ensureBwsInstalled();

    // 1. Always load base .env first (but don't override original env vars)
    dotenv.config({ override: false, quiet: true });
    log('debug', 'Loaded base environment from .env');

    // Only perform BWS setup if this is not a nested execution
    if (!isNestedExecution) {
      // Step 1: Setup phase
      showSecureRunProgress('Setup', ++currentStep, totalSteps, 'Initializing environment');
      // Step 2: Scanning phase
      showSecureRunProgress('Scanning', ++currentStep, totalSteps, 'Analyzing codebase variables');

      // 2. Check if we need to scan for required vars
      const requiredVariablesPath = path.join(dirname, 'requiredVars.env');

      // Check for special debug flags
      const isNetlify = process.env.NETLIFY === 'true';
      const isVercel = process.env.VERCEL === '1';
      const isDebug = process.env.DEBUG === 'true';

      // In debug mode with platform flags, preserve original BWS_ENV if set
      if (isDebug && (isNetlify || isVercel) && !process.env.PRESERVE_ENV) {
        // Store original value if it exists
        if (process.env.BWS_ENV) {
          process.env.ORIGINAL_BWS_ENV = process.env.BWS_ENV;
        } else if (fs.existsSync('.env')) {
          // Try to read from .env file if exists
          const environmentContent = fs.readFileSync('.env', 'utf8');
          const match = environmentContent.match(/^\s*BWS_ENV\s*=\s*(\w+)/m);
          if (match && match[1]) {
            process.env.ORIGINAL_BWS_ENV = match[1];
          }
        }
      }

      // Only run environment scan for platform builds or debug mode
      if (!fs.existsSync(requiredVariablesPath) || isNetlify || isVercel || isDebug) {
        if (!isDebug) clearSecureRunProgress();
        log('info', 'Scanning for required variables...');
        const scanResult = spawnSync(
          'node',
          [path.join(dirname, 'check-vars', 'requiredRuntimeVars.js')],
          {
            stdio: isDebug ? 'inherit' : 'ignore'
          }
        );
        if (scanResult.status !== 0) {
          clearSecureRunProgress();
          throw new Error('Failed to scan for required variables');
        }
      }

      // Step 3: Authentication phase
      showSecureRunProgress(
        'Authentication',
        ++currentStep,
        totalSteps,
        'Validating BWS credentials'
      );

      // 3. Try BWS enhancement if possible
      try {
        const isValidToken = await validateBwsToken();

        // CRITICAL CHANGE: For platform builds, immediately exit if SITE_NAME or BWS_PROJECT not found
        if (isValidToken && (isNetlify || isVercel)) {
          if (!process.env.SITE_NAME && !process.env.BWS_PROJECT) {
            clearSecureRunProgress();
            log(
              'error',
              'Critical Error: Neither SITE_NAME nor BWS_PROJECT environment variable is set. For platform builds, one of these must be specified.'
            );
            process.exit(1); // Immediately exit with error code
          }
        }

        if (isValidToken) {
          // Step 4: Environment Setup phase - enable progress mode to suppress interference
          enableProgressMode();
          showSecureRunProgress(
            'Environment Setup',
            ++currentStep,
            totalSteps,
            'Loading secrets and configuration'
          );

          // Single setupEnvironment call that handles both cases
          try {
            await setupEnvironment({
              isPlatformBuild: isNetlify || isVercel
            });
          } catch (setupError) {
            // CRITICAL CHANGE: Exit immediately for any setupEnvironment errors
            clearSecureRunProgress();
            log('error', `Failed to setup environment: ${setupError.message}`);
            process.exit(1);
          }

          // Call map-env-files.js to show decrypted contents if requested
          const mapResult = spawnSync(
            'node',
            [path.join(dirname, 'update-environments', 'map-env-files.js')],
            {
              stdio: SUPPRESS_ALL || !isDebug ? 'ignore' : 'inherit',
              env: process.env
            }
          );

          // Restore original variables after mapping
          for (const [key, value] of Object.entries(originalEnvironment)) {
            process.env[key] = value;
          }
        } else {
          currentStep++; // Skip environment setup step
          if (!isDebug)
            log('info', 'No valid BWS_ACCESS_TOKEN found, continuing with .env values only');
        }
      } catch (error) {
        // CRITICAL CHANGE: Exit for any error in the BWS enhancement process
        clearSecureRunProgress();
        log('error', `BWS enhancement failed: ${error.message}`);
        process.exit(1);
      }

      // Step 5: Validation phase (progress bar already shown earlier for visual timing)
      // Run environment validation regardless (silently)
      const validator = spawnSync('node', [path.join(dirname, 'env_validator.js')], {
        stdio: 'ignore', // Always ignore to prevent interference with progress bar
        env: process.env
      });

      // Add small delay to ensure validation completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 5. IMPORTANT: Restore original environment variables to ensure CLI-provided vars take precedence
      for (const [key, value] of Object.entries(originalEnvironment)) {
        process.env[key] = value;
      }

      normalizeBwsProjectIdForChild();

      // Restore original .env file content (silently)
      await restoreOriginalEnvironmentFile();
    } else {
      // For nested executions, just inherit the parent process environment
      log('debug', 'Skipping BWS setup in nested execution');
      currentStep = totalSteps - 1; // Skip to final step
    }

    // Step 6: Execution phase
    // (setupEnvironment already showed Ready progress and environment summary)

    // Disable progress mode before command execution
    disableProgressMode();

    // Add newline before command execution to ensure clean output
    console.log('');

    // 6. Execute the command
    const command = process.argv.slice(2);
    if (command.length === 0) {
      log('warn', 'No command provided to execute');
      finalizeBwsSecureArtifactsCleanup();
      process.exit(0);
    }

    // Normalize command - strip wrapping quotes that may have been passed literally
    // This handles cases like: pnpm secure-run "turbo dev" where quotes become part of argv
    // Works cross-platform: Linux, macOS, Windows (cmd.exe, PowerShell), and CI/CD environments
    let commandString = arguments_.join(' ');
    commandString = commandString.replace(/^["'](.*)["']$/, '$1').trim();

    const result = spawnSync(commandString, [], {
      stdio: 'inherit',
      env: process.env,
      shell: true
    });

    finalizeBwsSecureArtifactsCleanup();
    process.exit(result.status);
  } catch (error) {
    // Always show critical errors even when suppressed
    clearSecureRunProgress();
    console.error(error?.message || String(error));
    process.exit(1);
  }
})();

// Backup cleanup if the process exits without going through finalizeBwsSecureArtifactsCleanup (e.g. early process.exit)
process.on('exit', () => {
  finalizeBwsSecureArtifactsCleanup(false);
  if (originalEnvironmentFileContent && process.env.DEBUG === 'true') {
    log('debug', 'Skipping complete .env restoration to preserve BWS project selection');
  }
});

process.on('SIGINT', async () => {
  finalizeBwsSecureArtifactsCleanup(false);
  if (!isNestedExecution) {
    await restoreOriginalEnvironmentFile();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  finalizeBwsSecureArtifactsCleanup(false);
  if (!isNestedExecution) {
    await restoreOriginalEnvironmentFile();
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  // Disable progress mode to show error
  disableProgressMode();
  console.error('Uncaught Exception:', error);

  finalizeBwsSecureArtifactsCleanup(false);
  if (!isNestedExecution) {
    await restoreOriginalEnvironmentFile();
  }
  process.exit(1);
});
