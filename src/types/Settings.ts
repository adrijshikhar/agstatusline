import { z } from 'zod';

import { ColorLevelSchema } from './ColorLevel';
import { FlexModeSchema } from './FlexMode';
import { GlobalNumberFormatSchema } from './NumberFormat';
import { PowerlineConfigSchema } from './PowerlineConfig';
import { WidgetItemSchema } from './Widget';

// Current version - bump this when making breaking changes to the schema
export const CURRENT_VERSION = 4;

// Which side(s) of a widget the default padding is applied to
export const DefaultPaddingSideSchema = z.enum(['both', 'left', 'right']);
export type DefaultPaddingSide = z.infer<typeof DefaultPaddingSideSchema>;

export const InstallationMetadataSchema = z.discriminatedUnion('method', [
    z.object({
        method: z.literal('auto-update'),
        packageManager: z.enum(['npm', 'bun'])
    }),
    z.object({
        method: z.literal('pinned'),
        installedVersion: z.string().optional()
    }),
    z.object({
        method: z.literal('self-managed'),
        packageManager: z.enum(['npm', 'bun', 'unknown']).default('unknown')
    }),
    z.object({
        method: z.literal('unknown'),
        packageManager: z.enum(['npm', 'bun', 'unknown']).default('unknown')
    })
]);

// Schema for v1 settings (before version field was added)
export const SettingsSchema_v1 = z.object({
    lines: z.array(z.array(WidgetItemSchema)).optional(),
    flexMode: FlexModeSchema.optional(),
    compactThreshold: z.number().optional(),
    colorLevel: ColorLevelSchema.optional(),
    defaultSeparator: z.string().optional(),
    defaultPadding: z.string().optional(),
    inheritSeparatorColors: z.boolean().optional(),
    overrideBackgroundColor: z.string().optional(),
    overrideForegroundColor: z.string().optional(),
    globalBold: z.boolean().optional()
});

// Main settings schema with defaults
export const SettingsSchema = z.object({
    version: z.number().default(CURRENT_VERSION),
    lines: z.array(z.array(WidgetItemSchema))
        .min(1)
        .default([
            [
                { id: 'w-model', type: 'model', color: 'hex:61AFEF' },
                { id: 'w-sep1', type: 'separator' },
                { id: 'w-thinking', type: 'thinking-effort', color: 'hex:E06C75' },
                { id: 'w-sep2', type: 'separator' },
                { id: 'w-context-bar', type: 'context-bar', color: 'hex:98C379' },
                { id: 'w-sep3b', type: 'separator' },
                {
                    id: 'w-cwd-l1',
                    type: 'current-working-dir',
                    color: 'hex:ABB2BF',
                    metadata: { fishStyle: 'true' }
                },
                { id: 'w-sep4b', type: 'separator' },
                { id: 'w-git-branch', type: 'git-branch', color: 'hex:C678DD' },
                { id: 'w-sep5', type: 'separator' },
                { id: 'w-git-changes', type: 'git-changes', color: 'hex:E5C07B' }
            ],
            [
                { id: 'w-session-cost', type: 'session-cost', color: 'hex:98C379' },
                { id: 'w-sep6', type: 'separator' },
                { id: 'w-block-timer', type: 'block-timer', color: 'hex:D19A66' },
                { id: 'w-sep7', type: 'separator' },
                { id: 'w-weekly-usage', type: 'weekly-usage', color: 'hex:61AFEF' },
                { id: 'w-sep8', type: 'separator' },
                { id: 'w-session-clock', type: 'session-clock', color: 'hex:56B6C2' },
                { id: 'w-sep9', type: 'separator' },
                { id: 'w-input-speed', type: 'input-speed', color: 'hex:56B6C2' },
                { id: 'w-sep9b', type: 'separator' },
                { id: 'w-output-speed', type: 'output-speed', color: 'hex:61AFEF' },
                { id: 'w-sep9c', type: 'separator' },
                { id: 'w-tokens-cached', type: 'tokens-cached', color: 'hex:5C6370' },
                { id: 'w-sep10', type: 'separator' },
                {
                    id: 'w-session-usage-pct',
                    type: 'session-usage',
                    color: 'hex:C678DD',
                    metadata: { display: 'progress' }
                }
            ],
            [
                {
                    id: 'w-memory',
                    type: 'free-memory',
                    color: 'hex:E06C75',
                    rawValue: false
                },
                { id: 'w-sep-memory', type: 'separator' },
                {
                    id: 'w-skills',
                    type: 'skills',
                    color: 'hex:E879F9',
                    rawValue: false,
                    metadata: { mode: 'current' }
                },
                { id: 'w-sep-session-name', type: 'separator' },
                { id: 'w-session-name', type: 'session-name' },
                { id: 'w-sep-session-id', type: 'separator' },
                { id: 'w-session-id', type: 'claude-session-id' }
            ]
        ]),
    flexMode: FlexModeSchema.default('full-minus-40'),
    compactThreshold: z.number().min(1).max(99).default(60),
    colorLevel: ColorLevelSchema.default(2),
    defaultSeparator: z.string().optional(),
    defaultPadding: z.string().optional(),
    defaultPaddingSide: DefaultPaddingSideSchema.default('both'),
    inheritSeparatorColors: z.boolean().default(false),
    overrideBackgroundColor: z.string().optional(),
    overrideForegroundColor: z.string().optional(),
    globalBold: z.boolean().default(false),
    numberFormat: GlobalNumberFormatSchema.optional(),
    gitCacheTtlSeconds: z.number().min(0).max(60).default(5),
    // How long a "no TTY" result is reused for the same session, in seconds.
    // Detected widths are re-probed each render so terminal resizes take effect.
    // NOTE: 0 disables the cache (always probe). This deliberately differs from
    // gitCacheTtlSeconds above, where 0 means "never expire".
    terminalWidthCacheTtlSeconds: z.number().min(0).max(300).default(5),
    customCommandCacheTtlSeconds: z.number().min(0).max(60).default(0),
    minimalistMode: z.boolean().default(false),
    powerline: PowerlineConfigSchema.default({
        enabled: false,
        separators: ['|'],
        separatorInvertBackground: [false],
        startCaps: [],
        endCaps: [],
        theme: undefined,
        autoAlign: true,
        continueThemeAcrossLines: false
    }),
    updatemessage: z.object({
        message: z.string().nullable().optional(),
        remaining: z.number().nullable().optional()
    }).optional(),
    installation: InstallationMetadataSchema.optional()
});

// Inferred type from schema
export type Settings = z.infer<typeof SettingsSchema>;
export type InstallationMetadata = z.infer<typeof InstallationMetadataSchema>;
export type ResolvedInstallationMetadata
    = | Exclude<InstallationMetadata, { method: 'pinned' }>
        | (Extract<InstallationMetadata, { method: 'pinned' }> & { packageManager: 'npm' | 'bun' | 'unknown' });

// Export a default settings constant for reference
export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});
