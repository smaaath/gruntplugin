"use strict";

var util = require('util');

module.exports = function(grunt) {
    var IN_MEMORY = 'inmemory_functional_test';
    var UNIT = 'test';

    function sourcesDirectory() {
        return grunt.config.get('smTests').sourcesDirectory;
    }
    function testsDirectory() {
        return grunt.config.get('smTests').testsDirectory;
    }

    function initDatabase(done) {
        require('../' + testsDirectory() + 'initApplication').initDatabase(done);
    }
    function startApplication(done) {
        require('../' + testsDirectory() + 'initApplication').startApplication(done);
    }
    function closeApplicationAndResetCache(done) {
        process.emit('close SM application');

        removeModule(require.cache, require.resolve('../' + testsDirectory() + 'initApplication'));
        removeModule(require.cache, require.resolve('../' + sourcesDirectory() + 'data_access/utils/db/dbSqlite'));
        removeModule(require.cache, require.resolve('../' + sourcesDirectory() + 'data_access/utils/db/sqliImpl'));

        clearCache(require.cache);
        done();
    }

    function removeModule(cache, moduleName) {
        var module = cache[moduleName];

        if (module) {
            for (var i = 0; i < module.children.length; i++) {
                removeModule(cache, module.children[i].id);
            }
            delete cache[moduleName];
        }
    }

    function clearCache(cache) {
        for (var entry in cache) {
            if (cache.hasOwnProperty(entry)) {
                var id = cache[entry].id;
                // don't remove node modules from cache
                if ((id.indexOf('node_modules') === -1)) {
                    delete cache[entry];
                }
            }
        }
    }

    function isFunctionalTestIn(file) {
        return file.indexOf('functional') !== -1;
    }

    function prepareEnvironment(env) {
        process.env.NODE_ENV = env;
        process.env.NODE_CONFIG_DIR = './config';

        global.NODE_CONFIG = null;
        delete require.cache[require.resolve('config')];
    }

    function prepareEnvironmentFor(file) {
        if (isFunctionalTestIn(file)) {
            prepareEnvironment(IN_MEMORY);
        } else {
            prepareEnvironment(UNIT);
        }
    }

    grunt.config.set('mochaTest', {
        functional: ['test/*/functional/**/*Test.js'],
        unit: [ 'test/*/unit/**/*Test.js', 'test/utils/**/*Test.js' ],
        all : [ 'test/*/functional/**/*Test.js', 'test/*/unit/**/*Test.js', 'test/utils/**/*Test.js']
    });

    grunt.config.set('mochaTestConfig', {
        unit: {
            options: {
                reporter: 'spec',
                prepareEnvironmentFor : function(file) {
                    prepareEnvironment(UNIT);
                }
            }
        },
    functional: {
        options: {
            reporter: 'spec',
            timeout: 5000,
            prepareEnvironmentFor: function(file) {
                prepareEnvironment(IN_MEMORY);
            },
            onFirstBeforeTest: function (file, done) {
                initDatabase(done);
            },
            onLastBeforeTest: function (file, done) {
                startApplication(done);
            },
            onAfterTest: function (file, done) {
                closeApplicationAndResetCache(done);
            }
        }
    },
    all: {
        options: {
            reporter: 'spec',
            timeout: 5000,
            prepareEnvironmentFor: function (file) {
                prepareEnvironmentFor(file);
            },
            onFirstBeforeTest: function (file, done) {
                prepareEnvironmentFor(file);
                if (isFunctionalTestIn(file)) {
                    initDatabase(done);
                } else {
                    done();
                }
            },
            onLastBeforeTest: function (file, done) {
                if (isFunctionalTestIn(file)) {
                    startApplication(done);
                } else {
                    done();
                }
            },
            onAfterTest: function (file, done) {
                if (isFunctionalTestIn(file)) {
                    closeApplicationAndResetCache(done);
                } else {
                    done();
                }
            }
        }
    }
    });

    grunt.registerTask('functional', 'mochaTest:functional');
    grunt.registerTask('unit', 'mochaTest:unit');
    grunt.registerTask('test', 'unit functional');

    grunt.registerTask('testsWithReporterAndFile', 'Runs all tests with given reporter', function(reporter, file, silent) {
        function runTestsFor(step, reporter, file, silent) {
            var task = ['mochaTest', step];
            if (reporter) {
                task.push(reporter);
                if (file) {
                    task.push(file);
                    if (silent) {
                        task.push(silent);
                    }
                }
            }
            return task.join(':');
        }

        var mochaTask = ['prepareEnvironment:test',
            runTestsFor('unit', reporter, 'unit_' + file, silent),
            'prepareEnvironment:inmemory_functional_test',
            runTestsFor('functional', reporter, 'functional_' + file, silent)];

        grunt.log.writeln('Mocha task: ' + mochaTask.join(' '));
        grunt.task.run(mochaTask);
    });
};