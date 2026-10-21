import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    backupAntigravitySettings,
    installStatusLine,
    isStatusLineInstalled,
    uninstallStatusLine
} from '../antigravity-settings';

describe('antigravity-settings', () => {
    let tempDir: string;
    let settingsFile: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agstatusline-test-'));
        settingsFile = path.join(tempDir, 'settings.json');
    });

    afterEach(() => {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup failure
        }
    });

    it('installs statusLine into settings.json', async () => {
        await installStatusLine({ settingsPath: settingsFile, command: 'agstatusline' });

        const content = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) as { statusLine?: { command?: string; enabled?: boolean } };
        expect(content.statusLine?.command).toBe('agstatusline');
        expect(content.statusLine?.enabled).toBe(true);

        const status = await isStatusLineInstalled(settingsFile);
        expect(status.installed).toBe(true);
        expect(status.command).toBe('agstatusline');
    });

    it('creates .orig backup before modifying existing settings', async () => {
        const initial = { model: 'gemini-2.5-pro', someCustomKey: 123 };
        fs.writeFileSync(settingsFile, JSON.stringify(initial), 'utf8');

        await installStatusLine({ settingsPath: settingsFile, command: 'agstatusline' });

        const backupFile = `${settingsFile}.orig`;
        expect(fs.existsSync(backupFile)).toBe(true);
        const backupContent = JSON.parse(fs.readFileSync(backupFile, 'utf8')) as Record<string, unknown>;
        expect(backupContent).toEqual(initial);

        const updated = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) as typeof initial & { statusLine?: unknown };
        expect(updated.model).toBe('gemini-2.5-pro');
        expect(updated.someCustomKey).toBe(123);
        expect(updated.statusLine).toBeDefined();
    });

    it('preserves existing .orig backup across repeated installs', async () => {
        const initial = { model: 'gemini-2.5-pro', pristine: true };
        fs.writeFileSync(settingsFile, JSON.stringify(initial), 'utf8');

        // First install creates .orig
        await installStatusLine({ settingsPath: settingsFile, command: 'agstatusline' });

        // Second install with different command should not overwrite .orig
        await installStatusLine({ settingsPath: settingsFile, command: 'agstatusline --config /custom' });

        const backupFile = `${settingsFile}.orig`;
        expect(fs.existsSync(backupFile)).toBe(true);
        const backupContent = JSON.parse(fs.readFileSync(backupFile, 'utf8')) as Record<string, unknown>;
        expect(backupContent).toEqual(initial);
        expect(backupContent.statusLine).toBeUndefined();
    });

    it('backs up corrupted settings and warns without erasing backup', async () => {
        const corruptJson = '{\n  "corrupt": true,\n  invalid json here\n';
        fs.writeFileSync(settingsFile, corruptJson, 'utf8');

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        await installStatusLine({ settingsPath: settingsFile, command: 'agstatusline' });

        const backupFile = `${settingsFile}.orig`;
        expect(fs.existsSync(backupFile)).toBe(true);
        expect(fs.readFileSync(backupFile, 'utf8')).toBe(corruptJson);

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Warning: Could not read existing Antigravity settings. A backup exists at')
        );
        consoleSpy.mockRestore();

        const newSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) as { statusLine?: { command?: string } };
        expect(newSettings.statusLine?.command).toBe('agstatusline');
    });

    it('returns null backup when settings file does not exist', async () => {
        const nonExistent = path.join(tempDir, 'does-not-exist.json');
        const backup = await backupAntigravitySettings(nonExistent);
        expect(backup).toBeNull();
    });

    it('uninstalls statusLine cleanly', async () => {
        fs.writeFileSync(settingsFile, JSON.stringify({
            model: 'gemini-2.5-pro',
            statusLine: { type: 'command', command: 'agstatusline', enabled: true }
        }), 'utf8');

        await uninstallStatusLine(settingsFile);

        const content = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) as { model?: string; statusLine?: unknown };
        expect(content.model).toBe('gemini-2.5-pro');
        expect(content.statusLine).toBeUndefined();

        const status = await isStatusLineInstalled(settingsFile);
        expect(status.installed).toBe(false);
    });
});
