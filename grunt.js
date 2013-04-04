module.exports = function (grunt) {
    // Project configuration.



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

