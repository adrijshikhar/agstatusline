import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

const HIDEABLE_STATES: HideableState[] = [
    { key: 'zero', label: 'Hide when 0 tasks', defaultEnabled: false }
];

export class TasksWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows the number of active background tasks in Antigravity'; }
    getDisplayName(): string { return 'Tasks'; }
    getCategory(): string { return 'Status'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '3' : '3 tasks';
        }

        let count = 0;
        if (typeof context.data?.task_count === 'number') {
            count = context.data.task_count;
        } else if (Array.isArray(context.data?.tasks)) {
            count = context.data.tasks.length;
        } else if (typeof context.data?.tasks === 'number') {
            count = context.data.tasks;
        }

        if (count === 0 && item.metadata?.hide?.includes('zero')) {
            return null;
        }

        const label = count === 1 ? '1 task' : `${count} tasks`;
        return item.rawValue ? `${count}` : label;
    }

    getHideableStates(): HideableState[] {
        return HIDEABLE_STATES;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
