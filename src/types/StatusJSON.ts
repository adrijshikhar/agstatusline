import { z } from 'zod';

const CoercedNumberSchema = z.preprocess((value) => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return value;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : value;
}, z.number());

const RateLimitPeriodSchema = z.object({
    used_percentage: CoercedNumberSchema.nullable().optional(),
    resets_at: CoercedNumberSchema.nullable().optional() // Unix epoch seconds
});

export type RateLimitPeriod = z.infer<typeof RateLimitPeriodSchema>;

export const QuotaBucketSchema = z.object({
    remaining_fraction: CoercedNumberSchema.optional(),
    remaining_amount: CoercedNumberSchema.optional(),
    reset_time: z.string().optional(),
    reset_in_seconds: CoercedNumberSchema.optional(),
    disabled: z.boolean().optional()
});

export type QuotaBucket = z.infer<typeof QuotaBucketSchema>;

export const SubagentItemSchema = z.object({
    name: z.string(),
    role: z.string().optional(),
    status: z.string().optional()
});

export type SubagentItem = z.infer<typeof SubagentItemSchema>;

export const StatusJSONSchema = z.looseObject({
    hook_event_name: z.string().optional(),
    session_id: z.string().optional(),
    conversation_id: z.string().optional(),
    conversation_title: z.string().optional(),
    session_name: z.string().optional(),
    conversation_name: z.string().optional(),
    transcript_path: z.string().optional(),
    cwd: z.string().optional(),
    terminal_width: CoercedNumberSchema.optional(),
    email: z.string().optional(),
    agent_state: z.string().optional(),
    plan_tier: z.string().optional(),
    artifact_count: CoercedNumberSchema.optional(),
    pending_input_count: CoercedNumberSchema.optional(),
    tool_confirmation_pending: z.boolean().optional(),
    task_count: CoercedNumberSchema.optional(),
    tasks: z.union([CoercedNumberSchema, z.array(z.unknown())]).optional(),
    subagents: z.array(SubagentItemSchema).optional(),
    model: z.union([
        z.string(),
        z.object({
            id: z.string().optional(),
            display_name: z.string().optional(),
            effort: z.string().optional()
        })
    ]).optional(),
    workspace: z.object({
        current_dir: z.string().optional(),
        project_dir: z.string().optional()
    }).optional(),
    version: z.string().optional(),
    output_style: z.object({ name: z.string().optional() }).optional(),
    effort: z.object({ level: z.string().nullable().optional() }).nullable().optional(),
    cost: z.object({
        total_cost_usd: CoercedNumberSchema.optional(),
        total_usd: CoercedNumberSchema.optional(),
        subagent_usd: CoercedNumberSchema.optional(),
        total_duration_ms: CoercedNumberSchema.optional(),
        total_api_duration_ms: CoercedNumberSchema.optional(),
        total_lines_added: CoercedNumberSchema.optional(),
        total_lines_removed: CoercedNumberSchema.optional()
    }).optional(),
    context_window: z.object({
        context_window_size: CoercedNumberSchema.nullable().optional(),
        total_input_tokens: CoercedNumberSchema.nullable().optional(),
        total_output_tokens: CoercedNumberSchema.nullable().optional(),
        current_usage: z.union([
            CoercedNumberSchema,
            z.object({
                input_tokens: CoercedNumberSchema.optional(),
                output_tokens: CoercedNumberSchema.optional(),
                cache_creation_input_tokens: CoercedNumberSchema.optional(),
                cache_read_input_tokens: CoercedNumberSchema.optional()
            })
        ]).nullable().optional(),
        used_percentage: CoercedNumberSchema.nullable().optional(),
        remaining_percentage: CoercedNumberSchema.nullable().optional()
    }).nullable().optional(),
    sandbox: z.object({
        enabled: z.boolean().optional(),
        allow_network: z.boolean().optional()
    }).nullable().optional(),
    vim: z.object({ mode: z.string().optional() }).nullable().optional(),
    vcs: z.object({
        branch: z.string().optional(),
        dirty: z.boolean().optional(),
        client: z.string().optional(),
        type: z.string().optional()
    }).nullable().optional(),
    worktree: z.object({
        name: z.string().optional(),
        path: z.string().optional(),
        branch: z.string().optional(),
        original_cwd: z.string().optional(),
        original_branch: z.string().optional()
    }).nullable().optional(),
    rate_limits: z.object({
        five_hour: RateLimitPeriodSchema.optional(),
        seven_day: RateLimitPeriodSchema.optional(),
        seven_day_sonnet: RateLimitPeriodSchema.nullable().optional(),
        seven_day_opus: RateLimitPeriodSchema.nullable().optional()
    }).nullable().optional(),
    quota: z.record(z.string(), QuotaBucketSchema).optional()
});

export type StatusJSON = z.infer<typeof StatusJSONSchema>;
