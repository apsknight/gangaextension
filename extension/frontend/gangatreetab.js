/**
 * Entrpoint module for Jupyter Notebook frontend extension
 * @module gangatreetab
 */

define([
    './joblistbuilder',
    './load_file',
], function(
    joblistbuilder,
    load_file
) {
    function insert_tab () {
        var tab_text = 'Ganga Jobs';
        var tab_id = 'ganga_jobs';
        load_file.load_css('./static/style.css');        
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

    function load_ipython_extension () {
        console.log('Loading Ganga Tab Extension')
        insert_tab();
    }

    return {
        load_ipython_extension : load_ipython_extension
    };
});