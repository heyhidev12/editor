/**
 * Chart Insert Modal - Insert Chart.js charts as images into CKEditor
 * Bar, Line, Pie, Doughnut - renders to canvas, converts to data URL
 */
import React, { useState, useRef, useEffect } from 'react';

const CHART_W = 450;
const CHART_H = 280;
const MAX_POINTS = 12;
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
	const bg = [];
	const border = [];
	for (let i = 0; i < n; i++) {
		const c = COLORS[i % COLORS.length];
		bg.push(c.bg);
		border.push(c.border);
	}
	return { bg, border };
}

function renderChartToImage(ChartLib, type, labels, values, title) {
	return new Promise((resolve) => {
		const canvas = document.createElement('canvas');
		canvas.width = CHART_W;
		canvas.height = CHART_H;
		canvas.style.cssText = 'position:absolute;left:-9999px;top:0';
		document.body.appendChild(canvas);
		const ctx = canvas.getContext('2d');
		const colors = getColors(values.length);

		const isPieOrDoughnut = type === 'pie' || type === 'doughnut';
		const config = {
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
				animation: false,
				layout: { padding: 8 },
				plugins: {
					legend: { display: isPieOrDoughnut },
					title: {
						display: !!title,
						text: title || ''
					},
					datalabels: isPieOrDoughnut ? {
						display: false,
						formatter: (value, ctx) => {
							const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
							const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
							return value + ' (' + pct + '%)';
						},
						color: '#333',
						font: { size: 11, weight: 'bold' }
					} : { display: false }
				},
				scales: (type === 'bar' || type === 'line') ? {
					y: { beginAtZero: true }
				} : {}
			}
		};

		try {
			const chart = new ChartLib(ctx, config);
			function capture() {
				try {
					ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.0001) + ')';
					ctx.fillRect(CHART_W - 1, CHART_H - 1, 1, 1);
					canvas.toBlob((blob) => {
						chart.destroy();
						if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
						if (blob) {
							const reader = new FileReader();
							reader.onload = () => {
								const dataUrl = reader.result;
								resolve(dataUrl && dataUrl.length > 100 ? dataUrl : null);
							};
							reader.onerror = () => resolve(null);
							reader.readAsDataURL(blob);
						} else {
							resolve(null);
						}
					}, 'image/png');
				} catch (e2) {
					console.error('Chart capture error:', e2);
					chart.destroy();
					if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
					resolve(null);
				}
			}
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setTimeout(capture, 50);
				});
			});
		} catch (e) {
			console.error('Chart render error:', e);
			if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
			resolve(null);
		}
	});
}

export default function ChartInsertModal({ isOpen, onClose, onInsert }) {
	const [type, setType] = useState('bar');
	const [labels, setLabels] = useState('Jan, Feb, Mar, Apr, May');
	const [values, setValues] = useState('10, 20, 15, 25, 30');
	const [title, setTitle] = useState('');
	const [error, setError] = useState(null);
	const [isInserting, setIsInserting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setError(null);
		}
	}, [isOpen]);

	async function handleInsert() {
		const labelArr = labels.split(',').map((s) => s.trim()).filter(Boolean);
		const valueArr = values.split(',').map((s) => parseFloat(s.trim()) || 0).filter((n) => !isNaN(n));

		if (labelArr.length === 0 || valueArr.length === 0) {
			setError('Please enter labels and values.');
			return;
		}

		const len = Math.min(labelArr.length, valueArr.length, MAX_POINTS);
		const finalLabels = labelArr.slice(0, len);
		const finalValues = valueArr.slice(0, len);
		const chartType = ['bar', 'line', 'pie', 'doughnut'].includes(type) ? type : 'bar';

		const ChartLib = window.Chart;
		if (!ChartLib) {
			setError('Chart.js is not loaded. Please refresh the page.');
			return;
		}

		setIsInserting(true);
		setError(null);

		try {
			const imgSrc = await renderChartToImage(ChartLib, chartType, finalLabels, finalValues, title || '');
			if (imgSrc) {
				onInsert(imgSrc);
				onClose();
			} else {
				setError('Failed to create chart.');
			}
		} catch (err) {
			console.error('Chart error:', err);
			setError('Failed to create chart.');
		} finally {
			setIsInserting(false);
		}
	}

	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content chart-modal" onClick={(e) => e.stopPropagation()}>
				<h3>📊 Insert Chart</h3>

				<div className="form-group">
					<label>Chart Title (optional)</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Optional title"
					/>
				</div>

				<div className="form-group">
					<label>Chart Type</label>
					<select value={type} onChange={(e) => setType(e.target.value)}>
						<option value="bar">Bar</option>
						<option value="line">Line</option>
						<option value="pie">Pie</option>
						<option value="doughnut">Doughnut</option>
					</select>
				</div>

				<div className="form-group">
					<label>Labels (comma-separated, max {MAX_POINTS})</label>
					<textarea
						value={labels}
						onChange={(e) => setLabels(e.target.value)}
						placeholder="e.g. Jan, Feb, Mar, Apr, May"
						rows={2}
					/>
				</div>

				<div className="form-group">
					<label>Values (comma-separated, max {MAX_POINTS})</label>
					<textarea
						value={values}
						onChange={(e) => setValues(e.target.value)}
						placeholder="e.g. 10, 20, 15, 25, 30"
						rows={2}
					/>
				</div>

				{error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

				<div className="modal-actions">
					<button type="button" className="btn-secondary" onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className="btn-success"
						onClick={handleInsert}
						disabled={isInserting}
					>
						{isInserting ? 'Creating...' : 'Insert Chart'}
					</button>
				</div>
			</div>
		</div>
	);
}
