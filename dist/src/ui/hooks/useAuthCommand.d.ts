/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { Config } from '@google/gemini-cli-core';
export declare const useAuthCommand: (settings: LoadedSettings, setAuthError: (error: string | null) => void, config: Config) => {
    isAuthDialogOpen: boolean;
    openAuthDialog: () => void;
    handleAuthSelect: (authMethod: string | undefined, scope: SettingScope) => Promise<void>;
    handleAuthHighlight: (_authMethod: string | undefined) => void;
    isAuthenticating: boolean;
    cancelAuthentication: () => void;
};
