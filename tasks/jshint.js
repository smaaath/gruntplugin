"use strict";

var exec = require('child_process').exec;

module.exports = function (grunt) {
    grunt.config.set('jshintConfig', {
        files: 'src/**/*.js'
    });

    grunt.registerTask('jshint', 'Produces jshint with particular report (currently only jslint)', function (file, reporter) {
        grunt.config.requires('jshintConfig');

        var config = grunt.config.get('jshintConfig');

        var jshintReporter;
        switch (reporter) {
            case 'checkstyle'  :
                jshintReporter = './node_modules/jshint/lib/reporters/checkstyle.js';
                break;
            default :
            case 'lint':
                jshintReporter = './node_modules/jshint/lib/reporters/jslint_xml.js';
                break;
        }

        var instrumentCommand = ["node", "node_modules/jshint/bin/hint", config.files, "--reporter", jshintReporter, ">", file].join(" ");
        grunt.log.writeln("Invoking command: " + instrumentCommand);

        var done = grunt.task.current.async();
        exec(instrumentCommand, function (err, stdout, stderr) {
            done(err);
        });
    });
};
