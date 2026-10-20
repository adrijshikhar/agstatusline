import {
    Box,
    Text,
    useInput
} from 'ink';
import React from 'react';

import type { ResolvedInstallationMetadata } from '../../types/Settings';
import type {
    ActiveGlobalCommandResolution,
    GlobalPackageInstallation,
    GlobalPackageManager
} from '../../utils/global-package-manager';

import {
    List,
    type ListEntry
} from './List';

export type ManageInstallationAction = 'checkUpdates' | 'uninstall';

export interface UninstallSelection { packageManagers: GlobalPackageManager[] }

export interface ManageInstallationMenuProps {
    installation: ResolvedInstallationMetadata;
    activeCommand: ActiveGlobalCommandResolution | null;
    onSelect: (action: ManageInstallationAction) => void;
    onBack: () => void;
}

export interface UninstallMenuProps {
    installations: GlobalPackageInstallation[];
    onSelect: (selection: UninstallSelection) => void;
    onBack: () => void;
}

function getInstallationLabel(installation: ResolvedInstallationMetadata): string {
    if (installation.method === 'pinned') {
        const version = installation.installedVersion
            ? ` ${installation.installedVersion}`
            : '';
        const manager = installation.packageManager === 'unknown'
            ? ''
            : ` via ${installation.packageManager}`;

        return `Pinned global install${manager}${version}`;
    }

    if (installation.method === 'self-managed') {
        return 'Self-managed/global install';
    }

    if (installation.method === 'auto-update') {
        return `Auto-update via ${installation.packageManager}`;
    }

    return 'Unknown installation';
}

function getActiveCommandLabel(activeCommand: ActiveGlobalCommandResolution | null): string | null {
    if (!activeCommand?.resolvedPath) {
        return null;
    }

    if (activeCommand.packageManager === 'unknown') {
        return `Active PATH match: ${activeCommand.resolvedPath}`;
    }

    const version = activeCommand.version
        ? ` ${activeCommand.version}`
        : '';

    return `Active PATH match: ${activeCommand.packageManager} global${version} (${activeCommand.resolvedPath})`;
}

export function buildManageInstallationItems(): ListEntry<ManageInstallationAction>[] {
    return [
        {
            label: '🔄 Check for Updates',
            value: 'checkUpdates',
            description: 'Check npm for the latest agstatusline version and update the pinned global package'
        },
        {
            label: '🔌 Uninstall',
            value: 'uninstall',
            description: 'Remove agstatusline from Antigravity settings, optionally removing global npm/bun packages'
        }
    ];
}

function formatPackageManagers(packageManagers: GlobalPackageManager[]): string {
    return packageManagers.join(' + ');
}

export function buildUninstallItems(
    installations: GlobalPackageInstallation[]
): ListEntry<UninstallSelection>[] {
    const removableManagers = installations
        .filter(installation => installation.installed && installation.available)
        .map(installation => installation.packageManager);

    const items: ListEntry<UninstallSelection>[] = [
        {
            label: 'Remove from Antigravity settings only',
            value: { packageManagers: [] },
            description: 'Leaves any global npm or bun agstatusline packages installed'
        }
    ];

    for (const packageManager of removableManagers) {
        items.push({
            label: `Remove Antigravity settings and ${packageManager} global package`,
            value: { packageManagers: [packageManager] },
            description: `Runs ${packageManager === 'npm'
                ? 'npm uninstall -g agstatusline'
                : 'bun remove -g agstatusline'} after removing Antigravity settings`
        });
    }

    if (removableManagers.length > 1) {
        items.push({
            label: `Remove Antigravity settings and ${formatPackageManagers(removableManagers)} global packages`,
            value: { packageManagers: removableManagers },
            description: 'Removes every detected global agstatusline package after removing Antigravity settings'
        });
    }

    return items;
}

export const ManageInstallationMenu: React.FC<ManageInstallationMenuProps> = ({
    installation,
    activeCommand,
    onSelect,
    onBack
}) => {
    const activeCommandLabel = getActiveCommandLabel(activeCommand);

    useInput((_, key) => {
        if (key.escape) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>Manage Installation</Text>
            <Box marginTop={1}>
                <Text>
                    Current:
                    {' '}
                    {getInstallationLabel(installation)}
                </Text>
            </Box>
            {activeCommandLabel && (
                <Box>
                    <Text dimColor>{activeCommandLabel}</Text>
                </Box>
            )}
            {activeCommand?.warning && (
                <Box marginTop={1}>
                    <Text color='yellow' wrap='wrap'>{activeCommand.warning}</Text>
                </Box>
            )}
            <List
                marginTop={1}
                items={buildManageInstallationItems()}
                onSelect={(value) => {
                    if (value === 'back') {
                        onBack();
                        return;
                    }

                    onSelect(value);
                }}
                showBackButton={true}
            />
        </Box>
    );
};

export const UninstallMenu: React.FC<UninstallMenuProps> = ({
    installations,
    onSelect,
    onBack
}) => {
    const items = buildUninstallItems(installations);
    const detectedManagers = installations
        .filter(installation => installation.installed && installation.available)
        .map(installation => installation.packageManager);

    useInput((_, key) => {
        if (key.escape) {
            onBack();
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>Uninstall agstatusline</Text>
            <Box marginTop={1}>
                <Text dimColor>
                    Choose what to remove from this machine.
                </Text>
            </Box>
            {detectedManagers.length === 0 && (
                <Box marginTop={1}>
                    <Text dimColor>No global npm or bun agstatusline package was detected.</Text>
                </Box>
            )}
            <List
                marginTop={1}
                items={items}
                onSelect={(value) => {
                    if (value === 'back') {
                        onBack();
                        return;
                    }

                    onSelect(value);
                }}
                showBackButton={true}
            />
        </Box>
    );
};
