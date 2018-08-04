/**
 * Tiny module for manipulating date and time.
 * @module time
 */

define([
    'moment'
], function(
    moment
) {
    /**
     * Converts '2018-06-03 12:00:00' to 'Today at 12:00' 
     * @param {string} date 
     */
    function format_date(date) {
        return moment.utc(date, 'YYYY-MM-DD hh:mm:ss').local().format('MMM Do, h:mm a');
        // var start = $('<time></time>').addClass('timeago').attr('data-livestamp', date).attr('title', date.toString()).text(date.toString())
        // return start
    }

    /**
     * Converts '3:33:33' to '3 hours 33 minutes 33 seconds 
     * @param {string} time 
     */
    function format_time(time) {
        if (!time) {
            return '-'
        }
        var timeArray = time.toString().split(':');
        var timeString = '';
        if (timeArray[0] > 0) {
            timeString = timeString + timeArray[0] + ' hours ';
        }
        if (timeArray[1] > 0) {
            timeString = timeString + timeArray[1] + ' minutes ';
        }
        timeString = timeString + timeArray[2] + ' seconds';

        return timeString;
    }

    return {
        'format_date': format_date,
        'format_time': format_time
    };
});