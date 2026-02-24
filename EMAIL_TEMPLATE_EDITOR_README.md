# Email Template Editor - Admin Panel

A complete email template management system built with React and CKEditor 5, optimized specifically for creating and managing reusable email templates.

## 🎯 Features

### Core Functionality
- **Template Management**: Create, read, update, and delete email templates
- **Email-Optimized CKEditor**: Configured specifically for email writing with email-safe constraints
- **Template List View**: Browse all templates with filtering and sorting
- **Rich Email Editing**: Full-featured email body editor with drag & drop image support
- **Variable System**: Insert dynamic variables like {username}, {email}, etc.
- **Preview Modal**: Real-time preview of email templates with mock data

### Email-Safe Design
- **Inline Styles Only**: All styling uses inline CSS (email-client compatible)
- **Email-Safe Fonts**: Limited to Arial, Verdana, Georgia, Times New Roman
- **Numeric Font Sizes**: 12, 14, 16, 18, 20, 24px only
- **Table-Based Layouts**: Support for email-friendly table structures
- **No Advanced CSS**: No flexbox, grid, or other CSS features unsupported in email clients

### UI/UX Features
- **Responsive Design**: Works on desktop and tablet devices
- **Breadcrumb Navigation**: Clear navigation path in admin panel
- **Form Validation**: Real-time validation with error messages
- **Success Messages**: Feedback on save and delete operations
- **Loading States**: Loading indicators for async operations
- **Variables Panel**: Always-visible reference for available template variables

## 📁 File Structure

```
src/
├── admin/
│   ├── components/
│   │   ├── EmailTemplateEditor.jsx    # Main editor component
│   │   ├── VariablesPanel.jsx         # Variable reference panel
│   │   └── PreviewModal.jsx           # Email preview modal
│   ├── config/
│   │   └── emailEditorConfig.js       # CKEditor 5 email configuration
│   ├── pages/
│   │   ├── AdminEmailPage.jsx         # Main admin page with routing
│   │   └── TemplateListPage.jsx       # Template list view
│   ├── services/
│   │   └── templateService.js         # Mock data and API service
│   └── styles/
│       └── admin.css                  # Admin panel styles
├── App.jsx                            # Main app component
└── main.jsx                           # Entry point
```

## 🚀 Getting Started

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run start
```

The app will open at `http://localhost:5174/` (or next available port)

## 📋 Template Structure

Each email template contains:

### Basic Information
- **Name**: Unique identifier for the template
- **Description**: Admin memo (optional)
- **Category**: MARKETING, SYSTEM, or NOTIFICATION

### Email Meta
- **From Name**: Sender's display name
- **From Email**: Sender's email address
- **Subject**: Email subject with optional variables

### Email Body
- **Rich HTML Content**: Full CKEditor editing
- **Variable Support**: Insert {variable_name} placeholders
- **Drag & Drop**: Drop images directly into editor
- **Image Upload**: Pick and upload images
- **Table Support**: Insert tables for email layouts

## 🎨 Available Features in Editor

### Toolbar Items
- Undo / Redo
- Heading (H1-H3)
- Font Family (email-safe fonts only)
- Font Size (numeric values)
- Bold / Italic / Underline / Strikethrough
- Font Color / Background Color (hex colors)
- Link insertion
- Image insertion
- Table insertion
- Text alignment
- Bulleted / Numbered lists
- Indent / Outdent
- Source code view (HTML)

### Image Handling
- **Drag & Drop Support**: Drag images into the editor
- **File Upload**: Insert images via file picker
- **Inline Styles**: Images use inline CSS, email-safe
- **Resizing**: Resize images within the editor
- **Alignment**: Inline, left, right alignment options

## 📧 Available Variables

The following variables can be inserted into templates:

```
{username}                  - User's name
{email}                     - User's email address
{subscription_start_date}   - When subscription started
{reset_token}               - Password reset token
{order_id}                  - Order number
{item_name}                 - Product/item name
{qty}                       - Quantity ordered
{price}                     - Item price
{company_name}              - Your company name
{support_email}             - Support contact email
{current_date}              - Today's date
```

Click any variable in the Variables Panel to copy it to your clipboard.

## 🔍 Preview System

The **Save & Preview** button renders a live preview of your email:

- Replaces all variables with mock data
- Shows "From" information
- Displays email subject with resolved variables
- Renders HTML exactly as it will appear
- Simulates email client constraints

Mock data used for preview:
- `{username}` → "John Doe"
- `{email}` → "john@example.com"
- `{order_id}` → "#12345"
- And more...

## 🛠️ Configuration

### Email Editor Config
Located in `src/admin/config/emailEditorConfig.js`

Key settings:
- **Email-safe fonts**: Arial, Verdana, Georgia, Times New Roman
- **Font sizes**: 12, 14, 16, 18, 20, 24px
- **Colors**: 12-color palette optimized for emails
- **Inline styles export**: Converts content to inline CSS

### Template Categories
- **MARKETING**: Marketing campaigns and newsletters
- **SYSTEM**: Automated system notifications
- **NOTIFICATION**: User notifications and alerts

## 📝 Usage Examples

### Creating a Welcome Email

1. Click **"+ Create New Template"**
2. Fill in:
   - Name: "Welcome Email"
   - Category: "MARKETING"
   - From Name: "Company Team"
   - From Email: "welcome@company.com"
   - Subject: "Welcome to our platform, {username}!"
3. In the editor, write your welcome message
4. Use the Variables Panel to insert {username}, {email}, etc.
5. Click **"Save Template"**

### Creating a Password Reset Email

1. Create new template
2. Name: "Password Reset"
3. Category: "SYSTEM"
4. Subject: "Reset your password"
5. In editor:
   - Add heading and text
   - Insert reset link: `https://example.com/reset/{reset_token}`
6. Click **"Preview"** to see the rendered email
7. Click **"Save Template"**

### Editing Existing Templates

1. Browse the template list
2. Click **"✏️ Edit"** on any template
3. Modify content and fields
4. Click **"Save Template"** to update

## 🔌 API Integration

Currently uses mock data. To integrate with a real backend:

### Update `src/admin/services/templateService.js`

Replace mock functions with actual API calls:

```javascript
export async function getTemplates() {
  const response = await fetch('/api/templates');
  return response.json();
}

export async function createTemplate(data) {
  const response = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### Required API Endpoints

```
GET    /api/templates              - List all templates
GET    /api/templates/{id}         - Get single template
POST   /api/templates              - Create template
PUT    /api/templates/{id}         - Update template
DELETE /api/templates/{id}         - Delete template
```

### Response Format

```json
{
  "id": 1,
  "name": "Welcome Email",
  "description": "Sent to new users",
  "category": "MARKETING",
  "fromName": "Company Team",
  "fromEmail": "welcome@company.com",
  "subject": "Welcome {username}!",
  "body": "<h2>Hello {username}...</h2>",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## 🎨 Styling & Customization

### Global Admin Styles
Located in `src/admin/styles/admin.css`

Key classes:
- `.admin-container` - Main admin page wrapper
- `.email-editor-container` - Editor form container
- `.template-list-container` - Template table wrapper
- `.variables-panel` - Variables sidebar
- `.preview-content` - Email preview area

### Color Scheme
- **Primary**: #007bff (Blue)
- **Success**: #28a745 (Green)
- **Danger**: #dc3545 (Red)
- **Background**: #f5f5f5 (Light gray)

### Responsive Breakpoints
- **Desktop**: 1024px+
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

## ⚙️ Email Output

The generated email HTML:

1. **Uses inline styles** - All styling is inline CSS
2. **No CSS classes** - Avoids email client styling issues
3. **Table-based layouts** - Supports complex layouts
4. **Email-safe fonts** - Uses web-safe, email-compatible fonts
5. **Compatible images** - Inline image handling

### Generated HTML Example
```html
<h2>Welcome John Doe,</h2>
<p>Thank you for joining us!</p>
<p><a href="https://example.com" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:white;text-decoration:none;">Learn More</a></p>
```

## 🐛 Troubleshooting

### CKEditor not loading
- Check console for errors

### Images not uploading
- Verify `CLOUD_SERVICES_TOKEN_URL` is valid
- Check browser console for CORS errors

### Variables not working in preview
- Ensure variable name matches exactly (case-sensitive)
- Use format: `{variable_name}` (with curly braces)

### Styling issues in email clients
- Avoid CSS classes - use inline styles only
- Use table layouts for complex designs
- Test in target email clients
- Use email preview tools (Litmus, Email on Acid)

## 📚 Resources

- [CKEditor 5 Documentation](https://ckeditor.com/docs/ckeditor5/)
- [Email Client CSS Support](https://www.campaignmonitor.com/css/)
- [MJML Framework](https://mjml.io/) - Alternative for responsive emails
- [Email Testing Tools](https://litmus.com/)

## 📄 License

MIT

## 🤝 Contributing

To extend this template editor:

1. **Add new form fields**: Edit `EmailTemplateEditor.jsx`
2. **Add more variables**: Update `templateService.js` `getAvailableVariables()`
3. **Customize editor toolbar**: Modify `emailEditorConfig.js`
4. **Add new categories**: Update `TEMPLATE_CATEGORIES` in `templateService.js`

## 💡 Tips for Email Templates

1. **Keep it simple** - Email clients have limited CSS support
2. **Use tables for layout** - More reliable than divs
3. **Inline all styles** - Avoid external stylesheets
4. **Test thoroughly** - Preview in multiple email clients
5. **Use variables wisely** - Keep variable names lowercase and descriptive
6. **Image sizing** - Always specify width/height
7. **Responsive design** - Use max-width on tables (600px is standard)

---

**Version**: 1.0.0  
**Last Updated**: February 13, 2026
