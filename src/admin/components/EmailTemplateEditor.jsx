import React, { useState, useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { ClassicEditor } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { Editor } from '@tinymce/tinymce-react';
import { getTemplate, updateTemplate, createTemplate, TEMPLATE_CATEGORIES } from '../services/templateService';
import { ckEditorPlugins, getCkEditorConfig } from '../config/ckEditorConfig';
import { getEmailEditorConfig, getEmailEditorConfigFree } from '../config/emailEditorConfig';
import { cleanEmptyListItems } from '../utils/htmlCleanup';
import VariablesPanel from './VariablesPanel';
import PreviewModal from './PreviewModal';
import ChartInsertModal from './ChartInsertModal';

/** Welcome Email: CKEditor 5 | Password Reset: TinyMCE Cloud | Order Confirmation: TinyMCE FREE */
const WELCOME_EMAIL_TEMPLATE_ID = 1;
const ORDER_CONFIRMATION_TEMPLATE_ID = 3;

export default function EmailTemplateEditor({ templateId, onSave, onCancel }) {
	const useCkEditor = templateId === WELCOME_EMAIL_TEMPLATE_ID;
	const useTinyMceFree = templateId === ORDER_CONFIRMATION_TEMPLATE_ID;
	const [isLoading, setIsLoading] = useState(templateId ? true : false);
	const [isSaving, setIsSaving] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [showChartModal, setShowChartModal] = useState(false);
	const [message, setMessage] = useState(null);
	const [editorReady, setEditorReady] = useState(false);
	const editorRef = useRef(null);

	const [formData, setFormData] = useState({
		name: '',
		description: '',
		category: 'MARKETING',
		fromName: '',
		fromEmail: '',
		subject: '',
		body: '',
		customCss: ''
	});

	const [errors, setErrors] = useState({});
	const [contentView, setContentView] = useState('editor'); // 'editor' | 'html' | 'css'

	// Load template if editing
	useEffect(() => {
		setEditorReady(false);
		editorRef.current = null;
		if (templateId) {
			loadTemplate();
		} else {
			setIsLoading(false);
		}
	}, [templateId]);

	async function loadTemplate() {
		try {
			setIsLoading(true);
			const template = await getTemplate(templateId);
			setFormData({
				name: template.name,
				description: template.description,
				category: template.category,
				fromName: template.fromName,
				fromEmail: template.fromEmail,
				subject: template.subject,
				body: template.body,
				customCss: template.customCss || ''
			});
		} catch (error) {
			showMessage('Failed to load template', 'error');
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}

	function showMessage(text, type = 'success') {
		setMessage({ text, type });
		setTimeout(() => setMessage(null), 4000);
	}

	function validateForm() {
		const newErrors = {};

		if (!formData.name.trim()) newErrors.name = 'Template name is required';
		if (!formData.category.trim()) newErrors.category = 'Category is required';
		if (!formData.fromName.trim()) newErrors.fromName = 'From name is required';
		if (!formData.fromEmail.trim()) {
			newErrors.fromEmail = 'From email is required';
		} else if (!isValidEmail(formData.fromEmail)) {
			newErrors.fromEmail = 'Invalid email address';
		}
		if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
		if (!formData.body.trim()) newErrors.body = 'Email body is required';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}

	function isValidEmail(email) {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	}

	function handleInputChange(e) {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value
		}));
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: ''
			}));
		}
	}

	function handleEditorChange(event, editor) {
		const data = editor.getData();
		setFormData((prev) => ({
			...prev,
			body: data
		}));
		if (errors.body) {
			setErrors((prev) => ({
				...prev,
				body: ''
			}));
		}
	}

	function handleInsertVariable(variableName) {
		const editor = editorRef.current;
		if (!editor) return;
		const variableText = `{${variableName}}`;
		if (useCkEditor) {
			editor.model.change((writer) => {
				const insertPosition = editor.model.document.selection.getFirstPosition();
				const textNode = writer.createText(variableText);
				editor.model.insertContent(textNode, insertPosition);
			});
			editor.editing.view.focus();
		} else {
			editor.insertContent(variableText);
			editor.focus();
		}
	}

	function handleInsertChart(dataUrl) {
		const editor = editorRef.current;
		if (editor && useCkEditor) {
			editor.execute('insertImage', { source: [{ src: dataUrl }] });
			editor.editing.view.focus();
		}
	}

	async function handleSave(andPreview = false) {
		if (!validateForm()) {
			showMessage('Please fill in all required fields', 'error');
			return;
		}

		try {
			setIsSaving(true);
			const editor = editorRef.current;
			let bodyToSave = formData.body;
			if (editor && contentView === 'editor') {
				if (useCkEditor) {
					bodyToSave = editor.getData();
				} else {
					await editor.uploadImages();
					bodyToSave = editor.getContent();
				}
			}
			bodyToSave = cleanEmptyListItems(bodyToSave);
			const dataToSave = { ...formData, body: bodyToSave };

			if (templateId) {
				await updateTemplate(templateId, dataToSave);
				showMessage('Template updated successfully!', 'success');
			} else {
				await createTemplate(dataToSave);
				showMessage('Template created successfully!', 'success');
			}

			if (andPreview) {
				setFormData((prev) => ({ ...prev, body: bodyToSave }));
				setShowPreview(true);
			} else if (onSave) {
				onSave();
			}
		} catch (error) {
			showMessage('Failed to save template', 'error');
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	}

	if (isLoading) {
		return (
			<div className="email-editor-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
				<div className="loading" style={{ margin: '0 auto 20px' }}></div>
				<p>Loading template...</p>
			</div>
		);
	}

	const editorConfig = {
		...getCkEditorConfig({ placeholder: 'Compose your email template here...' }),
		plugins: ckEditorPlugins
	};

	return (
		<div className="email-editor-container">
			{message && (
				<div className={`alert alert-${message.type}`}>
					{message.type === 'success' && '✓ '}
					{message.type === 'error' && '✗ '}
					{message.text}
				</div>
			)}

			{/* Basic Information Section */}
			<div className="form-section">
				<h3>📝 Basic Information</h3>

				<div className="form-row">
					<div className="form-group">
						<label>
							Template Name <span className="required">*</span>
						</label>
						<input
							type="text"
							name="name"
							value={formData.name}
							onChange={handleInputChange}
							placeholder="e.g., Welcome Email"
							style={errors.name ? { borderColor: '#dc3545' } : {}}
						/>
						{errors.name && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.name}</span>}
					</div>

					<div className="form-group">
						<label>Category <span className="required">*</span></label>
						<select
							name="category"
							value={formData.category}
							onChange={handleInputChange}
							style={errors.category ? { borderColor: '#dc3545' } : {}}
						>
							{TEMPLATE_CATEGORIES.map((cat) => (
								<option key={cat.value} value={cat.value}>
									{cat.label}
								</option>
							))}
						</select>
						{errors.category && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.category}</span>}
					</div>
				</div>

				<div className="form-row full">
					<div className="form-group">
						<label>Description (optional)</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							placeholder="Internal memo about this template..."
							style={{ minHeight: '60px' }}
						/>
					</div>
				</div>
			</div>

			{/* Email Meta Section */}
			<div className="form-section">
				<h3>📧 Email Meta</h3>

				<div className="form-row">
					<div className="form-group">
						<label>
							From Name <span className="required">*</span>
						</label>
						<input
							type="text"
							name="fromName"
							value={formData.fromName}
							onChange={handleInputChange}
							placeholder="e.g., Company Team"
							style={errors.fromName ? { borderColor: '#dc3545' } : {}}
						/>
						{errors.fromName && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.fromName}</span>}
					</div>

					<div className="form-group">
						<label>
							From Email <span className="required">*</span>
						</label>
						<input
							type="email"
							name="fromEmail"
							value={formData.fromEmail}
							onChange={handleInputChange}
							placeholder="e.g., noreply@company.com"
							style={errors.fromEmail ? { borderColor: '#dc3545' } : {}}
						/>
						{errors.fromEmail && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.fromEmail}</span>}
					</div>
				</div>

				<div className="form-row full">
					<div className="form-group">
						<label>
							Subject <span className="required">*</span>
						</label>
						<input
							type="text"
							name="subject"
							value={formData.subject}
							onChange={handleInputChange}
							placeholder="e.g., Welcome {username}! or Use variables like {username}, {email}, etc."
							style={errors.subject ? { borderColor: '#dc3545' } : {}}
						/>
						{errors.subject && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.subject}</span>}
					</div>
				</div>
			</div>

			{/* Email Body Editor Section */}
			<div className="form-section">
				<h3>✏️ Email Body</h3>

				<div className="editor-wrapper">
					<div className="editor-main">
						<div style={{ marginBottom: '10px' }}>
							<label className="editor-label">
								Email Content <span className="required">*</span>
							</label>
							<div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
								Create a clean, professional email template. Use the variables panel to insert dynamic content.
							</div>
						</div>

						{/* View Tabs: Editor | HTML | CSS */}
						<div className="content-view-tabs">
							<button
								type="button"
								className={`content-view-tab ${contentView === 'editor' ? 'active' : ''}`}
								onClick={() => setContentView('editor')}
							>
								Editor
							</button>
							<button
								type="button"
								className={`content-view-tab ${contentView === 'html' ? 'active' : ''}`}
								onClick={() => {
									const editor = editorRef.current;
									if (editor && contentView === 'editor') {
										const body = useCkEditor ? editor.getData() : editor.getContent();
										setFormData((prev) => ({ ...prev, body }));
									}
									setContentView('html');
								}}
							>
								HTML
							</button>
							<button
								type="button"
								className={`content-view-tab ${contentView === 'css' ? 'active' : ''}`}
								onClick={() => setContentView('css')}
							>
								CSS
							</button>
						</div>

						<div className="content-view-panel">
							{contentView === 'editor' && useCkEditor && (
								<div className="ckeditor-wrapper">
									<div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
										<button
											type="button"
											className="btn-secondary"
											style={{ padding: '8px 14px', fontSize: '13px' }}
											onClick={() => setShowChartModal(true)}
											title="Insert Chart (Bar, Line, Pie, Doughnut)"
										>
											📊 Chart
										</button>
									</div>
									<CKEditor
										editor={ClassicEditor}
										config={editorConfig}
										data={formData.body}
										onReady={(editor) => {
											editorRef.current = editor;
											setEditorReady(true);
										}}
										onChange={handleEditorChange}
									/>
								</div>
							)}
							{contentView === 'editor' && !useCkEditor && (
								<div className="tinymce-editor-wrapper">
									<Editor
										apiKey={useTinyMceFree ? undefined : '1ei9ojn93btcdb2cv2lvo5hgl7n09m02ay2i89rw77w8zyja'}
										tinymceScriptSrc={
											useTinyMceFree
												? '/tinymce/tinymce.min.js'
												: [
														'https://cdn.tiny.cloud/1/1ei9ojn93btcdb2cv2lvo5hgl7n09m02ay2i89rw77w8zyja/tinymce/8/tinymce.min.js',
														'https://cdn.tiny.cloud/1/1ei9ojn93btcdb2cv2lvo5hgl7n09m02ay2i89rw77w8zyja/tinymce/8/plugins.min.js'
													]
										}
										onInit={(evt, editor) => {
											editorRef.current = editor;
											setEditorReady(true);
										}}
										value={formData.body}
										onEditorChange={(value) => {
											setFormData((prev) => ({ ...prev, body: value }));
											if (errors.body) {
												setErrors((prev) => ({ ...prev, body: '' }));
											}
										}}
										init={
											useTinyMceFree
												? getEmailEditorConfigFree(editorRef, {
														placeholder: 'Compose your email template here...',
														height: 450
													})
												: getEmailEditorConfig(editorRef, {
														placeholder: 'Compose your email template here...',
														height: 450
													})
										}
									/>
								</div>
							)}

							{contentView === 'html' && (
								<div className="code-view-wrapper">
									<textarea
										className="code-textarea"
										value={formData.body}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												body: e.target.value
											}))
										}
										placeholder="<p>Enter your HTML here...</p>"
										spellCheck={false}
									/>
								</div>
							)}

							{contentView === 'css' && (
								<div className="code-view-wrapper">
									<textarea
										className="code-textarea"
										value={formData.customCss}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												customCss: e.target.value
											}))
										}
										placeholder="/* Custom CSS for email template */
body { font-family: Arial, sans-serif; }
p { margin: 0 0 10px 0; }"
										spellCheck={false}
									/>
								</div>
							)}
						</div>
						{errors.body && contentView === 'editor' && (
							<span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.body}</span>
						)}
						{errors.body && (contentView === 'html' || contentView === 'css') && (
							<span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.body}</span>
						)}
					</div>

					<VariablesPanel
						editorInstance={contentView === 'editor' && editorReady ? editorRef.current : null}
						onInsertVariable={handleInsertVariable}
					/>
				</div>
			</div>

			{/* Form Actions */}
			<div className="form-actions">
				<button
					className="btn-secondary"
					onClick={onCancel}
					disabled={isSaving}
				>
					Cancel
				</button>
				<button
					className="btn-secondary"
					onClick={() => {
						const editor = editorRef.current;
						if (editor && contentView === 'editor') {
							const body = useCkEditor ? editor.getData() : editor.getContent();
							setFormData((prev) => ({ ...prev, body }));
						}
						setShowPreview(true);
					}}
					disabled={isSaving}
				>
					👁️ Preview
				</button>
				<button
					className="btn-secondary"
					onClick={() => handleSave(true)}
					disabled={isSaving}
				>
					{isSaving ? (
						<>
							<span className="loading" style={{ display: 'inline-block', marginRight: '8px' }}></span>
							Saving...
						</>
					) : (
						'💾 Save & Preview'
					)}
				</button>
				<button
					className="btn-success"
					onClick={() => handleSave(false)}
					disabled={isSaving}
				>
					{isSaving ? (
						<>
							<span className="loading" style={{ display: 'inline-block', marginRight: '8px' }}></span>
							Saving...
						</>
					) : (
						'✓ Save Template'
					)}
				</button>
			</div>

			<PreviewModal
				isOpen={showPreview}
				onClose={() => setShowPreview(false)}
				template={formData}
			/>

			{useCkEditor && (
				<ChartInsertModal
					isOpen={showChartModal}
					onClose={() => setShowChartModal(false)}
					onInsert={handleInsertChart}
				/>
			)}
		</div>
	);
}
