import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = 'Reset: ';

function formatDuration(totalSeconds: number): string {
    if (totalSeconds <= 0) {
        return '0m';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export class QuotaResetWidget implements Widget {
    getDefaultColor(): string { return 'brightBlack'; }
    getDescription(): string { return 'Displays the countdown timer until Antigravity API quota resets'; }
    getDisplayName(): string { return 'Quota Reset'; }
    getCategory(): string { return 'Quota'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), '4h 12m');
        }

        const quotaMap = context.data?.quota;
        if (!quotaMap || typeof quotaMap !== 'object') {
            return null;
        }

        const requestedBucket = item.metadata?.bucket;
        const bucket = (requestedBucket && quotaMap[requestedBucket])
            ?? quotaMap.pro
            ?? quotaMap.gemini_pro
            ?? quotaMap.flash
            ?? Object.values(quotaMap).find(b => !b.disabled)
            ?? Object.values(quotaMap)[0];

        if (!bucket || bucket.disabled) {
            return null;
        }

        let secondsRemaining: number | null = null;
        if (typeof bucket.reset_in_seconds === 'number') {
            secondsRemaining = bucket.reset_in_seconds;
        } else if (bucket.reset_time && typeof bucket.reset_time === 'string') {
            const targetMs = Date.parse(bucket.reset_time);
            if (!Number.isNaN(targetMs)) {
                secondsRemaining = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
            }
        }

        if (secondsRemaining === null) {
            return null;
        }

        const formatted = formatDuration(secondsRemaining);
        return formatRawOrLabeledValue(item, this.getLabelPrefix(), formatted);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
