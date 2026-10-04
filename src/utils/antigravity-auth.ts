import * as fs from 'fs';
import * as path from 'path';

import { getAntigravityConfigDir } from './antigravity-settings';

export interface AntigravityUser {
    readonly email?: string;
    readonly emailVerified?: boolean;
    readonly sub?: string;
    readonly name?: string;
}

interface OAuthFileContent {
    id_token?: string;
    token?: {
        access_token?: string;
        expiry?: string;
    };
    auth_method?: string;
}

let cachedUser: AntigravityUser | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds in-memory cache

export function clearAntigravityUserCacheForTesting(): void {
    cachedUser = null;
    lastCacheTime = 0;
}

/**
 * Decodes the JWT payload without verifying signature (safe for local credential inspection).
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
    try {
        const parts = jwt.split('.');
        if (parts.length < 2 || !parts[1]) {
            return null;
        }

        // Handle URL-safe base64
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }

        const json = Buffer.from(base64, 'base64').toString('utf8');
        const parsed = JSON.parse(json) as unknown;
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Retrieves the currently authenticated Antigravity Google user from
 * ~/.gemini/antigravity-cli/antigravity-oauth-token.
 */
export function getAntigravityUser(): AntigravityUser | null {
    const now = Date.now();
    if (cachedUser !== null && (now - lastCacheTime) < CACHE_TTL_MS) {
        return cachedUser;
    }

    const configDir = getAntigravityConfigDir();
    const tokenFile = path.join(configDir, 'antigravity-oauth-token');

    if (!fs.existsSync(tokenFile)) {
        cachedUser = null;
        lastCacheTime = now;
        return null;
    }

    try {
        const raw = fs.readFileSync(tokenFile, 'utf8');
        const data = JSON.parse(raw) as OAuthFileContent;

        if (data.id_token && typeof data.id_token === 'string') {
            const payload = decodeJwtPayload(data.id_token);
            if (payload) {
                cachedUser = {
                    email: typeof payload.email === 'string' ? payload.email : undefined,
                    emailVerified: typeof payload.email_verified === 'boolean' ? payload.email_verified : undefined,
                    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
                    name: typeof payload.name === 'string' ? payload.name : undefined
                };
                lastCacheTime = now;
                return cachedUser;
            }
        }

        cachedUser = null;
        lastCacheTime = now;
        return null;
    } catch {
        cachedUser = null;
        lastCacheTime = now;
        return null;
    }
}
