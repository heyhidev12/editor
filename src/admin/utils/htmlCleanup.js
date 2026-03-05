/**
 * Clean HTML - remove empty list items from pasted content
 * Fixes bullet list copy-paste issues (nested empty li elements)
 */
export function cleanEmptyListItems(html) {
	if (!html || typeof html !== 'string') return html;
	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		let changed = true;
		while (changed) {
			changed = false;
			doc.querySelectorAll('li').forEach((li) => {
				const hasContent = li.textContent.trim().length > 0 ||
					li.querySelector('img, table, ul, ol, a[href]');
				if (!hasContent) {
					li.remove();
					changed = true;
				}
			});
			// Remove empty ul/ol
			doc.querySelectorAll('ul, ol').forEach((list) => {
				if (list.children.length === 0) {
					list.remove();
					changed = true;
				}
			});
		}
		return doc.body.innerHTML;
	} catch {
		return html;
	}
}
