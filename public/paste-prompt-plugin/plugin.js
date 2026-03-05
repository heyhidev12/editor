/**
 * TinyMCE Paste Formatting Options (PowerPaste-style for FREE)
 * Paste vaqtida "Remove formatting" / "Keep formatting" dialog
 */
(function () {
	'use strict';

	var PluginManager = tinymce.util.Tools.resolve('tinymce.PluginManager');

	function register(editor) {
		editor.on('paste', function (e) {
			var clipboardData = (e.originalEvent || e).clipboardData || window.clipboardData;
			if (!clipboardData) return;

			var html = clipboardData.getData('text/html');
			var plain = clipboardData.getData('text/plain');

			// Agar faqat plain text bo'lsa, dialog kerak emas
			if (!html || html.trim() === '' || html === plain) return;

			e.preventDefault();
			e.stopPropagation();

			editor.windowManager.open({
				title: 'Paste Formatting Options',
				body: {
					type: 'panel',
					items: [
						{
							type: 'htmlpanel',
							html: '<p style="margin:0 0 12px;color:#666;">Choose to keep or remove formatting in the pasted content.</p>'
						}
					]
				},
				buttons: [
					{
						type: 'custom',
						name: 'remove',
						text: 'Remove formatting',
						buttonType: 'primary'
					},
					{
						type: 'custom',
						name: 'keep',
						text: 'Keep formatting'
					},
					{ type: 'cancel', text: 'Cancel' }
				],
				onAction: function (dialogApi, details) {
					if (details.name === 'remove') {
						editor.execCommand('mceInsertContent', false, editor.dom.encode(plain || ''));
					} else if (details.name === 'keep') {
						editor.execCommand('mceInsertContent', false, html);
					}
					dialogApi.close();
				}
			});
		});
	}

	PluginManager.add('paste_prompt', function (editor) {
		register(editor);
		return {};
	});
})();
