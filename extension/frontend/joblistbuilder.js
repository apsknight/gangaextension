/**
 * Module for building UI for Ganga Job tab.
 * @module joblistbuilder
 */
define([
    'base/js/namespace',
    'base/js/utils',
    'base/js/dialog',
    'jquery',
    './time',
    'text!./static/joblist.html',
    'text!./static/joblistrow.html',
    'text!./static/jobdialog.html',
    'require'
], function (
    Jupyter,
    utils,
    dialog,
    $,
    time,
    joblistHTML,
    joblistRow,
    jobdialog,
    requirejs
) {
        /**
         * Function to load HTML templates, animation and sorting events.
         */
        function build_ui() {
            // const channel = new BroadcastChannel('gangajlc');
            // channel.onmessage = function (e) {
            //     console.log(e);
            // };
            var host = window.location.host; // Host URL
            var list_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist');
            var skeleton = $(joblistHTML);
            var element = $(skeleton);
            element.find('#text img').attr('src', requirejs.toUrl('./static/gangaicon.gif'));
            element.find('#select-jobs').indeterminate = true;
            var obj = new getJobs(list_endpoint, element);


            element.find('#sort-ID').click(function () {
                element.find('#sort-ID i').show().toggleClass('fa-arrow-down').toggleClass('fa-arrow-up');
                var i = 0;
                element.find('.jlist tbody tr').each(function () {
                    var row = $(this).detach();
                    if (i % 2 == 0) {
                        element.find('.jlist tbody').prepend(row);
                    }
                    else {
                        row.insertAfter(".jlist tbody tr:first")
                    }
                    i++;
                });
            });

            element.find('#refresh-job-button').click(function () {
                element.find('tbody').empty();
                element.find('#pagination').empty();
                element.find('#sort-ID i').removeClass('fa-arrow-down').removeClass('fa-arrow-up');
                obj.getData(obj.endpoint);
            });

            return element;
        }

        /**
         * @constructor - Constructor for singleton object responsible for rendering list.
         * @param {string} list_endpoint - Base endpoint url for Ganga Server Extension.
         * @param {object} element - Display Element
         */
        function getJobs(list_endpoint, element) {
            this.element = element;
            this.page = 1;
            this.size = 10; // Rows demanded per request (default to 10)
            this.currentRows = size;
            this.page_count = 0;
            this.endpoint = list_endpoint + '?size=' + this.size;

            this.getData(this.endpoint);
        }
        /**
         * Function for making asynchronous AJAX request to Ganga Server Extension
         * @param {string} endpoint 
         */
        getJobs.prototype.getData = function (endpoint) {
            var that = this;
            this.element.find('#overlay').css('display', 'block');
            $.getJSON(endpoint, function (result) {
                that.element.find('#overlay').css('display', 'none');
                that.buildList(result);
            });
        }
        /**
         * Function for creting Job List using the result obtained from AJAX request.
         * @param {object} result 
         */
        getJobs.prototype.buildList = function (result) {
            var that = this;
            that.element.find('#pagination').empty();
            that.page_count = Math.ceil(result.total_jobs / result.size);
            that.start_index = result.start;

            for (var i = 0; i < that.page_count; i++) {
                var high_bound = result.total_jobs - 1 - i * (result.size);
                var low_bound = high_bound - result.size + 1;
                var pagination = $('<span title="' + low_bound + '-' + high_bound + '"class="btn btn-xs btn-default" id="p' + (i + 1) +
                    '" style="margin: 0 2px;">' + (i + 1) + '</span>')
                that.element.find('#pagination').append(pagination);
                that.element.find('#p' + (that.page)).addClass('active disabled').css('pointer-events', 'none');
                pagination.click(function () {
                    that.resetElement();
                    that.element.find('#toggle-sort').hide();
                    that.element.find('#p' + (that.page)).removeClass('active');
                    that.element.find('#pagination').empty();
                    that.element.find('.jlist tbody').empty();
                    var page_no = $(this).attr('id').split('p')[1]
                    var endpoint_query = '?size=' + that.size + '&start=' + (result.start - (page_no - that.page) * that.size)
                    var new_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist' + endpoint_query);
                    console.log(new_endpoint);
                    that.page = page_no;
                    that.endpoint = new_endpoint;
                    that.getData(new_endpoint);
                });
            }

            $.each(result.data, function (id, jobdata) {
                var row = $(joblistRow);
                row.find('.thid').text(id);
                row.find('.thname').text(jobdata.name);
                row.find('.thbackend').text(jobdata.backend);
                row.find('.thapplication').text(jobdata.application);
                row.find('.thsubjobs').text(jobdata.file_name);
                row.find('.thstatus').html($('<span></span>').addClass(jobdata.status.toUpperCase()).text(jobdata.status.toUpperCase()));
                if (jobdata.status == 'new') {
                    row.find('.thstart').text('-');
                }
                else {
                    row.find('.thstart').text(time.format_date(jobdata.job_submission_time));
                    row.find('.thstart').attr('title', jobdata.job_submission_time + 'UTC');
                }
                if ('runtime' in jobdata && jobdata.runtime != 'None') {
                    row.find('.thtime').text(time.format_time(jobdata.runtime));
                    row.find('.thtime').attr('title', jobdata.runtime);
                }
                else {
                    row.find('.thtime').text('-');
                }
                row.find('.splitterbadge').text(jobdata.splitter);
                row.find('.subjobcount').text(jobdata.subjobs);
                if (jobdata.subjobs > 0) {
                    $.each(jobdata.subjob_status, function (subjob_id, subjobdata) {
                        var subjobrow = $('<div class="subjobrow">\
                        <span class="thsubjobid" style="display: inline-block;">Subjob ID</span>\
                        <span class="thsubjobstatus" style="display: inline-block;">Status</span>\
                        <span class="thsubjobstart" style="display: inline-block;">Submssion Time</span>\
                        <span class="thsubjobtime" style="display: inline-block;">Runtime</span>\
                    </div>')
                        subjobrow.find('.thsubjobid').text(id + '.' + subjob_id);
                        subjobrow.find('.thsubjobstatus').html($('<span></span>').addClass(subjobdata.status.toUpperCase()).text(subjobdata.status.toUpperCase()));
                        subjobrow.find('.thsubjobstart').text(time.format_date(subjobdata.subjob_submission_time));
                        if ('runtime' in subjobdata && subjobdata.runtime != 'None') {
                            subjobrow.find('.thsubjobtime').text(time.format_time(subjobdata.runtime));
                        }
                        else {
                            subjobrow.find('.thsubjobtime').text('-');
                        }
                        row.find('.subjobrows').append(subjobrow);
                        row.find('.splitterbadge').show();
                    });
                }
                else {
                    row.find('.tdstageicon').hide();
                    row.find('.thbutton').addClass('iconproxyspace');
                }
                row.find('.tdstageicon').click(function () {
                    row.find('.tdstageicon').toggleClass('tdstageiconcollapsed');
                    $(row[2]).toggle(500);
                });

                that.element.find('.jlist tbody').prepend(row);
            });

            this.element.find('#select-all-jobs').click(function () {
                that.currentRows = that.size;
                var i = 0;
                that.element.find('.jlist tbody tr').each(function () {
                    $(this).find('input:checkbox[name="job_row"]').attr('checked', false);
                    $(this).find('.tdstageicon').removeClass('tdstageiconcollapsed');
                    if (i % 2 == 0) {
                        $(this).show();
                    }
                    else {
                        $(this).hide();
                    }
                    i++;
                });
                that.resetElement();
            });
            this.element.find('#select-finished-jobs').click(function () {
                that.currentRows = that.size;
                that.element.find('.jlist tbody tr').each(function () {
                    $(this).show();
                    $(this).find('input:checkbox[name="job_row"]').attr('checked', false);
                    $(this).find('.tdstageicon').removeClass('tdstageiconcollapsed');
                    var status = $(this).find('.thstatus').text().toLowerCase();
                    that.resetElement();
                    console.log(status);
                    if (status != 'completed' && status != 'killed' && status != 'failed') {
                        $(this).hide();
                        that.currentRows--;
                    }
                });
            });
            this.element.find('#select-running-jobs').click(function () {
                that.currentRows = that.size;
                that.element.find('.jlist tbody tr').each(function () {
                    $(this).show();
                    $(this).find('input:checkbox[name="job_row"]').attr('checked', false);
                    var status = $(this).find('.thstatus').text().toLowerCase();
                    that.resetElement();
                    $(this).find('.tdstageicon').removeClass('tdstageiconcollapsed');
                    if (status != 'running' && status != 'new' && status != 'submitted') {
                        $(this).hide();
                        that.currentRows--;
                    }
                });
            });
            var that = this;
            var checkboxes = that.element.find('input:checkbox[name="job_row"]');
            var checkbox_count = checkboxes.length;
            checkboxes.change(
                function () {
                    var checked_boxes = 0;
                    for (var i = 0; i < checkbox_count; i++) {
                        if (checkboxes[i].checked) {
                            checked_boxes++;
                        }
                    }
                    that.element.find('#counter-select-jobs').text(checked_boxes);
                    if (checked_boxes > 0 && checked_boxes != that.currentRows) {
                        that.element.find('.job_toolbar_info').hide();
                        that.element.find('.dynamic_job_button button').show();
                        that.element.find('#select-jobs').prop('indeterminate', true);
                        if (checked_boxes != 1) {
                            that.element.find('#job-cancel').hide();
                            that.element.find('#open-notebook').hide();
                        }
                    }
                    else if (checked_boxes == that.currentRows) {
                        that.element.find('.job_toolbar_info').hide();
                        that.element.find('.dynamic_job_button button').show();
                        that.element.find('#job-cancel').hide();
                        that.element.find('#open-notebook').hide();
                        that.element.find('#select-jobs').prop('indeterminate', false);
                        that.element.find('#select-jobs').prop('checked', true);
                    }
                    else {
                        that.element.find('.dynamic_job_button button').hide();
                        that.element.find('.job_toolbar_info').show();
                        that.element.find('#select-jobs').prop('indeterminate', false);
                        that.element.find('#select-jobs').prop('checked', false);
                    }
                });
            var select_all = this.element.find('#select-jobs');
            var that = this;
            select_all.change(
                function () {
                    if (this.checked) {
                        that.element.find('.job_toolbar_info').hide();
                        that.element.find('.dynamic_job_button button').show();
                        that.element.find('#job-cancel').hide();
                        that.element.find('#open-notebook').hide();
                        checkboxes.filter(':visible').prop('checked', true);
                        that.element.find('#counter-select-jobs').text(that.currentRows);
                    }
                    else {
                        checkboxes.filter(':visible').prop('checked', false);
                        that.resetElement();
                    }
                }
            );
        }

        /**
         * Reset element to original state.
         */
        getJobs.prototype.resetElement = function () {
            this.element.find('.dynamic_job_button button').hide();
            this.element.find('.job_toolbar_info').show();
            this.element.find('#select-jobs').prop('indeterminate', false);
            this.element.find('#select-jobs').prop('checked', false);
            this.element.find('#counter-select-jobs').text(0);
        }

        return {
            'build_ui': build_ui
        };
    });