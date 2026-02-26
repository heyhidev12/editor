import React, { useState, useEffect } from 'react';
import { getTemplates, deleteTemplate, duplicateTemplate, TEMPLATE_CATEGORIES } from '../services/templateService';

/**
 * Template List Page - Show all email templates with actions
 */
export default function TemplateListPage({ onCreateNew, onEdit, onDuplicate }) {
	const [templates, setTemplates] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [message, setMessage] = useState(null);

	useEffect(() => {
		loadTemplates();
	}, []);

	async function loadTemplates() {
		try {
			setIsLoading(true);
			const data = await getTemplates();
			setTemplates(data);
		} catch (error) {
			showMessage('Failed to load templates', 'error');
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}

	function showMessage(text, type = 'success') {
		setMessage({ text, type });
		setTimeout(() => setMessage(null), 4000);
	}

	async function handleDelete(id) {
		if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
			return;
		}

		try {
			await deleteTemplate(id);
			setTemplates((prev) => prev.filter((t) => t.id !== id));
			showMessage('Template deleted successfully', 'success');
		} catch (error) {
			showMessage('Failed to delete template', 'error');
			console.error(error);
		}
	}

	async function handleDuplicate(id) {
		try {
			const newTemplate = await duplicateTemplate(id);
			await loadTemplates();
			showMessage('Template duplicated successfully', 'success');
			if (onDuplicate) onDuplicate(newTemplate.id);
		} catch (error) {
			showMessage('Failed to duplicate template', 'error');
			console.error(error);
		}
	}

	function getCategoryColor(category) {
		switch (category) {
			case 'MARKETING':
				return 'category-marketing';
			case 'SYSTEM':
				return 'category-system';
			case 'NOTIFICATION':
				return 'category-notification';
			default:
				return '';
		}
	}

	function getCategoryLabel(category) {
		const cat = TEMPLATE_CATEGORIES.find((c) => c.value === category);
		return cat ? cat.label : category;
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	if (isLoading) {
		return (
			<div style={{ textAlign: 'center', padding: '60px 20px' }}>
				<div className="loading" style={{ margin: '0 auto 20px' }}></div>
				<p>Loading templates...</p>
			</div>
		);
	}

	return (
		<div>
			{/* Messages */}
			{message && (
				<div className={`alert alert-${message.type}`}>
					{message.type === 'success' && '✓ '}
					{message.type === 'error' && '✗ '}
					{message.text}
				</div>
			)}

			{/* Template List */}
			<div className="template-list-container">
				<div className="template-list-header">
					<h2>Email Templates</h2>
					<button className="btn-create" onClick={onCreateNew}>
						+ Create New Template
					</button>
				</div>

				{templates.length === 0 ? (
					<div className="empty-state">
						<p style={{ fontSize: '18px', marginBottom: '10px' }}>📭 No templates yet</p>
						<p>Get started by creating your first email template!</p>
						<button className="btn-create" onClick={onCreateNew} style={{ marginTop: '20px' }}>
							+ Create Template
						</button>
					</div>
				) : (
					<table className="template-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Category</th>
								<th>From Email</th>
								<th>Updated</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{templates.map((template) => (
								<tr key={template.id}>
									<td>
										<div className="template-name">{template.name}</div>
										{template.description && (
											<div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
												{template.description}
											</div>
										)}
									</td>
									<td>
										<span className={`template-category ${getCategoryColor(template.category)}`}>
											{getCategoryLabel(template.category)}
										</span>
									</td>
									<td style={{ fontSize: '12px' }}>{template.fromEmail}</td>
									<td style={{ fontSize: '12px', color: '#666' }}>
										{formatDate(template.updatedAt)}
									</td>
									<td>
										<div className="template-actions">
											<button
												className="btn-small btn-edit"
												onClick={() => onEdit(template.id)}
											>
												✏️ Edit
											</button>
											<button
												className="btn-small btn-duplicate"
												onClick={() => handleDuplicate(template.id)}
												title="Duplicate template"
											>
												📋 Duplicate
											</button>
											<button
												className="btn-small btn-delete"
												onClick={() => handleDelete(template.id)}
											>
												🗑️ Delete
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
