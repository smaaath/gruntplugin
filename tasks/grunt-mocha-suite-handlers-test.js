"use strict";
/*
 * This module is based on:
 *
 * grunt-mocha-test
 * https://github.com/pghalliday/grunt-mocha-test
 *
 * Copyright (c) 2012 Peter Halliday
 * Licensed under the MIT license.
 *
 * This module adds ability to invoke optional handlers when starting a Mocha suite (considered as one separate file
 * with tests). Just add to your options:
 *
 * mochaTestConfig: {
 *   options: {
 *
 *     // this function allows to set up a specific environment for given file. It's been called before loading test file
 *     prepareEnvironmentFor: function(file) {
 *       // anything...
 *     },
 *
 *     // this function is called as a first beforeAll hook of the test. Must call done(error) function
 *     onFirstBeforeTest: function (done) {
 *       // anything...
 *     },
 *
 *     // this function is called as a last beforeAll hook of the test. Must call done(error) function
 *     onLastBeforeTest: function (done) {
 *       // anything...
 *     },
 *
 *     // this function is called as a last afterAll hook of the test. Must call done(error) function
 *     onAfterTest: function (done) {
 *       // anything...
 *     }
 *   }
 * }
 *
 * It is IMPORTANT to call done function once execution of before and after hooks has been finished
 */

module.exports = function(grunt) {
    var Mocha = require('mocha');
    var Module = require('module');
    var fs = require('fs');

    grunt.registerMultiTask('mochaTest', 'Run node unit tests with Mocha',
        function(reporter, resultFile, silent) {
            // tell grunt this is an asynchronous task
            var done = this.async();

            // Clear all the files we can in the require cache in case we are run from watch.
            // NB. This is required to ensure that all tests are run and that all the modules under
            // test have been reloaded and are not in some kind of cached state
            for (var key in Module._cache) {
                if (Module._cache[key]) {
                    delete Module._cache[key];
                    if (Module._cache[key]) {
                        grunt.fail.warn('Mocha grunt task: Could not delete from require cache:\n' + key);
                    }
                } else {
                    grunt.fail.warn('Mocha grunt task: Could not find key in require cache:\n' + key);
                }
            }

            // load the options if they are specified
            var options = grunt.config(['mochaTestConfig', this.target, 'options']);
            if (typeof options !== 'object') {
                options = grunt.config(['mochaTestConfig', 'options']);
            }

            options.reporter = reporter || options.reporter;

            var resultAggregator = aggregateResultsInto(resultFile, silent);

            // create a mocha instance with our options
            var mocha = new Mocha(options);

            // add files to mocha
            grunt.file.expandFiles(this.file.src).forEach(function(file) {
                mocha.addFile(file);
            });

            // run mocha asynchronously and catch errors!! (again, in case we are running this task in watch)
            try {
                mocha.run = newRun(options, mocha);

                mocha.run(function(failureCount) {
                    resultAggregator.write();
                    done(failureCount === 0);
                });
            }
            catch (e) {
                resultAggregator.write();
                grunt.log.error('Mocha exploded!');
                grunt.log.error(e.stack);
                done(false);
            }
        });
};

function newRun(options, mocha) {
    var index = 0;
    var oldRun = mocha.run;
    return function(fn) {
        mocha.suite.on('pre-require', function(context, file, mocha) {
            if (options.prepareEnvironmentFor) {
                options.prepareEnvironmentFor(file);
            }
        });
        // when file with test is loaded...
        mocha.suite.on('post-require', function(context, file, mocha) {
            // .. find the suite corresponding to the file (it should be last)
            var suite = mocha.suite.suites[index];

            if (suite !== undefined) {
                index++;
                // .. and append handlers (if they exist!) in correct order
                if (options.onFirstBeforeTest) {
                    suite.beforeAll(function(done) {
                        options.onFirstBeforeTest(file, done);
                    });

                    var newlyAddedHook = suite._beforeAll.pop();
                    suite._beforeAll.unshift(newlyAddedHook);
                }
                if (options.onLastBeforeTest) {
                    suite.beforeAll(function(done) {
                        options.onLastBeforeTest(file, done);
                    });
                }
                if (options.onAfterTest) {
                    suite.afterAll(function(done) {
                        options.onAfterTest(file, done);
                    });
                }
            }
        });
        return oldRun.call(mocha, fn);
    };
}

function aggregateResultsInto(resultFile, silent) {
    return (function(file, silent) {
        var helper = {};
        var lines = [];
        var fs = require('fs');

        var unhookStdout;

        function hookFunction(stream, silent, callback) {
            var oldWrite = stream.write;

            stream.write = (function(write) {
                return function(string, encoding, fd) {
                    if (!silent) {
                        write.apply(stream, arguments);
                    }
                    callback(string, encoding, fd);
                };
            })(stream.write);

            return function() {
                stream.write = oldWrite;
            };
        }

        helper.write = function() {
            if (file) {
                unhookStdout();
                fs.writeFileSync(file, lines.join(''));
            }
        };

        if (file) {
            unhookStdout = hookFunction(process.stdout, silent === 'silent', function(string) {
                lines.push(string);
            });
        }

        return helper;
    })(resultFile, silent);
}
