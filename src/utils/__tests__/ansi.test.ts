import {
    describe,
    expect,
    it
} from 'vitest';

import {
    restoreBackgroundAfterResets,
    truncateStyledText
} from '../ansi';

describe('truncateStyledText', () => {
    it('returns empty string when maxWidth is 0 or negative', () => {
        expect(truncateStyledText('hello world', 0)).toBe('');
        expect(truncateStyledText('hello world', -5)).toBe('');
        expect(truncateStyledText('\x1b[31mhello\x1b[0m', 0)).toBe('');
    });

    it('returns original string when width is within maxWidth', () => {
        expect(truncateStyledText('hello', 10)).toBe('hello');
        expect(truncateStyledText('\x1b[31mhello\x1b[0m', 10)).toBe('\x1b[31mhello\x1b[0m');
    });

    it('truncates text with ellipsis by default', () => {
        expect(truncateStyledText('hello world', 8)).toBe('hello...');
    });

    it('truncates text without ellipsis when requested', () => {
        expect(truncateStyledText('hello world', 5, { ellipsis: false })).toBe('hello');
    });

    it('handles maxWidth smaller than ellipsis width', () => {
        expect(truncateStyledText('hello world', 2)).toBe('..');
        expect(truncateStyledText('hello world', 1)).toBe('.');
    });

    it('preserves OSC codes through truncation and closes open links', () => {
        expect(truncateStyledText('\x1b]0;title\x07abcdefgh', 5)).toBe('\x1b]0;title\x07ab...');
    });
});

describe('restoreBackgroundAfterResets', () => {
    const BG = '\x1b[44m';

    it('re-applies the background after every sequence that clears it', () => {
        expect(restoreBackgroundAfterResets('\x1b[31ma\x1b[0mb\x1b[mc\x1b[00md\x1b[;1me\x1b[39;49mf', BG))
            .toBe(`\x1b[31ma\x1b[0m${BG}b\x1b[m${BG}c\x1b[00m${BG}d\x1b[;1m${BG}e\x1b[39;49m${BG}f`);
    });

    it('leaves other styling, and the arguments of extended colors, alone', () => {
        const text = '\x1b[1;31ma\x1b[38;5;0mb\x1b[48;2;0;49;0mc\x1b[58;5;49md\x1b[39me';

        expect(restoreBackgroundAfterResets(text, BG)).toBe(text);
    });

    it.each([
        '0;40', '0;41', '0;47', '0;100', '0;107',
        '49;41', ';41', '0;48;5;49', '0;48;2;0;49;0',
        '41;0;42', '0;41;38;5;0', '0;41;58;5;49'
    ])('keeps the explicit background after a reset in SGR %s', (params) => {
        const text = `\x1b[${params}mtext`;

        expect(restoreBackgroundAfterResets(text, BG)).toBe(text);
    });

    it.each([
        '41;0', '107;49', '48;5;49;0', '48;2;0;49;0;49',
        '0;41;49', '0;41;', '0;38;5;0', '49;58;2;0;49;0'
    ])('restores the background when the final background operation clears it in SGR %s', (params) => {
        expect(restoreBackgroundAfterResets(`\x1b[${params}mtext`, BG))
            .toBe(`\x1b[${params}m${BG}text`);
    });
});
