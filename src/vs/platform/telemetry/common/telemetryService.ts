/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DisposableStore } from '../../../base/common/lifecycle.js';
import { mixin } from '../../../base/common/objects.js';
import { isWeb } from '../../../base/common/platform.js';
import { escapeRegExpCharacters } from '../../../base/common/strings.js';
import { localize } from '../../../nls.js';
import { IConfigurationService } from '../../configuration/common/configuration.js';
import { ConfigurationScope, Extensions, IConfigurationRegistry } from '../../configuration/common/configurationRegistry.js';
import product from '../../product/common/product.js';
import { IProductService } from '../../product/common/productService.js';
import { Registry } from '../../registry/common/platform.js';
import { ClassifiedEvent, IGDPRProperty, OmitMetadata, StrictPropertyCheck } from './gdprTypings.js';
import { ITelemetryData, ITelemetryService, TelemetryConfiguration, TelemetryLevel, TELEMETRY_CRASH_REPORTER_SETTING_ID, TELEMETRY_OLD_SETTING_ID, TELEMETRY_SECTION_ID, TELEMETRY_SETTING_ID, ICommonProperties, ITelemetryInfo, ITelemetryErrorData, GDPRClassification } from './telemetry.js';

export class TelemetryService implements ITelemetryService {
	declare readonly _serviceBrand: undefined;

	private static readonly IDLE_START_EVENT_NAME = 'UserIdleStart';
	private static readonly IDLE_STOP_EVENT_NAME = 'UserIdleStop';

	constructor() {
		// Empty constructor - no initialization needed
	}

	// Disable all telemetry methods
	public async publicLog(eventName: string, data?: ITelemetryData): Promise<void> {
		// No-op
		return;
	}

	public async publicLog2<E extends ClassifiedEvent<T> = never, T extends GDPRClassification<T> = never>(eventName: string, data?: StrictPropertyCheck<T, E>): Promise<void> {
		// No-op
		return;
	}

	public async publicLogError(errorEventName: string, data?: ITelemetryErrorData): Promise<void> {
		// No-op
		return;
	}

	public async publicLogError2<E extends ClassifiedEvent<T> = never, T extends GDPRClassification<T> = never>(eventName: string, data?: StrictPropertyCheck<T, E>): Promise<void> {
		// No-op
		return;
	}

	public getTelemetryInfo(): Promise<ITelemetryInfo> {
		return Promise.resolve({
			instanceId: 'disabled',
			sessionId: 'disabled',
			machineId: 'disabled'
		});
	}

	public setEnabled(value: boolean): void {
		// No-op
	}

	public setExperimentProperty(name: string, value: string): void {
		// No-op
	}

	public isOptedIn = false;
}

function getTelemetryLevelSettingDescription(): string {
	const telemetryText = localize('telemetry.telemetryLevelMd', "Controls {0} telemetry, first-party extension telemetry, and participating third-party extension telemetry. Some third party extensions might not respect this setting. Consult the specific extension's documentation to be sure. Telemetry helps us better understand how {0} is performing, where improvements need to be made, and how features are being used.", product.nameLong);
	const externalLinksStatement = !product.privacyStatementUrl ?
		localize("telemetry.docsStatement", "Read more about the [data we collect]({0}).", 'https://aka.ms/vscode-telemetry') :
		localize("telemetry.docsAndPrivacyStatement", "Read more about the [data we collect]({0}) and our [privacy statement]({1}).", 'https://aka.ms/vscode-telemetry', product.privacyStatementUrl);
	const restartString = !isWeb ? localize('telemetry.restart', 'A full restart of the application is necessary for crash reporting changes to take effect.') : '';

	const crashReportsHeader = localize('telemetry.crashReports', "Crash Reports");
	const errorsHeader = localize('telemetry.errors', "Error Telemetry");
	const usageHeader = localize('telemetry.usage', "Usage Data");

	const telemetryTableDescription = localize('telemetry.telemetryLevel.tableDescription', "The following table outlines the data sent with each setting:");
	const telemetryTable = `
|       | ${crashReportsHeader} | ${errorsHeader} | ${usageHeader} |
|:------|:---------------------:|:---------------:|:--------------:|
| all   |            ✓          |        ✓        |        ✓       |
| error |            ✓          |        ✓        |        -       |
| crash |            ✓          |        -        |        -       |
| off   |            -          |        -        |        -       |
`;

	const deprecatedSettingNote = localize('telemetry.telemetryLevel.deprecated', "****Note:*** If this setting is 'off', no telemetry will be sent regardless of other telemetry settings. If this setting is set to anything except 'off' and telemetry is disabled with deprecated settings, no telemetry will be sent.*");
	const telemetryDescription = `
${telemetryText} ${externalLinksStatement} ${restartString}

&nbsp;

${telemetryTableDescription}
${telemetryTable}

&nbsp;

${deprecatedSettingNote}
`;

	return telemetryDescription;
}

Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	'id': TELEMETRY_SECTION_ID,
	'order': 1,
	'type': 'object',
	'title': localize('telemetryConfigurationTitle', "Telemetry"),
	'properties': {
		[TELEMETRY_SETTING_ID]: {
			'type': 'string',
			'enum': [TelemetryConfiguration.ON, TelemetryConfiguration.ERROR, TelemetryConfiguration.CRASH, TelemetryConfiguration.OFF],
			'enumDescriptions': [
				localize('telemetry.telemetryLevel.default', "Sends usage data, errors, and crash reports."),
				localize('telemetry.telemetryLevel.error', "Sends general error telemetry and crash reports."),
				localize('telemetry.telemetryLevel.crash', "Sends OS level crash reports."),
				localize('telemetry.telemetryLevel.off', "Disables all product telemetry.")
			],
			'markdownDescription': getTelemetryLevelSettingDescription(),
			// --- Start Positron ---
			// 'default': TelemetryConfiguration.ON,
			'default': TelemetryConfiguration.OFF,
			// --- End Positron ---
			'restricted': true,
			'scope': ConfigurationScope.APPLICATION,
			'tags': ['usesOnlineServices', 'telemetry']
		}
	}
});

// Deprecated telemetry setting
Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	'id': TELEMETRY_SECTION_ID,
	'order': 110,
	'type': 'object',
	'title': localize('telemetryConfigurationTitle', "Telemetry"),
	'properties': {
		[TELEMETRY_OLD_SETTING_ID]: {
			'type': 'boolean',
			'markdownDescription':
				!product.privacyStatementUrl ?
					localize('telemetry.enableTelemetry', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made.", product.nameLong) :
					localize('telemetry.enableTelemetryMd', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made. [Read more]({1}) about what we collect and our privacy statement.", product.nameLong, product.privacyStatementUrl),
			'default': true,
			'restricted': true,
			'markdownDeprecationMessage': localize('enableTelemetryDeprecated', "If this setting is false, no telemetry will be sent regardless of the new setting's value. Deprecated in favor of the {0} setting.", `\`#${TELEMETRY_SETTING_ID}#\``),
			'scope': ConfigurationScope.APPLICATION,
			'tags': ['usesOnlineServices', 'telemetry']
		}
	}
});

