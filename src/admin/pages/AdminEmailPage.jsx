import React, { useState } from 'react';
import TemplateListPage from './TemplateListPage';
import EmailTemplateEditor from '../components/EmailTemplateEditor';

/**
 * Admin Email Templates Main Page
 * Routes between template list and editor views
 */
export default function AdminEmailPage() {
	const [view, setView] = useState('list'); // 'list', 'create', 'edit'
	const [editingTemplateId, setEditingTemplateId] = useState(null);

	function handleCreateNew() {
		setView('create');
		setEditingTemplateId(null);
	}

	function handleEdit(id) {
		setEditingTemplateId(id);
		setView('edit');
	}

	function handleSave() {
		setView('list');
		setEditingTemplateId(null);
	}

	function handleCancel() {
		setView('list');
		setEditingTemplateId(null);
	}

	return (
		<div className="admin-container">
			{/* Header */}
			<div className="admin-header">
				<h1>📧 Email Templates</h1>
				<p>Create and manage reusable email templates</p>
			</div>

			{/* Breadcrumb */}
			<div className="breadcrumb">
				<span>Admin</span>
				<span>/</span>
				<span>Email</span>
				<span>/</span>
				{view === 'list' && <span>Templates</span>}
				{view === 'create' && (
					<>
						<a onClick={() => setView('list')} style={{ cursor: 'pointer' }}>
							Templates
						</a>
						<span>/</span>
						<span>Create New</span>
					</>
				)}
				{view === 'edit' && (
					<>
						<a onClick={() => setView('list')} style={{ cursor: 'pointer' }}>
							Templates
						</a>
						<span>/</span>
						<span>Edit</span>
					</>
				)}
			</div>

			{/* Content */}
			{view === 'list' && (
				<TemplateListPage
					onCreateNew={handleCreateNew}
					onEdit={handleEdit}
				/>
			)}

			{view === 'create' && (
				<EmailTemplateEditor
					templateId={null}
					onSave={handleSave}
					onCancel={handleCancel}
				/>
			)}

			{view === 'edit' && (
				<EmailTemplateEditor
					templateId={editingTemplateId}
					onSave={handleSave}
					onCancel={handleCancel}
				/>
			)}
		</div>
	);
}
