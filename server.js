require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./_helpers/error-handler');
const jwt = require('./_helpers/jwt');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use('/users', require('./users/users.controller'));
app.use('/growth-records', require('./growth-records/growth-records.controller'));
app.use('/parent-events', require('./parent-events/parent-events.controller'));
app.use('/view-configurations', require('./view-configurations/view-configurations.controller'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? 8080 : 4000;
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});
