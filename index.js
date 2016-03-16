var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('lodash');
var gammabot = require('gammabot');
var semver = require('semver');
var defaults = {
    excludeDir: /test/,
    includeResolver: function (packageJson) {
        return !packageJson.lazo;
    },
    filterModules: function (modules, dependencies, lazoModules) {
        return modules.filter(function (module) {
            return dependencies[module.name];
        }).filter(function (module) {
            var parent = getParentModule(module.path, modules);
            // if !parent then module is the source
            return !parent || parent.lazo;
        });
    },
    filterConflicts: function (conflicts, dependencies, modules, lazoModules) {
        var retVal = {};
        for (var k in dependencies) {
            if (conflicts[k]) {
                retVal[k] = conflicts[k].filter(function (module) {
                    var parent = getParentModule(module.path, modules);
                    // if !parent then module is the source
                    return !parent || parent.lazo;
                });

                if (retVal[k].length === 1) {
                    retVal[k] = [];
                }
            }
        }

        return retVal;
    },
    versionResolver: function (name, modules, conflicts) {
        if (conflicts && conflicts.length) {
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
    resolveModules: function (parentModule, dependencies, modules, conflicts, options, callback) {
        var tasks = [];

        for (var k in dependencies) {
            (function (k) {
                tasks.push(function (callback) {
                    var module = options.versionResolver(k, modules, conflicts[k]);
                    var moduleConflicts = conflicts[k];

                    if (!module) {
                        resolveModule(parentModule.path, k, function (err, module) {
                            if (err) {
                                return callback(err, null);
                            }

                            dependencies[k] = dependencies[k].map(function (dependency) {
                                dependency.module = module;
                                dependency.conflicts = moduleConflicts;
                                return dependency;
                            });

                            callback(null, module);
                        });
                    } else {
                        dependencies[k] = dependencies[k].map(function (dependency) {
                            dependency.module = module;
                            dependency.conflicts = moduleConflicts;
                            return dependency;
                        });

                        callback(null, module);
                    }
                });
            })(k);
        }

        async.parallel(tasks, function (err, results) {
            if (err) {
                return callback(err, null);
            }

            callback(null, dependencies);
        });
    }
};

function getParentModule(modulePath, modules) {
    var pathParts = modulePath.split(path.sep);
    // -1 remove module from path
    var len = pathParts.length - 1;
    var parentModule;

    for (var i = len; i > 0; i--) {
        if (pathParts[i] !== 'node_modules') {
            // do not include current module name
            parentModule = pathParts.slice(0, i - 1).join(path.sep);
            break;
        }
    }

    return modules.filter(function (module) {
        return module.path === parentModule;
    })[0];
}

function resolveModule(modulePath, moduleName, callback) {
    var modulePathParts = modulePath.split(path.sep);

    if (!modulePathParts.length) {
        return callback(new Error('fabricio: Unable to resolve module ' + moduleName), null);
    }

    if (modulePathParts[modulePathParts.length - 1] !== 'node_modules') {
        modulePathParts.pop();
        return resolveModule(modulePathParts.join(path.sep), moduleName, callback);
    }

    var resolvedModulePath = path.join(modulePathParts.join(path.sep), moduleName);
    if (fs.existsSync(resolvedModulePath)) {
        var retVal = {
            name: moduleName,
            lazo: undefined,
            path: resolvedModulePath
        };
        fs.readFile(path.join(resolvedModulePath, 'package.json'), function (err, packageJson){
            try {
                packageJson = JSON.parse(packageJson);
                retVal.data = packageJson;
            } catch (e) {
                return callback(err, null);
            }

            return callback(null, retVal);
        });
    } else {
        modulePathParts.pop();
        return resolveModule(modulePathParts.join(path.sep), moduleName, callback);
    }
}

module.exports = function (lazoModules, options, callback) {
    options = _.defaults(options || {}, defaults);
    var tasks = [];
    var modules = [];

    for (var j in lazoModules) {
        (function (j) {
            var lazoModule = lazoModules[j];

            if (lazoModule.lazo && lazoModule.lazo.dependencies) {
                var dependencies = _.cloneDeep(lazoModule.lazo.dependencies);
                for (var k in dependencies) {
                    (function (k) {
                        tasks.push(function (callback) {
                            gammabot(path.join(lazoModule.path, 'node_modules'), _.pick(options, ['includeResolver', 'excludeDir']), function (err, results) {
                                if (err) {
                                    return callback(err, null);
                                }

                                var filteredModules = options.filterModules(results.modules, dependencies, lazoModules);
                                var filteredConflicts = options.filterConflicts(results.conflicts, dependencies, results.modules, lazoModules);
                                options.resolveModules(lazoModule, dependencies, filteredModules, filteredConflicts, options, function (err, resolvedModules) {
                                    if (err) {
                                        return callback(err, null);
                                    }
                                    modules.push(_.extend({
                                        dependencies: resolvedModules,
                                        name: j
                                    }, lazoModule));

                                    callback(null, modules);
                                });
                            });
                        });
                    })(k);
                }
            } else {
                modules.push(_.extend({
                    dependencies: undefined,
                    name: j
                }, lazoModule));
            }
        })(j);
    }

    async.parallel(tasks, function (err, results) {
        if (err) {
            return callback(err, null);
        }

        callback(null, _.uniq(modules, function (module) {
            return module.name;
        }));
    });
};