/**
 * Shared TinyMCE config for email template editor
 * Clean toolbar, email-safe fonts, inline styles for email compatibility
 * Reusable for Post/Content and other screens with image upload
 */

// Allowed image formats (backend can override)
export const IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const IMAGE_MAX_SIZE_MB = 5;

export function getEmailEditorConfig(editorRef, options = {}) {
	const {
		placeholder = 'Compose your email template here...',
		height = 500,
		showVariablesTip = true
	} = options;

	return {
		base_url: '/tinymce',
		height: Math.max(height, 450),
		menubar: 'edit view insert format table help',
		external_plugins: {
			chart: '/chart-plugin/plugin.js'
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
			'wordcount'
		],
		toolbar:
			'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
			'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
			'link image chart table | forecolor backcolor removeformat | code fullscreen help',
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
			'img.align-left { float: left; } img.align-right { float: right; }',
		placeholder,
		link_default_target: '_blank',
		link_assume_external_targets: 'https',
		// Paste: preserve lists, bullets, indentation (Word uchun)
		paste_as_text: false,
		paste_merge_formats: false,
		paste_remove_styles_if_webkit: false,
		paste_webkit_styles: 'all',
		paste_tab_spaces: 4,
		// Ensure list structure (ul, ol, li) is preserved
		extended_valid_elements:
			'ul[class|style|type],ol[class|style|type|start],li[class|style|value],' +
			'span[class|style],p[class|style|align],div[class|style|align]',
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
