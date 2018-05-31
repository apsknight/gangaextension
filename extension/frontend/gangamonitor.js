/**
 * Definiton of GangaMonitor singleton object for dealing communications with kernel.
 * @module GangaMonitor
 */

define([
    'base/js/namespace', 'require', 'base/js/events', './cellqueue', './displaymonitor'
], function(
    Jupyter, requirejs, events, currentcell, displaymonitor
) {
    /**
     * @constructor - GangaMonitor object's constructor
     */
    function GangaMonitor() {

        // Communication object with kernel.
        this.comm = null;
        this.cell = null;
        this.startComm();
        // Fix Kernel interruption/restarting
        // events.on('kernel_connected.Kernel', $.proxy(this.startComm, this))
    }

    /**
     * Start Communication with kerel using Comm API.
     * Closes any existing communication.
     */
    GangaMonitor.prototype.startComm = function () {
        if (this.comm) {
            this.comm.close();
        }
        var that = this;
        console.log("GangaMonitor: Starting a connection with Kernel.");

        if (Jupyter.notebook.kernel) {
            this.comm = Jupyter.notebook.kernel.comm_manager.new_comm('GangaMonitor',
                        { 'msgtype': 'openfromfrontend' });
            
            // Comm Message handlers.
            this.comm.on_msg($.proxy(that.comm_msg, that));
            this.comm.on_close($.proxy(that.comm_close, that));
        }
        else {
            console.error('GangaMonitor: Unable to start communication. Kenel not found!');
        }
    }

    /**
     * Called when a message is recieved from kernel.
     * @param {object} msg - JSON recieve message object.
     */
    GangaMonitor.prototype.comm_msg = function (msg) {
        console.log('GangaMonitor: Recieved message!', msg.content.data);
        this.handle_message(msg);
    }

    /**
     * @param {object} msg
     */
    GangaMonitor.prototype.send = function (msg) {
        this.comm.send(msg);
    }

    /**
     * Called when communication with kernel is closed.
     * @param {object} msg - JSON close message object.
     */
    GangaMonitor.prototype.comm_close = function (msg) {
        console.log('GangaMonitor: Comm Close Message:', msg);
    }

    GangaMonitor.prototype.handle_message = function (msg) {
        var data = msg.content.data;
        if (!data.msgtype) {
            console.warn('GangaMonitor: Unknown Data Recieved');
        }
        switch(data.msgtype) {
            case "magic_execution_start":
                console.log("Magic Execution Start");
                this.cell = currentcell.getRunningCell();
                console.log('This cell', this.cell);
                break;
            case "jobinfo":
                console.log('GangaMonitor: Job Info Recieved');
                this.job_info_recieved(data);
                break;
            case "jobstatus":
                console.log('GangaMonitor: Job Status Recieved');
                this.job_status_recieved(data);
                break;
        }
    }

    GangaMonitor.prototype.job_info_recieved = function (data) {
        var cell = this.cell;
        if (cell == null) {
            console.error('GangaMonitor: Job Started with no running cell');
            return;
        }
        console.log('GangaMonitor: Job started at cell', cell.cell_id, data);
        var dismonitor = new displaymonitor.DisplayMonitor(this, cell, data);
        this.displaymonitor = dismonitor;
    }

    GangaMonitor.prototype.job_status_recieved = function (data) {
        console.log(data);
        this.displaymonitor.updateContent(data);
    }

    return {
        'GangaMonitor': GangaMonitor
    };
});