(function () {
    tinymce.PluginManager.add('previewSeparator', function (editor) {
        var ATTR = 'data-paywall-separator';
        var SEPARATOR_HTML =
            '<div ' + ATTR + '="true" contenteditable="false" style="position:relative;display:flex;align-items:center;justify-content:center;margin:30px 0;padding:10px 0;cursor:default;user-select:none;">' +
            '<div style="position:absolute;top:50%;left:0;right:0;border-top:2px dashed #bbb;z-index:1;"></div>' +
            '<div style="position:relative;z-index:2;background:#fff;padding:4px 16px;border:1px solid #ddd;border-radius:20px;color:#666;font-size:11px;font-weight:500;box-shadow:0 2px 4px rgba(0,0,0,0.05);">' +
            '&mdash; Preview Separator' +
            '</div>' +
            '</div>';

        // Check if separator already exists in content
        function hasSeparator() {
            return editor.getBody().querySelector('[' + ATTR + ']') !== null;
        }

        // Remove duplicate separators, keep only the first
        function cleanDuplicates() {
            var seps = editor.getBody().querySelectorAll('[' + ATTR + ']');
            for (var i = 1; i < seps.length; i++) {
                seps[i].remove();
            }
        }

        // Add toolbar button
        editor.ui.registry.addButton('previewSeparator', {
            icon: 'horizontal-rule',
            tooltip: 'Divides free and paid content',
            onAction: function () {
                if (hasSeparator()) {
                    editor.notificationManager.open({
                        text: 'Only one preview separator is allowed per template.',
                        type: 'warning'
                    });
                    return;
                }
                editor.insertContent(SEPARATOR_HTML);
            }
        });

        // Add menu item (Insert menu)
        editor.ui.registry.addMenuItem('previewSeparator', {
            icon: 'horizontal-rule',
            text: 'Paywall Separator',
            onAction: function () {
                if (hasSeparator()) {
                    editor.notificationManager.open({
                        text: 'Only one preview separator is allowed per template.',
                        type: 'warning'
                    });
                    return;
                }
                editor.insertContent(SEPARATOR_HTML);
            }
        });

        // Allow delete via backspace/delete key when separator is selected
        editor.on('keydown', function (e) {
            if (e.keyCode === 8 || e.keyCode === 46) {
                var node = editor.selection.getNode();
                if (node && node.getAttribute && node.getAttribute(ATTR) === 'true') {
                    e.preventDefault();
                    editor.undoManager.transact(function () {
                        node.parentNode.removeChild(node);
                    });
                }
            }
        });

        // On content load (SetContent), clean up duplicates and ensure separator is non-editable
        editor.on('SetContent', function () {
            cleanDuplicates();
            var seps = editor.getBody().querySelectorAll('[' + ATTR + ']');
            for (var i = 0; i < seps.length; i++) {
                seps[i].setAttribute('contenteditable', 'false');
            }
        });

        // Prevent dragging the separator
        editor.on('dragstart', function (e) {
            var node = e.target;
            if (node && node.getAttribute && node.getAttribute(ATTR) === 'true') {
                e.preventDefault();
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
