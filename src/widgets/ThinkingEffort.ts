import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { loadAntigravitySettingsSync } from '../utils/antigravity-settings';
import { loadClaudeSettingsSync } from '../utils/claude-settings';
import {
    getTranscriptThinkingEffort,
    normalizeThinkingEffort,
    type ResolvedThinkingEffort,
    type TranscriptThinkingEffort
} from '../utils/jsonl';

export type ThinkingEffortLevel = TranscriptThinkingEffort;

const EFFORT_PARENTHESES_REGEX = /\((low|medium|high|xhigh|max)\)/i;

function extractEffortFromModelString(modelName?: string): ResolvedThinkingEffort | undefined {
    if (!modelName) {
        return undefined;
    }
    const match = EFFORT_PARENTHESES_REGEX.exec(modelName);
    if (match?.[1]) {
        return normalizeThinkingEffort(match[1]);
    }
    return undefined;
}

function resolveThinkingEffortFromStatusJson(context: RenderContext): ResolvedThinkingEffort | null | undefined {
    const effort = context.data?.effort;
    if (effort && 'level' in effort) {
        return typeof effort.level === 'string' ? normalizeThinkingEffort(effort.level) : null;
    }

    const model = context.data?.model;
    if (typeof model === 'string') {
        const fromName = extractEffortFromModelString(model);
        if (fromName) {
            return fromName;
        }
    } else if (typeof model === 'object') {
        const effortProp = (model as { effort?: unknown }).effort;
        if (typeof effortProp === 'string') {
            return normalizeThinkingEffort(effortProp);
        }
        const fromName = extractEffortFromModelString(model.display_name ?? model.id);
        if (fromName) {
            return fromName;
        }
    }

    return undefined;
}

function resolveThinkingEffortFromSettings(_context: RenderContext): ResolvedThinkingEffort | undefined {
    try {
        const agSettings = loadAntigravitySettingsSync();
        const modelStr = typeof agSettings.model === 'string' ? agSettings.model : undefined;
        const fromModel = extractEffortFromModelString(modelStr);
        if (fromModel) {
            return fromModel;
        }
        if (typeof agSettings.effortLevel === 'string') {
            return normalizeThinkingEffort(agSettings.effortLevel);
        }
    } catch {
        // Antigravity settings unavailable
    }

    try {
        const settings = loadClaudeSettingsSync({ logErrors: false });
        return normalizeThinkingEffort(settings.effortLevel);
    } catch {
        // Settings unavailable, return undefined
    }

    return undefined;
}

function resolveThinkingEffort(context: RenderContext): ResolvedThinkingEffort | null {
    const statusEffort = resolveThinkingEffortFromStatusJson(context);
    if (statusEffort !== undefined) {
        return statusEffort;
    }

    const transcriptEffort = context.transcriptThinkingEffort === undefined
        ? getTranscriptThinkingEffort(context.data?.transcript_path)
        : context.transcriptThinkingEffort ?? undefined;

    return transcriptEffort
        ?? resolveThinkingEffortFromSettings(context)
        ?? null;
}

function formatEffort(resolved: ResolvedThinkingEffort | null): string {
    if (!resolved) {
        return 'default';
    }
    return resolved.known ? resolved.value : `${resolved.value}?`;
}

export class ThinkingEffortWidget implements Widget {
    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return 'Displays the current thinking effort level (low, medium, high, xhigh, max).\nUnknown levels are shown with a trailing "?" (e.g. "super-max?").'; }
    getDisplayName(): string { return 'Thinking Effort'; }
    getCategory(): string { return 'Core'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'high' : 'Thinking: high';
        }

        const effort = formatEffort(resolveThinkingEffort(context));
        return item.rawValue ? effort : `Thinking: ${effort}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
