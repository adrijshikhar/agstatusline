import { spawnSync } from 'node:child_process';

import type { WidgetItem } from '../../types/Widget.ts';

export const DEFAULT_TIMEOUT_MS = 300;
export const MIN_TIMEOUT_MS = 50;
export const MAX_TIMEOUT_MS = 600;
export const MAX_OUTPUT_BYTES = 64 * 1024;

export interface CommandRequest {
    readonly command: string;
    readonly input: string;
    readonly timeoutMs: number;
    readonly cwd?: string | undefined;
}

export interface CommandResult {
    readonly status: number | null;
    readonly signal: NodeJS.Signals | null;
    readonly stdout: string;
    readonly errorCode?: string | undefined;
}

export type CommandRunner = (request: CommandRequest) => CommandResult;

export const spawnCommand: CommandRunner = ({ command, input, timeoutMs, cwd }) => {
    const result = spawnSync(command, {
        shell: true,
        input,
        cwd,
        env: process.env,
        timeout: timeoutMs,
        killSignal: 'SIGKILL',
        maxBuffer: MAX_OUTPUT_BYTES,
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true,
        encoding: 'utf8'
    });
    const err = result.error;
    const errorCode = err && 'code' in err && typeof err.code === 'string' ? err.code : undefined;
    return {
        status: result.status,
        signal: result.signal,
        stdout: typeof result.stdout === 'string' ? result.stdout : '',
        errorCode
    };
};

export function resolveTimeout(item: WidgetItem | { timeout?: number | undefined }): number {
    const requested = item.timeout ?? DEFAULT_TIMEOUT_MS;
    return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, requested));
}

export function wasTimeout(result: CommandResult, elapsedMs: number, timeoutMs: number): boolean {
    return result.errorCode === 'ETIMEDOUT' || elapsedMs >= timeoutMs;
}

export function describeFailure(result: CommandResult, timedOut = false): string | null {
    if (result.errorCode === 'ETIMEDOUT')
        return '[Timeout]';
    if (result.errorCode === 'ENOBUFS')
        return '[Error]';
    if (result.errorCode === 'ENOENT' || result.status === 127)
        return '[Cmd not found]';
    if (result.errorCode === 'EACCES')
        return '[Permission denied]';
    if (result.signal === 'SIGKILL' && timedOut)
        return '[Timeout]';
    if (result.signal)
        return `[Signal: ${result.signal}]`;
    if (result.status === null)
        return '[Error]';
    if (result.status !== 0)
        return `[Exit: ${result.status}]`;
    return null;
}
