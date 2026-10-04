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
