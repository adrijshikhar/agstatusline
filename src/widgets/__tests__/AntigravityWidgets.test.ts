import {
    describe,
    expect,
    it
} from 'vitest';

import type {
    RenderContext,
    WidgetItem
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import { AccountEmailWidget } from '../AccountEmail';
import { AgentStateWidget } from '../AgentState';
import { QuotaResetWidget } from '../QuotaReset';
import { QuotaUsageWidget } from '../QuotaUsage';
import { SessionIdWidget } from '../SessionId';
import { SubagentsWidget } from '../Subagents';
import { TasksWidget } from '../Tasks';

describe('Native Antigravity Widgets', () => {
    describe('AccountEmailWidget', () => {
        const widget = new AccountEmailWidget();

        it('has correct metadata', () => {
            expect(widget.getDisplayName()).toBe('Account Email');
            expect(widget.getDefaultColor()).toBe('blue');
            expect(widget.supportsRawValue()).toBe(true);
        });

        it('renders preview mode', () => {
            const item: WidgetItem = { id: 'email', type: 'account-email' };
            const context: RenderContext = { isPreview: true };
            expect(widget.render(item, context, DEFAULT_SETTINGS)).toBe('Account: you@example.com');
            expect(widget.render({ ...item, rawValue: true }, context, DEFAULT_SETTINGS)).toBe('you@example.com');
        });

        it('renders email from telemetry data', () => {
            const item: WidgetItem = { id: 'email', type: 'account-email' };
            const context: RenderContext = { data: { email: 'developer@example.com' } };
            expect(widget.render(item, context, DEFAULT_SETTINGS)).toBe('Account: developer@example.com');
            expect(widget.render({ ...item, rawValue: true }, context, DEFAULT_SETTINGS)).toBe('developer@example.com');
        });
    });

    describe('SessionIdWidget', () => {
        const widget = new SessionIdWidget();

        it('has correct metadata', () => {
            expect(widget.getDisplayName()).toBe('Session ID');
            expect(widget.getDefaultColor()).toBe('cyan');
        });

        it('renders preview mode', () => {
            const item: WidgetItem = { id: 's', type: 'session-id' };
            expect(widget.render(item, { isPreview: true }, DEFAULT_SETTINGS)).toBe('Session ID: preview-session-id');
            expect(widget.render({ ...item, rawValue: true }, { isPreview: true }, DEFAULT_SETTINGS)).toBe('preview-session-id');
        });

        it('renders session_id and conversation_id', () => {
            const item: WidgetItem = { id: 's', type: 'session-id' };
            expect(widget.render(item, { data: { session_id: 'sess-123' } }, DEFAULT_SETTINGS)).toBe('Session ID: sess-123');
            expect(widget.render(item, { data: { conversation_id: 'conv-456' } }, DEFAULT_SETTINGS)).toBe('Session ID: conv-456');
        });
    });

    describe('AgentStateWidget', () => {
        const widget = new AgentStateWidget();

        it('has correct metadata', () => {
            expect(widget.getDisplayName()).toBe('Agent State');
            expect(widget.getDefaultColor()).toBe('green');
        });

        it('renders preview mode', () => {
            const item: WidgetItem = { id: 'state', type: 'agent-state' };
            expect(widget.render(item, { isPreview: true }, DEFAULT_SETTINGS)).toBe('State: READY');
        });

        it('renders agent state normalized', () => {
            const item: WidgetItem = { id: 'state', type: 'agent-state' };
            expect(widget.render(item, { data: { agent_state: 'executing' } }, DEFAULT_SETTINGS)).toBe('State: EXECUTING');
            expect(widget.render({ ...item, rawValue: true }, { data: { agent_state: 'thinking' } }, DEFAULT_SETTINGS)).toBe('THINKING');
        });
    });

    describe('SubagentsWidget', () => {
        const widget = new SubagentsWidget();

        it('has correct metadata', () => {
            expect(widget.getDisplayName()).toBe('Subagents');
            expect(widget.getDefaultColor()).toBe('blue');
        });

        it('renders preview mode', () => {
            const item: WidgetItem = { id: 'sub', type: 'subagents' };
            expect(widget.render(item, { isPreview: true }, DEFAULT_SETTINGS)).toBe('2 subagents');
        });

        it('renders subagent counts', () => {
            const item: WidgetItem = { id: 'sub', type: 'subagents' };
            expect(widget.render(item, { data: { subagents: [{ name: 'researcher', status: 'RUNNING' }] } }, DEFAULT_SETTINGS)).toBe('1 subagent');
            expect(widget.render(item, { data: { subagents: [{ name: 'a', status: 'RUNNING' }, { name: 'b', status: 'RUNNING' }] } }, DEFAULT_SETTINGS)).toBe('2 subagents');
        });
    });

    describe('TasksWidget', () => {
        const widget = new TasksWidget();

        it('has correct metadata', () => {
            expect(widget.getDisplayName()).toBe('Tasks');
            expect(widget.getDefaultColor()).toBe('cyan');
        });

        it('renders preview mode', () => {
            const item: WidgetItem = { id: 'tasks', type: 'tasks' };
            expect(widget.render(item, { isPreview: true }, DEFAULT_SETTINGS)).toBe('3 tasks');
        });

        it('renders task count from task_count or array', () => {
            const item: WidgetItem = { id: 'tasks', type: 'tasks' };
            expect(widget.render(item, { data: { task_count: 5 } }, DEFAULT_SETTINGS)).toBe('5 tasks');
            expect(widget.render(item, { data: { tasks: ['t1'] } }, DEFAULT_SETTINGS)).toBe('1 task');
        });
    });

    describe('QuotaUsageWidget', () => {
        const widget = new QuotaUsageWidget();

        it('has correct metadata', () => {
            expect(widget.getDisplayName()).toBe('Quota Usage');
            expect(widget.getDefaultColor()).toBe('yellow');
        });

        it('renders preview mode', () => {
            const item: WidgetItem = { id: 'quota', type: 'quota-usage' };
            expect(widget.render(item, { isPreview: true }, DEFAULT_SETTINGS)).toBe('Quota: 82%');
        });

        it('renders quota percentage from bucket fraction', () => {
            const item: WidgetItem = { id: 'quota', type: 'quota-usage' };
            const context: RenderContext = { data: { quota: { pro: { remaining_fraction: 0.75 } } } };
            expect(widget.render(item, context, DEFAULT_SETTINGS)).toBe('Quota: 75.0%');
            expect(widget.render({ ...item, rawValue: true }, context, DEFAULT_SETTINGS)).toBe('75.0%');
        });
    });

    describe('QuotaResetWidget', () => {
        const widget = new QuotaResetWidget();

        it('has correct metadata', () => {
            expect(widget.getDisplayName()).toBe('Quota Reset');
            expect(widget.getDefaultColor()).toBe('brightBlack');
        });

        it('renders preview mode', () => {
            const item: WidgetItem = { id: 'reset', type: 'quota-reset' };
            expect(widget.render(item, { isPreview: true }, DEFAULT_SETTINGS)).toBe('Reset: 4h 12m');
        });

        it('renders countdown from reset_in_seconds', () => {
            const item: WidgetItem = { id: 'reset', type: 'quota-reset' };
            const context: RenderContext = { data: { quota: { pro: { reset_in_seconds: 3720 } } } };
            expect(widget.render(item, context, DEFAULT_SETTINGS)).toBe('Reset: 1h 2m');
            expect(widget.render({ ...item, rawValue: true }, context, DEFAULT_SETTINGS)).toBe('1h 2m');
        });
    });
});
