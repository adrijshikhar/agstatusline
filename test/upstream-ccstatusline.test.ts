import {
    describe,
    expect,
    it
} from 'vitest';

import {
    GhError,
    checkExistingParityIssue,
    ensureLabel,
    formatParityIssueBody,
    ghText,
    redact,
    runCcstatuslineWatch,
    type GhRunner,
    type UpstreamConfig
} from '../scripts/upstream-ccstatusline';

describe('upstream-ccstatusline', () => {
    describe('redact', () => {
        it('redacts tokens and auth headers', () => {
            const raw = 'Authorization: Bearer ghp_123456789012345678\nhttps://api.github.com/test?token=secret';
            const redacted = redact(raw);
            expect(redacted).not.toContain('ghp_123456789012345678');
            expect(redacted).not.toContain('token=secret');
        });
    });

    describe('ghText and error handling', () => {
        it('returns stdout when status is 0', () => {
            const runner: GhRunner = () => ({ status: 0, stdout: 'ok', stderr: '' });
            expect(ghText(runner, ['status'])).toBe('ok');
        });

        it('throws GhError when status is non-zero', () => {
            const runner: GhRunner = () => ({ status: 1, stdout: '', stderr: 'command failed' });
            expect(() => ghText(runner, ['fail'])).toThrow(GhError);
        });
    });

    describe('ensureLabel', () => {
        it('skips creation if label is already present', () => {
            const calls: string[][] = [];
            const runner: GhRunner = (args) => {
                calls.push([...args]);
                return {
                    status: 0,
                    stdout: JSON.stringify([{ name: 'upstream-parity' }]),
                    stderr: ''
                };
            };

            ensureLabel(runner, 'upstream-parity', '0e8a16', 'Parity tracking');
            expect(calls).toHaveLength(1);
            expect(calls[0]).toEqual(['label', 'list', '--json', 'name']);
        });

        it('creates label if absent from label list', () => {
            const calls: string[][] = [];
            const runner: GhRunner = (args) => {
                calls.push([...args]);
                if (args[0] === 'label' && args[1] === 'list') {
                    return {
                        status: 0,
                        stdout: JSON.stringify([{ name: 'bug' }]),
                        stderr: ''
                    };
                }
                return { status: 0, stdout: '', stderr: '' };
            };

            ensureLabel(runner, 'upstream-parity', '0e8a16', 'Parity tracking');
            expect(calls).toHaveLength(2);
            expect(calls[1]).toEqual([
                'label',
                'create',
                'upstream-parity',
                '--color',
                '0e8a16',
                '--description',
                'Parity tracking',
                '--force'
            ]);
        });
    });

    describe('checkExistingParityIssue', () => {
        it('returns exists true when issue with release tag exists', () => {
            const runner: GhRunner = () => ({
                status: 0,
                stdout: JSON.stringify([
                    { number: 12, url: 'https://github.com/foo/bar/issues/12', title: 'Upstream Parity: ccstatusline v2.2.32 released' }
                ]),
                stderr: ''
            });

            const res = checkExistingParityIssue(runner, 'v2.2.32');
            expect(res.exists).toBe(true);
            expect(res.url).toBe('https://github.com/foo/bar/issues/12');
        });

        it('returns exists false when no issue matches', () => {
            const runner: GhRunner = () => ({
                status: 0,
                stdout: JSON.stringify([]),
                stderr: ''
            });

            const res = checkExistingParityIssue(runner, 'v2.2.32');
            expect(res.exists).toBe(false);
        });
    });

    describe('formatParityIssueBody', () => {
        it('formats markdown table and commits', () => {
            const config: UpstreamConfig = { repo: 'sirmalloc/ccstatusline', baseCommit: 'abc123456789' };
            const body = formatParityIssueBody(
                config,
                {
                    tag_name: 'v2.2.32',
                    html_url: 'https://github.com/sirmalloc/ccstatusline/releases/tag/v2.2.32',
                    published_at: '2026-10-09T18:51:51Z',
                    body: 'Release notes here'
                },
                {
                    total_commits: 1,
                    html_url: 'https://github.com/sirmalloc/ccstatusline/compare/abc...v2.2.32',
                    commits: [
                        {
                            sha: 'def5678901234',
                            html_url: 'https://github.com/sirmalloc/ccstatusline/commit/def5678',
                            commit: { message: 'fix: something' }
                        }
                    ]
                }
            );

            expect(body).toContain('Upstream Parity Alert');
            expect(body).toContain('v2.2.32');
            expect(body).toContain('fix: something');
        });
    });

    describe('runCcstatuslineWatch', () => {
        it('throws GhError when gh issue create fails', async () => {
            const mockRunner: GhRunner = (args) => {
                if (args[1]?.endsWith('/releases/latest')) {
                    return {
                        status: 0,
                        stdout: JSON.stringify({
                            tag_name: 'v2.2.32',
                            html_url: 'https://github.com/sirmalloc/ccstatusline/releases/tag/v2.2.32',
                            published_at: '2026-10-09T18:51:51Z'
                        }),
                        stderr: ''
                    };
                }
                if (args[1]?.startsWith('repos/') && args[1].includes('/compare/')) {
                    return {
                        status: 0,
                        stdout: JSON.stringify({
                            total_commits: 5,
                            html_url: 'https://github.com/sirmalloc/ccstatusline/compare/test',
                            commits: []
                        }),
                        stderr: ''
                    };
                }
                if (args[0] === 'issue' && args[1] === 'list') {
                    return { status: 0, stdout: '[]', stderr: '' };
                }
                if (args[0] === 'label') {
                    return { status: 0, stdout: '[]', stderr: '' };
                }
                if (args[0] === 'issue' && args[1] === 'create') {
                    return {
                        status: 1,
                        stdout: '',
                        stderr: 'could not add label: \'upstream-parity\' not found'
                    };
                }
                return { status: 0, stdout: '', stderr: '' };
            };

            await expect(runCcstatuslineWatch({ ghRunner: mockRunner })).rejects.toThrow(GhError);
        });

        it('creates issue and returns issue_created on success', async () => {
            const mockRunner: GhRunner = (args) => {
                if (args[1]?.endsWith('/releases/latest')) {
                    return {
                        status: 0,
                        stdout: JSON.stringify({
                            tag_name: 'v2.2.32',
                            html_url: 'https://github.com/sirmalloc/ccstatusline/releases/tag/v2.2.32',
                            published_at: '2026-10-09T18:51:51Z'
                        }),
                        stderr: ''
                    };
                }
                if (args[1]?.startsWith('repos/') && args[1].includes('/compare/')) {
                    return {
                        status: 0,
                        stdout: JSON.stringify({
                            total_commits: 5,
                            html_url: 'https://github.com/sirmalloc/ccstatusline/compare/test',
                            commits: []
                        }),
                        stderr: ''
                    };
                }
                if (args[0] === 'issue' && args[1] === 'list') {
                    return { status: 0, stdout: '[]', stderr: '' };
                }
                if (args[0] === 'label') {
                    return { status: 0, stdout: JSON.stringify([{ name: 'upstream-parity' }, { name: 'enhancement' }]), stderr: '' };
                }
                if (args[0] === 'issue' && args[1] === 'create') {
                    return {
                        status: 0,
                        stdout: 'https://github.com/adrijshikhar/agstatusline/issues/1\n',
                        stderr: ''
                    };
                }
                return { status: 0, stdout: '', stderr: '' };
            };

            const result = await runCcstatuslineWatch({ ghRunner: mockRunner });
            expect(result.action).toBe('issue_created');
            expect(result.detail).toBe('https://github.com/adrijshikhar/agstatusline/issues/1');
        });
    });
});
