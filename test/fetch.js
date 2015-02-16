var assert = require("assert"),
    fetch = require("../index"),
    path = require("path"),
    tv4 = require("tv4"),
    pointer = require("json-pointer"),
    formats = require('tv4-formats');

var schema = require("../schema.json");
function displayErr(err, obj, output) {
    output.push("* " + err.message.trim());
    JSON.stringify(pointer.get(obj, err.dataPath), null, 4).split("\n").forEach(function(line) {
        output.push("    " + line);
    });
}

function schemaMsg(err, obj) {
    if (!err) return "";
    var output = [""];
    displayErr(err, obj, output);
    if (err.subErrors) {
        err.subErrors.forEach(function(s) {
            displayErr(s, obj, output);
        });
    }
    return output.join("\n");
}

function assertValid(obj) {
    var validator = tv4.freshApi();
    validator.addFormat(formats);
    var result = validator.validateResult(obj, schema);
    assert(result.valid, schemaMsg(result.error, obj));
}

suite("Test spec fetch module", function() {
    var server = require("spectools-fixtures").serve();
    
    suite("Screenshots", function() {
        test("default values for screenshot", function(done) {
            fetch("http:127.0.0.1:3000/anolis", { filename: "anolis.html", screenshot: true }, function(err, results) {
                assert(!err, err);
                assertValid(results);
                assert.equal(results.filepath, path.join(process.env.TMPDIR, "anolis.html"));
                assert.equal(results.screenshot.filepath, path.join(process.env.TMPDIR, "anolis.png"));
                assert.equal(results.screenshot.width, 1280);
                assert.equal(results.screenshot.height, 1024);
                done()
            });
        });
    
        test("custom screenshots values", function(done) {
            fetch("http:127.0.0.1:3000/anolis", { filename: "anolis.html", screenshot: { filename: "foo_{width}x{height}.png", width: 320, height: 256 }}, function(err, results) {
                assert(!err, err);
                assertValid(results);
                assert.equal(results.filepath, path.join(process.env.TMPDIR, "anolis.html"));
                assert.equal(results.screenshot.filepath, path.join(process.env.TMPDIR, "foo_320x256.png"));
                assert.equal(results.screenshot.width, 320);
                assert.equal(results.screenshot.height, 256);
                done()
            });
        });
        
        test("screenshot off by default", function(done) {
            fetch("http:127.0.0.1:3000/anolis", function(err, results) {
                assert(!err, err);
                assertValid(results);
                assert(!results.screenshot);
                done();
            });
        });
        
        test("test default screenshot filename value", function(done) {
            fetch("http:127.0.0.1:3000/anolis", { screenshot: true }, function(err, results) {
                assert(!err, err);
                assertValid(results);
                var regexp = new RegExp("^" + path.join(process.env.TMPDIR, "[0-f]{8}-[0-f]{4}-[0-f]{4}-[0-f]{4}-[0-f]{12}\.png$"));
                assert(results.screenshot.filepath.match(regexp));
                done();
            });
        });
    });

    suite("Filename", function() {
        test("default filename value", function(done) {
            fetch("http:127.0.0.1:3000/anolis", function(err, results) {
                assert(!err, err);
                assertValid(results);
                var regexp = new RegExp("^" + path.join(process.env.TMPDIR, "[0-f]{8}-[0-f]{4}-[0-f]{4}-[0-f]{4}-[0-f]{12}\.html$"));
                assert(results.filepath.match(regexp));
                done();
            });
        });
        
        test("custom filename value", function(done) {
            fetch("http:127.0.0.1:3000/anolis", { filename: "foo.html" }, function(err, results) {
                assert(!err, err);
                assertValid(results);
                assert.equal(results.filepath, path.join(process.env.TMPDIR, "foo.html"));
                done();
            });
        });
    });

    suite("clientsideRendering property", function() {
        test("test clientsideRendering property is false for non ReSpec drafts", function(done) {
            fetch("http:127.0.0.1:3000/respec", function(err, results) {
                assert(!err, err);
                assertValid(results);
                assert.strictEqual(results.clientsideRendering, false);
                done();
            });
        });
        
        test("test clientsideRendering property is false for other specs", function(done) {
            fetch("http:127.0.0.1:3000/anolis", function(err, results) {
                assert(!err, err);
                assertValid(results);
                assert.strictEqual(results.clientsideRendering, false);
                done();
            });
        });

        test("test clientsideRendering property is true for ReSpec drafts", function(done) {
            fetch("http:127.0.0.1:3000/respec-draft", function(err, results) {
                assert(!err, err);
                assertValid(results);
                assert.strictEqual(results.clientsideRendering, true);
                done();
            });
        });
    });

    suiteTeardown(function() {
        server.close()
    })
});
