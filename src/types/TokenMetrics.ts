export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}

export interface TranscriptLine {
    message?: { usage?: TokenUsage; stop_reason?: string | null };
    isSidechain?: boolean;
    timestamp?: string;
    created_at?: string;
    source?: string;
    input_tokens?: number;
    output_tokens?: number;
    cache_read_tokens?: number;
    cache_creation_tokens?: number;
    isApiErrorMessage?: boolean;
    type?: string;
}

export interface TokenMetrics {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    // Hot (cache read) and cold (cache creation) split of cachedTokens.
    // Optional so existing TokenMetrics literals stay valid; getTokenMetrics always sets them.
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
    totalTokens: number;
    contextLength: number;
}
