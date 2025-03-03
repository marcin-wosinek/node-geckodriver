Geckodriver [![CI](https://github.com/webdriverio-community/node-geckodriver/actions/workflows/ci.yml/badge.svg)](https://github.com/webdriverio-community/node-geckodriver/actions/workflows/ci.yml) [![Audit](https://github.com/webdriverio-community/node-geckodriver/actions/workflows/audit.yml/badge.svg)](https://github.com/webdriverio-community/node-geckodriver/actions/workflows/audit.yml)
==========

An NPM wrapper for Mozilla's [Geckodriver](https://github.com/mozilla/geckodriver). It manages to download various (or the latest) Geckodriver versions and provides a programmatic interface to start and stop it within Node.js. __Note:__ this is a wrapper module. If you discover any bugs with Geckodriver, please report them in the [official repository](https://github.com/mozilla/geckodriver).

# Installing

You can install this package via:

```sh
npm install geckodriver
```

Or install it globally:

```sh
npm install -g geckodriver
```

__Note:__ This installs a `geckodriver` shell script that runs the executable, but on Windows, [`selenium-webdriver`](https://www.npmjs.com/package/selenium-webdriver) looks for `geckodriver.exe`. To use a global installation of this package with [`selenium-webdriver`](https://www.npmjs.com/package/selenium-webdriver) on Windows, copy or link `geckodriver.exe` to a location on your `PATH` (such as the NPM bin directory) after installing this package:

```sh
mklink %USERPROFILE%\AppData\Roaming\npm\geckodriver.exe %USERPROFILE%\AppData\Roaming\npm\node_modules\geckodriver\geckodriver.exe
```

Once installed you can start Geckodriver via:

```sh
npx geckodriver --port=4444
```

By default, this package downloads Geckodriver when used for the first time through the CLI or the programmatical interface. If you like to download it as part of the NPM install process, set the `GECKODRIVER_AUTO_INSTALL` environment flag, e.g.:

```sh
GECKODRIVER_AUTO_INSTALL=1 npm i
```

To get a list of available CLI options run `npx geckodriver --help`. By default this package downloads the latest version of the driver. If you prefer to have it install a custom Geckodriver version you can define the environment variable `GECKODRIVER_VERSION` when running in CLI, e.g.:

```sh
$ npm i geckodriver
$ GECKODRIVER_VERSION="0.31.0" npx geckodriver --version
geckodriver 0.31.0 (b617178ef491 2022-04-06 11:57 +0000)

The source code of this program is available from
testing/geckodriver in https://hg.mozilla.org/mozilla-central.

This program is subject to the terms of the Mozilla Public License 2.0.
You can obtain a copy of the license at https://mozilla.org/MPL/2.0/.
```

## Setting a CDN URL for binary download

To set an alternate CDN location for geckodriver binaries, set the `GECKODRIVER_CDNURL` like this:

```sh
GECKODRIVER_CDNURL=https://INTERNAL_CDN/geckodriver/download
```

Binaries on your CDN should be located in a subdirectory of the above base URL. For example, `/vxx.xx.xx/*.tar.gz` should be located under `/geckodriver/download` above.

Alternatively, you can add the same property to your .npmrc file.

Default location is set to https://github.com/mozilla/geckodriver/releases/download

## Setting a PROXY URL

Use `HTTPS_PROXY` or `HTTP_PROXY` to set your proxy url.

# Programmatic Interface

You can import this package with Node.js and start the driver as part of your script and use it e.g. with [WebdriverIO](https://webdriver.io).

## Exported Methods

The package exports a `start` and `download` method.

### `start`

Starts an Geckodriver instance and returns a [`ChildProcess`](https://nodejs.org/api/child_process.html#class-childprocess). If Geckodriver is not downloaded it will download it for you.

__Params:__ `GeckodriverParameters` - options to pass into Geckodriver (see below)

__Example:__

```js
import { start } from 'geckodriver';
import { remote } from 'webdriverio';
import waitPort from 'wait-port';

/**
 * first start Geckodriver
 */
const cp = await start({ port: 4444 });

/**
 * wait for Geckodriver to be up
 */
await waitPort({ port: 4444 });

/**
 * then start WebdriverIO session
 */
const browser = await remote({ capabilities: { browserName: 'firefox' } });
await browser.url('https://webdriver.io');
console.log(await browser.getTitle()); // prints "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO"

/**
 * kill Geckodriver process
 */
cp.kill();
```

__Note:__ as you can see in the example above this package does not wait for the driver to be up, you have to manage this yourself through packages like [`wait-on`](https://github.com/jeffbski/wait-on).

### `download`

Method to download an Geckodriver with a particular version. If version parameter is omitted it tries to download the latest available version of the driver.

__Params:__ `string` - version of Geckodriver to download (optional)

## CJS Support

In case your module uses CJS you can use this package as follows:

```js
const { start } = require('geckodriver')
// see example above
```

## Options

The `start` method offers the following options to be passed on to the actual Geckodriver CLI.

### allowHosts

List of hostnames to allow. By default the value of --host is allowed, and in addition if that's a well known local address, other variations on well known local addresses are allowed. If --allow-hosts is provided only exactly those hosts are allowed.

Type: `string[]`<br />
Default: `[]`

### allowOrigins
List of request origins to allow. These must be formatted as scheme://host:port. By default any request with an origin header is rejected. If `--allow-origins` is provided then only exactly those origins are allowed.

Type: `string[]`<br />
Default: `[]`

### binary
Path to the Firefox binary.

Type: `string`

### connectExisting
Connect to an existing Firefox instance.

Type: `boolean`<br />
Default: `false`

### host
Host IP to use for WebDriver server.

Type: `string`<br />
Default: `127.0.0.1`

### jsdebugger
Attach browser toolbox debugger for Firefox.

Type: `boolean`<br />
Default: `false`

### log
Set Gecko log level [possible values: `fatal`, `error`, `warn`, `info`, `config`, `debug`, `trace`].

Type: `string`

### logNoTruncated
Write server log to file instead of stderr, increases log level to `INFO`.

Type: `boolean`

### marionetteHost
Host to use to connect to Gecko.

Type: `boolean`<br />
Default: `127.0.0.1`

### marionettePort
Port to use to connect to Gecko.

Type: `number`<br />
Default: `0`

### port
Port to listen on.

Type: `number`

### profileRoot
Directory in which to create profiles. Defaults to the system temporary directory.

Type: `string`

### geckoDriverVersion
Version of Geckodriver to start. See https://github.com/mozilla/geckodriver/releases for all available versions, platforms and architecture.

Type: `string`

### customGeckoDriverPath
Don't download Geckodriver, instead use a custom path to it, e.g. a cached binary.

Type: `string`<br />
Default: `process.env.GECKODRIVER_FILEPATH`

# Other Browser Driver

If you also look for other browser driver NPM wrapper, you can find them here:

- Chrome: [giggio/node-chromedriver](https://github.com/giggio/node-chromedriver)
- Microsoft Edge: [webdriverio-community/node-edgedriver](https://github.com/webdriverio-community/node-edgedriver)
- Safari: [webdriverio-community/node-safaridriver](https://github.com/webdriverio-community/node-safaridriver)

---

For more information on WebdriverIO see the [homepage](https://webdriver.io).
