(function () {
    tinymce.PluginManager.add('previewSeparator', function (editor) {
        // Function to check if separator exists
        var hasSeparator = function () {
            var content = editor.getContent({ format: 'raw' });
            return content.indexOf('data-preview-separator') !== -1;
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

                editor.insertContent(
                    '<div data-preview-separator="true" contenteditable="false" style="position:relative;display:flex;align-items:center;justify-content:center;margin:30px 0;padding:10px 0;cursor:default;user-select:none;">' +
                    '<div style="position:absolute;top:50%;left:0;right:0;border-top:2px dashed #bbb;z-index:1;"></div>' +
                    '<div style="position:relative;z-index:2;background:#fff;padding:4px 16px;border:1px solid #ddd;border-radius:20px;color:#666;font-size:11px;font-weight:500;box-shadow:0 2px 4px rgba(0,0,0,0.05);">' +
                    '&mdash; Preview Separator' +
                    '</div>' +
                    '</div>'
                );
            }
        });

        // Prevent editing/deleting the separator with normal typing
        editor.on('BeforeExecCommand', function (e) {
            var node = editor.selection.getNode();
            if (node && node.getAttribute && node.getAttribute('data-preview-separator') === 'true') {
                if (e.command === 'mceInsertContent') return;
            }
        });

        // Allow delete via backspace/delete key
        editor.on('keydown', function (e) {
            if (e.keyCode === 8 || e.keyCode === 46) { // backspace or delete
                var node = editor.selection.getNode();
                if (node && node.getAttribute && node.getAttribute('data-preview-separator') === 'true') {
                    e.preventDefault();
                    node.parentNode.removeChild(node);
                }
            }
        });

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
