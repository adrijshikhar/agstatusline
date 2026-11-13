import {
    mkdtempSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    classifyCommit,
    formatCheckSummary,
    formatTriageTable,
    parseCompareResult,
    runApplyBaseline,
    runCheck,
    runDiff,
    saveUpstreamConfig,
    type CommitEntry,
    type RawCompareResult
} from '../scripts/port-upstream';
import type {
    GhRunner,
    UpstreamConfig
} from '../scripts/upstream-ccstatusline';

describe('port-upstream', () => {
    let tempDir: string;
    let tempConfigFile: string;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'port-upstream-test-'));
        tempConfigFile = join(tempDir, 'upstream-ccstatusline.json');
        const initialConfig: UpstreamConfig = {
            repo: 'sirmalloc/ccstatusline',
            baseCommit: '19c6665ecf14309a5ffcfcda5e31972833dd821a'
        };
        writeFileSync(tempConfigFile, JSON.stringify(initialConfig, null, 4), 'utf8');
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    describe('classifyCommit', () => {
        it('classifies Claude auth/keychain as Category C (Skip)', () => {
            expect(classifyCommit('feat(auth): read claude token from macos keychain')).toBe('C (Skip)');
            expect(classifyCommit('fix(oauth): refresh token handling for anthropic api')).toBe('C (Skip)');
            expect(classifyCommit('feat: add link to claudenews')).toBe('C (Skip)');
        });

        it('classifies build/deps/ci chores as Category D (Tooling)', () => {
            expect(classifyCommit('chore(deps): bump typescript from 5.4 to 5.5')).toBe('D (Tooling)');
            expect(classifyCommit('chore(ci): update release action')).toBe('D (Tooling)');
            expect(classifyCommit('bump biome to 1.8.0')).toBe('D (Tooling)');
        });

        it('classifies usage, rate limit, quota as Category B (Adapt)', () => {
            expect(classifyCommit('feat(usage): add Weekly Limit Timer widget')).toBe('B (Adapt)');
            expect(classifyCommit('fix(rate-limit): handle 5-hour window rollover')).toBe('B (Adapt)');
            expect(classifyCommit('feat: quota usage no-data placeholder')).toBe('B (Adapt)');
        });

        it('classifies generic widgets, git, terminal, powerline as Category A (Direct)', () => {
            expect(classifyCommit('fix(renderer): keep separators placed next to each other')).toBe('A (Direct)');
            expect(classifyCommit('feat(git): add ahead behind counter')).toBe('A (Direct)');
            expect(classifyCommit('fix(powerline): keep custom theme on re-enable')).toBe('A (Direct)');
            expect(classifyCommit('feat(terminal): detect width from COLUMNS')).toBe('A (Direct)');
        });

        it('defaults unknown commits to Category A (Direct) for review', () => {
            expect(classifyCommit('random refactor in core loop')).toBe('A (Direct)');
        });
    });

    describe('parseCompareResult', () => {
        it('returns empty array when raw input has no commits', () => {
            expect(parseCompareResult({ total_commits: 0, commits: [] })).toEqual([]);
        });

        it('maps compare commits to CommitEntry array', () => {
            const raw: RawCompareResult = {
                total_commits: 1,
                commits: [
                    {
                        sha: '0c94df755665ed7794f082863821fd5f428cdf60',
                        commit: { message: 'docs: prepare 2.2.34 release\n\nFull release notes' },
                        html_url: 'https://github.com/sirmalloc/ccstatusline/commit/0c94df7'
                    }
                ]
            };
            const result = parseCompareResult(raw);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                sha: '0c94df755665ed7794f082863821fd5f428cdf60',
                shortSha: '0c94df7',
                title: 'docs: prepare 2.2.34 release',
                category: 'D (Tooling)',
                url: 'https://github.com/sirmalloc/ccstatusline/commit/0c94df7'
            });
        });
    });

    describe('formatTriageTable', () => {
        it('formats markdown table and escapes pipes', () => {
            const entries: CommitEntry[] = [
                {
                    sha: '1234567890',
                    shortSha: '1234567',
                    title: 'feat: add a | b format',
                    category: 'A (Direct)'
                }
            ];
            const table = formatTriageTable(entries);
            expect(table).toContain('| `1234567` | `feat: add a \\| b format` | A (Direct) | TBD | |');
        });
    });

    describe('formatCheckSummary', () => {
        it('reports up to date when commit list is empty', () => {
            const summary = formatCheckSummary('sirmalloc/ccstatusline', '19c6665', 'HEAD', []);
            expect(summary).toContain('✅ Up to date with upstream baseline.');
        });

        it('shows category breakdown and table when commits exist', () => {
            const entries: CommitEntry[] = [
                {
                    sha: '1234567890',
                    shortSha: '1234567',
                    title: 'feat(git): add status indicator',
                    category: 'A (Direct)'
                },
                {
                    sha: '2345678901',
                    shortSha: '2345678',
                    title: 'feat(usage): weekly timer',
                    category: 'B (Adapt)'
                }
            ];
            const summary = formatCheckSummary('sirmalloc/ccstatusline', '19c6665', 'v2.2.34', entries, 'https://compare');
            expect(summary).toContain('2 new commit(s)');
            expect(summary).toContain('- A (Direct): 1');
            expect(summary).toContain('- B (Adapt): 1');
            expect(summary).toContain('`1234567`');
            expect(summary).toContain('`2345678`');
        });
    });

    describe('saveUpstreamConfig and runApplyBaseline', () => {
        it('updates baseline commit in config file', () => {
            const newSha = '0c94df755665ed7794f082863821fd5f428cdf60';
            runApplyBaseline(newSha, tempConfigFile);

            const updated: UpstreamConfig = {
                repo: 'sirmalloc/ccstatusline',
                baseCommit: newSha
            };
            saveUpstreamConfig(updated, tempConfigFile);
        });

        it('throws on invalid short commit SHA', () => {
            expect(() => {
                runApplyBaseline('abc', tempConfigFile);
            }).toThrow('Invalid commit SHA');
        });
    });

    describe('runCheck', () => {
        it('fetches compare result from ghRunner and returns commits', () => {
            const runner: GhRunner = (args) => {
                expect(args[0]).toBe('api');
                return {
                    status: 0,
                    stdout: JSON.stringify({
                        total_commits: 1,
                        commits: [
                            {
                                sha: 'abcdef1234567',
                                commit: { message: 'feat(git): improve branch detection' },
                                html_url: 'https://example.com'
                            }
                        ]
                    }),
                    stderr: ''
                };
            };

            const commits = runCheck({
                configPath: tempConfigFile,
                ghRunner: runner
            });

            expect(commits).toHaveLength(1);
            expect(commits[0]?.shortSha).toBe('abcdef1');
            expect(commits[0]?.category).toBe('A (Direct)');
        });
    });

    describe('runDiff', () => {
        it('fetches diff text via gh api', () => {
            const runner: GhRunner = (args) => {
                expect(args).toContain('Accept: application/vnd.github.v3.diff');
                return {
                    status: 0,
                    stdout: 'diff --git a/file b/file\n+line',
                    stderr: ''
                };
            };

            const diff = runDiff('abcdef1', {
                configPath: tempConfigFile,
                ghRunner: runner
            });

            expect(diff).toBe('diff --git a/file b/file\n+line');
        });

        it('fetches diff stat via gh api', () => {
            const runner: GhRunner = () => ({
                status: 0,
                stdout: JSON.stringify({
                    stats: { total: 5, additions: 4, deletions: 1 },
                    files: [{ filename: 'src/widget.ts', additions: 4, deletions: 1, status: 'modified' }]
                }),
                stderr: ''
            });

            const stat = runDiff('abcdef1', {
                configPath: tempConfigFile,
                stat: true,
                ghRunner: runner
            });

            expect(stat).toContain('Total changes: +4 -1 (total 5)');
            expect(stat).toContain('src/widget.ts');
        });
    });
});
