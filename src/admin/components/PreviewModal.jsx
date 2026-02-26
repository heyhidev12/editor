import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Preview Modal - Shows email template preview with mock data
 * Sanitizes HTML to prevent XSS (dangerouslySetInnerHTML xavfsiz)
 */
export default function PreviewModal({ isOpen, onClose, template }) {
	if (!isOpen) return null;

	// Mock data for preview
		const mockData = {
		username: 'John Doe',
		email: 'john@example.com',
		subscription_start_date: 'January 15, 2024',
		reset_token: 'abc123def456',
		order_id: '#12345',
			item_name: 'Standard Plan',
		qty: '1',
		price: '99.99',
		company_name: 'Acme Corp',
		support_email: 'support@acme.com',
		current_date: new Date().toLocaleDateString()
	};

	// Replace variables in content with mock data
	const previewContent = replaceVariables(template.body, mockData);

	function replaceVariables(content, data) {
		let result = content;
		Object.entries(data).forEach(([key, value]) => {
			const regex = new RegExp(`{${key}}`, 'g');
			result = result.replace(regex, value);
		});
		return result;
	}

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<div>
						<h2>Email Preview</h2>
						<p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
							{template.name}
						</p>
					</div>
					<button className="modal-close" onClick={onClose}>×</button>
				</div>

				<div className="modal-body">
					{/* Email Meta Info */}
					<div style={{
						background: '#f9f9f9',
						padding: '15px',
						borderRadius: '4px',
						marginBottom: '20px',
						fontSize: '14px',
						borderLeft: '4px solid #007bff'
					}}>
						<div style={{ marginBottom: '10px' }}>
							<strong>From:</strong> {template.fromName} &lt;{template.fromEmail}&gt;
						</div>
						<div>
							<strong>Subject:</strong> {replaceVariables(template.subject, mockData)}
						</div>
					</div>

					{/* Email Body Preview - same CSS as editor (email-preview.css) for identical bullets/lists */}
					<div style={{ marginBottom: '20px' }}>
						<h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
							Email Body:
						</h3>
						{template.customCss && (
							<style dangerouslySetInnerHTML={{ __html: template.customCss }} />
						)}
						<div
							className="preview-content"
							dangerouslySetInnerHTML={{
								__html: DOMPurify.sanitize(previewContent, {
									ADD_TAGS: ['figure', 'figcaption'],
									ADD_ATTR: ['target', 'colspan', 'rowspan'],
									ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|blob|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
								})
							}}
						/>
					</div>

					{/* Mock Data Info */}
					<div style={{
						background: '#f0f7ff',
						padding: '15px',
						borderRadius: '4px',
						fontSize: '12px',
						color: '#0c5460',
						borderLeft: '4px solid #0c5460'
					}}>
						<strong>ℹ️ Note:</strong> This preview uses mock data for variables. In production, actual user data will be substituted.
					</div>
				</div>

				<div className="modal-footer">
					<button className="btn-secondary" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
