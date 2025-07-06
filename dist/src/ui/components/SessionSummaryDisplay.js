import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { Colors } from '../colors.js';
import { formatDuration } from '../utils/formatters.js';
import { StatRow, StatsColumn } from './Stats.js';
// --- Main Component ---
export const SessionSummaryDisplay = ({ stats, duration, }) => {
    const cumulativeFormatted = {
        inputTokens: stats.promptTokenCount,
        outputTokens: stats.candidatesTokenCount,
        toolUseTokens: stats.toolUsePromptTokenCount,
        thoughtsTokens: stats.thoughtsTokenCount,
        cachedTokens: stats.cachedContentTokenCount,
        totalTokens: stats.totalTokenCount,
    };
    const title = 'Agent powering down. Goodbye!';
    return (_jsxs(Box, { borderStyle: "round", borderColor: "gray", flexDirection: "column", paddingY: 1, paddingX: 2, alignSelf: "flex-start", children: [_jsx(Box, { marginBottom: 1, flexDirection: "column", children: Colors.GradientColors ? (_jsx(Gradient, { colors: Colors.GradientColors, children: _jsx(Text, { bold: true, children: title }) })) : (_jsx(Text, { bold: true, children: title })) }), _jsx(Box, { marginTop: 1, children: _jsx(StatsColumn, { title: `Cumulative Stats (${stats.turnCount} Turns)`, stats: cumulativeFormatted, isCumulative: true, children: _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(StatRow, { label: "Total duration (API)", value: formatDuration(stats.apiTimeMs) }), _jsx(StatRow, { label: "Total duration (wall)", value: duration })] }) }) })] }));
};
//# sourceMappingURL=SessionSummaryDisplay.js.map