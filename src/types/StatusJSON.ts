import { z } from 'zod';

function nullableToUndefined<T extends z.ZodType>(schema: T) {
    return z.preprocess(val => (val === null ? undefined : val), schema.optional());
}

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
    remaining_fraction: nullableToUndefined(CoercedNumberSchema),
    remaining_amount: nullableToUndefined(CoercedNumberSchema),
    reset_time: nullableToUndefined(z.string()),
    reset_in_seconds: nullableToUndefined(CoercedNumberSchema),
    disabled: nullableToUndefined(z.boolean())
});

export type QuotaBucket = z.infer<typeof QuotaBucketSchema>;

export const SubagentItemSchema = z.object({
    name: z.string(),
    role: nullableToUndefined(z.string()),
    status: nullableToUndefined(z.string())
});

export type SubagentItem = z.infer<typeof SubagentItemSchema>;

function tolerant<T extends z.ZodType>(schema: T) {
    return schema.nullable().optional().catch(undefined);
}

const LastMissCauseSchema = z.looseObject({
    causes: z.array(z.string()).catch([]),
    tools_added: tolerant(CoercedNumberSchema),
    tools_removed: tolerant(CoercedNumberSchema),
    system_char_delta: tolerant(CoercedNumberSchema)
});

const PromptCacheSchema = z.object({
    warm: tolerant(z.boolean()),
    caching_observed: tolerant(z.boolean()),
    ttl: tolerant(z.string()),
    expires_at: tolerant(CoercedNumberSchema),
    requests: tolerant(CoercedNumberSchema),
    misses: tolerant(CoercedNumberSchema),
    expected_rebuilds: tolerant(CoercedNumberSchema),
    hit_ratio: tolerant(CoercedNumberSchema),
    cache_write_tokens: tolerant(CoercedNumberSchema),
    miss_recache_tokens: tolerant(CoercedNumberSchema),
    last_miss_at: tolerant(CoercedNumberSchema),
    last_miss_cause: tolerant(LastMissCauseSchema),
    miss_causes: tolerant(z.record(z.string(), CoercedNumberSchema)),
    recache_tokens_if_cold: tolerant(CoercedNumberSchema)
});

export const StatusJSONSchema = z.looseObject({
    hook_event_name: nullableToUndefined(z.string()),
    session_id: nullableToUndefined(z.string()),
    conversation_id: nullableToUndefined(z.string()),
    conversation_title: nullableToUndefined(z.string()),
    session_name: nullableToUndefined(z.string()),
    conversation_name: nullableToUndefined(z.string()),
    transcript_path: nullableToUndefined(z.string()),
    cwd: nullableToUndefined(z.string()),
    terminal_width: nullableToUndefined(CoercedNumberSchema),
    email: nullableToUndefined(z.string()),
    agent_state: nullableToUndefined(z.string()),
    plan_tier: nullableToUndefined(z.string()),
    artifact_count: nullableToUndefined(CoercedNumberSchema),
    pending_input_count: nullableToUndefined(CoercedNumberSchema),
    tool_confirmation_pending: nullableToUndefined(z.boolean()),
    task_count: nullableToUndefined(CoercedNumberSchema),
    tasks: nullableToUndefined(z.union([CoercedNumberSchema, z.array(z.unknown())])),
    subagents: nullableToUndefined(z.array(SubagentItemSchema)),
    model: nullableToUndefined(z.union([
        z.string(),
        z.object({
            id: nullableToUndefined(z.string()),
            display_name: nullableToUndefined(z.string()),
            effort: nullableToUndefined(z.string())
        })
    ])),
    workspace: nullableToUndefined(z.object({
        current_dir: nullableToUndefined(z.string()),
        project_dir: nullableToUndefined(z.string())
    })),
    version: nullableToUndefined(z.string()),
    output_style: nullableToUndefined(z.object({ name: nullableToUndefined(z.string()) })),
    effort: z.object({ level: z.string().nullable().optional() }).nullable().optional(),
    cost: nullableToUndefined(z.object({
        total_cost_usd: nullableToUndefined(CoercedNumberSchema),
        total_usd: nullableToUndefined(CoercedNumberSchema),
        subagent_usd: nullableToUndefined(CoercedNumberSchema),
        total_duration_ms: nullableToUndefined(CoercedNumberSchema),
        total_api_duration_ms: nullableToUndefined(CoercedNumberSchema),
        total_lines_added: nullableToUndefined(CoercedNumberSchema),
        total_lines_removed: nullableToUndefined(CoercedNumberSchema)
    })),
    context_window: nullableToUndefined(z.object({
        context_window_size: nullableToUndefined(CoercedNumberSchema),
        total_input_tokens: nullableToUndefined(CoercedNumberSchema),
        total_output_tokens: nullableToUndefined(CoercedNumberSchema),
        current_usage: nullableToUndefined(z.union([
            CoercedNumberSchema,
            z.object({
                input_tokens: nullableToUndefined(CoercedNumberSchema),
                output_tokens: nullableToUndefined(CoercedNumberSchema),
                cache_creation_input_tokens: nullableToUndefined(CoercedNumberSchema),
                cache_read_input_tokens: nullableToUndefined(CoercedNumberSchema)
            })
        ])),
        used_percentage: nullableToUndefined(CoercedNumberSchema),
        remaining_percentage: nullableToUndefined(CoercedNumberSchema)
    })),
    sandbox: nullableToUndefined(z.object({
        enabled: nullableToUndefined(z.boolean()),
        allow_network: nullableToUndefined(z.boolean())
    })),
    vim: z.object({ mode: nullableToUndefined(z.string()) }).nullable().optional(),
    vcs: nullableToUndefined(z.object({
        branch: nullableToUndefined(z.string()),
        dirty: nullableToUndefined(z.boolean()),
        client: nullableToUndefined(z.string()),
        type: nullableToUndefined(z.string())
    })),
    worktree: nullableToUndefined(z.object({
        name: nullableToUndefined(z.string()),
        path: nullableToUndefined(z.string()),
        branch: nullableToUndefined(z.string()),
        original_cwd: nullableToUndefined(z.string()),
        original_branch: nullableToUndefined(z.string())
    })),
    prompt_cache: tolerant(PromptCacheSchema),
    rate_limits: z.object({
        five_hour: RateLimitPeriodSchema.nullable().optional(),
        seven_day: RateLimitPeriodSchema.nullable().optional(),
        seven_day_sonnet: RateLimitPeriodSchema.nullable().optional(),
        seven_day_opus: RateLimitPeriodSchema.nullable().optional()
    }).nullable().optional(),
    quota: nullableToUndefined(z.record(z.string(), QuotaBucketSchema))
});

export type StatusJSON = z.infer<typeof StatusJSONSchema>;
