/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { type GenerateContentResponseUsageMetadata } from '@google/genai';
export interface CumulativeStats {
    turnCount: number;
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    cachedContentTokenCount: number;
    toolUsePromptTokenCount: number;
    thoughtsTokenCount: number;
    apiTimeMs: number;
}
interface SessionStatsState {
    sessionStartTime: Date;
    cumulative: CumulativeStats;
    currentTurn: CumulativeStats;
    currentResponse: CumulativeStats;
}
interface SessionStatsContextValue {
    stats: SessionStatsState;
    startNewTurn: () => void;
    addUsage: (metadata: GenerateContentResponseUsageMetadata & {
        apiTimeMs?: number;
    }) => void;
}
export declare const SessionStatsProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useSessionStats: () => SessionStatsContextValue;
export {};
