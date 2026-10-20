import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { formatPercent } from '../utils/number-format';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = 'Quota: ';

export class QuotaUsageWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return 'Displays Antigravity API quota usage or remaining percentage'; }
    getDisplayName(): string { return 'Quota Usage'; }
    getCategory(): string { return 'Quota'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), '82%');
        }

        const quotaMap = context.data?.quota;
        if (!quotaMap || typeof quotaMap !== 'object') {
            return null;
        }

        const bucketNames = Object.keys(quotaMap);
        if (bucketNames.length === 0) {
            return null;
        }

        // Pick requested bucket or first available non-disabled bucket
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

        let fraction = bucket.remaining_fraction;
        if (fraction === undefined && typeof bucket.remaining_amount === 'number') {
            fraction = bucket.remaining_amount <= 1 ? bucket.remaining_amount : bucket.remaining_amount / 100;
        }

        if (fraction === undefined) {
            return null;
        }

        const percent = fraction * 100;
        const formatted = formatPercent(percent, item.numberFormat);
        return formatRawOrLabeledValue(item, this.getLabelPrefix(), formatted);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
