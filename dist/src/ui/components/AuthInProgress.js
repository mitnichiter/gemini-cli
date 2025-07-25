import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { Colors } from '../colors.js';
export function AuthInProgress({ onTimeout, }) {
    const [timedOut, setTimedOut] = useState(false);
    useInput((_, key) => {
        if (key.escape) {
            onTimeout();
        }
    });
    useEffect(() => {
        const timer = setTimeout(() => {
            setTimedOut(true);
            onTimeout();
        }, 180000);
        return () => clearTimeout(timer);
    }, [onTimeout]);
    return (_jsx(Box, { borderStyle: "round", borderColor: Colors.Gray, flexDirection: "column", padding: 1, width: "100%", children: timedOut ? (_jsx(Text, { color: Colors.AccentRed, children: "Authentication timed out. Please try again." })) : (_jsx(Box, { children: _jsxs(Text, { children: [_jsx(Spinner, { type: "dots" }), " Waiting for auth... (Press ESC to cancel)"] }) })) }));
}
//# sourceMappingURL=AuthInProgress.js.map