/**
 * TinyMCE 8 Chart Plugin (Chart.js)
 * MIT - Free to use
 */
(function () {
	'use strict';

	var PluginManager = tinymce.util.Tools.resolve('tinymce.PluginManager');

	function register(editor) {
		editor.ui.registry.addButton('chart', {
			text: 'Chart',
			tooltip: 'Insert Chart',
			onAction: function () {
				openChartDialog(editor);
			}
		});

		editor.ui.registry.addMenuItem('chart', {
			text: 'Chart',
			onAction: function () {
				openChartDialog(editor);
			}
		});
	}

	function openChartDialog(editor) {
		var ChartLib = window.Chart;
		if (!ChartLib) {
			editor.notificationManager.open({
				text: 'Chart.js is not loaded. Please refresh the page.',
				type: 'error'
			});
			return;
		}

		var state = {
			type: 'bar',
			labels: 'Jan, Feb, Mar, Apr, May',
			values: '10, 20, 15, 25, 30',
			title: ''
		};

		editor.windowManager.open({
			title: 'Insert Chart',
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
						label: 'Labels (comma-separated)',
						placeholder: 'e.g. Jan, Feb, Mar, Apr, May'
					},
					{
						type: 'textarea',
						name: 'values',
						label: 'Values (comma-separated)',
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

				// Align lengths
				var len = Math.min(labels.length, values.length);
				labels = labels.slice(0, len);
				values = values.slice(0, len);

				var chartType = ['bar', 'line', 'pie', 'doughnut'].indexOf(data.type) >= 0 ? data.type : 'bar';
				renderChartToImage(editor, ChartLib, chartType, labels, values, data.title || '').then(function (imgSrc) {
					if (imgSrc) {
						editor.insertContent('<p><img src="' + imgSrc + '" alt="Chart" width="500" height="300" style="max-width:100%;height:auto;" /></p>');
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

	function renderChartToImage(editor, ChartLib, type, labels, values, title) {
		return new Promise(function (resolve) {
			var canvas = document.createElement('canvas');
			canvas.width = 500;
			canvas.height = 300;
			canvas.style.cssText = 'position:absolute;left:-9999px;top:0';
			document.body.appendChild(canvas);
			var ctx = canvas.getContext('2d');

			var config = {
				type: type,
				data: {
					labels: labels,
					datasets: [{
						label: title || 'Data',
						data: values,
						backgroundColor: [
							'rgba(54, 162, 235, 0.7)',
							'rgba(255, 99, 132, 0.7)',
							'rgba(255, 206, 86, 0.7)',
							'rgba(75, 192, 192, 0.7)',
							'rgba(153, 102, 255, 0.7)',
							'rgba(255, 159, 64, 0.7)'
						],
						borderColor: [
							'rgb(54, 162, 235)',
							'rgb(255, 99, 132)',
							'rgb(255, 206, 86)',
							'rgb(75, 192, 192)',
							'rgb(153, 102, 255)',
							'rgb(255, 159, 64)'
						],
						borderWidth: 1
					}]
				},
				options: {
					responsive: false,
					animation: false,
					plugins: {
						legend: { display: type === 'pie' || type === 'doughnut' },
						title: {
							display: !!title,
							text: title || ''
						}
					},
					scales: (type === 'bar' || type === 'line') ? {
						y: { beginAtZero: true }
					} : {}
				}
			};

			if (type === 'pie' || type === 'doughnut') {
				config.options.scales = {};
			}

			try {
				var chart = new ChartLib(ctx, config);
				// Chart.js 4 renders async - draw unique pixel so each chart has different base64 (prevents getByData reuse)
				function capture() {
					try {
						// Invisible 1px at corner - makes each chart's base64 unique so TinyMCE getByData won't reuse blob
						ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.0001) + ')';
						ctx.fillRect(499, 299, 1, 1);
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
				// Wait for Chart.js to paint (rAF + short delay for async render)
				requestAnimationFrame(function () {
					requestAnimationFrame(function () {
						setTimeout(capture, 100);
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
