import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class AgentStateWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return 'Shows the active Antigravity execution cycle state (IDLE, THINKING, EXECUTING, WAITING)'; }
    getDisplayName(): string { return 'Agent State'; }
    getCategory(): string { return 'Status'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'READY' : 'State: READY';
        }

        const state = context.data?.agent_state;
        if (!state || typeof state !== 'string' || state.trim().length === 0) {
            return null;
        }

        const normalized = state.trim().toUpperCase();
        return item.rawValue ? normalized : `State: ${normalized}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
