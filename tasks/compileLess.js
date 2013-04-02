(function(module) {
    "use strict";

    var exec = require("child_process").exec;

    /**
     * @module GruntTasks
     * @class GruntTasks
     **/
    module.exports = function (grunt) {

        /**
         * Compiles LESS files to CSS.
         *
         * @method compileLess
         **/
        grunt.registerTask("compileLess", "Compiles LESS files to CSS", function() {
            exec("lessc ./src/static/styles/less/layout.less ./src/static/styles/layout.css");
            exec("lessc ./src/static/styles/less/theme.less ./src/static/styles/theme.css");
        });

        /**
         * Watches LESS files and compiles them to CSS when they change.
         *
         * @method watchLess
         **/
        grunt.registerTask("watchLess", "Watches LESS files and compiles them to CSS when they change", function() {
            var watch = grunt.config.get("watch");
            watch.tasks = "compileLess";
            watch.files = "src/static/styles/less/**/*.less";

            grunt.task.run("watch");
        });
    };

}(module));