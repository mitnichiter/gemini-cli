import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { StatsDisplay } from './StatsDisplay.js';
describe('<StatsDisplay />', () => {
    const mockStats = {
        turnCount: 10,
        promptTokenCount: 1000,
        candidatesTokenCount: 2000,
        totalTokenCount: 3500,
        cachedContentTokenCount: 500,
        toolUsePromptTokenCount: 200,
        thoughtsTokenCount: 300,
        apiTimeMs: 50234,
    };
    const mockLastTurnStats = {
        turnCount: 1,
        promptTokenCount: 100,
        candidatesTokenCount: 200,
        totalTokenCount: 350,
        cachedContentTokenCount: 50,
        toolUsePromptTokenCount: 20,
        thoughtsTokenCount: 30,
        apiTimeMs: 1234,
    };
    const mockDuration = '1h 23m 45s';
    it('renders correctly with given stats and duration', () => {
        const { lastFrame } = render(_jsx(StatsDisplay, { stats: mockStats, lastTurnStats: mockLastTurnStats, duration: mockDuration }));
        expect(lastFrame()).toMatchSnapshot();
    });
    it('renders zero state correctly', () => {
        const zeroStats = {
            turnCount: 0,
            promptTokenCount: 0,
            candidatesTokenCount: 0,
            totalTokenCount: 0,
            cachedContentTokenCount: 0,
            toolUsePromptTokenCount: 0,
            thoughtsTokenCount: 0,
            apiTimeMs: 0,
        };
        const { lastFrame } = render(_jsx(StatsDisplay, { stats: zeroStats, lastTurnStats: zeroStats, duration: "0s" }));
        expect(lastFrame()).toMatchSnapshot();
    });
});
//# sourceMappingURL=StatsDisplay.test.js.map