import * as fs from 'fs';
import os from 'os';
import path from 'path';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    clearAntigravitySessionNameCacheForTesting,
    getAntigravitySessionName,
    getSessionNameFromRecord,
    getTranscriptSessionName
} from '../jsonl-session';

let tempDir: string;

describe('jsonl-session', () => {
    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agstatusline-session-test-'));
        clearAntigravitySessionNameCacheForTesting();
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        clearAntigravitySessionNameCacheForTesting();
    });

    it('extracts session name from custom-title record', () => {
        expect(getSessionNameFromRecord({ type: 'custom-title', customTitle: 'Custom Session' })).toBe('Custom Session');
        expect(getSessionNameFromRecord({ type: 'custom-title', customTitle: '' })).toBeNull();
        expect(getSessionNameFromRecord({ type: 'message' })).toBeNull();
        expect(getSessionNameFromRecord(null)).toBeNull();
    });

    it('extracts session name from conversation_title in record', () => {
        expect(getSessionNameFromRecord({ conversation_title: 'My Title' })).toBe('My Title');
        expect(getSessionNameFromRecord({ conversation_title: '   ' })).toBeNull();
    });

    it('returns null for getAntigravitySessionName with invalid or empty id', () => {
        expect(getAntigravitySessionName(undefined)).toBeNull();
        expect(getAntigravitySessionName('')).toBeNull();
        expect(getAntigravitySessionName('   ')).toBeNull();
        expect(getAntigravitySessionName('invalid;drop table;')).toBeNull();
    });

    it('handles non-existent db gracefully', () => {
        const oldEnv = process.env.ANTIGRAVITY_CONFIG_DIR;
        process.env.ANTIGRAVITY_CONFIG_DIR = tempDir;
        try {
            expect(getAntigravitySessionName('some-session-id')).toBeNull();
        } finally {
            process.env.ANTIGRAVITY_CONFIG_DIR = oldEnv;
        }
    });

    it('returns null for getTranscriptSessionName when path is undefined or file missing', () => {
        expect(getTranscriptSessionName(undefined)).toBeNull();
        expect(getTranscriptSessionName(path.join(tempDir, 'nonexistent.jsonl'))).toBeNull();
    });
});
