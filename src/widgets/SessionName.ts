import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getAntigravitySessionName,
    getTranscriptSessionName
} from '../utils/jsonl-session';

export class SessionNameWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return 'Shows the session name set via /rename command in Antigravity or Claude Code'; }
    getDisplayName(): string { return 'Session Name'; }
    getCategory(): string { return 'Session'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'my-session' : 'Session: my-session';
        }

        const payloadTitle = context.data?.conversation_title
            ?? context.data?.session_name
            ?? context.data?.conversation_name;
        if (typeof payloadTitle === 'string' && payloadTitle.trim().length > 0) {
            const trimmed = payloadTitle.trim();
            return item.rawValue ? trimmed : `Session: ${trimmed}`;
        }

        let sessionName = context.transcriptSessionName;
        if (sessionName === undefined || sessionName === null) {
            const sessionId = context.data?.session_id ?? context.data?.conversation_id;
            sessionName = (sessionId ? getAntigravitySessionName(sessionId) : null)
                ?? getTranscriptSessionName(context.data?.transcript_path);
        }

        if (sessionName === null || sessionName.trim().length === 0) {
            return null;
        }

        const trimmed = sessionName.trim();
        return item.rawValue ? trimmed : `Session: ${trimmed}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
