/**
 * Module for building UI for Ganga Job tab.
 * @module joblistbuilder
 */
define([
    'base/js/namespace',
    'base/js/utils',
    'base/js/dialog',
    'jquery',
    'bootstrap',
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
    bootstrap,
    time,
    joblistHTML,
    joblistRow,
    jobdialog,
    requirejs
) {
        function build_ui() {
            var job_per_page = 20;
            var list_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist?size=' + job_per_page);
            var skeleton = $(joblistHTML);
            var element = $(skeleton);
            element.find('#text img').attr('src', requirejs.toUrl('./static/gangaicon.gif'));
            element.find('#select-jobs').indeterminate = true;
            var obj = new getJobs(list_endpoint, element, job_per_page);


            element.find('#sort-ID').click(function () {
                element.find('#sort-ID i').show().toggleClass('fa-arrow-down').toggleClass('fa-arrow-up');
                element.find('.jlist tbody tr').each(function () {
                    var row = $(this).detach();
                    // console.log(row);
                    element.find('.jlist tbody').prepend(row);
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

        function getJobs(list_endpoint, element, size) {
            this.endpoint = list_endpoint;
            this.element = element;
            this.page = 1;
            this.size = size; // Rows demanded per request
            this.currentRows = size;
            this.page_count = 0;

            this.getData(this.endpoint);
        }

        getJobs.prototype.getData = function (endpoint) {
            var that = this;
            this.element.find('#overlay').css('display', 'block');
            $.getJSON(endpoint, function (result) {
                that.element.find('#overlay').css('display', 'none');
                that.buildList(result);
            });
        }
        getJobs.prototype.buildList = function (result) {
            var that = this;
            that.element.find('#pagination').empty();
            that.page_count = Math.ceil(result.total_jobs / result.size);
            that.start_index = result.start;

            for (var i = 0; i < that.page_count; i++) {
                var pagination = $('<span class="btn btn-xs btn-default" id="p' + (i + 1) +
                    '" style="margin: 0 2px;">' + (i + 1) + '</span>')
                that.element.find('#pagination').append(pagination);
                that.element.find('#p' + (that.page)).addClass('active disabled');
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
                console.log(jobdata);
                if ('runtime' in jobdata && jobdata.runtime != 'None') {
                    row.find('.thtime').text(time.format_time(jobdata.runtime));
                    row.find('.thtime').attr('title', jobdata.runtime);                    
                }
                else {
                    row.find('.thtime').text('-');                    
                }
                that.element.find('.jlist tbody').prepend(row);
            });

            this.element.find('#select-all-jobs').click(function () {
                // var that = this;
                // that.element.find('#select-jobs').prop('indeterminate', false);
                // that.element.find('#select-jobs').prop('checked', false);
                // that.element.find('#counter-select-jobs').text(0); 
                that.currentRows = that.size;
                that.element.find('.jlist tbody tr').each(function () {
                    $(this).find('input:checkbox[name="job_row"]').attr('checked', false);
                    $(this).show();
                });
                that.resetElement();               
            });
            this.element.find('#select-finished-jobs').click(function () {
                // var that = this;
                // that.element.find('#select-jobs').prop('indeterminate', false);
                // that.element.find('#select-jobs').prop('checked', false);
                // that.element.find('#counter-select-jobs').text(0);  
                that.currentRows = that.size;
                that.element.find('.jlist tbody tr').each(function () {
                    $(this).show();
                    $(this).find('input:checkbox[name="job_row"]').attr('checked', false);                    
                    var status = $(this).find('.thstatus').text().toLowerCase();
                    that.resetElement();                                             
                    // console.log(status);
                    if (status != 'completed' && status != 'killed' && status != 'failed') {
                        $(this).hide();
                        that.currentRows--;
                    }
                });
            });
            this.element.find('#select-running-jobs').click(function () {
                // var that = this;
                // that.element.find('#select-jobs').prop('indeterminate', false);
                // that.element.find('#select-jobs').prop('checked', false);
                // that.element.find('#counter-select-jobs').text(0); 
                that.currentRows = that.size;
                that.element.find('.jlist tbody tr').each(function () {
                    $(this).show();
                    $(this).find('input:checkbox[name="job_row"]').attr('checked', false);                    
                    var status = $(this).find('.thstatus').text().toLowerCase();
                    that.resetElement();                                              
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
                        // that.element.find('#select-jobs').data('indeterminate', true);
                        if (checked_boxes != 1) {
                            that.element.find('#job-cancel').hide();
                            that.element.find('#open-notebook').hide();
                        }
                        else if (checked_boxes == 1 && ) {
                            
                        }
                    }
                    else if (checked_boxes == that.currentRows) {
                        that.element.find('.job_toolbar_info').hide();
                        that.element.find('.dynamic_job_button button').show();
                        that.element.find('#select-jobs').prop('indeterminate', false);
                        that.element.find('#select-jobs').prop('checked', true);
                        // that.element.find('#select-jobs').data('indeterminate', false);
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
            // console.log(checkboxes);
            select_all.change(
                function () {
                    // console.log(this.indeterminate);
                    if (this.checked) {
                        that.element.find('.job_toolbar_info').hide();
                        that.element.find('.dynamic_job_button button').show();
                        checkboxes.filter(':visible').prop('checked', true);
                        that.element.find('#counter-select-jobs').text(that.currentRows);
                        // console.log('Xhecked');
                    }
                    else {
                        checkboxes.filter(':visible').prop('checked', false);
                        that.resetElement();
                        // that.element.find('#counter-select-jobs').text(0);
                        // that.element.find('.dynamic_job_button button').hide();
                        // that.element.find('.job_toolbar_info').show();
                        // console.log('Dhecked');                                              
                    }
                }
            );
            this.element.find('#subjob-info').click(function () {
                for (var i = 0; i < checkboxes.length; i++) {
                    if (checkboxes[i].checked) {
                        that.create_model($(checkboxes[i]).parent().next().text(), result.data);
                    }
                }
            });
        }

        getJobs.prototype.resetElement = function () {
            this.element.find('.dynamic_job_button button').hide();
            this.element.find('.job_toolbar_info').show();
            this.element.find('#select-jobs').prop('indeterminate', false);
            this.element.find('#select-jobs').prop('checked', false);
            this.element.find('#counter-select-jobs').text(0);                            
        }
        // function getJobs(list_endpoint, element, page, size) {
        //     element.find('#pagination').empty();
        //     element.find('.jlist tbody').empty();
        //     element.find('#overlay').css('display', 'block');
        //     $.getJSON(list_endpoint, function (result) {
        //         element.find('#overlay').css('display', 'none');
        //         var count = Math.ceil(result.total_jobs / result.size);
        //         for (var i = 0; i < count; i++) {
        //             var pagination = $('<span class="btn btn-xs btn-default" id="p' + (i + 1) + '" style="margin: 0 2px;">'
        //                 + (i + 1) +
        //                 '</span>')
        //             element.find('#pagination').append(pagination);
        //             pagination.click(function () {
        //                 element.find('#p' + (page)).removeClass('active');
        //                 element.find('#pagination').empty();
        //                 element.find('.jlist tbody').empty();
        //                 new_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist' + '?size=' + size + '&start=' + (result.start - ($(this).attr('id').split('p')[1] - page) * size));
        //                 console.log(new_endpoint);
        //                 getJobs(new_endpoint, element, $(this).attr('id').split('p')[1], size);
        //             });
        //         }
        //         element.find('#p' + (page)).addClass('active disabled');
        //         $.each(result.data, function (id, jobdata) {
        //             var row = $(joblistRow);
        //             row.find('.thid').text(id);
        //             row.find('.thname').text(jobdata.name);
        //             row.find('.thbackend').text(jobdata.backend);
        //             row.find('.thapplication').text(jobdata.application);
        //             row.find('.thsubjobs').text(jobdata.file_name);
        //             row.find('.thstatus').html($('<span></span>').addClass(jobdata.status.toUpperCase()).text(jobdata.status.toUpperCase()));
        //             row.find('.thstart').text(time.format_date(jobdata.job_submission_time));
        //             row.find('.thtime').text('-');
        //             element.find('.jlist tbody').prepend(row);
        //         });
        //         // element.find('#button-select-all').click(function () {
        //         //     checkboxes.prop('checked', !checkboxes.prop('checked'));                
        //         // });
        //         element.find('#select-finished-jobs').click(function () {
        //             element.find('.jlist tbody').empty();
        //             $.each(result.data, function (id, jobdata) {
        //                 if (jobdata.status == 'completed' || jobdata.status == 'killed' || jobdata.status == 'failed') {
        //                     var row = $(joblistRow);
        //                     row.find('.thid').text(id);
        //                     row.find('.thname').text(jobdata.name);
        //                     row.find('.thbackend').text(jobdata.backend);
        //                     row.find('.thapplication').text(jobdata.application);
        //                     row.find('.thsubjobs').text(jobdata.file_name);
        //                     row.find('.thstatus').html($('<span></span>').addClass(jobdata.status.toUpperCase()).text(jobdata.status.toUpperCase()));
        //                     row.find('.thstart').text(time.format_date(jobdata.job_submission_time));
        //                     row.find('.thtime').text('-');
        //                     element.find('.jlist tbody').prepend(row);
        //                 }
        //             });
        //         });
        //         element.find('#select-running-jobs').click(function () {
        //             element.find('.jlist tbody').empty();
        //             $.each(result.data, function (id, jobdata) {
        //                 if (jobdata.status == 'running' || jobdata.status == 'new' || jobdata.status == 'submitted') {
        //                     var row = $(joblistRow);
        //                     row.find('.thid').text(id);
        //                     row.find('.thname').text(jobdata.name);
        //                     row.find('.thbackend').text(jobdata.backend);
        //                     row.find('.thapplication').text(jobdata.application);
        //                     row.find('.thsubjobs').text(jobdata.file_name);
        //                     row.find('.thstatus').html($('<span></span>').addClass(jobdata.status.toUpperCase()).text(jobdata.status.toUpperCase()));
        //                     row.find('.thstart').text(time.format_date(jobdata.job_submission_time));
        //                     row.find('.thtime').text('-');
        //                     element.find('.jlist tbody').prepend(row);
        //                 }
        //             });
        //         });
        //         var checkboxes = element.find('input:checkbox[name="job_row"]');
        //         var checkbox_count = checkboxes.length;
        //         checkboxes.change(
        //             function () {
        //                 var checked_boxes = 0;
        //                 for (var i = 0; i < checkbox_count; i++) {
        //                     if (checkboxes[i].checked) {
        //                         checked_boxes++;
        //                     }
        //                 }
        //                 element.find('#counter-select-jobs').text(checked_boxes);
        //                 if (checked_boxes > 0 && checked_boxes != checkbox_count) {
        //                     element.find('.job_toolbar_info').hide();
        //                     element.find('.dynamic_job_button button').show();
        //                     element.find('#select-jobs').prop('indeterminate', true);
        //                     // element.find('#select-jobs').data('indeterminate', true);
        //                 }
        //                 else if (checked_boxes == checkbox_count) {
        //                     element.find('.job_toolbar_info').hide();
        //                     element.find('.dynamic_job_button button').show();
        //                     element.find('#select-jobs').prop('indeterminate', false);
        //                     element.find('#select-jobs').prop('checked', true);
        //                     // element.find('#select-jobs').data('indeterminate', false);
        //                 }
        //                 else {
        //                     element.find('.dynamic_job_button button').hide();
        //                     element.find('.job_toolbar_info').show();
        //                     element.find('#select-jobs').prop('indeterminate', false);
        //                     element.find('#select-jobs').prop('checked', false);
        //                 }
        //             }
        //         );

        //         var select_all = element.find('#select-jobs');
        //         select_all.change(
        //             function () {
        //                 // console.log(this.indeterminate);
        //                 if (this.checked) {
        //                     element.find('.job_toolbar_info').hide();
        //                     element.find('.dynamic_job_button button').show();
        //                     checkboxes.prop('checked', true);
        //                     element.find('#counter-select-jobs').text(checkbox_count);
        //                     // console.log('Xhecked');
        //                 }
        //                 else {
        //                     checkboxes.prop('checked', false);
        //                     element.find('#counter-select-jobs').text(0);
        //                     element.find('.dynamic_job_button button').hide();
        //                     element.find('.job_toolbar_info').show();
        //                     // console.log('Dhecked');                                              
        //                 }
        //             }
        //         );
        //         element.find('#subjob-info').click(function () {
        //             for (var i = 0; i < checkboxes.length; i++) {
        //                 if (checkboxes[i].checked) {
        //                     create_model($(checkboxes[i]).parent().next().text(), result.data);
        //                 }
        //             }
        //         });
        //     })
        // }

        getJobs.prototype.create_model = function (id, data) {
            // console.log(id);
            var jdialog = $(jobdialog);
            if (data[id].subjobs > 0) {
                jdialog.find('.splitterbadge').text(data[id].splitter);
                console.log(data.splitter);
                jdialog.find('.subjobcount').text(data[id].subjobs);
                $.each(data[id].subjob_status, function (subjob_id, subjobdata) {
                    var row = $('<tr>\
                        <td class="thsubjobid"></td>\
                        <td class="thsubjobstatus">Running</td>\
                        <td class="thsubjobsubmissiontime">June 4th, 2018</td>\
                        <td class="thsubjobruntime">-</td>\
                    </tr>')
                    row.find('.thsubjobid').text(id + '.' + subjob_id);
                    row.find('.thsubjobstatus').html($('<span></span>').addClass(subjobdata.status.toUpperCase()).text(subjobdata.status.toUpperCase()));
                    row.find('.thsubjobsubmissiontime').text(time.format_date(subjobdata.subjob_submission_time));
                    // row.find('.thsubjobruntime').text('-');
                    if ('runtime' in subjobdata && subjobdata.runtime != 'None') {
                        row.find('.thsubjobruntime').text(time.format_time(subjobdata.runtime));
                    }
                    else {
                        row.find('.thsubjobruntime').text('-');                    
                    }
                    jdialog.find('.jtable tbody').append(row);
                });
            }
            else {
                jdialog = 'There are no subjobs for Job#' + id;
            }

            dialog.modal({
                title: 'Ganga subjob info: Job#' + id,
                body: jdialog,
                buttons: {
                    Close: {}
                }
            });
            // jdialog.find('.gangaicon').css('background-image', 'url("' + requirejs.toUrl('./static/gangaicon.png') + '")')            
        }

        return {
            'build_ui': build_ui
        };
    });