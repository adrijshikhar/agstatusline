import React from 'react';

import { getColorLevelString } from '../types/ColorLevel';
import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetEditorProps,
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

import { makeModifierText } from './shared/editor-display';
import {
    EDIT_LEVEL_COLORS_ACTION,
    EffortColorsEditor
} from './shared/effort-colors-editor';
import {
    THINKING_EFFORT_DEFAULT_COLOR,
    THINKING_EFFORT_LABEL,
    cycleBracketStyle,
    formatThinkingEffort,
    getBracketStyle,
    isLevelColorsEnabled,
    type EffortDisplay
} from './shared/effort-style';

const CYCLE_BRACKETS_ACTION = 'cycle-brackets';

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
    } else if (model && typeof model === 'object') {
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

function toEffortDisplay(resolved: ResolvedThinkingEffort | null): EffortDisplay {
    if (!resolved) {
        return { text: 'default', level: null };
    }
    return resolved.known
        ? { text: resolved.value, level: resolved.value as TranscriptThinkingEffort }
        : { text: `${resolved.value}?`, level: null };
}

export class ThinkingEffortWidget implements Widget {
    getDefaultColor(): string { return THINKING_EFFORT_DEFAULT_COLOR; }
    getDescription(): string { return 'Displays the current thinking effort level (low, medium, high, xhigh, max).\nUnknown levels are shown with a trailing "?" (e.g. "super-max?").\nMay be incorrect when multiple CLI sessions are running due to CLI limitations.'; }
    getDisplayName(): string { return 'Thinking Effort'; }
    getCategory(): string { return 'Core'; }
    getLabelPrefix(): string { return THINKING_EFFORT_LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const modifiers: string[] = [];
        const brackets = getBracketStyle(item);
        if (brackets) {
            modifiers.push(`brackets ${brackets}`);
        }
        if (isLevelColorsEnabled(item)) {
            modifiers.push('level colors');
        }

        return { displayText: this.getDisplayName(), modifierText: makeModifierText(modifiers) };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const effort: EffortDisplay = context.isPreview
            ? { text: 'high', level: 'high' }
            : toEffortDisplay(resolveThinkingEffort(context));

        return formatThinkingEffort(item, effort, {
            colorLevel: getColorLevelString(settings.colorLevel),
            colorsDisabled: settings.colorLevel === 0
        });
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'b', label: '(b)rackets', action: CYCLE_BRACKETS_ACTION },
            { key: 'l', label: '(l)evel colors', action: EDIT_LEVEL_COLORS_ACTION }
        ];
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return action === CYCLE_BRACKETS_ACTION ? cycleBracketStyle(item) : null;
    }

    renderEditor(props: WidgetEditorProps): React.ReactElement {
        return React.createElement(EffortColorsEditor, props);
    }

    // Level colors paint only the level, so the renderer colors the label and
    // the rest around it with the theme or widget color
    colorsOnlyItsRuns(item: WidgetItem): boolean {
        return isLevelColorsEnabled(item);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}
