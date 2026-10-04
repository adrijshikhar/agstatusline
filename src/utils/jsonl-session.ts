import { execFileSync } from 'child_process';
import * as fs from 'fs';
import os from 'os';
import path from 'path';

import {
    iterateJsonlLinesReverseSync,
    parseJsonlLine
} from './jsonl-lines';

const antigravitySessionNameCache = new Map<string, { title: string | null; timestamp: number }>();
const CACHE_TTL_MS = 2000;

export function clearAntigravitySessionNameCacheForTesting(): void {
    antigravitySessionNameCache.clear();
}

export function getAntigravitySessionName(sessionId?: string): string | null {
    if (!sessionId || typeof sessionId !== 'string') {
        return null;
    }

    const trimmedId = sessionId.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
        return null;
    }

    const cached = antigravitySessionNameCache.get(trimmedId);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
        return cached.title;
    }

    const baseDirs: string[] = [
        ...(process.env.ANTIGRAVITY_CONFIG_DIR ? [process.env.ANTIGRAVITY_CONFIG_DIR] : []),
        ...(process.env.AIM_PROFILE_DIR ? [
            path.join(process.env.AIM_PROFILE_DIR, '.gemini', 'antigravity-cli'),
            path.join(process.env.AIM_PROFILE_DIR, '.gemini', 'antigravity')
        ] : []),
        path.join(os.homedir(), '.gemini', 'antigravity-cli'),
        path.join(os.homedir(), '.gemini', 'antigravity')
    ];

    let resolvedTitle: string | null = null;

    for (const dir of baseDirs) {
        const dbPath = path.join(dir, 'conversation_summaries.db');
        if (!fs.existsSync(dbPath)) {
            continue;
        }

        try {
            const stdout = execFileSync('sqlite3', [
                '-batch',
                '-noheader',
                dbPath,
                `SELECT title FROM conversation_summaries WHERE conversation_id = '${trimmedId}' LIMIT 1;`
            ], {
                encoding: 'utf8',
                timeout: 500,
                stdio: ['pipe', 'pipe', 'ignore']
            });

            const title = stdout.trim();
            if (title.length > 0) {
                resolvedTitle = title;
                break;
            }
        } catch {
            // ignore sqlite3 errors or missing executable
        }
    }

    antigravitySessionNameCache.set(trimmedId, { title: resolvedTitle, timestamp: now });
    return resolvedTitle;
}

export function getSessionNameFromRecord(record: unknown): string | null {
    if (typeof record !== 'object' || record === null) {
        return null;
    }

    const entry = record as {
        type?: unknown;
        customTitle?: unknown;
        conversation_title?: unknown;
        title?: unknown;
    };
    if (entry.type === 'custom-title' && typeof entry.customTitle === 'string' && entry.customTitle.length > 0) {
        return entry.customTitle;
    }
    if (typeof entry.conversation_title === 'string' && entry.conversation_title.trim().length > 0) {
        return entry.conversation_title.trim();
    }
    return null;
}

export function getTranscriptSessionName(transcriptPath: string | undefined): string | null {
    if (!transcriptPath) {
        return null;
    }

    try {
        for (const line of iterateJsonlLinesReverseSync(transcriptPath)) {
            const sessionName = getSessionNameFromRecord(parseJsonlLine(line));
            if (sessionName !== null) {
                return sessionName;
            }
        }
    } catch {
        return null;
    }

    return null;
}
