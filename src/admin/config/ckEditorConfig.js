/**
 * CKEditor 5 config for email template editor
 * All features: formatting, lists, tables, images, font, paste from Word
 */

import {
	ClassicEditor,
	Essentials,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Paragraph,
	Heading,
	List,
	Indent,
	IndentBlock,
	Alignment,
	Link,
	Image,
	ImageInsert,
	ImageUpload,
	ImageStyle,
	ImageToolbar,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,
	Font,
	FontFamily,
	FontSize,
	FontColor,
	FontBackgroundColor,
	RemoveFormat,
	SourceEditing,
	PasteFromOffice,
	Fullscreen,
	WordCount,
	Undo,
	Base64UploadAdapter
} from 'ckeditor5';

export const ckEditorPlugins = [
	Essentials,
	Paragraph,
	Heading,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Alignment,
	List,
	Indent,
	IndentBlock,
	Link,
	Image,
	ImageInsert,
	ImageUpload,
	ImageStyle,
	ImageToolbar,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,
	Font,
	FontFamily,
	FontSize,
	FontColor,
	FontBackgroundColor,
	RemoveFormat,
	SourceEditing,
	PasteFromOffice,
	Fullscreen,
	WordCount,
	Undo,
	Base64UploadAdapter
];

export const ckEditorToolbar = [
	'undo', 'redo', '|',
	'heading', '|',
	'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
	'bold', 'italic', 'underline', 'strikethrough', '|',
	'alignment', '|',
	'bulletedList', 'numberedList', 'outdent', 'indent', '|',
	'link', 'uploadImage', 'insertTable', '|',
	'removeFormat', 'sourceEditing', 'fullscreen', '|',
	'wordCount'
];

export function getCkEditorConfig(options = {}) {
	const { placeholder = 'Compose your email template here...' } = options;

	return {
		licenseKey: 'GPL',
		placeholder,
		toolbar: ckEditorToolbar,
		heading: {
			options: [
				{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
				{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
				{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
			]
		},
		fontSize: {
			options: ['12', '14', '16', '18', '20', '24'],
			supportAllValues: false
		},
		fontFamily: {
			options: [
				'Arial',
				'Verdana',
				'Georgia',
				'Times New Roman',
				'Courier New',
				'Tahoma',
				'Trebuchet MS'
			],
			supportAllValues: false
		},
		link: {
			defaultProtocol: 'https://',
			addTargetToExternalLinks: true
		},
		image: {
			toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative', 'toggleImageCaption'],
			upload: {
				types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
			}
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
		},
		htmlSupport: {
			allow: [
				{ name: 'img', attributes: true, classes: true, styles: true },
				{ name: 'ul', attributes: true, classes: true, styles: true },
				{ name: 'ol', attributes: true, classes: true, styles: true },
				{ name: 'li', attributes: true, classes: true, styles: true },
				{ name: 'p', attributes: true, classes: true, styles: true },
				{ name: 'span', attributes: true, classes: true, styles: true },
				{ name: 'a', attributes: true, classes: true, styles: true },
				{ name: 'table', attributes: true, classes: true, styles: true },
				{ name: 'td', attributes: true, classes: true, styles: true },
				{ name: 'th', attributes: true, classes: true, styles: true },
				{ name: 'tr', attributes: true, classes: true, styles: true }
			]
		}
	};
}
