import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    afterAll,
    afterEach,
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';

import { saveAntigravitySettings } from '../../utils/antigravity-settings';
import { loadClaudeStatusLineState } from '../claude-status';

const ORIGINAL_ANTIGRAVITY_CONFIG_DIR = process.env.ANTIGRAVITY_CONFIG_DIR;
let testAntigravityConfigDir = '';

beforeEach(() => {
    testAntigravityConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agstatusline-status-'));
    process.env.ANTIGRAVITY_CONFIG_DIR = testAntigravityConfigDir;
});

afterEach(() => {
    if (testAntigravityConfigDir) {
        fs.rmSync(testAntigravityConfigDir, { recursive: true, force: true });
    }
});

afterAll(() => {
    if (ORIGINAL_ANTIGRAVITY_CONFIG_DIR === undefined) {
        delete process.env.ANTIGRAVITY_CONFIG_DIR;
    } else {
        process.env.ANTIGRAVITY_CONFIG_DIR = ORIGINAL_ANTIGRAVITY_CONFIG_DIR;
    }
});

describe('loadClaudeStatusLineState', () => {
    it('loads both the installed command and refresh interval from Antigravity settings', async () => {
        await saveAntigravitySettings({
            statusLine: {
                type: 'command',
                command: 'npx -y agstatusline@latest',
                padding: 0,
                refreshInterval: 10
            }
        });

        await expect(loadClaudeStatusLineState()).resolves.toEqual({
            existingStatusLine: 'npx -y agstatusline@latest',
            refreshInterval: 10
        });
    });

    it('returns null refreshInterval when Antigravity settings do not define one', async () => {
        await saveAntigravitySettings({
            statusLine: {
                type: 'command',
                command: 'npx -y agstatusline@latest',
                padding: 0
            }
        });

        await expect(loadClaudeStatusLineState()).resolves.toEqual({
            existingStatusLine: 'npx -y agstatusline@latest',
            refreshInterval: null
        });
    });
});
