var path = require('path');
var async = require('async');
var _ = require('lodash');
var gammabot = require('gammabot');
var semver = require('semver');
var defaults = {
    includeResolver: function (packageJson) {
        return !packageJson.lazo;
    },
    filterModules: function (modules, dependencies) {
        return modules.filter(function (module) {
            return dependencies[module.name];
        });
    },
    filterConflicts: function (conflicts, dependencies) {
        var retVal = {};
        for (var k in dependencies) {
            if (conflicts[k]) {
                retVal[k] = conflicts[k];
            }
        }

        return retVal;
    },
    versionResolver: function (name, modules, conflicts) {
        if (conflicts) {
            conflicts = conflicts.slice(0);
            conflicts.sort(function (a, b) {
                if (semver.lt(a.version, b.version)) {
                    return -1;
                }
                if (semver.gt(a.version, b.version)) {
                    return 1;
                }

                return 0;
            });

            // get the latest version
            return conflicts.pop();
        } else {
            return _.find(modules, function (module) {
                return module.name === name;
            });
        }
    },
    resolveModules: function (dependencies, modules, conflicts, options) {
        for (var k in dependencies) {
            dependencies[k].module = options.versionResolver(k, modules, conflicts[k]);
            dependencies[k].conflicts = conflicts[k];
        }

        return dependencies;
    }
};

module.exports = function (lazoModules, options, callback) {
    options = _.defaults(options || {}, defaults);
    var tasks = [];
    var modules = [];

    for (var j in lazoModules) {
        (function (j) {
            var lazoModule = lazoModules[j];

            if (lazoModule.lazo && lazoModule.lazo.dependencies) {
                var dependencies = _.clone(lazoModule.lazo.dependencies);
                for (var k in dependencies) {
                    (function (k) {
                        tasks.push(function (callback) {
                            gammabot(path.join(lazoModule.path, 'node_modules'), { includeResolver: options.includeResolver }, function (err, results) {
                                if (err) {
                                    return callback(err, null);
                                }
                                var filteredModules = options.filterModules(results.modules, dependencies);
                                var filteredConflicts = options.filterConflicts(results.conflicts, dependencies);

                                modules.push(_.extend({
                                    dependencies: options.resolveModules(dependencies, filteredModules, filteredConflicts, options),
                                }, lazoModule));

                                callback(null, modules);
                            });
                        });
                    })(k);
                }
            }
        })(j);
    }

    async.parallel(tasks, function (err, result) {
        if (err) {
            return callback(err, null);
        }
;
        callback(null, modules);
    });
};