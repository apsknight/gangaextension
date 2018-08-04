/**
 * Entrpoint module for Jupyter Notebook frontend extension and Ganga Tab in Jupyter Tree view.
 * To enable this use "jupyter nbextension enable frontend/extension --section tree" and
 * "jupyter nbextension enable frontend/extension --section notebook"
 * @module extension
 */

define([
	'base/js/namespace',
	'./gangamonitor',
	'./cellqueue',
	'./load_file',
	'./joblistbuilder',
	'jquery'

], function(
	Jupyter,
	GangaMonitor,
	CurrentCell,
	load_file,
	joblistbuilder,
	$
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
            $('#ganga_jobs').show();			
        }

	/**
	 * Entrypoint function : Jupyter automatically detects and call this function.
	 */
	function load_ipython_extension() {
		if (Jupyter.notebook != null) {
			// This is notebook
			console.log('GangaMonitor: Loading GangaMonitor frontend extension');
			load_file.load_css('./static/style.css');
			var monitor = new GangaMonitor.GangaMonitor();
			window.ganga_monitor = monitor;
			CurrentCell.register();
		}
		else {
			// This is tree
			console.log('Loading Ganga Tab Extension')
			insert_tab();
		}
	}

	return {
        load_ipython_extension: load_ipython_extension
	};
});