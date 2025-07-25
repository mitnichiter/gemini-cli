import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { MessageType } from '../types.js';
// Mock child components
vi.mock('./messages/ToolGroupMessage.js', () => ({
    ToolGroupMessage: () => _jsx("div", {}),
}));
describe('<HistoryItemDisplay />', () => {
    const baseItem = {
        id: 1,
        timestamp: 12345,
        isPending: false,
        terminalWidth: 80,
    };
    it('renders UserMessage for "user" type', () => {
        const item = {
            ...baseItem,
            type: MessageType.USER,
            text: 'Hello',
        };
        const { lastFrame } = render(_jsx(HistoryItemDisplay, { ...baseItem, item: item }));
        expect(lastFrame()).toContain('Hello');
    });
    it('renders StatsDisplay for "stats" type', () => {
        const stats = {
            turnCount: 1,
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30,
            cachedContentTokenCount: 5,
            toolUsePromptTokenCount: 2,
            thoughtsTokenCount: 3,
            apiTimeMs: 123,
        };
        const item = {
            ...baseItem,
            type: MessageType.STATS,
            stats,
            lastTurnStats: stats,
            duration: '1s',
        };
        const { lastFrame } = render(_jsx(HistoryItemDisplay, { ...baseItem, item: item }));
        expect(lastFrame()).toContain('Stats');
    });
    it('renders AboutBox for "about" type', () => {
        const item = {
            ...baseItem,
            type: MessageType.ABOUT,
            cliVersion: '1.0.0',
            osVersion: 'test-os',
            sandboxEnv: 'test-env',
            modelVersion: 'test-model',
            selectedAuthType: 'test-auth',
            gcpProject: 'test-project',
        };
        const { lastFrame } = render(_jsx(HistoryItemDisplay, { ...baseItem, item: item }));
        expect(lastFrame()).toContain('About Gemini CLI');
    });
    it('renders SessionSummaryDisplay for "quit" type', () => {
        const stats = {
            turnCount: 1,
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30,
            cachedContentTokenCount: 5,
            toolUsePromptTokenCount: 2,
            thoughtsTokenCount: 3,
            apiTimeMs: 123,
        };
        const item = {
            ...baseItem,
            type: 'quit',
            stats,
            duration: '1s',
        };
        const { lastFrame } = render(_jsx(HistoryItemDisplay, { ...baseItem, item: item }));
        expect(lastFrame()).toContain('Agent powering down. Goodbye!');
    });
});
//# sourceMappingURL=HistoryItemDisplay.test.js.map