/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { CumulativeStats } from '../contexts/SessionContext.js';
interface StatsDisplayProps {
    stats: CumulativeStats;
    lastTurnStats: CumulativeStats;
    duration: string;
}
export declare const StatsDisplay: React.FC<StatsDisplayProps>;
export {};
