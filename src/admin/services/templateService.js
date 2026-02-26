/**
 * Mock email template data service
 * In production, this would be replaced with actual API calls
 */

let templateId = 1;

// Mock storage
let templates = [
	{
		id: 1,
		name: 'Welcome Email',
		description: 'Sent to new users when they sign up',
		category: 'MARKETING',
		fromName: 'Company Team',
		fromEmail: 'welcome@company.com',
		subject: 'Welcome to our platform, {username}!',
		body: '<h2>Hello {username},</h2><p>Welcome to our platform! We\'re excited to have you join us.</p><p>Your account has been created successfully. You can now log in and start exploring.</p><p>Best regards,<br>The Company Team</p>',
		createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
		updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
	},
	{
		id: 2,
		name: 'Password Reset',
		description: 'Sent when user requests password reset',
		category: 'SYSTEM',
		fromName: 'Security Team',
		fromEmail: 'security@company.com',
		subject: 'Reset your password',
		body: '<h2>Password Reset Request</h2><p>Hi {username},</p><p>You requested a password reset. Click the button below to create a new password.</p><p><a href="https://example.com/reset/{reset_token}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:white;text-decoration:none;border-radius:5px;">Reset Password</a></p><p>If you didn\'t request this, you can ignore this email.</p>',
		createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
		updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
	},
	{
		id: 3,
		name: 'Order Confirmation',
		description: 'Sent after successful purchase',
		category: 'NOTIFICATION',
		fromName: 'Orders Team',
		fromEmail: 'orders@company.com',
		subject: 'Order #{order_id} confirmed',
		body: '<h2>Order Confirmation</h2><p>Thank you for your purchase, {username}!</p><p>Your order #{order_id} has been confirmed and will be shipped soon.</p><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px;border:1px solid #ddd;">Item</td><td style="padding:10px;border:1px solid #ddd;">Quantity</td><td style="padding:10px;border:1px solid #ddd;">Price</td></tr><tr><td style="padding:10px;border:1px solid #ddd;">{item_name}</td><td style="padding:10px;border:1px solid #ddd;">{qty}</td><td style="padding:10px;border:1px solid #ddd;">${price}</td></tr></table>',
		createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
		updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
	}
];

/**
 * Get all templates
 */
export async function getTemplates() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(templates.map(t => ({
				...t,
				createdAt: t.createdAt.toISOString(),
				updatedAt: t.updatedAt.toISOString()
			})));
		}, 300);
	});
}

/**
 * Get single template by ID
 */
export async function getTemplate(id) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const template = templates.find(t => t.id === parseInt(id));
			if (template) {
				resolve({
					...template,
					createdAt: template.createdAt.toISOString(),
					updatedAt: template.updatedAt.toISOString()
				});
			} else {
				reject(new Error('Template not found'));
			}
		}, 300);
	});
}

/**
 * Create new template
 */
export async function createTemplate(data) {
	return new Promise((resolve) => {
		setTimeout(() => {
			const newTemplate = {
				id: ++templateId,
				...data,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			templates.push(newTemplate);
			resolve({
				...newTemplate,
				createdAt: newTemplate.createdAt.toISOString(),
				updatedAt: newTemplate.updatedAt.toISOString()
			});
		}, 300);
	});
}

/**
 * Update existing template
 */
export async function updateTemplate(id, data) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const index = templates.findIndex(t => t.id === parseInt(id));
			if (index !== -1) {
				templates[index] = {
					...templates[index],
					...data,
					id: templates[index].id,
					createdAt: templates[index].createdAt,
					updatedAt: new Date()
				};
				resolve({
					...templates[index],
					createdAt: templates[index].createdAt.toISOString(),
					updatedAt: templates[index].updatedAt.toISOString()
				});
			} else {
				reject(new Error('Template not found'));
			}
		}, 300);
	});
}

/**
 * Duplicate template by ID
 */
export async function duplicateTemplate(id) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const template = templates.find(t => t.id === parseInt(id));
			if (template) {
				const { id: _id, createdAt, updatedAt, ...data } = template;
				const duplicateData = { ...data, name: `Copy of ${data.name}` };
				createTemplate(duplicateData).then(resolve).catch(reject);
			} else {
				reject(new Error('Template not found'));
			}
		}, 300);
	});
}

/**
 * Delete template
 */
export async function deleteTemplate(id) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const index = templates.findIndex(t => t.id === parseInt(id));
			if (index !== -1) {
				templates.splice(index, 1);
				resolve({ success: true });
			} else {
				reject(new Error('Template not found'));
			}
		}, 300);
	});
}

/**
 * Get available variables for email templates
 */
export function getAvailableVariables() {
	return [
		{ name: 'username', description: 'User\'s name' },
		{ name: 'email', description: 'User\'s email address' },
		{ name: 'subscription_start_date', description: 'When subscription started' },
		{ name: 'reset_token', description: 'Password reset token' },
		{ name: 'order_id', description: 'Order number' },
		{ name: 'item_name', description: 'Product/item name' },
		{ name: 'qty', description: 'Quantity ordered' },
		{ name: 'price', description: 'Item price' },
		{ name: 'company_name', description: 'Your company name' },
		{ name: 'support_email', description: 'Support contact email' },
		{ name: 'current_date', description: 'Today\'s date' }
	];
}

// Template categories
export const TEMPLATE_CATEGORIES = [
	{ value: 'MARKETING', label: 'Marketing' },
	{ value: 'SYSTEM', label: 'System' },
	{ value: 'NOTIFICATION', label: 'Notification' }
];
