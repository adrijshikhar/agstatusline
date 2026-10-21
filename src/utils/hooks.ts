import * as fs from 'fs';
import { readFile } from 'fs/promises';

import type { Settings } from '../types/Settings';
import type { Widget } from '../types/Widget';

import {
    getAntigravityHooksPath,
    getExistingStatusLine as getAgExistingStatusLine,
    writeJsonAtomic
} from './antigravity-settings';
import {
    getExistingStatusLine as getClaudeExistingStatusLine,
    loadClaudeSettings,
    saveClaudeSettings
} from './claude-settings';
import { getWidget } from './widgets';

export interface WidgetHookDef {
    event: string;
    matcher?: string;
}

const HOOK_TAG = 'agstatusline-managed';

// Matches agstatusline (and legacy ccstatusline) hook commands written by any install method
// (global binary, `bunx agstatusline@latest --hook`, `npx agstatusline --hook`, …).
// Used to heal legacy/untagged hooks that predate HOOK_TAG so they do not
// accumulate alongside the managed set on every sync. The space before `--hook`
// and trailing boundary avoid matching unrelated `--hook*` substrings.
const AGSTATUSLINE_HOOK_PATTERN = /(?:agstatusline|ccstatusline).* --hook(?:\s|$)/;

interface HookEntry {
    _tag?: string;
    matcher?: string;
    hooks?: { type: string; command: string }[];
}

type WidgetWithHooks = Widget & { getHooks(): WidgetHookDef[] };

function hasWidgetHooks(widget: Widget | null): widget is WidgetWithHooks {
    return Boolean(widget && 'getHooks' in widget && typeof widget.getHooks === 'function');
}

function isAgstatuslineManagedEntry(entry: HookEntry): boolean {
    return entry._tag === HOOK_TAG || entry._tag === 'agstatusline-managed';
}

function isLegacyHookCommand(hook: { type: string; command: string }): boolean {
    return AGSTATUSLINE_HOOK_PATTERN.test(hook.command);
}

function stripManagedHookEntry(entry: HookEntry): HookEntry | null {
    if (isAgstatuslineManagedEntry(entry)) {
        return null;
    }

    if (!entry.hooks) {
        return entry;
    }

    const remainingHooks = entry.hooks.filter(hook => !isLegacyHookCommand(hook));
    if (remainingHooks.length === entry.hooks.length) {
        return entry;
    }

    if (remainingHooks.length === 0) {
        return null;
    }

    return {
        ...entry,
        hooks: remainingHooks
    };
}

function stripManagedHooks(hooks: Record<string, HookEntry[]>): void {
    for (const event of Object.keys(hooks)) {
        hooks[event] = (hooks[event] ?? [])
            .map(stripManagedHookEntry)
            .filter((entry): entry is HookEntry => entry !== null);
        if (hooks[event].length === 0) {
            Reflect.deleteProperty(hooks, event);
        }
    }
}

function getActiveHookDefs(settings: Settings): WidgetHookDef[] {
    const seen = new Set<string>();
    const defs: WidgetHookDef[] = [];
    for (const line of settings.lines) {
        for (const item of line) {
            const widget = getWidget(item.type);
            if (!hasWidgetHooks(widget)) {
                continue;
            }
            for (const hook of widget.getHooks()) {
                const key = `${hook.event}:${hook.matcher ?? ''}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    defs.push(hook);
                }
            }
        }
    }
    return defs;
}

async function syncClaudeHooks(needed: WidgetHookDef[]): Promise<void> {
    const claudeSettings = await loadClaudeSettings({ logErrors: false });
    const hooks = (claudeSettings.hooks ?? {}) as Record<string, HookEntry[]>;

    // Remove tagged entries and legacy untagged hook commands
    stripManagedHooks(hooks);

    const statusCommand = await getClaudeExistingStatusLine();
    if (!statusCommand) {
        claudeSettings.hooks = Object.keys(hooks).length > 0 ? hooks : undefined;
        await saveClaudeSettings(claudeSettings);
        return;
    }
    const hookCommand = `${statusCommand} --hook`;

    // Add needed hooks
    for (const def of needed) {
        const entry: HookEntry = {
            _tag: HOOK_TAG,
            hooks: [{ type: 'command', command: hookCommand }]
        };
        if (def.matcher) {
            entry.matcher = def.matcher;
        }
        const list = hooks[def.event] ??= [];
        list.push(entry);
    }

    claudeSettings.hooks = Object.keys(hooks).length > 0 ? hooks : undefined;
    await saveClaudeSettings(claudeSettings);
}

async function removeClaudeManagedHooks(): Promise<void> {
    const claudeSettings = await loadClaudeSettings({ logErrors: false });
    const hooks = (claudeSettings.hooks ?? {}) as Record<string, HookEntry[]>;

    stripManagedHooks(hooks);

    claudeSettings.hooks = Object.keys(hooks).length > 0 ? hooks : undefined;
    await saveClaudeSettings(claudeSettings);
}

async function syncAntigravityHooks(needed: WidgetHookDef[]): Promise<void> {
    const hooksPath = getAntigravityHooksPath();
    const statusCommand = await getAgExistingStatusLine();

    let hooksData: Record<string, unknown> = {};
    if (fs.existsSync(hooksPath)) {
        try {
            const raw = await readFile(hooksPath, 'utf8');
            const parsed = JSON.parse(raw) as unknown;
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                hooksData = parsed as Record<string, unknown>;
            }
        } catch {
            // Ignore parse errors on pre-existing hooks.json
        }
    }

    if (!statusCommand || needed.length === 0) {
        if ('agstatusline' in hooksData) {
            delete hooksData.agstatusline;
            await writeJsonAtomic(hooksPath, hooksData);
        }
        return;
    }

    const hookCommand = `${statusCommand} --hook`;
    const agstatuslineHook: Record<string, unknown> = {};

    for (const def of needed) {
        const handler = {
            type: 'command',
            command: hookCommand
        };

        const entry = def.matcher
            ? { matcher: def.matcher, hooks: [handler] }
            : handler;

        const eventList = (agstatuslineHook[def.event] ??= []) as unknown[];
        eventList.push(entry);
    }

    hooksData.agstatusline = agstatuslineHook;
    await writeJsonAtomic(hooksPath, hooksData);
}

export async function removeAntigravityHooks(): Promise<void> {
    const hooksPath = getAntigravityHooksPath();
    if (!fs.existsSync(hooksPath)) {
        return;
    }
    try {
        const raw = await readFile(hooksPath, 'utf8');
        const parsed = JSON.parse(raw) as unknown;
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            const hooksData = parsed as Record<string, unknown>;
            if ('agstatusline' in hooksData) {
                delete hooksData.agstatusline;
                await writeJsonAtomic(hooksPath, hooksData);
            }
        }
    } catch {
        // Ignore
    }
}

export async function syncWidgetHooks(settings: Settings): Promise<void> {
    const needed = getActiveHookDefs(settings);

    try {
        await syncAntigravityHooks(needed);
    } catch {
        // Ignore Antigravity hook sync errors
    }

    try {
        await syncClaudeHooks(needed);
    } catch {
        // Ignore Claude hook sync errors
    }
}

export async function removeManagedHooks(): Promise<void> {
    try {
        await removeAntigravityHooks();
    } catch {
        // Ignore
    }

    try {
        await removeClaudeManagedHooks();
    } catch {
        // Ignore
    }
}
