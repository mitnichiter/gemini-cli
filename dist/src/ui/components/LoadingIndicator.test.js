import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { LoadingIndicator } from './LoadingIndicator.js';
import { StreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';
import { vi } from 'vitest';
// Mock GeminiRespondingSpinner
vi.mock('./GeminiRespondingSpinner.js', () => ({
    GeminiRespondingSpinner: ({ nonRespondingDisplay, }) => {
        const streamingState = React.useContext(StreamingContext);
        if (streamingState === StreamingState.Responding) {
            return _jsx(Text, { children: "MockRespondingSpinner" });
        }
        else if (nonRespondingDisplay) {
            return _jsx(Text, { children: nonRespondingDisplay });
        }
        return null;
    },
}));
const renderWithContext = (ui, streamingStateValue) => {
    const contextValue = streamingStateValue;
    return render(_jsx(StreamingContext.Provider, { value: contextValue, children: ui }));
};
describe('<LoadingIndicator />', () => {
    const defaultProps = {
        currentLoadingPhrase: 'Loading...',
        elapsedTime: 5,
    };
    it('should not render when streamingState is Idle', () => {
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...defaultProps }), StreamingState.Idle);
        expect(lastFrame()).toBe('');
    });
    it('should render spinner, phrase, and time when streamingState is Responding', () => {
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...defaultProps }), StreamingState.Responding);
        const output = lastFrame();
        expect(output).toContain('MockRespondingSpinner');
        expect(output).toContain('Loading...');
        expect(output).toContain('(esc to cancel, 5s)');
    });
    it('should render spinner (static), phrase but no time/cancel when streamingState is WaitingForConfirmation', () => {
        const props = {
            currentLoadingPhrase: 'Confirm action',
            elapsedTime: 10,
        };
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...props }), StreamingState.WaitingForConfirmation);
        const output = lastFrame();
        expect(output).toContain('⠏'); // Static char for WaitingForConfirmation
        expect(output).toContain('Confirm action');
        expect(output).not.toContain('(esc to cancel)');
        expect(output).not.toContain(', 10s');
    });
    it('should display the currentLoadingPhrase correctly', () => {
        const props = {
            currentLoadingPhrase: 'Processing data...',
            elapsedTime: 3,
        };
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...props }), StreamingState.Responding);
        expect(lastFrame()).toContain('Processing data...');
    });
    it('should display the elapsedTime correctly when Responding', () => {
        const props = {
            currentLoadingPhrase: 'Working...',
            elapsedTime: 8,
        };
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...props }), StreamingState.Responding);
        expect(lastFrame()).toContain('(esc to cancel, 8s)');
    });
    it('should render rightContent when provided', () => {
        const rightContent = _jsx(Text, { children: "Extra Info" });
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...defaultProps, rightContent: rightContent }), StreamingState.Responding);
        expect(lastFrame()).toContain('Extra Info');
    });
    it('should transition correctly between states using rerender', () => {
        const { lastFrame, rerender } = renderWithContext(_jsx(LoadingIndicator, { ...defaultProps }), StreamingState.Idle);
        expect(lastFrame()).toBe(''); // Initial: Idle
        // Transition to Responding
        rerender(_jsx(StreamingContext.Provider, { value: StreamingState.Responding, children: _jsx(LoadingIndicator, { currentLoadingPhrase: "Now Responding", elapsedTime: 2 }) }));
        let output = lastFrame();
        expect(output).toContain('MockRespondingSpinner');
        expect(output).toContain('Now Responding');
        expect(output).toContain('(esc to cancel, 2s)');
        // Transition to WaitingForConfirmation
        rerender(_jsx(StreamingContext.Provider, { value: StreamingState.WaitingForConfirmation, children: _jsx(LoadingIndicator, { currentLoadingPhrase: "Please Confirm", elapsedTime: 15 }) }));
        output = lastFrame();
        expect(output).toContain('⠏');
        expect(output).toContain('Please Confirm');
        expect(output).not.toContain('(esc to cancel)');
        expect(output).not.toContain(', 15s');
        // Transition back to Idle
        rerender(_jsx(StreamingContext.Provider, { value: StreamingState.Idle, children: _jsx(LoadingIndicator, { ...defaultProps }) }));
        expect(lastFrame()).toBe('');
    });
    it('should display fallback phrase if thought is empty', () => {
        const props = {
            thought: null,
            currentLoadingPhrase: 'Loading...',
            elapsedTime: 5,
        };
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...props }), StreamingState.Responding);
        const output = lastFrame();
        expect(output).toContain('Loading...');
    });
    it('should display the subject of a thought', () => {
        const props = {
            thought: {
                subject: 'Thinking about something...',
                description: 'and other stuff.',
            },
            elapsedTime: 5,
        };
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...props }), StreamingState.Responding);
        const output = lastFrame();
        expect(output).toBeDefined();
        if (output) {
            expect(output).toContain('Thinking about something...');
            expect(output).not.toContain('and other stuff.');
        }
    });
    it('should prioritize thought.subject over currentLoadingPhrase', () => {
        const props = {
            thought: {
                subject: 'This should be displayed',
                description: 'A description',
            },
            currentLoadingPhrase: 'This should not be displayed',
            elapsedTime: 5,
        };
        const { lastFrame } = renderWithContext(_jsx(LoadingIndicator, { ...props }), StreamingState.Responding);
        const output = lastFrame();
        expect(output).toContain('This should be displayed');
        expect(output).not.toContain('This should not be displayed');
    });
});
//# sourceMappingURL=LoadingIndicator.test.js.map