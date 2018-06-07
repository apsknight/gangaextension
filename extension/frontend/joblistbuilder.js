/**
 * Module for building UI for Ganga Job tab.
 * @module joblistbuilder
 */
define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog',
    './time'
], function(
    Jupyter,
    $,
    utils,
    dialog,
    time
) {
    function build_ui() {
        var list_endpoint = utils.url_path_join(utils.get_body_data('baseUrl'), 'gangajoblist');
        var skeleton = '<div class="JobList pm list_container">\
        <div class="content">\
            <table class="jobtable">\
                <thead>\
                <tr>\
                    <th class="thjobid">Job ID</th>\
                    <th class="thjobname">Job Name</th>\
                    <th class="thbackend">Backend</th>\
                    <th class="thapplication">Application</th>\
                    <th class="thjobstatus">Status</th>\
                    <th class="thjobtasks">Subjobs</th>\
                    <th class="thjobstart">Submission Time</th>\
                    <th class="thjobtime">Runtime</th>\
                    </tr>\
                    </thead>\
                        <tbody class="jobbody">\
                        </tbody>\
                        </table>\
                        </div></div>'
                        // <th class="thbutton"></th>\                    
        
        var element = $(skeleton);
        // $.getJSON(list_endpoint, function(data) {
        //     console.log("Data: ", data)
        //     $.each(data, function(id, jobdata) {
        //         element.find('.jobbody').append(newRow(id, jobdata));
        //     });
        // })
        var data = {"190": {
                    "splitter": "GenericSplitter",
                    "name": "Island Count",
                    "application": "Executable",
                    "status": "completed",
                    "runtime": "0:00:10",
                    "subjob_status": {
                        "0": "completed",
                        "1": "completed",
                        "2": "completed",
                        "3": "completed"
                    },
                    "job_submission_time": "2018-06-03 10:56:00",
                    "subjobs": 4,
                    "subjob_submission_time": {
                        "0": "2018-06-03 10:56:00",
                        "1": "2018-06-03 10:56:00",
                        "2": "2018-06-03 10:56:00",
                        "3": "2018-06-03 10:56:00"
                    },
                    "backend": "Localhost"
                },
                "189": {
                    "splitter": "GenericSplitter",
                    "name": "Island Count",
                    "application": "Executable",
                    "status": "failed",
                    "runtime": "0:00:10",
                    "subjob_status": {
                        "0": "completed",
                        "1": "completed",
                        "2": "completed",
                        "3": "completed"
                    },
                    "job_submission_time": "2018-06-02 13:16:00",
                    "subjobs": 4,
                    "subjob_submission_time": {
                        "0": "2018-06-03 10:56:00",
                        "1": "2018-06-03 10:56:00",
                        "2": "2018-06-03 10:56:00",
                        "3": "2018-06-03 10:56:00"
                    },
                    "backend": "Localhost"
                }
            }
            $.each(data, function(id, jobdata) {
                element.find('.jobbody').append(newRow(id, jobdata));
            });

        return element;
    }

    function newRow(id, data) {
        var skeleton = '<tr">\
        <td class="tdjobid"></td>\
        <td class="tdjobname"></td>\
        <td class="tdjobbackend"><span class="badgeinfo backendbadge"></span></td>\
        <td class="tdjobbackend"><span class="badgeinfo applicationbadge"></span></td>\
        <td class="tdjobstatus"></td>\
        <td class="tdjobtasks"></td>\
        <td class="tdjobstart"></td>\
        <td class="tdjobtime"></td>\
        </tr>'
        element = $(skeleton);
        // element.find('.tdbutton').append(id);
        element.find('.tdjobid').append(id);
        element.find('.tdjobname').append(data.name);
        element.find('.backendbadge').append(data.backend.toUpperCase());
        element.find('.applicationbadge').append(data.application.toUpperCase());
        var status = $('<span></span>').addClass(data.status.toUpperCase()).text(data.status.toUpperCase()).addClass('tditemjobstatus');
        element.find('.tdjobstatus').html(status);
        element.find('.tdjobstart').html(time.format_date(data.job_submission_time));
        element.find('.tdjobtime').append(time.format_time(data.runtime));

        // Subjob Progress Bar
        if (data.subjobs == 0) {
            element.find('.tdjobtasks').text('No Subjobs');
        }
        else {
            // var progress = $('\<div class="cssprogress">\
            //                     <div class="data"></div><span class="val1"></span><span class="val2"></span></div>').addClass('tdstageitemprogress');
            // element.find('.tdjobtasks').addClass('tdstageprocess').append(progress);
            // element.find('.tdstageitemprogress .val1').width('100%');
            element.find('.tdjobtasks').text(data.subjobs);            
        }
        
        return element;
    }

    function new_subjob_row () {
        var srow = $('<tr></tr>').addClass('stagerow');
        var tdstageid = $('<td></td>').addClass('tdstageid');
        var status = $('<span></span>').addClass("NEW").text('NEW');
        var tdstatus = $('<td></td>').addClass("tdstagestatus").html(status);
        var tdstarttime = $('<td></td>').addClass('tdstagestarttime');
        srow.append(tdstageid, tdstatus, tdstarttime);
        
        return srow;
    };

    return {
        'build_ui': build_ui
    };
});