var system = require('system');
var fs = require('fs');

// Args:
// https://example.com /tmp/filename.html /tmp/filename_{width}x{height}.png 1280 1024
// [0]: script path
// [1]: URL to visit
// [4]: filepath for html dump.
// [4]: filepath for screenshot
// [5]: screenshot width
// [6]: screenshot height

if (system.args.length <= 2) {
    system.stderr.write('Not enough args.');
    phantom.exit(1);
}
var url = system.args[1];
var filepath = system.args[2];
var screenshot_filepath = system.args[3] || null;
var width = parseInt(system.args[4] || 0, 10);
var height = parseInt(system.args[5] || 0, 10);

function screenshot(screenshot_filepath, w, h) {
    var zoom = 1;
    w = w * zoom;
    h = h * zoom;
    page.viewportSize = { width: w, height: h };
    page.clipRect = { top: 0, left: 0, width: w, height: h };
    page.zoomFactor = zoom;
    page.render(screenshot_filepath, { format: 'png' });
    return screenshot_filepath;
}

var page = require('webpage').create();

phantom.onError = page.onError = function(err, trace) {
  var msgStack = [err];
  if (trace && trace.length) {
    trace.forEach(function(t) {
      msgStack.push('    ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  system.stderr.write(msgStack.join('\n'));
  system.stderr.write('\n');
  page && page.close();
  phantom.exit(1);
};

page.onCallback = function(err, data) {
    if (err) {
        system.stderr.write(err.message);
        phantom.exit(1);
        return;
    }
    var results = {
        resources: resources,
        filepath: filepath,
        screenshot: null,
        clientsideRendering: data.clientsideRendering
    };
    fs.write(results.filepath, page.content, 'w');
    
    if (screenshot_filepath) {
        page.evaluate(function() { document.body.bgColor = 'white'; });
        results.screenshot = {
            width: width,
            height: height,
            filepath: screenshot(screenshot_filepath, width, height)
        };
    }
    system.stdout.write("SPECTOOLS_FETCH_SPEC_START" + JSON.stringify(results) + "SPECTOOLS_FETCH_SPEC_END");
    page.close();
    phantom.exit(0);
};

var resources = [];
page.onResourceRequested = function(requestData, networkRequest) {
    resources.push(requestData)
};

page.onResourceError = function(resourceError) {
  system.stderr.write('Unable to load resource (#' + resourceError.id + ' URL:' + resourceError.url + ')\n');
  system.stderr.write('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString + "\n");
};

page.open(url, function (status) {
    if (status !== 'success') {
        system.stderr.write('Unable to access network.');
        page.close();
        phantom.exit(1);
    }
    page.evaluate(function() {
        
          var called = false;
    
          function fn(clientsideRendering) {
              if (called) return;
              called = true;
              callPhantom(null, { clientsideRendering: clientsideRendering || false });
          }
    
          function oncomplete() {
              setTimeout(function() {
                  // Special case ReSpec-based spec drafts.
                  if (window.respecConfig || window.respecEvents) {
                      if (window.document && window.document.respecDone) {
                          fn(true);
                      } else {
                          window.respecEvents.sub("end-all", function() { fn(true) });
                      }
                  } else {
                      fn();
                  }
              }, 10);
          }
    
          if (window.document.readyState === "complete") {
              oncomplete();
          } else {
              window.addEventListener("load", oncomplete, false);
          }
    });
});
