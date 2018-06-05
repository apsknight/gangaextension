/**
 * Module for displaying Job widget below magic cell
 * @module displaymonitor
 */

define([
    'base/js/namespace', 'require', 'base/js/events', 'jquery', 'text!./jobmonitor.html', 'moment'
], function(
    Jupyter, requirejs, events, $, WidgetHTML, moment
) {

    /**
     * Function to asynchronously load static file.
     * @param {string} name 
     */
    function load_css(name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = requirejs.toUrl(name);
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    /**
     * Converts '2018-06-03 12:00:00' to 'Today at 12:00' 
     * @param {string} date 
     */
    function format_date(date) {
        return moment().subtract(date, 'YYYY-MM-DD hh:mm:ss').calendar();
    }

    /**
     * Converts '3:33:33' to '3 hours 33 minutes 33 seconds 
     * @param {string} time 
     */
    function format_time(time) {
        var timeArray = time.toString().split(':');
        var timeString = '';
        if (timeArray[0] > 0) {
            timeString = timeString + timeArray[0] + ' hours';
        }
        if (timeArray[1] > 0) {
            timeString = timeString + timeArray[1] + ' minutes';
        }
        timeString = timeString + timeArray[2] + ' seconds';

        return timeString;
    }

    /**
     * Main singleton object for displaying frontend widget.
     * @param {GangaMonitor} monitor 
     * @param {codecell} cell 
     * @param {Object} data 
     */
    function DisplayMonitor(monitor, cell, data) {
        this.monitor = monitor;
        this.cell = cell;
        // this.initialDisplayCreated = false;
        this.displayElement = null;
        this.jobInfoData = data;
        this.subjobsCount = data.subjobs;
        this.contentVisible = true;
        this.initializeDisplay();
        this.createContent();
    };

    /**
     * Initialize display features
     */
    DisplayMonitor.prototype.initializeDisplay = function() {
        load_css('./style.css');
        var that = this;

        // Append Widget to innercell
        var element = $(WidgetHTML).hide();
        this.displayElement = element;
        this.cell.element.find('.inner_cell').append(element);
        element.slideToggle();

        // Add callback to Stop Button
        element.find('.stopbutton').click(function () {
            console.log('GangaMoniotor: Stop request initiated from displaymonitor');
            that.cancelJobRequest(that.jobInfoData);
        });

        // Add callback to close button
        element.find('.closebutton').click(function () {
            that.displayElement.remove();
        });

        // Toggle Content on Collapse button
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

    /**
     * Function to add data to a tag.
     * @param {string} identifier - .Classname or #idname  
     * @param {object} data - data to write
     * @param {string} type - HTML or TEXT
     */
    DisplayMonitor.prototype.add_data_to_tag = function (identifier, data, type) {
        var tag = this.displayElement.find(identifier)
        if (type == 'html') {
            tag.html(data);
        }
        else if (type == 'text') {
            tag.text(data);
        }
    };

    /**
     * Popularize frontend widget with Job Info.
     */
    DisplayMonitor.prototype.createContent = function () {
        var that = this;
        var data = this.jobInfoData;
        var status = $('<span></span>').addClass(data.status.toUpperCase()).text(data.status.toUpperCase()).addClass('tditemjobstatus');

        // Add Job Info to widget
        this.add_data_to_tag('.backendbadge', data.backend.toUpperCase(), 'text');
        this.add_data_to_tag('.applicationbadge', data.application.toUpperCase(), 'text');
        this.add_data_to_tag('.splitterbadge', data.splitter, 'text');
        this.add_data_to_tag('.subjobcount', data.subjobs, 'text');
        this.add_data_to_tag('.tdjobid', data.id, 'text');
        this.add_data_to_tag('.tdjobname', data.name, 'text');
        this.add_data_to_tag('.tdjobstatus', status, 'html');
        this.add_data_to_tag('.tdjobstart', format_date(data.job_submission_time), 'text');
        this.add_data_to_tag('.tdjobtime', '-', 'text');

        // Subjob Progress Bar
        if (this.subjobsCount == 0) {
            this.displayElement.find('.tdjobtasks').text('No Subjobs');
        }
        else {
            var progress = $('\<div class="cssprogress">\
                               <div class="data"></div><span class="val1"></span><span class="val2"></span></div>').addClass('tdstageitemprogress');
            this.displayElement.find('.tdjobtasks').addClass('tdstageprocess').append(progress);
            this.displayElement.find('.tdstageitemprogress .val2').width('100%');
            
            var fakerow = $('<tr><td class="stagetableoffset"></td><td colspan=7 class="stagedata"></td></tr>').addClass('jobstagedatarow').hide();
            var stagetable = $("<table class='stagetable'>\
            <thead>\
            <th class='thstageid'>Subjob ID</th>\
            <th class='thstagestatus'>Status</th>\
            <th class='thstagestart'>Submission Time</th>\
            <th class='thstageduration'>Runtime</th>\
            </thead>\
            <tbody></tbody></table>").addClass('stagetable');
            fakerow.find('.stagedata').append(stagetable);
            this.displayElement.find('.tdbutton').addClass('tdstagebutton').html('<span class="tdstageicon"></span>');
            var icon = this.displayElement.find('.tdstageicon');
            this.displayElement.find('.tdbutton').click(function () {
                icon.toggleClass('tdstageiconcollapsed');
                fakerow.slideToggle();
            })

            this.displayElement.find('.jobbody').append(fakerow);

            for (var i = 0; i < this.subjobsCount; i++) {
                var subjobrow = this.new_subjob_row();
                subjobrow.find('.tdstageid').text(this.jobInfoData.id + '.' + i);        
                subjobrow.find('.tdstagestatus').removeClass('tdstagestatus').addClass('tdstagestatus'+i);
                subjobrow.find('.tdstagestarttime').text(format_date(data.subjob_submission_time[i]));
                subjobrow.find('.tdstageduration').removeClass('tdstageduration').addClass('tdstageduration'+i).text('-');
                subjobrow.addClass('stagerow' + i);
                this.displayElement.find('.stagetable tbody').append(subjobrow);
            }
        }
    };

    /**
     * Function to create subjob row skeleton.
     */
    DisplayMonitor.prototype.new_subjob_row = function () {
        var srow = $('<tr></tr>').addClass('stagerow');
        var tdstageid = $('<td></td>').addClass('tdstageid');
        var status = $('<span></span>').addClass("NEW").text('NEW');
        var tdstatus = $('<td></td>').addClass("tdstagestatus").html(status);
        var tdstarttime = $('<td></td>').addClass('tdstagestarttime');
        var tdduration = $('<td></td>').addClass('tdstageduration');
        srow.append(tdstageid, tdstatus, tdstarttime, tdduration);
        
        return srow;
    };

    /**
     * Function to update frontend widget with current job status.
     * @param {object} data - Job Status JSON data
     */
    DisplayMonitor.prototype.updateContent = function (data) {
        // Update Job Status Badge
        var status = $('<span></span>').addClass(data.status.toUpperCase()).text(data.status.toUpperCase()).addClass('tditemjobstatus');
        this.add_data_to_tag('.tdjobstatus', status, 'html');

        // Hide stop button if Job is finished
        var endpoints = ["completed", "killed", "failed"];
        if (endpoints.includes(data.status)) {
            this.displayElement.find('.stopbutton').hide();
            if (data.status == "completed") {
                this.displayElement.find('.tdjobtime').text(format_time(data.runtime));
            }
        }

        // Update Subjob Progress Bar and Subjob status badge
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
                if (data.subjob_status[i] == "completed") {
                    this.displayElement.find('.tdstageduration' + i).text(format_time(data.subjob_runtime[i]));
                }
                var subJobStatus = $('<span></span>').addClass(data.subjob_status[i].toUpperCase()).text(data.subjob_status[i].toUpperCase()).addClass('tditemjobstatus');
                this.displayElement.find('.tdstagestatus'+i).html(subJobStatus);
            }
            val1 = (completedTask / this.subjobsCount) * 100;
            val2 = (runningTask / this.subjobsCount) * 100;
            var text = '' + completedTask + '' + ' / ' + this.subjobsCount;
            this.displayElement.find('.tdstageitemprogress .data').text(text);
            this.displayElement.find('.tdstageitemprogress .val1').width(val1 + '%');
            this.displayElement.find('.tdstageitemprogress .val2').width(val2 + '%');
        }
    };

    /**
     * Function for sending Job Cancellation request to kernel extension.
     * @param {object} data - Job Info data
     */
    DisplayMonitor.prototype.cancelJobRequest = function (data) {
        cancelMsg = {'id': data.id,
                    'msgtype': 'cancel'};
        this.monitor.send(cancelMsg);
    }

    return {
        'DisplayMonitor' : DisplayMonitor
    };
});