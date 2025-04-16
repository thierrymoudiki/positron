/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

// This is a fairly direct copy of the original BaseCellEditorOptions.tsx file from the vscode
// notebooks extension. It's setup to be less restrictive on the types needed for the constructor
// and also so that we can have our own settings in the future.

import { Disposable, DisposableStore } from '../../../../base/common/lifecycle.js';
import { IBaseCellEditorOptions, INotebookEditorDelegate } from '../../notebook/browser/notebookBrowser.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { NotebookOptions } from '../../notebook/browser/notebookOptions.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IEditorOptions } from '../../../../editor/common/config/editorOptions.js';
import { deepClone } from '../../../../base/common/objects.js';

export class BaseCellEditorOptions extends Disposable implements IBaseCellEditorOptions {
	private static fixedEditorOptions: IEditorOptions = {
		scrollBeyondLastLine: false,
		scrollbar: {
			verticalScrollbarSize: 14,
			horizontal: 'auto',
			useShadows: true,
			verticalHasArrows: false,
			horizontalHasArrows: false,
			alwaysConsumeMouseWheel: false
		},
		renderLineHighlightOnlyWhenFocus: true,
		overviewRulerLanes: 0,
		lineDecorationsWidth: 0,
		folding: true,
		fixedOverflowWidgets: true,
		minimap: { enabled: false },
		renderValidationDecorations: 'on',
		lineNumbersMinChars: 3
	};

	private readonly _localDisposableStore = this._register(new DisposableStore());
	private readonly _onDidChange = this._register(new Emitter<void>());
	readonly onDidChange: Event<void> = this._onDidChange.event;
	private _value: IEditorOptions;

	get value(): Readonly<IEditorOptions> {
		return this._value;
	}

	constructor(readonly notebookEditor: Pick<INotebookEditorDelegate, 'onDidChangeModel' | 'hasModel' | 'onDidChangeOptions' | 'isReadOnly'>, readonly notebookOptions: NotebookOptions, readonly configurationService: IConfigurationService, readonly language: string) {
		super();
		this._register(configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('editor') || e.affectsConfiguration('notebook')) {
				this._recomputeOptions();
			}
		}));

		this._register(notebookOptions.onDidChangeOptions(e => {
			if (e.cellStatusBarVisibility || e.editorTopPadding || e.editorOptionsCustomizations) {
				this._recomputeOptions();
			}
		}));

		this._register(this.notebookEditor.onDidChangeModel(() => {
			this._localDisposableStore.clear();

			if (this.notebookEditor.hasModel()) {
				this._localDisposableStore.add(this.notebookEditor.onDidChangeOptions(() => {
					this._recomputeOptions();
				}));

				this._recomputeOptions();
			}
		}));

		if (this.notebookEditor.hasModel()) {
			this._localDisposableStore.add(this.notebookEditor.onDidChangeOptions(() => {
				this._recomputeOptions();
			}));
		}

		this._value = this._computeEditorOptions();
	}

	private _recomputeOptions(): void {
		this._value = this._computeEditorOptions();
		this._onDidChange.fire();
	}

	private _computeEditorOptions() {
		const editorOptions = deepClone(this.configurationService.getValue<IEditorOptions>('editor', { overrideIdentifier: this.language }));
		const editorOptionsOverrideRaw = this.notebookOptions.getDisplayOptions().editorOptionsCustomizations ?? {} as any;
		const editorOptionsOverride: { [key: string]: any } = {};
		for (const key in editorOptionsOverrideRaw) {
			if (key.indexOf('editor.') === 0) {
				editorOptionsOverride[key.substring(7)] = editorOptionsOverrideRaw[key];
			}
		}
		const computed = Object.freeze({
			...editorOptions,
			...BaseCellEditorOptions.fixedEditorOptions,
			...editorOptionsOverride,
			...{ padding: { top: 12, bottom: 12 } },
			readOnly: this.notebookEditor.isReadOnly
		});

		return computed;
	}
}
