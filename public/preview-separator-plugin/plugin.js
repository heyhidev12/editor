(function () {
    tinymce.PluginManager.add('previewSeparator', function (editor) {
        // Function to check if separator exists
        const hasSeparator = () => {
            const content = editor.getContent({ format: 'raw' });
            return content.indexOf('<!--preview-separator-->') !== -1;
        };

        // Add the button
        editor.ui.registry.addButton('previewSeparator', {
            icon: 'horizontal-rule',
            tooltip: 'Divides free and paid content',
            onAction: function () {
                if (hasSeparator()) {
                    editor.notificationManager.open({
                        text: 'Only one preview separator is allowed.',
                        type: 'error'
                    });
                    return;
                }

                // Insert the visual indicator and the functional comment
                // We use data-mce-bogus="all" so TinyMCE strips the visual part on getContent()
                // We use contenteditable="false" to make it behave as a single block
                // Using inline styles as fallback to ensure visibility if CSS load is delayed
                editor.insertContent(
                    '<div class="preview-separator" data-mce-bogus="all" contenteditable="false" style="position: relative; display: flex; align-items: center; justify-content: center; margin: 30px 0; padding: 10px 0; cursor: default;">' +
                    '<div class="preview-separator-line" style="position: absolute; top: 50%; left: 0; right: 0; border-top: 1px dashed #bbb; z-index: 1; height: 1px;">&nbsp;</div>' +
                    '<div class="preview-separator-badge" style="position: relative; z-index: 2; background: #fff; padding: 4px 16px; border: 1px solid #ddd; border-radius: 20px; color: #666; font-size: 11px; font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">' +
                    '— Preview Separator' +
                    '</div>' +
                    '</div><!--preview-separator-->'
                );
            }
        });

        // Optional: Handle the case where the comment exists but visual is missing (e.g. after manual HTML edit)
        // This is a bit advanced, but let's keep it simple for now as per user request.

        return {
            getMetadata: function () {
                return {
                    name: 'Preview Separator',
                    url: 'https://example.com'
                };
            }
        };
    });
})();
