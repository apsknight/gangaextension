/**
 * Module for displaying Job widget below magic cell
 * @module displaymonitor
 */

define([
    'base/js/namespace', 'require', 'base/js/events', 'jquery', 'text!./jobmonitor.html', 'moment'
], function(
    Jupyter, requirejs, events, $, WidgetHTML, moment
) {

    function load_css(name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = requirejs.toUrl(name);
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    function DisplayMonitor(monitor, cell, data) {
        this.monitor = monitor;
        this.cell = cell;
        this.initialDisplayCreated = false;
        this.displayElement = null;
        this.jobData = data;
        this.displayVisible = false;
        this.initialData = data;
        this.contentVisible = true;
        this.initializeDisplay();
        this.createContent(data);
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
            that.cancelJobRequest(that.initialData);
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

    DisplayMonitor.prototype.createContent = function (data) {
        var that = this;
        this.subjobsCount = data.subjobs;
        var relative_time = this.getRelativeTime(data.job_submission_time);
        this.displayElement.find('.backendbadge').text(data.backend.toUpperCase());
        this.displayElement.find('.tdjobid').text(data.id);
        this.displayElement.find('.tdjobname').text(data.name);
        var status = $('<span></span>').addClass(data.status.toUpperCase()).text(data.status.toUpperCase()).addClass('tditemjobstatus');
        this.displayElement.find('.tdjobstatus').html(status);
        this.displayElement.find('.tdjobstart').text(relative_time);
        this.displayElement.find('.tdjobtime').text(data.duration);
        if (this.subjobsCount == 0) {
            this.displayElement.find('.tdjobtasks').text('No Subjobs');
        }
        else {
            var progress = $('\<div class="cssprogress">\
                               <div class="data"></div><span class="val1"></span><span class="val2"></span></div>').addClass('tdstageitemprogress');
            this.displayElement.find('.tdjobtasks').addClass('tdstageprocess').append(progress);
        }
        // if (data["subjobs"] > 0) {
        //     this.displayElement.find('.tdbutton').append('<span class="tbitem tdcollapse"><span class="tdicon"></span></span>');
        //     this.subjobContentVisible = true;

        //     that = this;                                                             
        //     this.displayElement.find('.tdcollapse').click(function () {
        //         if (that.subjobContentVisible) {
        //             that.subjobContentVisible = false;
        //             that.cell.element.find('.tdcontent').slideUp({
        //                 queue: false,
        //                 duration: 400,
        //                 complete: function () {
        //                     that.cell.element.find('.tdicon').toggleClass('tdcollapsed');
        //                 }
        //             });
        //         }
        //         else {
        //             that.subjobContentVisible = true;
        //             that.cell.element.find('.tdcontent').slideDown({
        //                 queue: false,
        //                 duration: 400,
        //                 complete: function () {
        //                     that.cell.element.find('.tdicon').toggleClass('tdiconcollapsed');
        //                 }
        //             });
        //         }
        //     });   
        // }
    };

    DisplayMonitor.prototype.updateContent = function (data) {
        var status = $('<span></span>').addClass(data.status.toUpperCase()).text(data.status.toUpperCase()).addClass('tditemjobstatus');
        this.displayElement.find('.tdjobstatus').html(status);
        if (data.status == 'completed') {
            this.displayElement.find('.stopbutton').hide();
        }
        if (this.subjobsCount > 0) {
            var val1 = 0, val2 = 0;
            var completedTask = 0, runningTask = 0;
            for(var i = 0; i < this.subjobsCount; i++) {
                if (data.subjob_status[i] == "completed") {
                    completedTask++;
                }
                else {
                    runningTask++;
                }
            }
            val1 = (completedTask / this.subjobsCount) * 100;
            val2 = (runningTask / this.subjobsCount) * 100;
            var text = '' + completedTask + '' + ' / ' + this.subjobsCount;
            this.displayElement.find('.tdstageitemprogress .data').text(text);
            this.displayElement.find('.tdstageitemprogress .val1').width(val1 + '%');
            this.displayElement.find('.tdstageitemprogress .val2').width(val2 + '%');
        }
    };

    DisplayMonitor.prototype.getRelativeTime = function (time) {
        var job_time_utc = moment.utc().format(time);
        var parse_utc_time = moment.utc(job_time_utc).toDate();
        var job_time_local = moment(parse_utc_time).local().format('YYYY-MM-DD HH:mm:ss');
        // var job_time_relative = moment(job_time_local, ["YYYY-MM-DD h:mm:ss"]).fromNow();

        return job_time_local;
    };

    DisplayMonitor.prototype.cancelJobRequest = function (data) {
        cancelMsg = {'id': data.id,
                    'msgtype': 'cancel'};
        this.monitor.send(cancelMsg);
    }

    return {
        'DisplayMonitor' : DisplayMonitor
    };
});