import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { formatDuration } from '../utils/formatters.js';
import { StatRow, StatsColumn } from './Stats.js';
// --- Constants ---
const COLUMN_WIDTH = '48%';
// --- Main Component ---
export const StatsDisplay = ({ stats, lastTurnStats, duration, }) => {
    const lastTurnFormatted = {
        inputTokens: lastTurnStats.promptTokenCount,
        outputTokens: lastTurnStats.candidatesTokenCount,
        toolUseTokens: lastTurnStats.toolUsePromptTokenCount,
        thoughtsTokens: lastTurnStats.thoughtsTokenCount,
        cachedTokens: lastTurnStats.cachedContentTokenCount,
        totalTokens: lastTurnStats.totalTokenCount,
    };
    const cumulativeFormatted = {
        inputTokens: stats.promptTokenCount,
        outputTokens: stats.candidatesTokenCount,
        toolUseTokens: stats.toolUsePromptTokenCount,
        thoughtsTokens: stats.thoughtsTokenCount,
        cachedTokens: stats.cachedContentTokenCount,
        totalTokens: stats.totalTokenCount,
    };
    return (_jsxs(Box, { borderStyle: "round", borderColor: "gray", flexDirection: "column", paddingY: 1, paddingX: 2, children: [_jsx(Text, { bold: true, color: Colors.AccentPurple, children: "Stats" }), _jsxs(Box, { flexDirection: "row", justifyContent: "space-between", marginTop: 1, children: [_jsx(StatsColumn, { title: "Last Turn", stats: lastTurnFormatted, width: COLUMN_WIDTH }), _jsx(StatsColumn, { title: `Cumulative (${stats.turnCount} Turns)`, stats: cumulativeFormatted, isCumulative: true, width: COLUMN_WIDTH })] }), _jsxs(Box, { flexDirection: "row", justifyContent: "space-between", marginTop: 1, children: [_jsx(Box, { width: COLUMN_WIDTH, flexDirection: "column", children: _jsx(StatRow, { label: "Turn Duration (API)", value: formatDuration(lastTurnStats.apiTimeMs) }) }), _jsxs(Box, { width: COLUMN_WIDTH, flexDirection: "column", children: [_jsx(StatRow, { label: "Total duration (API)", value: formatDuration(stats.apiTimeMs) }), _jsx(StatRow, { label: "Total duration (wall)", value: duration })] })] })] }));
};
//# sourceMappingURL=StatsDisplay.js.map