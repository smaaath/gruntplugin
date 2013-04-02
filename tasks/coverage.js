"use strict";

var exec = require("child_process").exec;

// coverage reports
module.exports = function(grunt) {
    grunt.loadNpmTasks("grunt-text-replace");
    grunt.loadNpmTasks("grunt-rm");
    grunt.loadNpmTasks("grunt-contrib-copy");

    grunt.config.set("coverage", {
        sourceDirs: {
            input: "src/",
            // instrumented code
            output: "src-instrumented/"
        },
        testDirs: {
            input: "test/",
            output: "test-instrumented/"
        }
    });


    grunt.registerTask("coverage", "Produces test coverage report", function(reportFile, reporter) {
        if (reportFile === undefined) {
            grunt.fail.fatal("Cannot run coverage. reportFile parameter is mandatory");
            return;
        }

        grunt.config.requires("coverage");

        var config = grunt.config.get("coverage");

        // default reporter
        reporter = reporter || "html";

        // configure mocha reporting
        var mochaReporter;

        switch (reporter) {
            case "lcov"  :
                mochaReporter = "mocha-lcov-reporter";
                break;
            case "xunit" :
                mochaReporter = "xunit";
                break;
            case "html"  :
                mochaReporter = "html-cov";
                break;
            case "cobertura":
                mochaReporter = "mocha-cobertura-reporter";
                break;
            default :
                mochaReporter = reporter;
                break;
        }

        // step 1 - configure tests to copy
        var testsToCopy = {};
        //testsToCopy[ COVERAGE_TEMP_DIR + config.tests.output] = config.tests.input;
        testsToCopy[config.testDirs.output] = config.testDirs.input + "**";
        grunt.config.set("copy", {
            compile: {
                files: testsToCopy
            }
        });

        // step 2 - configure modify tests so they will use instrumented sources
        grunt.config.set("replace", {
            updateTests: {
                src: [config.testDirs.output + "**/*.js", config.sourceDirs.output + "**/*.js"],
                overwrite: true,
                replacements: [
                    {
                        from: config.sourceDirs.input,
                        to: config.sourceDirs.output
                    },
                    {
                        from: config.testDirs.input,
                        to: config.testDirs.output
                    }
                ]
            }
        });

        grunt.log.writeln(JSON.stringify(grunt.config.get("regex-replace")));

        // step 3 - configure cleaning - tidiness is our madness! so remove instrumented soruces and tests
        grunt.config.set("rm", {
            sources: { dir: config.sourceDirs.output },
            tests: { dir: config.testDirs.output }
        });

        // step 4 - configure instrumentalization
        // FIXME ugly workaround, when jscover plugin for grunt shows up, change this
        var instrumentCommand = ["node", "node_modules/jscover/bin/jscover", "--no-instrument=static",
            "--no-instrument=templates",
            config.sourceDirs.input.replace("/", ""),
            config.sourceDirs.output.replace("/", "")].join(" ");
        grunt.log.writeln("Invoking command: " + instrumentCommand);

        // We want to execute all tests which are already instrumented..
        grunt.config.get("mochaTest")["all"] = [config.testDirs.output + "**/*Test.js"];

        // tell Mocha to run tests and application from new directories
        grunt.config.get("smTests").sourcesDirectory = config.sourceDirs.output;
        grunt.config.get("smTests").testsDirectory = config.testDirs.output;

        var done = grunt.task.current.async();
        // TODO errror handling
        // step 1 - instrument source code
        exec(instrumentCommand, function(err, stdout, stderr) {
            if (err) {
                grunt.log.writeln("Error found: " + err);
                done(err);
                return;
            }
            grunt.log.writeln("stdout: " + stdout);
            grunt.log.writeln("Instrumenting finished.");

            var mochaTask = ["mochaTest", "all", mochaReporter, reportFile, "silent"].join(":");
            grunt.log.writeln("Mocha task: " + mochaTask);
            grunt.task.run([ "copy", "replace", mochaTask, "rm" ]);
            done(err);
        });

    });
};
