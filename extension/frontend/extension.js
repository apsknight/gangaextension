/**
 * Entrpoint module for Jupyter Notebook frontend extension and Ganga Tab in Jupyter Tree view.
 * To enable this use "jupyter nbextension enable frontend/gangatreetab --section tree" and
 * "jupyter nbextension enable frontend/gangatreetab --section notebook"
 * @module extension
 */

define([
	'./gangamonitor',
	'./cellqueue',
	'./load_file',
	'./joblistbuilder',
	'jquery'

], function(
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
		console.log('GangaMonitor: Loading GangaMonitor frontend extension');
		console.log('Loading Ganga Tab Extension')
		if($(".tab-content").length != 0) {
			// This is Tree Tab
			insert_tab();
		}
		else {
			// This is Notebook
			load_file.load_css('./static/style.css');
			var monitor = new GangaMonitor.GangaMonitor();
			window.ganga_monitor = monitor;
			CurrentCell.register();
		}
	}

	return {
        load_ipython_extension: load_ipython_extension
	};
});