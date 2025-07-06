/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
export interface FormattedStats {
    inputTokens: number;
    outputTokens: number;
    toolUseTokens: number;
    thoughtsTokens: number;
    cachedTokens: number;
    totalTokens: number;
}
/**
 * Renders a single row with a colored label on the left and a value on the right.
 */
export declare const StatRow: React.FC<{
    label: string;
    value: string | number;
    valueColor?: string;
}>;
/**
 * Renders a full column for either "Last Turn" or "Cumulative" stats.
 */
export declare const StatsColumn: React.FC<{
    title: string;
    stats: FormattedStats;
    isCumulative?: boolean;
    width?: string | number;
    children?: React.ReactNode;
}>;
/**
 * Renders a column for displaying duration information.
 */
export declare const DurationColumn: React.FC<{
    apiTime: string;
    wallTime: string;
}>;
