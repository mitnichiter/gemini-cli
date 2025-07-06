/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { CumulativeStats } from '../contexts/SessionContext.js';
interface SessionSummaryDisplayProps {
    stats: CumulativeStats;
    duration: string;
}
export declare const SessionSummaryDisplay: React.FC<SessionSummaryDisplayProps>;
export {};
