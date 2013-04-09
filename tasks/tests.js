"use strict";

var util = require('util');

module.exports = function(grunt) {
    var IN_MEMORY = 'inmemory_functional_test';
    var UNIT = 'test';

    function sourcesDirectory() {
        return grunt.config.get('moduleTests').sourcesDirectory;
    }
    function testsDirectory() {
        return grunt.config.get('moduleTests').testsDirectory;
    }

    function initFunctional(done) {
        require('../../../' + testsDirectory() + 'initApplication').startFunctional(done);
    }
    function stopFunctional(done) {
        require('../../../' + testsDirectory() + 'initApplication').stopFunctional(done);
    }
    function initDatabase(done) {
        require('../../../' + testsDirectory() + 'initApplication').initDatabase(done);
    }
    function startApplication(done) {
        require('../../../' + testsDirectory() + 'initApplication').startApplication(done);
    }
    function closeApplicationAndResetCache(done) {


        process.emit('close SM application');
        resetCache();
        done();
        done();
    }

    function resetCache() {
        removeModule(require.cache, require.resolve('../../../' + testsDirectory() + 'initApplication'));
        removeModule(require.cache, require.resolve('../../../' + sourcesDirectory() + 'data_access/utils/db/dbSqlite'));
        removeModule(require.cache, require.resolve('../../../' + sourcesDirectory() + 'data_access/utils/db/sqliImpl'));

        clearCache(require.cache);
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
        functional: [grunt.config.get('moduleTests').functional],
        unit: [grunt.config.get('moduleTests').unit],
        all : [grunt.config.get('moduleTests').unit , grunt.config.get('moduleTests').functional]

    });



    /**
     * Check if which config should be used
     * @returns {*}
     */
    function checkConfig() {
        return grunt.config.get('moduleTests').DG1==='true';
    }


    if(checkConfig()){
        prepareEnvironementForDG1();
    }else{
        prepareEnvironnmentForDG2();
    }

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
    function prepareEnvironementForDG1() {
        grunt.config.set('mochaTestConfig', {
            unit: {
                options: {
                    reporter: 'spec',
                    prepareEnvironmentFor: function (file) {
                        prepareEnvironment(UNIT);
                    }
                }
            },
            functional: {
                options: {
                    reporter: 'spec',
                    timeout: 5000,
                    prepareEnvironmentFor: function (file) {
                        prepareEnvironment(IN_MEMORY);
                    },
                    onFirstBeforeTest: function (file, done) {
                        initFunctional(done);
                    },
                    onLastBeforeTest: function (file, done) {
                        done();
                    },
                    onAfterTest: function (file, done) {
                        stopFunctional(done);
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
                            initFunctional(done);
                        } else {
                            done();
                        }
                    },
                    onLastBeforeTest: function (file, done) {
                        done();

                    },
                    onAfterTest: function (file, done) {
                        if (isFunctionalTestIn(file)) {
                            stopFunctional(done);
                        } else {
                            done();
                        }
                    }
                }
            }
        });
    }


    /**
     * This enable configuration for test for UI modules like
     */
    function prepareEnvironnmentForDG2() {
        grunt.config.set('mochaTestConfig', {
            unit: {
                options: {
                    reporter: 'spec',
                    prepareEnvironmentFor: function (file) {
                        prepareEnvironment(UNIT);
                    }
                }
            },
            functional: {
                options: {
                    reporter: 'spec',
                    timeout: 5000,
                    prepareEnvironmentFor: function (file) {
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
    }
};

