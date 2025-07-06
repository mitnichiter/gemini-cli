import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
// --- Helper Components ---
/**
 * Renders a single row with a colored label on the left and a value on the right.
 */
export const StatRow = ({ label, value, valueColor }) => (_jsxs(Box, { justifyContent: "space-between", gap: 2, children: [_jsx(Text, { color: Colors.LightBlue, children: label }), _jsx(Text, { color: valueColor, children: value })] }));
/**
 * Renders a full column for either "Last Turn" or "Cumulative" stats.
 */
export const StatsColumn = ({ title, stats, isCumulative = false, width, children }) => {
    const cachedDisplay = isCumulative && stats.totalTokens > 0
        ? `${stats.cachedTokens.toLocaleString()} (${((stats.cachedTokens / stats.totalTokens) * 100).toFixed(1)}%)`
        : stats.cachedTokens.toLocaleString();
    const cachedColor = isCumulative && stats.cachedTokens > 0 ? Colors.AccentGreen : undefined;
    return (_jsxs(Box, { flexDirection: "column", width: width, children: [_jsx(Text, { bold: true, children: title }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(StatRow, { label: "Input Tokens", value: stats.inputTokens.toLocaleString() }), _jsx(StatRow, { label: "Output Tokens", value: stats.outputTokens.toLocaleString() }), stats.toolUseTokens > 0 && (_jsx(StatRow, { label: "Tool Use Tokens", value: stats.toolUseTokens.toLocaleString() })), _jsx(StatRow, { label: "Thoughts Tokens", value: stats.thoughtsTokens.toLocaleString() }), stats.cachedTokens > 0 && (_jsx(StatRow, { label: "Cached Tokens", value: cachedDisplay, valueColor: cachedColor })), _jsx(Box, { borderTop: true, borderLeft: false, borderRight: false, borderBottom: false, borderStyle: "single" }), _jsx(StatRow, { label: "Total Tokens", value: stats.totalTokens.toLocaleString() }), children] })] }));
};
/**
 * Renders a column for displaying duration information.
 */
export const DurationColumn = ({ apiTime, wallTime }) => (_jsxs(Box, { flexDirection: "column", width: '48%', children: [_jsx(Text, { bold: true, children: "Duration" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(StatRow, { label: "API Time", value: apiTime }), _jsx(StatRow, { label: "Wall Time", value: wallTime })] })] }));
//# sourceMappingURL=Stats.js.map