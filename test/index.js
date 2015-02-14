var path = require('path');
var fabricio = require('../index');
var root = path.resolve(path.join('application'));
var data = {
    foo: {
        version: '1.0.0',
        lazo: {
            component: true,
            dependencies: {
                moment: {
                    moduleId: 'moment',
                    install: 'common'
                }
            }
        },
        data: {},
        path: path.join(root, 'node_modules', 'foo')
    }
};

fabricio(data, null, function (err, results) {
    console.log(err || results[0].dependencies.moment.module);
});
