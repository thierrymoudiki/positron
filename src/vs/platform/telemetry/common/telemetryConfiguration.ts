export const telemetryConfigurationNodeId = 'telemetry';

export const defaultTelemetryConfiguration: IConfigurationNode = {
	id: telemetryConfigurationNodeId,
	title: localize('telemetry', "Telemetry"),
	type: 'object',
	properties: {
		'telemetry.telemetryLevel': {
			type: 'string',
			enum: ['all', 'error', 'crash', 'off'],
			default: 'off',
			tags: ['telemetry'],
			description: localize('telemetry.telemetryLevel', "Controls Visual Studio Code telemetry, crash reports, and extensions recommendations."),
		}
	}
};
