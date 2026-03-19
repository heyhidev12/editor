/**
 * TinyMCE 8 Chart Plugin (Chart.js + Excel Upload via SheetJS)
 * MIT - Free to use
 *
 * Supports two Excel layouts:
 *   Vertical:   Column A = labels, Column B = values (many rows)
 *   Horizontal: Row 1 = labels (headers), Row 2 = values (single data row)
 */
(function () {
	'use strict';

	var PluginManager = tinymce.util.Tools.resolve('tinymce.PluginManager');
	var CHART_W = 450;
	var CHART_H = 280;
	var MAX_POINTS = 12;
	var COLORS = [
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

	// Shared state for Excel data
	var excelState = {
		headers: [],
		rows: [],
		fileName: '',
		layout: 'vertical' // 'vertical' | 'horizontal'
	};

	function register(editor) {
		editor.ui.registry.addButton('chart', {
			text: 'Chart',
			tooltip: 'Insert Chart',
			onAction: function () {
				openSourceDialog(editor);
			}
		});

		editor.ui.registry.addMenuItem('chart', {
			text: 'Chart',
			onAction: function () {
				openSourceDialog(editor);
			}
		});
	}

	/**
	 * Step 1: Choose data source — Manual entry or Excel upload
	 */
	function openSourceDialog(editor) {
		var ChartLib = window.Chart;
		if (!ChartLib) {
			editor.notificationManager.open({
				text: 'Chart.js is not loaded. Please refresh the page.',
				type: 'error'
			});
			return;
		}

		editor.windowManager.open({
			title: 'Insert Chart — Choose Data Source',
			body: {
				type: 'panel',
				items: [
					{
						type: 'htmlpanel',
						html:
							'<div style="padding:8px 0;">' +
							'<p style="margin:0 0 16px;color:#555;">Choose how to provide chart data:</p>' +
							'</div>'
					}
				]
			},
			buttons: [
				{ type: 'cancel', text: 'Cancel' },
				{
					type: 'custom',
					text: 'Manual Entry',
					name: 'manual'
				},
				{
					type: 'custom',
					text: 'Upload Excel',
					name: 'excel',
					primary: true
				}
			],
			onAction: function (api, details) {
				api.close();
				if (details.name === 'manual') {
					openManualChartDialog(editor, ChartLib);
				} else if (details.name === 'excel') {
					triggerExcelUpload(editor, ChartLib);
				}
			}
		});
	}

	/**
	 * Detect if Excel data is horizontal layout:
	 * - Only 1 data row (after header)
	 * - Header row has 2+ columns
	 * - Data row values are mostly numeric
	 */
	function detectLayout(headers, rows) {
		if (rows.length > 3 || headers.length < 2) return 'vertical';

		// Count numeric values in first data row
		if (rows.length >= 1) {
			var numericCount = 0;
			for (var i = 0; i < headers.length; i++) {
				var val = rows[0][i];
				if (val !== null && val !== undefined && !isNaN(parseFloat(val))) {
					numericCount++;
				}
			}
			// If most columns have numeric values, it's horizontal
			if (numericCount >= headers.length * 0.5 && numericCount >= 2) {
				return 'horizontal';
			}
		}

		return 'vertical';
	}

	/**
	 * Trigger hidden file input for Excel upload
	 */
	function triggerExcelUpload(editor, ChartLib) {
		if (!window.XLSX) {
			editor.notificationManager.open({
				text: 'SheetJS (XLSX) library is not loaded. Please refresh the page.',
				type: 'error'
			});
			return;
		}

		var input = document.createElement('input');
		input.type = 'file';
		input.accept = '.xlsx,.xls,.csv';
		input.style.display = 'none';
		document.body.appendChild(input);

		input.onchange = function () {
			var file = input.files[0];
			if (input.parentNode) input.parentNode.removeChild(input);
			if (!file) return;

			var reader = new FileReader();
			reader.onload = function (e) {
				try {
					var data = new Uint8Array(e.target.result);
					var workbook = window.XLSX.read(data, { type: 'array' });
					var sheetName = workbook.SheetNames[0];
					var sheet = workbook.Sheets[sheetName];
					var json = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });

					if (!json || json.length < 1) {
						editor.notificationManager.open({
							text: 'Excel file is empty.',
							type: 'error'
						});
						return;
					}

					// First row = headers
					var headers = json[0].map(function (h) { return String(h || '').trim(); });
					var rows = json.slice(1).filter(function (row) {
						return row && row.some(function (cell) { return cell !== null && cell !== undefined && cell !== ''; });
					});

					if (headers.length < 2 && rows.length < 2) {
						editor.notificationManager.open({
							text: 'Excel file needs at least 2 data points.',
							type: 'error'
						});
						return;
					}

					excelState.headers = headers;
					excelState.rows = rows;
					excelState.fileName = file.name;
					excelState.layout = detectLayout(headers, rows);

					openExcelChartDialog(editor, ChartLib);
				} catch (err) {
					console.error('Excel parse error:', err);
					editor.notificationManager.open({
						text: 'Failed to parse Excel file: ' + err.message,
						type: 'error'
					});
				}
			};
			reader.onerror = function () {
				if (input.parentNode) input.parentNode.removeChild(input);
				editor.notificationManager.open({
					text: 'Failed to read file.',
					type: 'error'
				});
			};
			reader.readAsArrayBuffer(file);
		};

		input.click();
	}

	/**
	 * Step 2 (Excel): Show preview, select options, insert chart
	 */
	function openExcelChartDialog(editor, ChartLib) {
		var headers = excelState.headers;
		var rows = excelState.rows;
		var layout = excelState.layout;

		// Build preview table HTML
		var previewRows = rows.slice(0, 5);
		var tableHtml = '<div style="margin:8px 0;max-height:150px;overflow:auto;">' +
			'<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
			'<thead><tr>' +
			headers.map(function (h) {
				return '<th style="border:1px solid #ddd;padding:4px 8px;background:#f5f5f5;text-align:left;">' +
					escapeHtml(h) + '</th>';
			}).join('') +
			'</tr></thead><tbody>' +
			previewRows.map(function (row) {
				return '<tr>' + headers.map(function (_, ci) {
					var val = row[ci] !== undefined && row[ci] !== null ? String(row[ci]) : '';
					return '<td style="border:1px solid #ddd;padding:4px 8px;">' + escapeHtml(val) + '</td>';
				}).join('') + '</tr>';
			}).join('') +
			'</tbody></table>' +
			(rows.length > 5 ? '<p style="color:#888;font-size:11px;margin:4px 0 0;">... and ' + (rows.length - 5) + ' more rows</p>' : '') +
			'</div>';

		var layoutLabel = layout === 'horizontal'
			? '<p style="margin:4px 0 8px;color:#0070d2;font-size:12px;"><strong>Detected: Horizontal layout</strong> — headers are labels, first row values are data.</p>'
			: '<p style="margin:4px 0 8px;color:#0070d2;font-size:12px;"><strong>Detected: Vertical layout</strong> — select which columns to use for labels and values.</p>';

		// Build dialog items
		var dialogItems = [
			{
				type: 'htmlpanel',
				html: '<p style="margin:0 0 4px;font-weight:600;">Data Preview:</p>' + tableHtml + layoutLabel
			},
			{
				type: 'input',
				name: 'title',
				label: 'Chart Title',
				placeholder: 'Optional title'
			},
			{
				type: 'listbox',
				name: 'type',
				label: 'Chart Type',
				items: [
					{ text: 'Bar', value: 'bar' },
					{ text: 'Line', value: 'line' },
					{ text: 'Pie', value: 'pie' },
					{ text: 'Doughnut', value: 'doughnut' }
				]
			}
		];

		var initialData = {
			title: '',
			type: 'bar'
		};

		// For horizontal layout with multiple data rows, let user pick which row
		if (layout === 'horizontal' && rows.length > 1) {
			var rowOptions = rows.map(function (row, i) {
				var preview = row.slice(0, 4).map(function (v) { return v != null ? String(v) : ''; }).join(', ');
				return { text: 'Row ' + (i + 1) + ' (' + preview + '...)', value: String(i) };
			});
			dialogItems.push({
				type: 'listbox',
				name: 'dataRow',
				label: 'Data Row',
				items: rowOptions
			});
			initialData.dataRow = '0';
		}

		// For vertical layout, add column selectors
		if (layout === 'vertical') {
			var columnOptions = headers.map(function (h, i) {
				return { text: h || 'Column ' + (i + 1), value: String(i) };
			});
			dialogItems.push({
				type: 'listbox',
				name: 'labelCol',
				label: 'Labels Column',
				items: columnOptions
			});
			dialogItems.push({
				type: 'listbox',
				name: 'valueCol',
				label: 'Values Column',
				items: columnOptions
			});
			initialData.labelCol = '0';
			initialData.valueCol = headers.length > 1 ? '1' : '0';
		}

		editor.windowManager.open({
			title: 'Chart from Excel — ' + excelState.fileName,
			size: 'medium',
			body: {
				type: 'panel',
				items: dialogItems
			},
			initialData: initialData,
			buttons: [
				{ type: 'cancel', text: 'Cancel' },
				{
					type: 'submit',
					text: 'Insert Chart',
					primary: true
				}
			],
			onSubmit: function (api) {
				var data = api.getData();
				var labels = [];
				var values = [];

				if (layout === 'horizontal') {
					// Headers = labels, selected row = values
					var rowIdx = data.dataRow ? parseInt(data.dataRow, 10) : 0;
					var dataRow = rows[rowIdx] || rows[0];
					var len = Math.min(headers.length, MAX_POINTS);
					for (var i = 0; i < len; i++) {
						var val = parseFloat(dataRow[i]);
						if (headers[i] && !isNaN(val)) {
							labels.push(headers[i]);
							values.push(val);
						}
					}
				} else {
					// Vertical: pick label column + value column
					var labelIdx = parseInt(data.labelCol, 10);
					var valueIdx = parseInt(data.valueCol, 10);

					if (labelIdx === valueIdx) {
						editor.notificationManager.open({
							text: 'Labels and Values must be different columns.',
							type: 'error'
						});
						return;
					}

					var len2 = Math.min(rows.length, MAX_POINTS);
					for (var j = 0; j < len2; j++) {
						var row = rows[j];
						var label = row[labelIdx] != null ? String(row[labelIdx]).trim() : '';
						var v = parseFloat(row[valueIdx]);
						if (label && !isNaN(v)) {
							labels.push(label);
							values.push(v);
						}
					}
				}

				if (labels.length === 0) {
					editor.notificationManager.open({
						text: 'No valid data found. Make sure the Values contain numbers.',
						type: 'error'
					});
					return;
				}

				var chartType = ['bar', 'line', 'pie', 'doughnut'].indexOf(data.type) >= 0 ? data.type : 'bar';
				renderChartToImage(ChartLib, chartType, labels, values, data.title || '').then(function (imgSrc) {
					if (imgSrc) {
						editor.insertContent(buildChartImgTag(imgSrc, chartType, labels, values, data.title || ''));
						api.close();
					} else {
						editor.notificationManager.open({
							text: 'Failed to create chart.',
							type: 'error'
						});
					}
				}).catch(function (err) {
					console.error('Chart error:', err);
					editor.notificationManager.open({
						text: 'Failed to create chart.',
						type: 'error'
					});
				});
			}
		});
	}

	/**
	 * Manual entry dialog (original flow)
	 */
	function openManualChartDialog(editor, ChartLib) {
		var state = {
			type: 'bar',
			labels: 'Jan, Feb, Mar, Apr, May',
			values: '10, 20, 15, 25, 30',
			title: ''
		};

		editor.windowManager.open({
			title: 'Insert Chart — Manual Entry',
			body: {
				type: 'panel',
				items: [
					{
						type: 'input',
						name: 'title',
						label: 'Chart Title',
						placeholder: 'Optional title'
					},
					{
						type: 'listbox',
						name: 'type',
						label: 'Chart Type',
						items: [
							{ text: 'Bar', value: 'bar' },
							{ text: 'Line', value: 'line' },
							{ text: 'Pie', value: 'pie' },
							{ text: 'Doughnut', value: 'doughnut' }
						]
					},
					{
						type: 'textarea',
						name: 'labels',
						label: 'Labels (comma-separated, max ' + MAX_POINTS + ')',
						placeholder: 'e.g. Jan, Feb, Mar, Apr, May'
					},
					{
						type: 'textarea',
						name: 'values',
						label: 'Values (comma-separated, max ' + MAX_POINTS + ')',
						placeholder: 'e.g. 10, 20, 15, 25, 30'
					}
				]
			},
			initialData: state,
			buttons: [
				{ type: 'cancel', text: 'Cancel' },
				{
					type: 'submit',
					text: 'Insert',
					primary: true
				}
			],
			onSubmit: function (api) {
				var data = api.getData();
				var labels = data.labels.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
				var values = data.values.split(',').map(function (s) { return parseFloat(s.trim()) || 0; }).filter(function (n) { return !isNaN(n); });

				if (labels.length === 0 || values.length === 0) {
					editor.notificationManager.open({
						text: 'Please enter labels and values.',
						type: 'error'
					});
					return;
				}

				var len = Math.min(labels.length, values.length, MAX_POINTS);
				labels = labels.slice(0, len);
				values = values.slice(0, len);

				var chartType = ['bar', 'line', 'pie', 'doughnut'].indexOf(data.type) >= 0 ? data.type : 'bar';
				renderChartToImage(ChartLib, chartType, labels, values, data.title || '').then(function (imgSrc) {
					if (imgSrc) {
						editor.insertContent(buildChartImgTag(imgSrc, chartType, labels, values, data.title || ''));
						api.close();
					} else {
						editor.notificationManager.open({
							text: 'Failed to create chart.',
							type: 'error'
						});
					}
				}).catch(function (err) {
					console.error('Chart error:', err);
					editor.notificationManager.open({
						text: 'Failed to create chart.',
						type: 'error'
					});
				});
			}
		});
	}

	function buildChartImgTag(imgSrc, chartType, labels, values, title) {
		var chartData = JSON.stringify({ type: chartType, labels: labels, values: values, title: title });
		var escaped = chartData.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return '<p><img src="' + imgSrc + '" alt="Chart" width="' + CHART_W + '" height="' + CHART_H + '" style="max-width:100%;height:auto;" data-chart="' + escaped + '" /></p>';
	}

	function escapeHtml(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	function getColors(n) {
		var bg = [], border = [];
		for (var i = 0; i < n; i++) {
			var c = COLORS[i % COLORS.length];
			bg.push(c.bg);
			border.push(c.border);
		}
		return { bg: bg, border: border };
	}

	function renderChartToImage(ChartLib, type, labels, values, title) {
		return new Promise(function (resolve) {
			var canvas = document.createElement('canvas');
			canvas.width = CHART_W;
			canvas.height = CHART_H;
			canvas.style.cssText = 'position:absolute;left:-9999px;top:0';
			document.body.appendChild(canvas);
			var ctx = canvas.getContext('2d');
			var colors = getColors(values.length);

			var isPieOrDoughnut = type === 'pie' || type === 'doughnut';
			var config = {
				type: type,
				data: {
					labels: labels,
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
							formatter: function (value, ctx) {
								var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
								var pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
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

			if (isPieOrDoughnut) {
				config.options.scales = {};
			}

			try {
				var chart = new ChartLib(ctx, config);
				function capture() {
					try {
						ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.0001) + ')';
						ctx.fillRect(CHART_W - 1, CHART_H - 1, 1, 1);
						canvas.toBlob(function (blob) {
							chart.destroy();
							if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
							if (blob) {
								var reader = new FileReader();
								reader.onload = function () {
									var dataUrl = reader.result;
									resolve(dataUrl && dataUrl.length > 100 ? dataUrl : null);
								};
								reader.onerror = function () { resolve(null); };
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
				requestAnimationFrame(function () {
					requestAnimationFrame(function () {
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

	PluginManager.add('chart', function (editor) {
		register(editor);
		return {};
	});
})();
