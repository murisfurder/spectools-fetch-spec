fetch-spec
==========

`spectools-fetch-spec` is a PhantomJS-based node module
designed to fetch specs, their subresources, and,
optionally, grab a screenshot.

It thus contains specific code to deal with specs whose
rendering is client-side such as ReSpec.

API
---

### `fetchSpec(url [, options], callback)`

Visits `url`, waits for the spec to be fully rendered,
grabs its HTML, stores in `TMP_DIR`,
optionally takes a screenshot (which it also stores in `TMP_DIR`),
and returns a JSON object which contains the following properties:

*   `filepath` (`str`): filepath of the rendered Web page.
*   `screenshot` (`obj`?): an obj with the filepath and dimensions of the optional
    screenshot.
*   `resources` (`array`): a list of all HTTP requests made.
*   `clientsideRendering` (`bool`): whether or not the Web page was
    rendered on the client (e.g. ReSpec drafts).

A [JSON Schema](./schema.json) describes the return object in more details.

`options` is… optional and accepts the following values:

*   `filename` (`str`): name of the filename in which to save the HTML in `TMP_DIR`.
    Defaults to `"[UUID].html"`.
*   `screenshot` (`boolean`): takes a 1280x1024 PNG screenshot of the page
    and saves it as `"{filename}.png"` in `TMP_DIR`.
*   `screenshot` (`object`):
    *   `filename` (`str`): name of the filename in which to save the screenshot
        in `TMP_DIR`. Defaults to `"{filename}_{width}x{height}.png"`.
    *   `width` (`int`): width of screenshot. Defaults to 1280.
    *   `height` (`int`): height of screenshot. Defaults to 1024.
*   `timeout` (`int`): the length, in `ms` before a request is killed.
    Defaults to none.
*   `attempts` (`int`): number of attempts at visiting the page before reporting
    an error (note this uses an exponential backoff). Defaults to `1`.
*   `delay` (`int`): time in `ms` before the second attempt, default to `0 ms`.
*   `config` (`str`): Path to the [PhantomJS JSON config file](http://phantomjs.org/api/command-line.html). Optional.
