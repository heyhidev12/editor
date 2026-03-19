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

/**
 * Build a JSON-safe chart descriptor to embed in data-chart attribute.
 * PreviewModal uses this to render live animated charts.
 */
function buildChartData(type, labels, values, title) {
	return JSON.stringify({ type, labels, values, title });
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

/**
 * Detect if Excel data is horizontal layout:
 * - 1-3 data rows, 2+ columns, most values in first row are numeric
 * Example: headers=[may, june, july], row=[50, 32, 85]
 */
function detectLayout(headers, rows) {
	if (rows.length > 3 || headers.length < 2) return 'vertical';
	if (rows.length >= 1) {
		let numericCount = 0;
		for (let i = 0; i < headers.length; i++) {
			const val = rows[0][i];
			if (val !== null && val !== undefined && !isNaN(parseFloat(val))) {
				numericCount++;
			}
		}
		if (numericCount >= headers.length * 0.5 && numericCount >= 2) {
			return 'horizontal';
		}
	}
	return 'vertical';
}

export default function ChartInsertModal({ isOpen, onClose, onInsert }) {
	const [dataSource, setDataSource] = useState('manual'); // 'manual' | 'excel'
	const [type, setType] = useState('bar');
	const [labels, setLabels] = useState('Jan, Feb, Mar, Apr, May');
	const [values, setValues] = useState('10, 20, 15, 25, 30');
	const [title, setTitle] = useState('');
	const [error, setError] = useState(null);
	const [isInserting, setIsInserting] = useState(false);

	// Excel state
	const [excelHeaders, setExcelHeaders] = useState([]);
	const [excelRows, setExcelRows] = useState([]);
	const [excelFileName, setExcelFileName] = useState('');
	const [excelLayout, setExcelLayout] = useState('vertical'); // 'vertical' | 'horizontal'
	const [labelCol, setLabelCol] = useState(0);
	const [valueCol, setValueCol] = useState(1);
	const [dataRowIdx, setDataRowIdx] = useState(0); // for horizontal with multiple rows
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (!isOpen) {
			setError(null);
			setDataSource('manual');
			setExcelHeaders([]);
			setExcelRows([]);
			setExcelFileName('');
			setExcelLayout('vertical');
			setDataRowIdx(0);
		}
	}, [isOpen]);

	function handleExcelUpload(e) {
		const file = e.target.files[0];
		if (!file) return;

		const XLSX = window.XLSX;
		if (!XLSX) {
			setError('SheetJS (XLSX) library is not loaded. Please refresh the page.');
			return;
		}

		const reader = new FileReader();
		reader.onload = (evt) => {
			try {
				const data = new Uint8Array(evt.target.result);
				const workbook = XLSX.read(data, { type: 'array' });
				const sheetName = workbook.SheetNames[0];
				const sheet = workbook.Sheets[sheetName];
				const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

				if (!json || json.length < 1) {
					setError('Excel file is empty.');
					return;
				}

				const headers = json[0].map((h) => String(h || '').trim());
				const rows = json.slice(1).filter((row) =>
					row && row.some((cell) => cell !== null && cell !== undefined && cell !== '')
				);

				if (headers.length < 2 && rows.length < 2) {
					setError('Excel file needs at least 2 data points.');
					return;
				}

				const layout = detectLayout(headers, rows);

				setExcelHeaders(headers);
				setExcelRows(rows);
				setExcelFileName(file.name);
				setExcelLayout(layout);
				setLabelCol(0);
				setValueCol(headers.length > 1 ? 1 : 0);
				setDataRowIdx(0);
				setError(null);
			} catch (err) {
				console.error('Excel parse error:', err);
				setError('Failed to parse Excel file: ' + err.message);
			}
		};
		reader.onerror = () => setError('Failed to read file.');
		reader.readAsArrayBuffer(file);

		// Reset input so the same file can be re-selected
		if (fileInputRef.current) fileInputRef.current.value = '';
	}

	async function handleInsert() {
		let finalLabels, finalValues;

		if (dataSource === 'excel') {
			if (excelRows.length === 0 && excelHeaders.length === 0) {
				setError('Please upload an Excel file first.');
				return;
			}

			finalLabels = [];
			finalValues = [];

			if (excelLayout === 'horizontal') {
				// Horizontal: headers = labels, selected row = values
				const dataRow = excelRows[dataRowIdx] || excelRows[0];
				const len = Math.min(excelHeaders.length, MAX_POINTS);
				for (let i = 0; i < len; i++) {
					const val = parseFloat(dataRow[i]);
					if (excelHeaders[i] && !isNaN(val)) {
						finalLabels.push(excelHeaders[i]);
						finalValues.push(val);
					}
				}
			} else {
				// Vertical: pick label column + value column
				if (labelCol === valueCol) {
					setError('Labels and Values must be different columns.');
					return;
				}
				const len = Math.min(excelRows.length, MAX_POINTS);
				for (let i = 0; i < len; i++) {
					const row = excelRows[i];
					const label = row[labelCol] != null ? String(row[labelCol]).trim() : '';
					const val = parseFloat(row[valueCol]);
					if (label && !isNaN(val)) {
						finalLabels.push(label);
						finalValues.push(val);
					}
				}
			}

			if (finalLabels.length === 0) {
				setError('No valid data found. Make sure there are numeric values.');
				return;
			}
		} else {
			const labelArr = labels.split(',').map((s) => s.trim()).filter(Boolean);
			const valueArr = values.split(',').map((s) => parseFloat(s.trim()) || 0).filter((n) => !isNaN(n));

			if (labelArr.length === 0 || valueArr.length === 0) {
				setError('Please enter labels and values.');
				return;
			}

			const len = Math.min(labelArr.length, valueArr.length, MAX_POINTS);
			finalLabels = labelArr.slice(0, len);
			finalValues = valueArr.slice(0, len);
		}

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
				const chartData = buildChartData(chartType, finalLabels, finalValues, title || '');
				onInsert(imgSrc, chartData);
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

	const previewRows = excelRows.slice(0, 5);

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content chart-modal" onClick={(e) => e.stopPropagation()}>
				<h3>📊 Insert Chart</h3>

				{/* Data Source Toggle */}
				<div className="form-group">
					<label>Data Source</label>
					<div style={{ display: 'flex', gap: '8px' }}>
						<button
							type="button"
							className={dataSource === 'manual' ? 'btn-primary' : 'btn-secondary'}
							onClick={() => setDataSource('manual')}
							style={{ flex: 1 }}
						>
							Manual Entry
						</button>
						<button
							type="button"
							className={dataSource === 'excel' ? 'btn-primary' : 'btn-secondary'}
							onClick={() => setDataSource('excel')}
							style={{ flex: 1 }}
						>
							Upload Excel
						</button>
					</div>
				</div>

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

				{dataSource === 'manual' ? (
					<>
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
					</>
				) : (
					<>
						{/* Excel Upload */}
						<div className="form-group">
							<label>Upload Excel File (.xlsx, .xls, .csv)</label>
							<input
								ref={fileInputRef}
								type="file"
								accept=".xlsx,.xls,.csv"
								onChange={handleExcelUpload}
								style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
							/>
						</div>

						{/* Excel Preview */}
						{excelHeaders.length > 0 && (
							<>
								<div className="form-group">
									<label style={{ fontWeight: 600 }}>
										Data Preview — {excelFileName} ({excelRows.length} row{excelRows.length !== 1 ? 's' : ''})
									</label>
									<div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
										<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
											<thead>
												<tr>
													{excelHeaders.map((h, i) => (
														<th key={i} style={{
															border: '1px solid #ddd', padding: '4px 8px',
															background: '#f5f5f5', textAlign: 'left', whiteSpace: 'nowrap'
														}}>
															{h || `Column ${i + 1}`}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{previewRows.map((row, ri) => (
													<tr key={ri}>
														{excelHeaders.map((_, ci) => (
															<td key={ci} style={{ border: '1px solid #ddd', padding: '4px 8px' }}>
																{row[ci] != null ? String(row[ci]) : ''}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
										{excelRows.length > 5 && (
											<div style={{ color: '#888', fontSize: '11px', padding: '4px 8px' }}>
												... and {excelRows.length - 5} more rows
											</div>
										)}
									</div>
								</div>

								{/* Layout info */}
								<div style={{ color: '#0070d2', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>
									{excelLayout === 'horizontal'
										? 'Detected: Horizontal layout — headers are labels, row values are data.'
										: 'Detected: Vertical layout — select which columns to use for labels and values.'
									}
								</div>

								{excelLayout === 'horizontal' ? (
									<>
										{/* For horizontal with multiple rows, let user pick which row */}
										{excelRows.length > 1 && (
											<div className="form-group">
												<label>Data Row</label>
												<select value={dataRowIdx} onChange={(e) => setDataRowIdx(Number(e.target.value))}>
													{excelRows.map((row, i) => {
														const preview = row.slice(0, 4).map((v) => v != null ? String(v) : '').join(', ');
														return <option key={i} value={i}>Row {i + 1} ({preview}...)</option>;
													})}
												</select>
											</div>
										)}
									</>
								) : (
									/* Vertical: Column Selection */
									<div style={{ display: 'flex', gap: '12px' }}>
										<div className="form-group" style={{ flex: 1 }}>
											<label>Labels Column</label>
											<select value={labelCol} onChange={(e) => setLabelCol(Number(e.target.value))}>
												{excelHeaders.map((h, i) => (
													<option key={i} value={i}>{h || `Column ${i + 1}`}</option>
												))}
											</select>
										</div>
										<div className="form-group" style={{ flex: 1 }}>
											<label>Values Column</label>
											<select value={valueCol} onChange={(e) => setValueCol(Number(e.target.value))}>
												{excelHeaders.map((h, i) => (
													<option key={i} value={i}>{h || `Column ${i + 1}`}</option>
												))}
											</select>
										</div>
									</div>
								)}
							</>
						)}
					</>
				)}

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
