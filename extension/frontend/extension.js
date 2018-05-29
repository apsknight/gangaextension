/**
 * Entrpoint module for Jupyter Notebook frontend extension
 * @module extension
 */

// import GangaMonitor from './gangamonitor.js'

/**
 * Entrypoint function : Jupyter automatically detects and call this function.
 */
define([
    './gangamonitor', './cellqueue'
], function(
    GangaMonitor, CurrentCell
) {
	function load_ipython_extension() {
		console.log('GangaMonitor: Loading GangaMonitor frontend extension');
		var monitor = new GangaMonitor.GangaMonitor();
		window.ganga_monitor = monitor;
		CurrentCell.register();
	}

	return {
        load_ipython_extension: load_ipython_extension
	};
});