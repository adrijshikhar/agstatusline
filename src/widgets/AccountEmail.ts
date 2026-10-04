import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getAntigravityUser } from '../utils/antigravity-auth';

export class AccountEmailWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Displays the email of the currently logged-in Antigravity account'; }
    getDisplayName(): string { return 'Account Email'; }
    getCategory(): string { return 'Session'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'you@example.com' : 'Account: you@example.com';
        }

        // 1. Direct telemetry payload email
        if (typeof context.data?.email === 'string' && context.data.email.trim().length > 0) {
            const email = context.data.email.trim();
            return item.rawValue ? email : `Account: ${email}`;
        }

        // 2. Native Antigravity Google OAuth token
        const agUser = getAntigravityUser();
        if (agUser?.email && agUser.email.trim().length > 0) {
            const email = agUser.email.trim();
            return item.rawValue ? email : `Account: ${email}`;
        }

        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
