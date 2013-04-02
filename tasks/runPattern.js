"use strict";

module.exports = function(grunt) {

    grunt.registerTask("runPattern", "Runs only tests which accepts the given pattern using Mocha",
        function(pattern, reporter) {
            if (pattern === undefined) {
                grunt.fail.fatal("runPatttern accepts two parameters: pattern and reporter; " +
                    "pattern parameter is mandatory!");
                return;
            }

            if (pattern.indexOf(".js") === -1) {
                pattern = pattern + ".js";
            }

            grunt.config.get("mochaTest").all = [ "test/**/" + pattern];

            var mochaTask = ["mochaTest", "all"];
            if (reporter) {
                mochaTask.push(reporter);
            }

            mochaTask = mochaTask.join(":");
            grunt.log.writeln("Mocha task: " + mochaTask);
            grunt.task.run(mochaTask);
        });

    grunt.registerTask("watchPattern", "Watches files for changes and runs tests (by pattern) using Mocha",
        function(file, reporter) {
            if (file === undefined) {
                grunt.fail.fatal("watchPatttern accepts two parameters: pattern and reporter; " +
                    "pattern parameter is mandatory!");
                return;
            }

            reporter = reporter || "min";
            grunt.config.get("watch").tasks = ["runPattern", file, reporter].join(":");

            grunt.task.run("watch");
        });
};