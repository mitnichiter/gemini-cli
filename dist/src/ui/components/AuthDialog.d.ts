/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
interface AuthDialogProps {
    onSelect: (authMethod: string | undefined, scope: SettingScope) => void;
    onHighlight: (authMethod: string | undefined) => void;
    settings: LoadedSettings;
    initialErrorMessage?: string | null;
}
export declare function AuthDialog({ onSelect, onHighlight, settings, initialErrorMessage, }: AuthDialogProps): React.JSX.Element;
export {};
