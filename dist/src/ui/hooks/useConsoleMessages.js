/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
export function useConsoleMessages() {
    const [consoleMessages, setConsoleMessages] = useState([]);
    const messageQueueRef = useRef([]);
    const messageQueueTimeoutRef = useRef(null);
    const processMessageQueue = useCallback(() => {
        if (messageQueueRef.current.length === 0) {
            return;
        }
        setConsoleMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            messageQueueRef.current.forEach((queuedMessage) => {
                if (newMessages.length > 0 &&
                    newMessages[newMessages.length - 1].type === queuedMessage.type &&
                    newMessages[newMessages.length - 1].content === queuedMessage.content) {
                    newMessages[newMessages.length - 1].count =
                        (newMessages[newMessages.length - 1].count || 1) + 1;
                }
                else {
                    newMessages.push({ ...queuedMessage, count: 1 });
                }
            });
            return newMessages;
        });
        messageQueueRef.current = [];
        messageQueueTimeoutRef.current = null; // Allow next scheduling
    }, []);
    const scheduleQueueProcessing = useCallback(() => {
        if (messageQueueTimeoutRef.current === null) {
            messageQueueTimeoutRef.current = setTimeout(processMessageQueue, 0);
        }
    }, [processMessageQueue]);
    const handleNewMessage = useCallback((message) => {
        messageQueueRef.current.push(message);
        scheduleQueueProcessing();
    }, [scheduleQueueProcessing]);
    const clearConsoleMessages = useCallback(() => {
        setConsoleMessages([]);
        if (messageQueueTimeoutRef.current !== null) {
            clearTimeout(messageQueueTimeoutRef.current);
            messageQueueTimeoutRef.current = null;
        }
        messageQueueRef.current = [];
    }, []);
    useEffect(() => 
    // Cleanup on unmount
    () => {
        if (messageQueueTimeoutRef.current !== null) {
            clearTimeout(messageQueueTimeoutRef.current);
        }
    }, []);
    return { consoleMessages, handleNewMessage, clearConsoleMessages };
}
//# sourceMappingURL=useConsoleMessages.js.map