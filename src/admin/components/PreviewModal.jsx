import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { cleanEmptyListItems } from '../utils/htmlCleanup';

const COLORS = [
	{ bg: 'rgba(54, 162, 235, 0.7)', border: 'rgb(54, 162, 235)' },
	{ bg: 'rgba(255, 99, 132, 0.7)', border: 'rgb(255, 99, 132)' },
	{ bg: 'rgba(255, 206, 86, 0.7)', border: 'rgb(255, 206, 86)' },
	{ bg: 'rgba(75, 192, 192, 0.7)', border: 'rgb(75, 192, 192)' },
	{ bg: 'rgba(153, 102, 255, 0.7)', border: 'rgb(153, 102, 255)' },
	{ bg: 'rgba(255, 159, 64, 0.7)', border: 'rgb(255, 159, 64)' },
	{ bg: 'rgba(199, 199, 199, 0.7)', border: 'rgb(199, 199, 199)' },
	{ bg: 'rgba(83, 102, 255, 0.7)', border: 'rgb(83, 102, 255)' },
	{ bg: 'rgba(255, 99, 255, 0.7)', border: 'rgb(255, 99, 255)' },
	{ bg: 'rgba(99, 255, 132, 0.7)', border: 'rgb(99, 255, 132)' }
];

function getColors(n) {
	const bg = [], border = [];
	for (let i = 0; i < n; i++) {
		const c = COLORS[i % COLORS.length];
		bg.push(c.bg);
		border.push(c.border);
	}
	return { bg, border };
}

/**
 * Preview Modal - Shows email template preview with mock data
 * Sanitizes HTML to prevent XSS (dangerouslySetInnerHTML xavfsiz)
 * Renders chart images as live animated Chart.js canvases
 */
export default function PreviewModal({ isOpen, onClose, template }) {
	const previewRef = useRef(null);
	const chartInstancesRef = useRef([]);

	useEffect(() => {
		if (!isOpen) {
			// Destroy chart instances on close
			chartInstancesRef.current.forEach((c) => c.destroy());
			chartInstancesRef.current = [];
			return;
		}

		// Wait for DOM to render, then find chart images
		const timer = setTimeout(() => {
			const container = previewRef.current;
			if (!container) return;

			const ChartLib = window.Chart;
			if (!ChartLib) return;

			const imgs = container.querySelectorAll('img[data-chart]');
			imgs.forEach((img) => {
				try {
					const chartData = JSON.parse(img.getAttribute('data-chart'));
					if (!chartData || !chartData.labels || !chartData.values) return;

					const { type, labels, values, title } = chartData;
					const colors = getColors(values.length);
					const isPieOrDoughnut = type === 'pie' || type === 'doughnut';

					// Create canvas to replace the image
					const canvas = document.createElement('canvas');
					canvas.width = 450;
					canvas.height = 280;
					canvas.style.maxWidth = '100%';
					canvas.style.height = 'auto';

					img.parentNode.replaceChild(canvas, img);

					const chart = new ChartLib(canvas.getContext('2d'), {
						type,
						data: {
							labels,
							datasets: [{
								label: title || 'Data',
								data: values,
								backgroundColor: colors.bg,
								borderColor: colors.border,
								borderWidth: 1
							}]
						},
						options: {
							responsive: false,
							animation: {
								duration: 1200,
								easing: 'easeOutQuart'
							},
							layout: { padding: 8 },
							plugins: {
								legend: { display: isPieOrDoughnut },
								title: {
									display: !!title,
									text: title || ''
								},
								datalabels: { display: false }
							},
							scales: (type === 'bar' || type === 'line') ? {
								y: { beginAtZero: true }
							} : {}
						}
					});

					chartInstancesRef.current.push(chart);
				} catch (e) {
					console.error('Preview chart render error:', e);
				}
			});
		}, 100);

		return () => clearTimeout(timer);
	}, [isOpen]);

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
	const bodyCleaned = cleanEmptyListItems(template.body);
	const previewContent = replaceVariables(bodyCleaned, mockData);

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
							ref={previewRef}
							className="preview-content"
							dangerouslySetInnerHTML={{
								__html: DOMPurify.sanitize(previewContent, {
									ADD_TAGS: ['figure', 'figcaption', 'iframe'],
									ADD_ATTR: [
										'target',
										'colspan',
										'rowspan',
										'src',
										'width',
										'height',
										'frameborder',
										'allow',
										'allowfullscreen',
										'style',
										'title',
										'loading',
										'referrerpolicy',
										'data-chart'
									],
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
