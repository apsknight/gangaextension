/**
 * Tree section frontend extension for Ganga Tab in Jupyter Tree view.
 * To enable this use "jupyter nbextension enable frontend/gangatreetab --section tree"
 * @module gangatreetab
 */

define([
    './joblistbuilder',
    './load_file',
    'base/js/utils',
    'services/kernels/kernel'
], function (
    joblistbuilder,
    load_file,
    utils,
    kernel
) {
        /**
         * Insert Ganga Jobs tab in tree.
         */
        function insert_tab() {
            var tab_text = 'Ganga Jobs';
            var tab_id = 'ganga_jobs';
            load_file.load_css('./static/treetab.css');
            var content = joblistbuilder.build_ui();

            $('<div/>')
                .attr('id', tab_id)
                .append(content)
                .addClass('tab-pane')
                .appendTo('.tab-content');

            var tab_link = $('<a>')
                .text(tab_text)
                .attr('href', '#' + tab_id)
                .attr('data-toggle', 'tab')
                .on('click', function (evt) {
                    window.history.pushState(null, null, '#' + tab_id);
                });

            $('<li>')
                .append(tab_link)
                .appendTo('#tabs');

            if (window.location.hash == '#' + tab_id) {
                tab_link.click();
            }
        }

        /**
         * Entrypoint function : Jupyter automatically detects and call this function.
         */
        function load_ipython_extension() {
            console.log('Loading Ganga Tab Extension')
            insert_tab();
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    });