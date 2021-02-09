const _ = require("lodash");
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const { ENV_VARS } = require("../config");
const { PORT, APP_NAME } = ENV_VARS;
const SERVER_PORT = PORT || 4000;

const { generalAuth, adminAuth } = require("./middleware/authenticate");
const usersController = require("./controllers/usersController");
const sessionsController = require("./controllers/sessionsController");
const shiftController = require("./controllers/shiftController");
const riderController = require("./controllers/riderController");

const app = express();
const server = require("http").createServer(app);
const corsOptions = {
    exposedHeaders: "Auth",
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/* Users */
app.get("/users", generalAuth, usersController.getUsers);
app.get("/users/:id", generalAuth, usersController.getUser);
app.post("/users", adminAuth, usersController.postUser);
app.post("/users/bulk", adminAuth, usersController.postBulkUser);
app.patch("/users/:id", generalAuth, usersController.patchUser);
app.delete("/users/:id", adminAuth, usersController.deleteUser);

/* Sessions */
app.get("/sessions/:id", generalAuth, sessionsController.getSession);
app.post("/sessions", sessionsController.postSession);
app.delete("/sessions/:id", generalAuth, sessionsController.deleteSession);

/*Shift Category*/
app.post("/shift", adminAuth, shiftController.postShift);
app.get("/shift/geoCoder", shiftController.currentLocationName);
app.get("/shift/", generalAuth, shiftController.getShifts);
app.get("/shift/:id", generalAuth, shiftController.getShift);
app.delete("/shift/:id", generalAuth, shiftController.deleteShift);

/* rider*/
app.post('/rider/online', generalAuth, riderController.riderOnline)
app.post('/rider/offline', generalAuth, riderController.riderOffline)
app.get('/rider/todayRecords', generalAuth, riderController.todayRecords)

/*Admin*/
// specific rider detail
app.get('/rider/:id', generalAuth, usersController.getUserStats)
app.get('/riders', generalAuth, riderController.todayRecords)
app.get('/riders/:id', generalAuth, riderController.currentMonth)
app.get('/admin/todayRecords', generalAuth, riderController.todayRecords)
app.get('/admin/search/', generalAuth, usersController.searchUser)

/**
 *  Run the server
 */
server.listen(SERVER_PORT, function() {
    console.log(`${APP_NAME} listening at ${SERVER_PORT}`);
});
