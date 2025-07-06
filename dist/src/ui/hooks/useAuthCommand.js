/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useEffect } from 'react';
import { clearCachedCredentialFile, getErrorMessage, } from '@google/gemini-cli-core';
async function performAuthFlow(authMethod, config) {
    await config.refreshAuth(authMethod);
    console.log(`Authenticated via "${authMethod}".`);
}
export const useAuthCommand = (settings, setAuthError, config) => {
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(settings.merged.selectedAuthType === undefined);
    const openAuthDialog = useCallback(() => {
        setIsAuthDialogOpen(true);
    }, []);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    useEffect(() => {
        const authFlow = async () => {
            if (isAuthDialogOpen || !settings.merged.selectedAuthType) {
                return;
            }
            try {
                setIsAuthenticating(true);
                await performAuthFlow(settings.merged.selectedAuthType, config);
            }
            catch (e) {
                setAuthError(`Failed to login. Message: ${getErrorMessage(e)}`);
                openAuthDialog();
            }
            finally {
                setIsAuthenticating(false);
            }
        };
        void authFlow();
    }, [isAuthDialogOpen, settings, config, setAuthError, openAuthDialog]);
    const handleAuthSelect = useCallback(async (authMethod, scope) => {
        if (authMethod) {
            await clearCachedCredentialFile();
            settings.setValue(scope, 'selectedAuthType', authMethod);
        }
        setIsAuthDialogOpen(false);
        setAuthError(null);
    }, [settings, setAuthError]);
    const handleAuthHighlight = useCallback((_authMethod) => {
        // For now, we don't do anything on highlight.
    }, []);
    const cancelAuthentication = useCallback(() => {
        setIsAuthenticating(false);
    }, []);
    return {
        isAuthDialogOpen,
        openAuthDialog,
        handleAuthSelect,
        handleAuthHighlight,
        isAuthenticating,
        cancelAuthentication,
    };
};
//# sourceMappingURL=useAuthCommand.js.map