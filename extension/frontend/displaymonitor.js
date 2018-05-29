/**
 * Module for displaying Job widget below magic cell
 * @module displaymonitor
 */

define([
    'base/js/namespace', 'require', 'base/js/events', 'jquery', 'text!./jobmonitor.html'
], function(
    Jupyter, requirejs, events, $, WidgetHTML
) {

    function load_css(name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = requirejs.toUrl(name);
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    function DisplayMonitor(cell, data) {
        this.cell = cell;
        this.initialDisplayCreated = false;
        this.displayElement = null;
        this.jobData = data;
        this.displayVisible = false;
        this.contentVisible = true;
        this.initializeDisplay();
    };

    DisplayMonitor.prototype.initializeDisplay = function() {
        load_css('./style.css');
        var that = this;
        var element = $(WidgetHTML).hide();
        this.displayElement = element;
        this.cell.element.find('.inner_cell').append(element);
        element.slideToggle();
        this.displayVisible = true;
        element.find('.stopbutton').click(function () {
            console.log('GangaMoniotor: Stop request initiated from displaymonitor');
        });
        element.find('.closebutton').click(function () {
            that.displayElement.remove();
        });
        element.find('.titlecollapse').click(function () {
            if (that.contentVisible) {
                that.contentVisible = false;
                that.cell.element.find('.content').slideUp({
                    queue: false,
                    duration: 400,
                    complete: function () {
                        that.cell.element.find('.headericon').addClass('headericoncollapsed');
                    }
                });
            }
            else {
                that.contentVisible = true;
                that.cell.element.find('.content').slideDown({
                    queue: false,
                    duration: 400,
                    complete: function () {
                        that.cell.element.find('.headericon').removeClass('headericoncollapsed');
                    }
                });
            }
        });
    };

    return {
        'DisplayMonitor' : DisplayMonitor,
        // 'initializeDisplay' : initializeDisplay
    };
});