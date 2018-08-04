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
            // API Endpoint for querying Job Info from server
            var list_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist');

            // Skeleton HTML of Jobs Page
            var skeleton = $(joblistHTML);
            var element = $(skeleton);

            // Insert Ganga Icon GIF to element. It will display while loading as overlay.
            element.find('#text img').attr('src', requirejs.toUrl('./static/gangaicon.gif'));

            // Make Select Jobs button tri-state
            element.find('#select-jobs').indeterminate = true;

            // obj is singleton object which query server and renders list.
            var obj = new getJobs(list_endpoint, element);

            // Sort Jobs Rows on the basis of Job IDs (Ascending or Descending)
            element.find('#sort-ID').click(function () {
                // Toggle between Up and Down arrow.
                element.find('#sort-ID i').toggleClass('fa-arrow-up fa-arrow-down');

                // This is tricky, there are two rows per Job (one for Job other for SubJobs)
                // so for sorting, we have to reverse
                // 5, 5', 4, 4', 3, 3', 2, 2', 1, 1'
                // to
                // 1, 1', 2, 2', 3, 3', 4, 4', 5, 5',  
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
            
            // Show 10 Jobs per page
            element.find('#jobs10').click(function () {
                element.find('tbody').empty();
                element.find('#pagination').empty();
                element.find('#sort-ID i').removeClass('fa-arrow-up'); // Default mode is descending
                obj.changeSize(10, list_endpoint);
                obj.getData(obj.endpoint);
            });

            // Show 20 Jobs per page
            element.find('#jobs20').click(function () {
                element.find('tbody').empty();
                element.find('#pagination').empty();
                element.find('#sort-ID i').removeClass('fa-arrow-up'); // Default mode is descending
                obj.changeSize(20, list_endpoint);
                obj.getData(obj.endpoint);
            });

            // Show 50 Jobs per page
            element.find('#jobs50').click(function () {
                element.find('tbody').empty();
                element.find('#pagination').empty();
                element.find('#sort-ID i').removeClass('fa-arrow-up'); // Default mode is descending
                obj.changeSize(50, list_endpoint);
                obj.getData(obj.endpoint);
            });

            // Show 100 Jobs per page
            element.find('#jobs100').click(function () {
                element.find('tbody').empty();
                element.find('#pagination').empty();
                element.find('#sort-ID i').removeClass('fa-arrow-up'); // Default mode is descending
                obj.changeSize(100, list_endpoint);
                obj.getData(obj.endpoint);
            });

            // Refresh the Job List on clicking of Refresh button.
            element.find('#refresh-job-button').click(function () {
                element.find('tbody').empty();
                element.find('#pagination').empty();
                element.find('#sort-ID i').removeClass('fa-arrow-up'); // Default mode is descending
                obj.getData(obj.endpoint);
            });
            
             // Open Logs in Iframe
            element.find('#logs').click(function (e) {
                e.preventDefault();
                element.find("iframe").attr("src", utils.url_path_join(utils.get_body_data('baseUrl'), 'view/ganga-monitoring.txt'));
                element.find(".iframe-popup").show().fadeIn('slow');
            });
            element.find(".iframe-close").click(function () {
                $(this).parent().fadeOut("slow");
            });

            // Refresh the Job List every 12 seconds to pick new updates from server.
            setInterval( function() {
                obj.getData(obj.endpoint, false);
            }, 12000 );

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
            this.size = 20; // Rows demanded per request (default to 20)
            this.currentRows = this.size;
            this.page_count = 0;
            this.endpoint = list_endpoint + '?size=' + this.size;

            this.getData(this.endpoint);
        }

        /**
         * Change Jobs per page size.
         * @param {var} size 
         */
        getJobs.prototype.changeSize = function (size, list_endpoint) {
            this.size = size;
            this.endpoint = list_endpoint + '?size=' + this.size;
        }

        /**
         * Function for making asynchronous AJAX request to Ganga Server Extension
         * @param {string} endpoint 
         */
        getJobs.prototype.getData = function (endpoint, force_refresh=true) {
            var that = this;
            // Don't show overlay during periodic refresh
            if (force_refresh) {
                this.element.find('#overlay').css('display', 'block');
            }

            // Store the selected checkbox to maintain the state after refreshing.
            this.selected = [];

            var checkboxes = this.element.find('input:checkbox[name="job_row"]');
            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    var id = $(checkboxes[i]).parent().next().text();
                    this.selected.push(id);
                }
            }

            // AJAX Request to server extension
            $.ajax({
                url: endpoint,
                dataType: 'json',
                success: function (result) {
                    that.element.find('tbody').empty();
                    that.element.find('#pagination').empty();
                    that.element.find('#overlay').css('display', 'none');
                    that.buildList(result);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    that.element.find('#overlay').css('display', 'none');
                    console.log(jqXHR, textStatus, errorThrown);
                },
                timeout: 20000
            });
        }

        /**
         * Function for creting Job List using the result obtained from AJAX request.
         * @param {object} result 
         */
        getJobs.prototype.buildList = function (result) {
            var that = this;
            // Delete existing pagination
            that.element.find('#pagination').empty();

            // Total jobs available in Ganga
            var total_jobs = parseInt(result.total_jobs);
            // Current size of maximum permssible Jobs per page.
            var size = parseInt(that.size);
            // How many pages are required for sowing all Jobs ?
            var page_count = Math.ceil(total_jobs / size);

            // Create Pagination with tooltip and link.
            for (var i = 0; i < page_count; i++) {
                // The highest Job index for current page.
                var high_bound = total_jobs - 1 - i * (size);

                // The Lowest Job index for current page.
                var low_bound = Math.max(high_bound - size + 1, 0);

                // The Pagination element with tooltip.
                var pagination = $('<span title="' + low_bound + '-' + high_bound + '"class="btn btn-xs btn-default" id="p' + (i + 1) +
                    '" style="margin: 0 2px;">' + (i + 1) + '</span>');

                that.element.find('#pagination').append(pagination);

                // Disable current page's pagination button.
                that.element.find('#p' + (that.page)).addClass('active disabled').css('pointer-events', 'none');
                
                // Click event for other page's pagination button.
                pagination.click(function () {
                    // Reset header element
                    that.resetElement();
                    // Remove current page from active mode.
                    that.element.find('#p' + (that.page)).removeClass('active');
                    // Delete current pagination
                    that.element.find('#pagination').empty();
                    // Delete current List
                    that.element.find('.jlist tbody').empty();
                    // Find page number of clicked pagination button
                    var page_no = parseInt($(this).attr('id').split('p')[1]);
                    // Endpoint for fetching data of new page.
                    // ID of latest Job = total_jobs - 1.
                    // New page will have max ID = ID of latest Job - (page no - 1) * size
                    var endpoint_query = '?size=' + that.size + '&end=' + (total_jobs - 1 - (page_no-1) * (size)); 
                    var new_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist' + endpoint_query);
                    // Update Current Page
                    that.page = page_no;
                    // Update Current Endpoint
                    that.endpoint = new_endpoint;
                    // Fetch data with new endpoint
                    that.getData(new_endpoint);
                });
            }

            // Create the Table of Jobs.
            $.each(result.data, function (id, jobdata) {
                var row = $(joblistRow);
                // If checkbox of this row was selected before periodic refreshing than also check it now.
                if (that.selected.includes(id)) {
                    row.find('input:checkbox[name="job_row"]').prop('checked', true);
                }
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

                row.find('#open-this-notebook').addClass('open' + id);
                row.find('#remove-this-job').addClass('remove' + id);

                // Function for removing this Job from Ganga Repository.
                row.find('#remove-this-job').click(function () {
                    var list_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist');
                    var endpoint = list_endpoint + '?remove=true&jobid=' + id;
                    $.getJSON(endpoint, function (result) {
                        if (result.id == id && result.remove == 'true') {
                            dialog.modal({
                                title: 'Job Removed',
                                body: 'Job #' + id + ' removed succesfully.',
                                buttons: {
                                    Okay: {}
                                }
                            });
                        }
                        else {
                            dialog.modal({
                                title: 'Job was not removed',
                                body: result.error,
                                buttons: {
                                    Okay: {}
                                }
                            });
                        }
                    });
                });

                // If subjobs are present create collapsible row for it.
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

            // Show all jobs in table.
            this.element.find('#select-all-jobs').click(function () {
                that.currentRows = result.size;
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

            // Show finished Jobs only.
            this.element.find('#select-finished-jobs').click(function () {
                that.currentRows = result.size;
                that.element.find('.jlist tbody tr').each(function () {
                    $(this).show();
                    $(this).find('input:checkbox[name="job_row"]').attr('checked', false);
                    $(this).find('.tdstageicon').removeClass('tdstageiconcollapsed');
                    var status = $(this).find('.thstatus').text().toLowerCase();
                    that.resetElement();
                    // console.log(status);
                    if (status != 'completed' && status != 'killed' && status != 'failed') {
                        $(this).hide();
                        that.currentRows--;
                    }
                });
            });

            // Show running/unfinished Jobs only.
            this.element.find('#select-running-jobs').click(function () {
                that.currentRows = result.size;
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

            // Checkbox event handlers
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
                        }
                    }
                    else if (checked_boxes == that.currentRows) {
                        that.element.find('.job_toolbar_info').hide();
                        that.element.find('.dynamic_job_button button').show();
                        that.element.find('#job-cancel').hide();
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
                        checkboxes.filter(':visible').prop('checked', true);
                        that.element.find('#counter-select-jobs').text(result.size);
                    }
                    else {
                        checkboxes.filter(':visible').prop('checked', false);
                        that.resetElement();
                    }
                }
            );

            // Select all checkboxes
            this.element.find('#button-select-all').click(function (e) {
                // toggle checkbox if the click doesn't come from the checkbox already
                if (!$(e.target).is('input[type=checkbox]')) {
                    if (select_all.prop('checked') || select_all.data('indeterminate')) {
                        checkboxes.filter(':visible').prop('checked', false);
                        that.resetElement();
                    }
                    else {
                        that.element.find('.job_toolbar_info').hide();
                        that.element.find('.dynamic_job_button button').show();
                        that.element.find('#job-cancel').hide();
                        checkboxes.filter(':visible').prop('checked', true);
                        that.element.find('#counter-select-jobs').text(result.size);
                        that.element.find('#select-jobs').prop('indeterminate', false);
                        that.element.find('#select-jobs').prop('checked', true);
                    }
                }
            });

            // Function for killing Job.
            this.element.find('#job-cancel').click(function () {
                var list_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist');
                that.element.find('#select-jobs').prop('indeterminate', false);
                that.element.find('#select-jobs').prop('checked', false);
                that.resetElement();
                that.getData(that.endpoint);

                for (var i = 0; i < checkbox_count; i++) {
                    if (checkboxes[i].checked) {
                        $(checkboxes[i]).prop('checked', false);
                        var id = $(checkboxes[i]).parent().next().text();
                        var endpoint = list_endpoint + '?cancel=true&jobid=' + id;
                        $.getJSON(endpoint, function (result) {
                            if (result.id == id && result.cancel == 'true') {
                                dialog.modal({
                                    title: 'Job Killed succesfully',
                                    body: 'Job #' + id + ' killed succesfully.',
                                    buttons: {
                                        Okay: {}
                                    }
                                });
                            }
                            else {
                                dialog.modal({
                                    title: 'Job was not killed',
                                    body: result.error,
                                    buttons: {
                                        Okay: {}
                                    }
                                });
                            }
                        });
                        break;
                    }
                }
            });

            // If multiple Jobs are asked to be removed simultaneously.
            this.element.find('#job-remove').unbind('click').click(function () {
                var checked_count = 0;
                for (var i = 0; i < checkbox_count; i++) {
                    if (checkboxes[i].checked) {
                        checked_count++;
                    }
                }
                dialog.modal({
                    title: 'Remove Jobs',
                    body: 'Are you sure you want to remove ' + checked_count + ' job(s)?',
                    buttons: {
                        Remove: {
                            class: "btn-danger",
                            click: function () {
                                for (var i = 0; i < checkbox_count; i++) {
                                    if (checkboxes[i].checked) {
                                        $(checkboxes[i]).prop('checked', false);
                                        var id = $(checkboxes[i]).parent().next().text();
                                        that.element.find('.remove' + id).click();
                                    }
                                }
                                checkboxes.filter(':visible').prop('checked', false);
                                that.resetElement();
                            }
                        },
                        Cancel: {}
                    }
                });
            });
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