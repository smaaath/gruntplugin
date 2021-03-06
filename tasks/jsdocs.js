"use strict";

module.exports = function(grunt) {
    grunt.config.set("yuidoc",
        {
            compile: {
                name: "Manager",
                options: {
                    outdir: "./doc/yuidoc",
                    paths: "./src",
                    themedir: "./doc/private/yuidoc-theme"
                }
            }
        });

    grunt.loadNpmTasks('grunt-contrib-yuidoc');
};