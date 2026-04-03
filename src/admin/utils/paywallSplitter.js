/**
 * Paywall Content Splitter
 *
 * Splits HTML content at the paywall separator into free and paid sections.
 * Uses DOM parsing to ensure HTML integrity — no broken tags after splitting.
 *
 * Separator marker: <div data-paywall-separator="true">...</div>
 *
 * Usage:
 *   const { freeContent, paidContent, hasSeparator } = splitPaywallContent(html);
 *
 * Edge cases handled:
 *   - No separator → all content is free
 *   - Multiple separators → only the first one is used
 *   - Images, tables, embeds, iframes inside either section → preserved
 *   - Multilingual content → works (DOM-based, not regex-based)
 */

/**
 * Split raw HTML string at the paywall separator.
 * Returns { freeContent, paidContent, hasSeparator }.
 */
export function splitPaywallContent(html) {
	if (!html || typeof html !== 'string') {
		return { freeContent: html || '', paidContent: '', hasSeparator: false };
	}

	// Check for separator existence before parsing (fast path)
	if (html.indexOf('data-paywall-separator') === -1) {
		return { freeContent: html, paidContent: '', hasSeparator: false };
	}

	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const separators = doc.body.querySelectorAll('[data-paywall-separator]');

		if (separators.length === 0) {
			return { freeContent: html, paidContent: '', hasSeparator: false };
		}

		// Use only the first separator
		const separator = separators[0];

		// Remove any extra separators (use only first)
		for (let i = 1; i < separators.length; i++) {
			separators[i].remove();
		}

		// Collect free nodes (everything before separator) and paid nodes (everything after)
		const freeNodes = [];
		const paidNodes = [];
		let foundSeparator = false;

		// Walk direct children of body
		const children = Array.from(doc.body.childNodes);
		for (const child of children) {
			if (child === separator) {
				foundSeparator = true;
				continue;
			}
			if (!foundSeparator) {
				freeNodes.push(child);
			} else {
				paidNodes.push(child);
			}
		}

		// Serialize back to HTML strings
		const freeDoc = document.createElement('div');
		freeNodes.forEach((n) => freeDoc.appendChild(n.cloneNode(true)));

		const paidDoc = document.createElement('div');
		paidNodes.forEach((n) => paidDoc.appendChild(n.cloneNode(true)));

		return {
			freeContent: freeDoc.innerHTML,
			paidContent: paidDoc.innerHTML,
			hasSeparator: true
		};
	} catch {
		// Fallback: regex-based split (less safe but better than nothing)
		const regex = /<div[^>]*data-paywall-separator[^>]*>[\s\S]*?<\/div>/i;
		const parts = html.split(regex);
		if (parts.length >= 2) {
			return {
				freeContent: parts[0],
				paidContent: parts.slice(1).join(''),
				hasSeparator: true
			};
		}
		return { freeContent: html, paidContent: '', hasSeparator: false };
	}
}

/**
 * Render content based on subscription status.
 * @param {string} html - Full HTML content (may contain paywall separator)
 * @param {boolean} isSubscribed - Whether the user has a paid subscription
 * @returns {string} HTML to render
 */
export function renderPaywallContent(html, isSubscribed) {
	const { freeContent, paidContent, hasSeparator } = splitPaywallContent(html);

	if (!hasSeparator || isSubscribed) {
		// Subscribed users or no separator: return full content without the separator div
		if (!hasSeparator) return html;
		return freeContent + paidContent;
	}

	// Non-subscribed: only free content
	return freeContent;
}

/**
 * Remove extra separators from HTML, keeping only the first one.
 * Useful for sanitizing content saved from HTML view edits.
 */
export function sanitizePaywallSeparators(html) {
	if (!html || typeof html !== 'string') return html || '';
	if (html.indexOf('data-paywall-separator') === -1) return html;

	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const separators = doc.body.querySelectorAll('[data-paywall-separator]');
		for (let i = 1; i < separators.length; i++) {
			separators[i].remove();
		}
		return doc.body.innerHTML;
	} catch {
		return html;
	}
}
