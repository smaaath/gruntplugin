module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',
        test: {
            files: ['test/**/*Test.js']
        },
        lint: {
            files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
        },
        watch: {
            files: ['<config:lint.files>', 'src/**/*', 'test/**/*'],
            tasks: 'unit'
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                node: true
            },
            globals: {
                exports: true
            }
        },
        moduleTests: {
            sourcesDirectory: 'src/',
            testsDirectory: 'test/'
        }
    });

    grunt.config.set("moduleTests", {
        sourcesDirectory: "src/",
        testsDirectory: "test/"
    });


    //grunt.loadTasks('node_modules/grunt-tasks/tasks');
    grunt.loadNpmTasks('grunt-tasks');

    grunt.loadTasks('node_modules/grunt-tasks/tasks');

    // These plugins provide necessary tasks.

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    //
    // console.log('grunt.config.get("smTests").sourcesDirectory',grunt.config.get("smTests").sourcesDirectory);
    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'test', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);
    // Default task.
    //grunt.registerTask('default', 'lint test');
};

