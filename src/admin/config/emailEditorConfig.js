/**
 * Shared TinyMCE config for email template editor
 * Clean toolbar, email-safe fonts, inline styles for email compatibility
 * Reusable for Post/Content and other screens with image upload
 */

// Allowed image formats (backend can override)
export const IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const IMAGE_MAX_SIZE_MB = 5;

/** TinyMCE FREE (self-hosted) - Order Confirmation uchun, powerpaste va premium yo'q */
export function getEmailEditorConfigFree(editorRef, options = {}) {
	const base = getEmailEditorConfig(editorRef, options);
	return {
		...base,
		license_key: 'gpl',
		plugins: base.plugins.filter((p) => p !== 'powerpaste').concat('paste_prompt'),
		external_plugins: {
			...base.external_plugins,
			paste_prompt: '/paste-prompt-plugin/plugin.js'
		},
		powerpaste_word_import: undefined,
		powerpaste_html_import: undefined,
		powerpaste_allow_local_images: undefined
	};
}

export function getEmailEditorConfig(editorRef, options = {}) {
	const {
		placeholder = 'Compose your email template here...',
		height = 500,
		showVariablesTip = true
	} = options;

	return {
		height: Math.max(height, 450),
		menubar: 'edit view insert format table help',
		external_plugins: {
			chart: '/chart-plugin/plugin.js',
			previewSeparator: '/preview-separator-plugin/plugin.js'
		},
		plugins: [
			'advlist',
			'autolink',
			'lists',
			'link',
			'image',
			'chart',
			'charmap',
			'anchor',
			'searchreplace',
			'visualblocks',
			'code',
			'fullscreen',
			'insertdatetime',
			'table',
			'help',
			'media',
			'wordcount',
			'preview',
			'previewSeparator',
			'powerpaste'
		],
		toolbar:
			'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
			'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
			'link image chart media previewSeparator table | forecolor backcolor removeformat | preview code fullscreen help',
		toolbar_mode: 'sliding',
		contextmenu: 'link image chart table',
		// Email-safe fonts
		font_family_formats:
			'Arial=arial,helvetica,sans-serif; ' +
			'Verdana=verdana,sans-serif; ' +
			'Georgia=georgia,palatino,serif; ' +
			'Times New Roman=times new roman,times,serif; ' +
			'Courier New=courier new,courier,monospace; ' +
			'Tahoma=tahoma,sans-serif; ' +
			'Trebuchet MS=trebuchet ms,sans-serif',
		font_size_formats: '12px 14px 16px 18px 20px 24px',
		// Inline styles for email (avoid classes)
		formats: {
			alignleft: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign: 'left' } },
			aligncenter: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign: 'center' } },
			alignright: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign: 'right' } },
			alignjustify: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles: { textAlign: 'justify' } }
		},
		// Editor va Preview bir xil - tashqi CSS
		content_css: '/css/email-preview.css',
		content_style:
			'body, body * { word-break: keep-all; overflow-wrap: normal; white-space: normal; } ' +
			'body { font-family: Arial, sans-serif; font-size: 14px; } ' +
			'ul, ul ul, ul ul ul { margin-left: 20px; padding-left: 20px; list-style-type: disc; list-style-position: outside; } ' +
			'ol, ol ol, ol ol ol { margin-left: 20px; padding-left: 20px; list-style-type: decimal; list-style-position: outside; } ' +
			'li { margin-bottom: 6px; } ' +
			'figure.image { display: inline-block; border: 1px solid #ddd; margin: 0 2px 0 1px; background: #f5f2f0; } ' +
			'figure.image img { margin: 8px; } ' +
			'img.align-left { float: left; } img.align-right { float: right; } ' +
			'.preview-separator { position: relative; display: flex; align-items: center; justify-content: center; margin: 30px 0; user-select: none; } ' +
			'.preview-separator-line { position: absolute; top: 50%; left: 0; right: 0; border-top: 1px dashed #bbb; z-index: 1; } ' +
			'.preview-separator-badge { position: relative; z-index: 2; background: #fff; padding: 4px 16px; border: 1px solid #ddd; border-radius: 20px; color: #666; font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }',
		allow_comments: true,
		placeholder,
		link_default_target: '_blank',
		link_assume_external_targets: 'https',
		// PowerPaste: Word/Excel/HTML paste - cleans and preserves lists, bullets, indentation
		powerpaste_word_import: 'merge',
		powerpaste_html_import: 'merge',
		powerpaste_allow_local_images: true,
		// Fallback paste options (PowerPaste handles most)
		paste_as_text: false,
		paste_merge_formats: false,
		paste_remove_styles_if_webkit: false,
		paste_webkit_styles: 'all',
		paste_tab_spaces: 4,
		// Ensure list structure (ul, ol, li) is preserved
		extended_valid_elements:
			'ul[class|style|type],ol[class|style|type|start],li[class|style|value],' +
			'span[class|style|contenteditable],p[class|style|align],div[class|style|align|data-mce-bogus|contenteditable],' +
			'iframe[src|width|height|frameborder|allow|allowfullscreen|style|class|title|loading|referrerpolicy]',
		// Image: drag & drop + file picker (paste/drop use images_upload_handler)
		automatic_uploads: true,
		paste_data_images: true,
		file_picker_types: 'image',
		images_upload_handler: (blobInfo, progress) => {
			const blob = blobInfo.blob();
			if (!IMAGE_ALLOWED_TYPES.includes(blob.type)) {
				return Promise.reject(new Error('Allowed formats: JPEG, PNG, GIF, WebP'));
			}
			if (blob.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
				return Promise.reject(new Error(`Image must be under ${IMAGE_MAX_SIZE_MB}MB`));
			}
			return Promise.resolve('data:' + blob.type + ';base64,' + blobInfo.base64());
		},
		file_picker_callback: (callback, value, meta) => {
			if (meta.filetype !== 'image') return;
			const editor = editorRef?.current;
			if (!editor) return;

			const input = document.createElement('input');
			input.setAttribute('type', 'file');
			input.setAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp');
			input.onchange = function () {
				const file = this.files[0];
				if (!file) return;

				// Format validation
				if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
					editor.notificationManager.open({
						text: `Allowed formats: JPEG, PNG, GIF, WebP`,
						type: 'error'
					});
					return;
				}

				// Size validation (MB)
				if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
					editor.notificationManager.open({
						text: `Image must be under ${IMAGE_MAX_SIZE_MB}MB`,
						type: 'error'
					});
					return;
				}

				const reader = new FileReader();
				reader.onload = function () {
					const id = 'blobid' + Date.now();
					const blobCache = editor.editorUpload.blobCache;
					const base64 = reader.result.split(',')[1];
					const blobInfo = blobCache.create(id, file, base64);
					blobCache.add(blobInfo);
					callback(blobInfo.blobUri(), { title: file.name, alt: file.name });
				};
				reader.readAsDataURL(file);
			};
			input.click();
		}
	};
}
