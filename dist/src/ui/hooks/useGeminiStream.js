/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useInput } from 'ink';
import { GeminiEventType as ServerGeminiEventType, getErrorMessage, isNodeError, MessageSenderType, logUserPrompt, GitService, UnauthorizedError, UserPromptEvent, } from '@google/gemini-cli-core';
import { StreamingState, MessageType, ToolCallStatus, } from '../types.js';
import { isAtCommand } from '../utils/commandUtils.js';
import { parseAndFormatApiError } from '../utils/errorParsing.js';
import { useShellCommandProcessor } from './shellCommandProcessor.js';
import { handleAtCommand } from './atCommandProcessor.js';
import { findLastSafeSplitPoint } from '../utils/markdownUtilities.js';
import { useStateAndRef } from './useStateAndRef.js';
import { useLogger } from './useLogger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { useReactToolScheduler, mapToDisplay as mapTrackedToolCallsToDisplay, } from './useReactToolScheduler.js';
import { useSessionStats } from '../contexts/SessionContext.js';
export function mergePartListUnions(list) {
    const resultParts = [];
    for (const item of list) {
        if (Array.isArray(item)) {
            resultParts.push(...item);
        }
        else {
            resultParts.push(item);
        }
    }
    return resultParts;
}
var StreamProcessingStatus;
(function (StreamProcessingStatus) {
    StreamProcessingStatus[StreamProcessingStatus["Completed"] = 0] = "Completed";
    StreamProcessingStatus[StreamProcessingStatus["UserCancelled"] = 1] = "UserCancelled";
    StreamProcessingStatus[StreamProcessingStatus["Error"] = 2] = "Error";
})(StreamProcessingStatus || (StreamProcessingStatus = {}));
/**
 * Manages the Gemini stream, including user input, command processing,
 * API interaction, and tool call lifecycle.
 */
export const useGeminiStream = (geminiClient, history, addItem, setShowHelp, config, onDebugMessage, handleSlashCommand, shellModeActive, getPreferredEditor, onAuthError, performMemoryRefresh) => {
    const [initError, setInitError] = useState(null);
    const abortControllerRef = useRef(null);
    const turnCancelledRef = useRef(false);
    const [isResponding, setIsResponding] = useState(false);
    const [thought, setThought] = useState(null);
    const [pendingHistoryItemRef, setPendingHistoryItem] = useStateAndRef(null);
    const processedMemoryToolsRef = useRef(new Set());
    const logger = useLogger();
    const { startNewTurn, addUsage } = useSessionStats();
    const gitService = useMemo(() => {
        if (!config.getProjectRoot()) {
            return;
        }
        return new GitService(config.getProjectRoot());
    }, [config]);
    const [toolCalls, scheduleToolCalls, markToolsAsSubmitted] = useReactToolScheduler((completedToolCallsFromScheduler) => {
        // This onComplete is called when ALL scheduled tools for a given batch are done.
        if (completedToolCallsFromScheduler.length > 0) {
            // Add the final state of these tools to the history for display.
            // The new useEffect will handle submitting their responses.
            addItem(mapTrackedToolCallsToDisplay(completedToolCallsFromScheduler), Date.now());
        }
    }, config, setPendingHistoryItem, getPreferredEditor);
    const pendingToolCallGroupDisplay = useMemo(() => toolCalls.length ? mapTrackedToolCallsToDisplay(toolCalls) : undefined, [toolCalls]);
    const onExec = useCallback(async (done) => {
        setIsResponding(true);
        await done;
        setIsResponding(false);
    }, []);
    const { handleShellCommand } = useShellCommandProcessor(addItem, setPendingHistoryItem, onExec, onDebugMessage, config, geminiClient);
    const streamingState = useMemo(() => {
        if (toolCalls.some((tc) => tc.status === 'awaiting_approval')) {
            return StreamingState.WaitingForConfirmation;
        }
        if (isResponding ||
            toolCalls.some((tc) => tc.status === 'executing' ||
                tc.status === 'scheduled' ||
                tc.status === 'validating' ||
                ((tc.status === 'success' ||
                    tc.status === 'error' ||
                    tc.status === 'cancelled') &&
                    !tc
                        .responseSubmittedToGemini))) {
            return StreamingState.Responding;
        }
        return StreamingState.Idle;
    }, [isResponding, toolCalls]);
    useInput((_input, key) => {
        if (streamingState === StreamingState.Responding && key.escape) {
            if (turnCancelledRef.current) {
                return;
            }
            turnCancelledRef.current = true;
            abortControllerRef.current?.abort();
            if (pendingHistoryItemRef.current) {
                addItem(pendingHistoryItemRef.current, Date.now());
            }
            addItem({
                type: MessageType.INFO,
                text: 'Request cancelled.',
            }, Date.now());
            setPendingHistoryItem(null);
            setIsResponding(false);
        }
    });
    const prepareQueryForGemini = useCallback(async (query, userMessageTimestamp, abortSignal) => {
        if (turnCancelledRef.current) {
            return { queryToSend: null, shouldProceed: false };
        }
        if (typeof query === 'string' && query.trim().length === 0) {
            return { queryToSend: null, shouldProceed: false };
        }
        let localQueryToSendToGemini = null;
        if (typeof query === 'string') {
            const trimmedQuery = query.trim();
            logUserPrompt(config, new UserPromptEvent(trimmedQuery.length, trimmedQuery));
            onDebugMessage(`User query: '${trimmedQuery}'`);
            await logger?.logMessage(MessageSenderType.USER, trimmedQuery);
            // Handle UI-only commands first
            const slashCommandResult = await handleSlashCommand(trimmedQuery);
            if (typeof slashCommandResult === 'boolean' && slashCommandResult) {
                // Command was handled, and it doesn't require a tool call from here
                return { queryToSend: null, shouldProceed: false };
            }
            else if (typeof slashCommandResult === 'object' &&
                slashCommandResult.shouldScheduleTool) {
                // Slash command wants to schedule a tool call (e.g., /memory add)
                const { toolName, toolArgs } = slashCommandResult;
                if (toolName && toolArgs) {
                    const toolCallRequest = {
                        callId: `${toolName}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        name: toolName,
                        args: toolArgs,
                        isClientInitiated: true,
                    };
                    scheduleToolCalls([toolCallRequest], abortSignal);
                }
                return { queryToSend: null, shouldProceed: false }; // Handled by scheduling the tool
            }
            if (shellModeActive && handleShellCommand(trimmedQuery, abortSignal)) {
                return { queryToSend: null, shouldProceed: false };
            }
            // Handle @-commands (which might involve tool calls)
            if (isAtCommand(trimmedQuery)) {
                const atCommandResult = await handleAtCommand({
                    query: trimmedQuery,
                    config,
                    addItem,
                    onDebugMessage,
                    messageId: userMessageTimestamp,
                    signal: abortSignal,
                });
                if (!atCommandResult.shouldProceed) {
                    return { queryToSend: null, shouldProceed: false };
                }
                localQueryToSendToGemini = atCommandResult.processedQuery;
            }
            else {
                // Normal query for Gemini
                addItem({ type: MessageType.USER, text: trimmedQuery }, userMessageTimestamp);
                localQueryToSendToGemini = trimmedQuery;
            }
        }
        else {
            // It's a function response (PartListUnion that isn't a string)
            localQueryToSendToGemini = query;
        }
        if (localQueryToSendToGemini === null) {
            onDebugMessage('Query processing resulted in null, not sending to Gemini.');
            return { queryToSend: null, shouldProceed: false };
        }
        return { queryToSend: localQueryToSendToGemini, shouldProceed: true };
    }, [
        config,
        addItem,
        onDebugMessage,
        handleShellCommand,
        handleSlashCommand,
        logger,
        shellModeActive,
        scheduleToolCalls,
    ]);
    // --- Stream Event Handlers ---
    const handleContentEvent = useCallback((eventValue, currentGeminiMessageBuffer, userMessageTimestamp) => {
        if (turnCancelledRef.current) {
            // Prevents additional output after a user initiated cancel.
            return '';
        }
        let newGeminiMessageBuffer = currentGeminiMessageBuffer + eventValue;
        if (pendingHistoryItemRef.current?.type !== 'gemini' &&
            pendingHistoryItemRef.current?.type !== 'gemini_content') {
            if (pendingHistoryItemRef.current) {
                addItem(pendingHistoryItemRef.current, userMessageTimestamp);
            }
            setPendingHistoryItem({ type: 'gemini', text: '' });
            newGeminiMessageBuffer = eventValue;
        }
        // Split large messages for better rendering performance. Ideally,
        // we should maximize the amount of output sent to <Static />.
        const splitPoint = findLastSafeSplitPoint(newGeminiMessageBuffer);
        if (splitPoint === newGeminiMessageBuffer.length) {
            // Update the existing message with accumulated content
            setPendingHistoryItem((item) => ({
                type: item?.type,
                text: newGeminiMessageBuffer,
            }));
        }
        else {
            // This indicates that we need to split up this Gemini Message.
            // Splitting a message is primarily a performance consideration. There is a
            // <Static> component at the root of App.tsx which takes care of rendering
            // content statically or dynamically. Everything but the last message is
            // treated as static in order to prevent re-rendering an entire message history
            // multiple times per-second (as streaming occurs). Prior to this change you'd
            // see heavy flickering of the terminal. This ensures that larger messages get
            // broken up so that there are more "statically" rendered.
            const beforeText = newGeminiMessageBuffer.substring(0, splitPoint);
            const afterText = newGeminiMessageBuffer.substring(splitPoint);
            addItem({
                type: pendingHistoryItemRef.current?.type,
                text: beforeText,
            }, userMessageTimestamp);
            setPendingHistoryItem({ type: 'gemini_content', text: afterText });
            newGeminiMessageBuffer = afterText;
        }
        return newGeminiMessageBuffer;
    }, [addItem, pendingHistoryItemRef, setPendingHistoryItem]);
    const handleUserCancelledEvent = useCallback((userMessageTimestamp) => {
        if (turnCancelledRef.current) {
            return;
        }
        if (pendingHistoryItemRef.current) {
            if (pendingHistoryItemRef.current.type === 'tool_group') {
                const updatedTools = pendingHistoryItemRef.current.tools.map((tool) => tool.status === ToolCallStatus.Pending ||
                    tool.status === ToolCallStatus.Confirming ||
                    tool.status === ToolCallStatus.Executing
                    ? { ...tool, status: ToolCallStatus.Canceled }
                    : tool);
                const pendingItem = {
                    ...pendingHistoryItemRef.current,
                    tools: updatedTools,
                };
                addItem(pendingItem, userMessageTimestamp);
            }
            else {
                addItem(pendingHistoryItemRef.current, userMessageTimestamp);
            }
            setPendingHistoryItem(null);
        }
        addItem({ type: MessageType.INFO, text: 'User cancelled the request.' }, userMessageTimestamp);
        setIsResponding(false);
    }, [addItem, pendingHistoryItemRef, setPendingHistoryItem]);
    const handleErrorEvent = useCallback((eventValue, userMessageTimestamp) => {
        if (pendingHistoryItemRef.current) {
            addItem(pendingHistoryItemRef.current, userMessageTimestamp);
            setPendingHistoryItem(null);
        }
        addItem({
            type: MessageType.ERROR,
            text: parseAndFormatApiError(eventValue.error, config.getContentGeneratorConfig().authType),
        }, userMessageTimestamp);
    }, [addItem, pendingHistoryItemRef, setPendingHistoryItem, config]);
    const handleChatCompressionEvent = useCallback((eventValue) => addItem({
        type: 'info',
        text: `IMPORTANT: This conversation approached the input token limit for ${config.getModel()}. ` +
            `A compressed context will be sent for future messages (compressed from: ` +
            `${eventValue?.originalTokenCount ?? 'unknown'} to ` +
            `${eventValue?.newTokenCount ?? 'unknown'} tokens).`,
    }, Date.now()), [addItem, config]);
    const processGeminiStreamEvents = useCallback(async (stream, userMessageTimestamp, signal) => {
        let geminiMessageBuffer = '';
        const toolCallRequests = [];
        for await (const event of stream) {
            switch (event.type) {
                case ServerGeminiEventType.Thought:
                    setThought(event.value);
                    break;
                case ServerGeminiEventType.Content:
                    geminiMessageBuffer = handleContentEvent(event.value, geminiMessageBuffer, userMessageTimestamp);
                    break;
                case ServerGeminiEventType.ToolCallRequest:
                    toolCallRequests.push(event.value);
                    break;
                case ServerGeminiEventType.UserCancelled:
                    handleUserCancelledEvent(userMessageTimestamp);
                    break;
                case ServerGeminiEventType.Error:
                    handleErrorEvent(event.value, userMessageTimestamp);
                    break;
                case ServerGeminiEventType.ChatCompressed:
                    handleChatCompressionEvent(event.value);
                    break;
                case ServerGeminiEventType.UsageMetadata:
                    addUsage(event.value);
                    break;
                case ServerGeminiEventType.ToolCallConfirmation:
                case ServerGeminiEventType.ToolCallResponse:
                    // do nothing
                    break;
                default: {
                    // enforces exhaustive switch-case
                    const unreachable = event;
                    return unreachable;
                }
            }
        }
        if (toolCallRequests.length > 0) {
            scheduleToolCalls(toolCallRequests, signal);
        }
        return StreamProcessingStatus.Completed;
    }, [
        handleContentEvent,
        handleUserCancelledEvent,
        handleErrorEvent,
        scheduleToolCalls,
        handleChatCompressionEvent,
        addUsage,
    ]);
    const submitQuery = useCallback(async (query, options) => {
        if ((streamingState === StreamingState.Responding ||
            streamingState === StreamingState.WaitingForConfirmation) &&
            !options?.isContinuation)
            return;
        const userMessageTimestamp = Date.now();
        setShowHelp(false);
        abortControllerRef.current = new AbortController();
        const abortSignal = abortControllerRef.current.signal;
        turnCancelledRef.current = false;
        const { queryToSend, shouldProceed } = await prepareQueryForGemini(query, userMessageTimestamp, abortSignal);
        if (!shouldProceed || queryToSend === null) {
            return;
        }
        if (!options?.isContinuation) {
            startNewTurn();
        }
        setIsResponding(true);
        setInitError(null);
        try {
            const stream = geminiClient.sendMessageStream(queryToSend, abortSignal);
            const processingStatus = await processGeminiStreamEvents(stream, userMessageTimestamp, abortSignal);
            if (processingStatus === StreamProcessingStatus.UserCancelled) {
                return;
            }
            if (pendingHistoryItemRef.current) {
                addItem(pendingHistoryItemRef.current, userMessageTimestamp);
                setPendingHistoryItem(null);
            }
        }
        catch (error) {
            if (error instanceof UnauthorizedError) {
                onAuthError();
            }
            else if (!isNodeError(error) || error.name !== 'AbortError') {
                addItem({
                    type: MessageType.ERROR,
                    text: parseAndFormatApiError(getErrorMessage(error) || 'Unknown error', config.getContentGeneratorConfig().authType),
                }, userMessageTimestamp);
            }
        }
        finally {
            setIsResponding(false);
        }
    }, [
        streamingState,
        setShowHelp,
        prepareQueryForGemini,
        processGeminiStreamEvents,
        pendingHistoryItemRef,
        addItem,
        setPendingHistoryItem,
        setInitError,
        geminiClient,
        startNewTurn,
        onAuthError,
        config,
    ]);
    /**
     * Automatically submits responses for completed tool calls.
     * This effect runs when `toolCalls` or `isResponding` changes.
     * It ensures that tool responses are sent back to Gemini only when
     * all processing for a given set of tools is finished and Gemini
     * is not already generating a response.
     */
    useEffect(() => {
        const run = async () => {
            if (isResponding) {
                return;
            }
            const completedAndReadyToSubmitTools = toolCalls.filter((tc) => {
                const isTerminalState = tc.status === 'success' ||
                    tc.status === 'error' ||
                    tc.status === 'cancelled';
                if (isTerminalState) {
                    const completedOrCancelledCall = tc;
                    return (!completedOrCancelledCall.responseSubmittedToGemini &&
                        completedOrCancelledCall.response?.responseParts !== undefined);
                }
                return false;
            });
            // Finalize any client-initiated tools as soon as they are done.
            const clientTools = completedAndReadyToSubmitTools.filter((t) => t.request.isClientInitiated);
            if (clientTools.length > 0) {
                markToolsAsSubmitted(clientTools.map((t) => t.request.callId));
            }
            // Identify new, successful save_memory calls that we haven't processed yet.
            const newSuccessfulMemorySaves = completedAndReadyToSubmitTools.filter((t) => t.request.name === 'save_memory' &&
                t.status === 'success' &&
                !processedMemoryToolsRef.current.has(t.request.callId));
            if (newSuccessfulMemorySaves.length > 0) {
                // Perform the refresh only if there are new ones.
                void performMemoryRefresh();
                // Mark them as processed so we don't do this again on the next render.
                newSuccessfulMemorySaves.forEach((t) => processedMemoryToolsRef.current.add(t.request.callId));
            }
            // Only proceed with submitting to Gemini if ALL tools are complete.
            const allToolsAreComplete = toolCalls.length > 0 &&
                toolCalls.length === completedAndReadyToSubmitTools.length;
            if (!allToolsAreComplete) {
                return;
            }
            const geminiTools = completedAndReadyToSubmitTools.filter((t) => !t.request.isClientInitiated);
            if (geminiTools.length === 0) {
                return;
            }
            // If all the tools were cancelled, don't submit a response to Gemini.
            const allToolsCancelled = geminiTools.every((tc) => tc.status === 'cancelled');
            if (allToolsCancelled) {
                if (geminiClient) {
                    // We need to manually add the function responses to the history
                    // so the model knows the tools were cancelled.
                    const responsesToAdd = geminiTools.flatMap((toolCall) => toolCall.response.responseParts);
                    for (const response of responsesToAdd) {
                        let parts;
                        if (Array.isArray(response)) {
                            parts = response;
                        }
                        else if (typeof response === 'string') {
                            parts = [{ text: response }];
                        }
                        else {
                            parts = [response];
                        }
                        geminiClient.addHistory({
                            role: 'user',
                            parts,
                        });
                    }
                }
                const callIdsToMarkAsSubmitted = geminiTools.map((toolCall) => toolCall.request.callId);
                markToolsAsSubmitted(callIdsToMarkAsSubmitted);
                return;
            }
            const responsesToSend = geminiTools.map((toolCall) => toolCall.response.responseParts);
            const callIdsToMarkAsSubmitted = geminiTools.map((toolCall) => toolCall.request.callId);
            markToolsAsSubmitted(callIdsToMarkAsSubmitted);
            submitQuery(mergePartListUnions(responsesToSend), {
                isContinuation: true,
            });
        };
        void run();
    }, [
        toolCalls,
        isResponding,
        submitQuery,
        markToolsAsSubmitted,
        addItem,
        geminiClient,
        performMemoryRefresh,
    ]);
    const pendingHistoryItems = [
        pendingHistoryItemRef.current,
        pendingToolCallGroupDisplay,
    ].filter((i) => i !== undefined && i !== null);
    useEffect(() => {
        const saveRestorableToolCalls = async () => {
            if (!config.getCheckpointingEnabled()) {
                return;
            }
            const restorableToolCalls = toolCalls.filter((toolCall) => (toolCall.request.name === 'replace' ||
                toolCall.request.name === 'write_file') &&
                toolCall.status === 'awaiting_approval');
            if (restorableToolCalls.length > 0) {
                const checkpointDir = config.getProjectTempDir()
                    ? path.join(config.getProjectTempDir(), 'checkpoints')
                    : undefined;
                if (!checkpointDir) {
                    return;
                }
                try {
                    await fs.mkdir(checkpointDir, { recursive: true });
                }
                catch (error) {
                    if (!isNodeError(error) || error.code !== 'EEXIST') {
                        onDebugMessage(`Failed to create checkpoint directory: ${getErrorMessage(error)}`);
                        return;
                    }
                }
                for (const toolCall of restorableToolCalls) {
                    const filePath = toolCall.request.args['file_path'];
                    if (!filePath) {
                        onDebugMessage(`Skipping restorable tool call due to missing file_path: ${toolCall.request.name}`);
                        continue;
                    }
                    try {
                        let commitHash = await gitService?.createFileSnapshot(`Snapshot for ${toolCall.request.name}`);
                        if (!commitHash) {
                            commitHash = await gitService?.getCurrentCommitHash();
                        }
                        if (!commitHash) {
                            onDebugMessage(`Failed to create snapshot for ${filePath}. Skipping restorable tool call.`);
                            continue;
                        }
                        const timestamp = new Date()
                            .toISOString()
                            .replace(/:/g, '-')
                            .replace(/\./g, '_');
                        const toolName = toolCall.request.name;
                        const fileName = path.basename(filePath);
                        const toolCallWithSnapshotFileName = `${timestamp}-${fileName}-${toolName}.json`;
                        const clientHistory = await geminiClient?.getHistory();
                        const toolCallWithSnapshotFilePath = path.join(checkpointDir, toolCallWithSnapshotFileName);
                        await fs.writeFile(toolCallWithSnapshotFilePath, JSON.stringify({
                            history,
                            clientHistory,
                            toolCall: {
                                name: toolCall.request.name,
                                args: toolCall.request.args,
                            },
                            commitHash,
                            filePath,
                        }, null, 2));
                    }
                    catch (error) {
                        onDebugMessage(`Failed to write restorable tool call file: ${getErrorMessage(error)}`);
                    }
                }
            }
        };
        saveRestorableToolCalls();
    }, [toolCalls, config, onDebugMessage, gitService, history, geminiClient]);
    return {
        streamingState,
        submitQuery,
        initError,
        pendingHistoryItems,
        thought,
    };
};
//# sourceMappingURL=useGeminiStream.js.map