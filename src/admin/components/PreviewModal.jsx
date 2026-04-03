import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { cleanEmptyListItems } from '../utils/htmlCleanup';
import { splitPaywallContent } from '../utils/paywallSplitter';

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

function sanitizeHtml(html) {
	return DOMPurify.sanitize(html, {
		ADD_TAGS: ['figure', 'figcaption', 'iframe'],
		ADD_ATTR: [
			'target', 'colspan', 'rowspan', 'src', 'width', 'height',
			'frameborder', 'allow', 'allowfullscreen', 'style', 'title',
			'loading', 'referrerpolicy', 'data-chart'
		],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|blob|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
	});
}

/**
 * Preview Modal - Shows email template preview with mock data
 * Sanitizes HTML to prevent XSS
 * Supports paywall separator: splits free/paid content
 * Renders chart images as live animated Chart.js canvases
 */
export default function PreviewModal({ isOpen, onClose, template }) {
	const freeRef = useRef(null);
	const paidRef = useRef(null);
	const fullRef = useRef(null);
	const chartInstancesRef = useRef([]);
	const [isSubscribed, setIsSubscribed] = useState(true);

	useEffect(() => {
		if (!isOpen) {
			chartInstancesRef.current.forEach((c) => c.destroy());
			chartInstancesRef.current = [];
			return;
		}

		const timer = setTimeout(() => {
			const ChartLib = window.Chart;
			if (!ChartLib) return;

			// Animate charts in all visible preview containers
			[freeRef, paidRef, fullRef].forEach((ref) => {
				const container = ref.current;
				if (!container) return;

				const imgs = container.querySelectorAll('img[data-chart]');
				imgs.forEach((img) => {
					try {
						const chartData = JSON.parse(img.getAttribute('data-chart'));
						if (!chartData || !chartData.labels || !chartData.values) return;

						const { type, labels, values, title } = chartData;
						const colors = getColors(values.length);
						const isPieOrDoughnut = type === 'pie' || type === 'doughnut';

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
								animation: { duration: 1200, easing: 'easeOutQuart' },
								layout: { padding: 8 },
								plugins: {
									legend: { display: isPieOrDoughnut },
									title: { display: !!title, text: title || '' },
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
			});
		}, 100);

		return () => clearTimeout(timer);
	}, [isOpen, isSubscribed]);

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

	const bodyCleaned = cleanEmptyListItems(template.body);
	const previewContent = replaceVariables(bodyCleaned, mockData);

	// DOM-based paywall split (handles HTML integrity, images, embeds, multilingual)
	const { freeContent, paidContent, hasSeparator } = splitPaywallContent(previewContent);

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

					{/* Subscription toggle — only show when separator exists */}
					{hasSeparator && (
						<div style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							marginBottom: '16px',
							padding: '10px 16px',
							background: '#f8f9fa',
							borderRadius: '8px',
							border: '1px solid #e9ecef'
						}}>
							<span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
								Preview as:
							</span>
							<button
								type="button"
								onClick={() => setIsSubscribed(false)}
								style={{
									padding: '5px 14px',
									borderRadius: '6px',
									border: '1px solid',
									borderColor: !isSubscribed ? '#28a745' : '#dee2e6',
									background: !isSubscribed ? '#28a745' : '#fff',
									color: !isSubscribed ? '#fff' : '#666',
									fontSize: '12px',
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'all 0.15s'
								}}
							>
								Free User
							</button>
							<button
								type="button"
								onClick={() => setIsSubscribed(true)}
								style={{
									padding: '5px 14px',
									borderRadius: '6px',
									border: '1px solid',
									borderColor: isSubscribed ? '#007bff' : '#dee2e6',
									background: isSubscribed ? '#007bff' : '#fff',
									color: isSubscribed ? '#fff' : '#666',
									fontSize: '12px',
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'all 0.15s'
								}}
							>
								Subscribed User
							</button>
						</div>
					)}

					{/* Email Body Preview */}
					<div style={{ marginBottom: '20px' }}>
						<h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
							Email Body:
						</h3>
						{template.customCss && (
							<style dangerouslySetInnerHTML={{ __html: template.customCss }} />
						)}

						{hasSeparator ? (
							<>
								{/* FREE content — always visible */}
								<div style={{
									border: '2px solid #28a745',
									borderRadius: '8px',
									padding: '16px',
									position: 'relative'
								}}>
									<div style={{
										position: 'absolute',
										top: '-10px',
										left: '16px',
										background: '#28a745',
										color: '#fff',
										padding: '2px 12px',
										borderRadius: '10px',
										fontSize: '11px',
										fontWeight: '600',
										letterSpacing: '0.5px'
									}}>
										FREE PREVIEW
									</div>
									<div
										ref={freeRef}
										className="preview-content"
										dangerouslySetInnerHTML={{
											__html: sanitizeHtml(freeContent)
										}}
									/>
								</div>

								{/* Separator visual */}
								<div style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									margin: '24px 0',
									position: 'relative'
								}}>
									<div style={{
										position: 'absolute',
										top: '50%',
										left: 0,
										right: 0,
										borderTop: '2px dashed #bbb',
										zIndex: 1
									}} />
									<div style={{
										position: 'relative',
										zIndex: 2,
										background: '#fff',
										padding: '4px 16px',
										border: '1px solid #ddd',
										borderRadius: '20px',
										color: '#666',
										fontSize: '11px',
										fontWeight: 500,
										boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
									}}>
										&mdash; Preview Separator
									</div>
								</div>

								{/* PAID content — visible only for subscribed users */}
								{isSubscribed ? (
									<div style={{
										border: '2px solid #007bff',
										borderRadius: '8px',
										padding: '16px',
										position: 'relative'
									}}>
										<div style={{
											position: 'absolute',
											top: '-10px',
											left: '16px',
											background: '#007bff',
											color: '#fff',
											padding: '2px 12px',
											borderRadius: '10px',
											fontSize: '11px',
											fontWeight: '600',
											letterSpacing: '0.5px'
										}}>
											PAID CONTENT
										</div>
										<div
											ref={paidRef}
											className="preview-content"
											dangerouslySetInnerHTML={{
												__html: sanitizeHtml(paidContent)
											}}
										/>
									</div>
								) : (
									<div style={{
										border: '2px dashed #dee2e6',
										borderRadius: '8px',
										padding: '32px 16px',
										position: 'relative',
										textAlign: 'center',
										background: '#f8f9fa'
									}}>
										<div style={{
											position: 'absolute',
											top: '-10px',
											left: '16px',
											background: '#6c757d',
											color: '#fff',
											padding: '2px 12px',
											borderRadius: '10px',
											fontSize: '11px',
											fontWeight: '600',
											letterSpacing: '0.5px'
										}}>
											PAID CONTENT
										</div>
										<div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
											This content is only visible to subscribed users.
										</div>
										<div style={{
											display: 'inline-block',
											padding: '6px 20px',
											background: '#ffc107',
											color: '#333',
											borderRadius: '6px',
											fontSize: '12px',
											fontWeight: 600
										}}>
											Subscribe to unlock
										</div>
									</div>
								)}
							</>
						) : (
							<div
								ref={fullRef}
								className="preview-content"
								dangerouslySetInnerHTML={{
									__html: sanitizeHtml(previewContent)
								}}
							/>
						)}
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
