import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
    mkdir,
    readFile,
    rename,
    unlink,
    writeFile
} from 'node:fs/promises';
import os from 'node:os';
import path, {
    basename,
    dirname,
    resolve
} from 'node:path';

import type { InstallationMetadata } from '../types/Settings';

import {
    getConfigPath,
    isCustomConfigPath
} from './config';

export const AGSTATUSLINE_COMMANDS = {
    AUTO_NPX: 'npx -y agstatusline@latest',
    AUTO_BUNX: 'bunx -y agstatusline@latest',
    GLOBAL: 'agstatusline'
};

export const PINNED_INSTALL_COMMANDS = {
    NPM: (version: string) => `npm install -g agstatusline@${version}`,
    BUN: (version: string) => `bun add -g agstatusline@${version}`
};

export type StatusLineCommandMode = 'auto-npx' | 'auto-bunx' | 'global';

export interface PackageCommandAvailability {
    npm: boolean;
    npx: boolean;
    bun: boolean;
    bunx: boolean;
}

export function getPackageCommandAvailability(): PackageCommandAvailability {
    const hasCommand = (cmd: string): boolean => {
        try {
            const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
            execSync(checkCmd, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    };

    return {
        npm: hasCommand('npm'),
        npx: hasCommand('npx'),
        bun: hasCommand('bun'),
        bunx: hasCommand('bunx')
    };
}

function getBaseCommandForMode(commandMode: StatusLineCommandMode): string {
    switch (commandMode) {
        case 'auto-npx':
            return AGSTATUSLINE_COMMANDS.AUTO_NPX;
        case 'auto-bunx':
            return AGSTATUSLINE_COMMANDS.AUTO_BUNX;
        case 'global':
            return AGSTATUSLINE_COMMANDS.GLOBAL;
    }
}

export function buildStatusLineCommand(commandMode: StatusLineCommandMode): string {
    const base = getBaseCommandForMode(commandMode);
    if (isCustomConfigPath()) {
        return `${base} --config "${getConfigPath()}"`;
    }
    return base;
}

function matchesCommandBase(command: string, baseCommand: string): boolean {
    return command === baseCommand || command.startsWith(`${baseCommand} --config `);
}

export function isKnownCommand(command: string): boolean {
    const prefixes = [AGSTATUSLINE_COMMANDS.AUTO_NPX, AGSTATUSLINE_COMMANDS.AUTO_BUNX, AGSTATUSLINE_COMMANDS.GLOBAL];
    return prefixes.some(prefix => matchesCommandBase(command, prefix))
        || /(?:^|[\s"'\\/])agstatusline(?:\.ts)?(?=$|[\s"'])/.test(command);
}

export function classifyInstallation(
    command: string | null | undefined,
    metadata?: InstallationMetadata
): InstallationMetadata {
    const statusLineCommand = command ?? '';

    if (matchesCommandBase(statusLineCommand, AGSTATUSLINE_COMMANDS.AUTO_NPX)) {
        return {
            method: 'auto-update',
            packageManager: 'npm'
        };
    }

    if (matchesCommandBase(statusLineCommand, AGSTATUSLINE_COMMANDS.AUTO_BUNX)) {
        return {
            method: 'auto-update',
            packageManager: 'bun'
        };
    }

    if (matchesCommandBase(statusLineCommand, AGSTATUSLINE_COMMANDS.GLOBAL)) {
        if (metadata?.method === 'pinned') {
            return metadata;
        }

        return {
            method: 'self-managed',
            packageManager: 'unknown'
        };
    }

    if (/(?:^|[\s"'\\/])agstatusline(?:\.ts)?(?=$|[\s"'])/.test(statusLineCommand)) {
        return {
            method: 'self-managed',
            packageManager: 'unknown'
        };
    }

    return metadata ?? {
        method: 'self-managed',
        packageManager: 'unknown'
    };
}

export interface InstallStatusLineOptions {
    command?: string;
    settingsPath?: string;
    customConfigPath?: string;
}

export interface StatusLineInstallStatus {
    installed: boolean;
    command?: string;
    enabled?: boolean;
}

async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
    const dir = dirname(file);
    await mkdir(dir, { recursive: true });
    const tempPath = resolve(dir, `${basename(file)}.${process.pid}.${Date.now()}.tmp`);
    try {
        await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
        await rename(tempPath, file);
    } catch (error) {
        await unlink(tempPath).catch(() => undefined);
        throw error;
    }
}

export function getAntigravityConfigDir(): string {
    const customDir = process.env.ANTIGRAVITY_CONFIG_DIR;
    if (customDir && customDir.trim().length > 0) {
        return path.resolve(customDir.trim());
    }

    const appDataDir = process.env.ANTIGRAVITY_APP_DATA_DIR;
    if (appDataDir && appDataDir.trim().length > 0) {
        return path.resolve(appDataDir.trim());
    }

    const aimProfile = process.env.AIM_PROFILE;
    const stateDir = process.env.AIM_STATE_DIR ?? process.env.AIM_HOME;
    if (aimProfile && stateDir) {
        const candidate = path.join(path.resolve(stateDir), 'profiles', aimProfile.trim(), '.gemini', 'antigravity-cli');
        return candidate;
    }

    const profileDir = process.env.AIM_PROFILE_DIR;
    if (profileDir && profileDir.trim().length > 0) {
        return path.join(path.resolve(profileDir.trim()), '.gemini', 'antigravity-cli');
    }

    return path.join(os.homedir(), '.gemini', 'antigravity-cli');
}

export function getAntigravitySettingsPath(): string {
    return path.join(getAntigravityConfigDir(), 'settings.json');
}

export async function loadAntigravitySettings(
    settingsPath?: string
): Promise<Record<string, unknown>> {
    const targetFile = settingsPath ?? getAntigravitySettingsPath();
    try {
        const content = await readFile(targetFile, 'utf8');
        const parsed = JSON.parse(content) as unknown;
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        return {};
    } catch {
        return {};
    }
}

export function loadAntigravitySettingsSync(
    settingsPath?: string
): Record<string, unknown> {
    const targetFile = settingsPath ?? getAntigravitySettingsPath();
    try {
        const content = readFileSync(targetFile, 'utf8');
        const parsed = JSON.parse(content) as unknown;
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        return {};
    } catch {
        return {};
    }
}

export async function saveAntigravitySettings(
    settings: Record<string, unknown>,
    settingsPath?: string
): Promise<void> {
    const targetFile = settingsPath ?? getAntigravitySettingsPath();
    await writeJsonAtomic(targetFile, settings);
}

export async function isStatusLineInstalled(
    settingsPath?: string
): Promise<StatusLineInstallStatus> {
    const targetFile = settingsPath ?? getAntigravitySettingsPath();
    let settings: Record<string, unknown>;
    try {
        const content = await readFile(targetFile, 'utf8');
        const parsed = JSON.parse(content) as unknown;
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            settings = parsed as Record<string, unknown>;
        } else {
            return { installed: false };
        }
    } catch {
        return { installed: false };
    }

    const statusLine = settings.statusLine;
    if (typeof statusLine !== 'object' || statusLine === null || Array.isArray(statusLine)) {
        return { installed: false };
    }

    const sl = statusLine as Record<string, unknown>;
    const command = typeof sl.command === 'string' ? sl.command : undefined;
    const enabled = typeof sl.enabled === 'boolean' ? sl.enabled : undefined;
    const isCommandType = sl.type === 'command';
    const hasAgstatusline = typeof command === 'string' && command.includes('agstatusline');
    const isEnabled = enabled !== false;

    if (isCommandType && hasAgstatusline && isEnabled) {
        return {
            installed: true,
            command,
            enabled: true
        };
    }

    return {
        installed: false,
        ...(command !== undefined ? { command } : {}),
        ...(enabled !== undefined ? { enabled } : {})
    };
}

export async function installStatusLine(options?: InstallStatusLineOptions): Promise<void> {
    const targetFile = options?.settingsPath ?? getAntigravitySettingsPath();
    const settings = await loadAntigravitySettings(targetFile);

    let command: string;
    if (options?.command && options.command.trim().length > 0) {
        command = options.command.trim();
    } else if (options?.customConfigPath && options.customConfigPath.trim().length > 0) {
        command = `agstatusline --config "${options.customConfigPath.trim()}"`;
    } else {
        command = 'agstatusline';
    }

    settings.statusLine = {
        type: 'command',
        command,
        enabled: true
    };

    await saveAntigravitySettings(settings, targetFile);
}

export async function getExistingStatusLine(settingsPath?: string): Promise<string | null> {
    const status = await isStatusLineInstalled(settingsPath);
    return status.command ?? null;
}

export async function getRefreshInterval(settingsPath?: string): Promise<number | null> {
    try {
        const targetFile = settingsPath ?? getAntigravitySettingsPath();
        const settings = await loadAntigravitySettings(targetFile);
        const sl = settings.statusLine as Record<string, unknown> | undefined;
        return typeof sl?.refreshInterval === 'number' ? sl.refreshInterval : null;
    } catch {
        return null;
    }
}

export async function setRefreshInterval(interval: number | null, settingsPath?: string): Promise<void> {
    const targetFile = settingsPath ?? getAntigravitySettingsPath();
    const settings = await loadAntigravitySettings(targetFile);
    if (!settings.statusLine || typeof settings.statusLine !== 'object' || Array.isArray(settings.statusLine)) {
        return;
    }
    const sl = settings.statusLine as Record<string, unknown>;
    if (interval === null) {
        delete sl.refreshInterval;
    } else {
        sl.refreshInterval = interval;
    }
    await saveAntigravitySettings(settings, targetFile);
}

export async function uninstallStatusLine(settingsPath?: string): Promise<void> {
    const targetFile = settingsPath ?? getAntigravitySettingsPath();
    let content: string;
    try {
        content = await readFile(targetFile, 'utf8');
    } catch {
        return;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(content) as unknown;
    } catch {
        return;
    }

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const settings = parsed as Record<string, unknown>;
        if ('statusLine' in settings) {
            delete settings.statusLine;
            await saveAntigravitySettings(settings, targetFile);
        }
    }
}
