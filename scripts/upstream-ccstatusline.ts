/**
 * Automated Upstream Watcher for ccstatusline (Claude Code statusline).
 *
 * Checks for new releases and commits from sirmalloc/ccstatusline since the last
 * recorded base commit, formats changelog and commit summaries, and opens an issue
 * with the `upstream-parity` label to guide maintainers on feature/bugfix parity.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface UpstreamConfig {
    readonly repo: string;
    readonly baseCommit: string;
}

export interface CcRelease {
    readonly tag_name: string;
    readonly name?: string;
    readonly body?: string;
    readonly html_url: string;
    readonly published_at: string;
}

export interface CcCommit {
    readonly sha: string;
    readonly commit: {
        readonly message: string;
        readonly author?: { readonly name: string; readonly date: string };
        readonly committer?: { readonly name: string; readonly date: string };
    };
    readonly html_url: string;
}

export interface CcCompare {
    readonly total_commits: number;
    readonly commits: readonly CcCommit[];
    readonly html_url: string;
}

export interface WatchResult {
    readonly action: 'up_to_date' | 'dry_run' | 'issue_exists' | 'issue_created';
    readonly releaseTag: string;
    readonly newCommitsCount: number;
    readonly detail?: string;
}

export interface GhResult {
    readonly status: number;
    readonly stdout: string;
    readonly stderr: string;
}

export type GhRunner = (args: readonly string[]) => GhResult;

const CLASSIC_TOKEN = /\bgh[porsu]_[A-Za-z0-9]{16,}/g;
const FINE_GRAINED_TOKEN = /\bgithub_pat_[A-Za-z0-9_]{20,}/g;
const AUTH_HEADER = /^.*\bauthorization\s*:.*$/gim;
const QUERY_URL = /\bhttps?:\/\/[^\s"'<>]+\?[^\s"'<>]*/g;
const TOKEN_PLACEHOLDER = '[redacted-token]';

/** Strip credentials from `text`. Never throws; a redacted string is always safe to publish. */
export function redact(text: string): string {
    return text
        .replace(FINE_GRAINED_TOKEN, TOKEN_PLACEHOLDER)
        .replace(CLASSIC_TOKEN, TOKEN_PLACEHOLDER)
        .replace(QUERY_URL, url => `${url.slice(0, url.indexOf('?'))}?[redacted-query]`)
        .replace(AUTH_HEADER, '[redacted-authorization-header]');
}

/** A `gh` invocation that failed. Its message is already redacted. */
export class GhError extends Error {
    override readonly name = 'GhError';
    constructor(
        readonly args: readonly string[],
        readonly result: GhResult
    ) {
        super(`gh ${args.slice(0, 3).join(' ')} failed (exit ${result.status}): ${redact(result.stderr.trim())}`);
    }
}

const TIMEOUT_MS = 900_000;
const MAX_BUFFER = 64 * 1024 * 1024;

/** The real runner using GitHub CLI (`gh`). Authenticates via `GH_TOKEN`/`GITHUB_TOKEN`. */
export const execGh: GhRunner = (args) => {
    const r = spawnSync('gh', [...args], {
        encoding: 'utf8',
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER
    });
    if (r.error) {
        throw new Error(`gh could not be started: ${redact(r.error.message)}`);
    }
    return {
        status: r.status ?? 1,
        stdout: r.stdout,
        stderr: r.stderr
    };
};

/** Run `gh` and return stdout, or throw `GhError`. */
export function ghText(run: GhRunner, args: readonly string[]): string {
    const result = run(args);
    if (result.status !== 0) {
        throw new GhError(args, result);
    }
    return result.stdout;
}

/** Run `gh` and parse its JSON stdout. */
export function ghJson(run: GhRunner, args: readonly string[]): unknown {
    const stdout = ghText(run, args);
    try {
        return JSON.parse(stdout);
    } catch (e) {
        throw new Error(`gh ${args.slice(0, 3).join(' ')} did not return JSON: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
    }
}

export function loadUpstreamConfig(configPath?: string): UpstreamConfig {
    const path = configPath ?? join(import.meta.dirname, 'upstream-ccstatusline.json');
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw) as UpstreamConfig;
}

export function fetchLatestRelease(gh: GhRunner, upstreamRepo: string): CcRelease {
    return ghJson(gh, ['api', `repos/${upstreamRepo}/releases/latest`]) as CcRelease;
}

export function fetchCompare(gh: GhRunner, upstreamRepo: string, baseCommit: string, head = 'HEAD'): CcCompare {
    return ghJson(gh, ['api', `repos/${upstreamRepo}/compare/${baseCommit}...${head}`]) as CcCompare;
}

export function checkExistingParityIssue(gh: GhRunner, releaseTag: string): { exists: boolean; url?: string } {
    const res = gh(['issue', 'list', '--label', 'upstream-parity', '--state', 'open', '--json', 'number,url,title']);
    if (res.status !== 0 || !res.stdout.trim() || res.stdout.trim() === '[]') {
        return { exists: false };
    }
    try {
        const list = JSON.parse(res.stdout) as { number: number; url: string; title: string }[];
        const match = list.find(i => i.title.includes(releaseTag));
        if (match) {
            return { exists: true, url: match.url };
        }
        return { exists: false };
    } catch {
        return { exists: false };
    }
}

export function formatParityIssueBody(config: UpstreamConfig, release: CcRelease, compare: CcCompare): string {
    const firstLines = compare.commits.map((c) => {
        const header = c.commit.message.split('\n')[0] ?? 'update';
        const shortSha = c.sha.slice(0, 7);
        return `- [\`${shortSha}\`](${c.html_url}) ${header}`;
    });

    const commitList = firstLines.length > 0 ? firstLines.join('\n') : '_No additional commits._';
    const releaseNotes = release.body && release.body.trim().length > 0
        ? redact(release.body.trim())
        : '_No release notes provided in upstream release._';

    return [
        `## 🔔 Upstream Parity Alert: \`ccstatusline\` ${release.tag_name}`,
        '',
        `A new release or update has been detected in [${config.repo}](https://github.com/${config.repo})!`,
        '',
        '| Detail | Value |',
        '| :--- | :--- |',
        `| **Latest Upstream Release** | [${release.tag_name}](${release.html_url}) |`,
        `| **Published Date** | ${release.published_at} |`,
        `| **Baseline Commit** | [\`${config.baseCommit.slice(0, 7)}\`](https://github.com/${config.repo}/commit/${config.baseCommit}) |`,
        `| **Commits Ahead** | ${compare.total_commits} new commit(s) ([view diff](${compare.html_url})) |`,
        '',
        '### 📦 Upstream Release Notes',
        '',
        '<details>',
        '<summary>Click to expand upstream release notes</summary>',
        '',
        releaseNotes,
        '',
        '</details>',
        '',
        '### 🔍 Commits to Evaluate for Parity',
        '',
        commitList,
        '',
        '### 🛠️ Suggested Steps for Porting',
        '1. **Review upstream changes**: Check if any new widgets, themes, renderer optimizations, or bug fixes apply to Antigravity.',
        '2. **Implement in agstatusline**: Adapt widgets for Antigravity session telemetry, state, and types.',
        '3. **Update Baseline**: Update `scripts/upstream-ccstatusline.json` and `NOTICE` with the new upstream commit hash once ported.'
    ].join('\n');
}

export async function runCcstatuslineWatch(options: {
    readonly configPath?: string;
    readonly dryRun?: boolean;
    readonly ghRunner?: GhRunner;
} = {}): Promise<WatchResult> {
    await Promise.resolve();
    const gh = options.ghRunner ?? execGh;
    const config = loadUpstreamConfig(options.configPath);

    const release = fetchLatestRelease(gh, config.repo);
    const compare = fetchCompare(gh, config.repo, config.baseCommit, release.tag_name);

    if (compare.total_commits === 0) {
        return {
            action: 'up_to_date',
            releaseTag: release.tag_name,
            newCommitsCount: 0,
            detail: `Already up to date with ${config.repo}@${release.tag_name}`
        };
    }

    if (options.dryRun) {
        return {
            action: 'dry_run',
            releaseTag: release.tag_name,
            newCommitsCount: compare.total_commits,
            detail: `Dry run complete. ${compare.total_commits} commits found up to ${release.tag_name}.`
        };
    }

    const existing = checkExistingParityIssue(gh, release.tag_name);
    if (existing.exists) {
        return {
            action: 'issue_exists',
            releaseTag: release.tag_name,
            newCommitsCount: compare.total_commits,
            detail: `Issue already open: ${existing.url ?? ''}`
        };
    }

    const title = `Upstream Parity: ccstatusline ${release.tag_name} released (${compare.total_commits} commits ahead)`;
    const body = formatParityIssueBody(config, release, compare);

    const createRes = gh([
        'issue',
        'create',
        '--title',
        title,
        '--body',
        body,
        '--label',
        'upstream-parity,enhancement'
    ]);

    return {
        action: 'issue_created',
        releaseTag: release.tag_name,
        newCommitsCount: compare.total_commits,
        detail: createRes.stdout.trim()
    };
}

if (import.meta.main) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    void runCcstatuslineWatch({ dryRun })
        .then((result) => {
            console.log(`ccstatusline Upstream Watch result: ${result.action} (${result.releaseTag}, ${result.newCommitsCount} commits)`);
            if (result.detail) {
                console.log(result.detail);
            }
        })
        .catch((err: unknown) => {
            console.error('ccstatusline Upstream Watch failed:', err);
            process.exit(1);
        });
}
