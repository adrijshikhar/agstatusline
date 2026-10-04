import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

const HIDEABLE_STATES: HideableState[] = [
    { key: 'zero', label: 'Hide when 0 subagents', defaultEnabled: false }
];

export class SubagentsWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows the number of active background subagents running in Antigravity'; }
    getDisplayName(): string { return 'Subagents'; }
    getCategory(): string { return 'Status'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '2' : '2 subagents';
        }

        const subagents = context.data?.subagents;
        const count = Array.isArray(subagents) ? subagents.length : 0;

        if (count === 0 && item.metadata?.hide?.includes('zero')) {
            return null;
        }

        const label = count === 1 ? '1 subagent' : `${count} subagents`;
        return item.rawValue ? `${count}` : label;
    }

    getHideableStates(): HideableState[] {
        return HIDEABLE_STATES;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
