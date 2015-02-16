"use strict";
var fs = require("fs");
var path = require("path");
var os = require("os");
var childProcess = require("child_process");
var phantomjs = require("phantomjs");
var binPath = phantomjs.path;
var esprima = require("esprima");
var backoff = require("backoff");
var phtm_script = path.resolve(__dirname, "./script.js");
var uuid = require("uuid").v4;

// Check for script being a correct ES program
// as it silently fails in PhantomJS otherwise
// which is really hard to debug.
var body = fs.readFileSync(phtm_script);
try {
    esprima.parse(body);
} catch(e) {
    e.file = phtm_script;
    throw e;
}

function exec(url, dir, filename, screenshot_filename, width, height, options, callback) {
    var args = ["--ssl-protocol=TLSv1", "--ignore-ssl-errors=yes", phtm_script, url, dir, filename];
    if (screenshot_filename) {
        args.push.call(args, screenshot_filename, width, height);
    }
    if (options.config) {
        args.unshift("--config=" + options.config);
    }
    childProcess.execFile(binPath, args, { timeout: options.timeout }, function(err, stdout, stderr) {
        if (err) return callback(err, null, stderr);
        try {
            callback(null, parseJSON(stdout), stderr);
        } catch(e) {
            callback(e, null, stderr);
        }
    });
}

function parseJSON(stdout) {
    var START = "SPECTOOLS_FETCH_SPEC_START";
    var END = "SPECTOOLS_FETCH_SPEC_END";
    var start = stdout.indexOf(START) + START.length;
    var end = stdout.indexOf(END);
    var substr = stdout.substring(start, end);
    return JSON.parse(substr);
}

function fetch(url, options, callback) {
    if (!url)
        return callback(new TypeError("Missing URL."));
    if (!callback) {
        callback = options;
        options = {};
    }
    
    var filename = options.filename || uuid() + ".html",
        dir = options.dir || os.tmpDir(),
        screenshot = options.screenshot,
        screenshot_filename = null,
        width = null,
        height = null;
    
    if (screenshot) {
        if (typeof screenshot != "object") { screenshot = {}; } // options.screenshot is true
        screenshot_filename = screenshot.filename || filename.replace(/\.html$/, ".png");
        var width = screenshot.width || 1280;
        var height = screenshot.height || 1024;
    }
    
    
    var execOptions = {
        timeout: options.timeout || 0,
        config: options.config
    }

    if (options.attempts && options.attempts > 1) {
        var call = backoff.call(exec, url, dir, filename, screenshot_filename, width, height, execOptions, callback);
        call.setStrategy(new backoff.ExponentialStrategy({
            initialDelay: options.delay || 1
        }));
        call.failAfter(options.attempts - 1);
        call.start();
    } else {
        exec(url, dir, filename, screenshot_filename, width, height, execOptions, callback);
    }
}

module.exports = fetch;
