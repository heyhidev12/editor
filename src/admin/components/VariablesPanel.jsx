import React from 'react';
import { getAvailableVariables } from '../services/templateService';

/**
 * Variables Panel - Shows available variables for email templates
 * Inserts at cursor when editor is ready, otherwise copies to clipboard
 */
export default function VariablesPanel({ editorInstance, onInsertVariable }) {
	const [copiedVariable, setCopiedVariable] = React.useState(null);
	const variables = getAvailableVariables();

	const handleVariableClick = (variableName) => {
		const variable = `{${variableName}}`;
		if (editorInstance && onInsertVariable) {
			onInsertVariable(variableName);
		} else {
			navigator.clipboard.writeText(variable).then(() => {
				setCopiedVariable(variableName);
				setTimeout(() => setCopiedVariable(null), 2000);
			});
		}
	};

	return (
		<div className="variables-panel">
			<h4>📋 Available Variables</h4>
			<p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
				{editorInstance ? 'Click to insert at cursor' : 'Click to copy variable name'}
			</p>
			<ul className="variables-list">
				{variables.map((variable) => (
					<li
						key={variable.name}
						className="variable-item"
						onClick={() => handleVariableClick(variable.name)}
						title={editorInstance ? `Insert {${variable.name}}` : `Click to copy: {${variable.name}}`}
					>
						<div className="variable-name">
							{!editorInstance && copiedVariable === variable.name ? '✓ Copied!' : `{${variable.name}}`}
						</div>
						<div className="variable-description">{variable.description}</div>
					</li>
				))}
			</ul>
			<div style={{ fontSize: '11px', color: '#999', marginTop: '12px', lineHeight: '1.4' }}>
				💡 <strong>Tip:</strong> {editorInstance
					? 'Click any variable to insert it at your cursor in the editor.'
					: 'Click any variable to copy it to your clipboard, then paste into your email template.'}
			</div>
		</div>
	);
}
