/**
 * Definiton of GangaMonitor singleton object for dealing communications with kernel.
 * @module GangaMonitor
 */

define([
    'base/js/namespace',
    'require',
    'base/js/events',
    'base/js/utils',
    './cellqueue',
    './displaymonitor'
], function(
    Jupyter,
    requirejs,
    events,
    utils,
    currentcell,
    displaymonitor
) {
    /**
     * @constructor - GangaMonitor object's constructor
     */
    function GangaMonitor() {
        var that = this;
        // Communication object with kernel.
        this.comm = null;
        this.cell = null;
        // Object to store id : displaymonitor object as key : value 
        this.displaymonitor = {}
        // Object to store cell_id : job_id as key : value 
        this.cell_id_hash = {}

        // Start Comm communication with Kernel.
        this.startComm();
        var base_url = utils.get_body_data("baseUrl");

        // Fix Kernel interruption/restarting
        // If kernel is interrupted or restarted than again start communicaton
        events.on('kernel_connected.Kernel', $.proxy(this.startComm, this))

        // Removing display widget when output area is cleared.
        events.on('clear_output.CodeCell', function (event, data) {
            var monitor = that.getDisplayMonitor(data.cell.cell_id)
            if (monitor) {
                monitor.displayElement.remove();
            }
        });

        // Insert button in toolbar to toggle widgets and link for directly opening Jobs tab.
        this.createButtons();
    }

    GangaMonitor.prototype.createButtons = function () {
        var that = this;

        // Toggle Display widgets
        var toggleHandler = function () {
            that.toggleAll();
        };
        var toggleAction = {
            icon: 'fa-toggle-on',
            help: 'Toggle Ganga Monitor Displays',
            help_index: 'zz',
            handler: toggleHandler
        };
        var togglePrefix = 'GangaMonitor';
        var toggle_action_name = 'toggle-ganga-monitoring';
    
        var toggle_action = Jupyter.actions.register(toggleAction, toggle_action_name, togglePrefix);
        button = Jupyter.toolbar.add_buttons_group([toggle_action]);

        button.click(function() {
            button.find('i').toggleClass('fa-toggle-on').toggleClass('fa-toggle-off');
        })

        // Button for opening Jobs Page in new tab.
        var path = utils.url_path_join(utils.get_body_data('baseUrl'), 'swangangalist');

        var openJobsHandler = function () {
            window.open(path, '_blank');
        }
        var openJobsAction = {
            icon: 'fa-share',
            help: 'Open Jobs in new tab',
            help_index: 'zz',
            handler: openJobsHandler
        };
        var openJobsPrefix = 'Jobs';
        var openJobs_action_name = 'open-jobs';

        var openJobs_action = Jupyter.actions.register(openJobsAction, openJobs_action_name, openJobsPrefix);

        Jupyter.toolbar.add_buttons_group([openJobs_action]);

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
        console.log('GangaMonitor: Recieved message!', msg);
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

    /**
     * Function to habdle received messages from kernel based on msgtype.
     * @param {object} msg - JSON message object.
     */
    GangaMonitor.prototype.handle_message = function (msg) {
        var channel = new BroadcastChannel('gangajlc');        
        channel.postMessage(msg);
        var data = msg.content.data;
        if (!data.msgtype) {
            console.warn('GangaMonitor: Unknown Data Recieved');
        }
        switch(data.msgtype) {
            case "magic_execution_start":
                console.log("GangaMonitor: Magic Execution Start");
                this.cell = currentcell.getRunningCell();
                // console.log('GangaMonitor: This cell', this.cell);
                cell_msg = {
                    'msgtype': 'cellinfo',
                    'cell_id': this.cell.cell_id,
                }
                this.send(cell_msg)
                break;
            case "jobinfo":
                console.log('GangaMonitor: Job Info Recieved');
                this.job_info_recieved(data);
                break;
            case "jobstatus":
                console.log('GangaMonitor: Job Status Recieved: ', data.status);
                this.job_status_recieved(data);
                break;
        }
    }
    
    /**
     * Function for handling Job Info message.
     * Creates a new instance of DisplayMonitor and assigns it to cell.
     * @param {object} msg - JSON Job Info data.
     */
    GangaMonitor.prototype.job_info_recieved = function (data) {
        var cell = this.cell;
        if (cell == null) {
            console.error('GangaMonitor: Job Started with no running cell');
            return;
        }
        // Store in which cell this Job is created.
        this.cell_id_hash[cell.cell_id] = data.id
        var dismonitor = new displaymonitor.DisplayMonitor(this, cell, data);
        this.displaymonitor[data.id] = dismonitor;
    }

    /**
     * Function for handling Job Status message.
     * Send status to displaymonitor for updating frontend widget.
     * @param {object} msg - JSON Job Status data.
     */
    GangaMonitor.prototype.job_status_recieved = function (data) {
        this.displaymonitor[data.id].updateContent(data);
    }

    // /**
    //  * Ask for Job Info from Kernel
    //  * @param {var} id - Job ID.
    //  */
    // GangaMonitor.prototype.ask_job_info = function (jobid, cellid) {
    //     this.send({'msgtype': 'askinfo', 'id': jobid, 'cell': cellid});
    // }

    /**
     * Return the displaymonitor instance (if any) associated with cell.
     * @param {object} cell_id - ID of cell
     */
    GangaMonitor.prototype.getDisplayMonitor = function (cell_id) {
        var jobid = this.cell_id_hash[cell_id]
        return this.displaymonitor[jobid];
    }

    /**
     * Toggle display widget (Show/Hide).
     */
    GangaMonitor.prototype.toggleAll = function () {
        var cells = Jupyter.notebook.get_cells();

        cells.forEach(cell => {
            var JobMonitor = cell.element.find('.inner_cell').find('.JobMonitor');
            if (cell.cell_type == 'code' && JobMonitor.length > 0) {
                JobMonitor.toggle();
            }
        });
    }

    return {
        'GangaMonitor': GangaMonitor
    };
});