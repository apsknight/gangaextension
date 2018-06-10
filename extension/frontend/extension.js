/**
 * Entrpoint module for Jupyter Notebook frontend extension
 * @module extension
 */

define([
	'./gangamonitor',
	'./cellqueue',
	'./load_file'
], function(
	GangaMonitor,
	CurrentCell,
	load_file
) {
	/**
	 * Entrypoint function : Jupyter automatically detects and call this function.
	 */
	function load_ipython_extension() {
		console.log('GangaMonitor: Loading GangaMonitor frontend extension');
		load_file.load_css('./static/style.css');
		var monitor = new GangaMonitor.GangaMonitor();
		window.ganga_monitor = monitor;
		CurrentCell.register();
	}

	return {
        load_ipython_extension: load_ipython_extension
	};
});