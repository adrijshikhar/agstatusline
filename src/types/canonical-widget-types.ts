export const CANONICAL_WIDGET_TYPES = [
    'separator',
    'flex-separator',
    'model',
    'context-window',
    'context-bar',
    'context-percentage',
    'quota-usage',
    'quota-reset',
    'agent-state',
    'subagents',
    'tasks',
    'sandbox',
    'vim-mode',
    'session-cost',
    'git-branch',
    'git-changes',
    'current-working-dir',
    'session-clock',
    'terminal-width',
    'custom-text',
    'custom-symbol',
    'custom-command',
    'version'
] as const;

export type CanonicalWidgetType = (typeof CANONICAL_WIDGET_TYPES)[number];
