const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.resolve(__dirname, 'mvdb.db'));


const constants = require('./constants');

let history = [];
const FIRST_COLUMN = [];
const SECOND_COLUMN = [];
const THIRD_COLUMN = [];
const FOURTH_COLUMN = [];

loadCarPositions();

function parkingHistoryRoute(req, res) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    history = [];
    generateAnimationHistory();
    return res.json({data: history});
}

function loadCarPositions() {
    const query = 'select * from car_position ORDER BY column_id';
    db.all(query, [], (err, row) => {
        row.forEach(rowItem => {
            switch (rowItem.column_id) {
                case 0:
                    FIRST_COLUMN.push([rowItem.lat_position, rowItem.long_position]);
                    break;
                case 1:
                    SECOND_COLUMN.push([rowItem.lat_position, rowItem.long_position]);
                    break;
                case 2:
                    THIRD_COLUMN.push([rowItem.lat_position, rowItem.long_position]);
                    break;
                default:
                    FOURTH_COLUMN.push([rowItem.lat_position, rowItem.long_position]);
            }
        });

        db.close();
    })
}

generateAnimationHistory = () => {
    const initialState = [FIRST_COLUMN, SECOND_COLUMN, THIRD_COLUMN, FOURTH_COLUMN];

    randomizeCarVisibility(initialState);
    saveStateInHistory(initialState);
    for (let i = 0; i < constants.NUMBER_OF_FRAMES - 1; ++i) {
        const oldState = history[i];
        const newState = getNextState(oldState);
        saveStateInHistory(newState);
    }
};

getNextState = state => {
    const newState = getStateDeepCopy(state);
    randomizeCarVisibility(newState);

    return newState;
};

getStateDeepCopy = state => {
    return state.map(column => getColumnDeepCopy(column));
};

getColumnDeepCopy = column => {
    return column.map(point => [...point]);
};

saveStateInHistory = state => {
    history.push(state);
};

randomizeCarVisibility = state => {
    state.forEach((column, i) => {
        column.forEach((point, j) => {
            let randomBoolean = null;
            const currentHour = history.length;
            switch (true) {
                case currentHour < 0.18 * constants.NUMBER_OF_FRAMES:
                    randomBoolean = Math.random() >= 0.75;
                    break;
                case currentHour < 0.25 * constants.NUMBER_OF_FRAMES:
                    randomBoolean = Math.random() >= 0.55;
                    break;
                case currentHour < 0.6 * constants.NUMBER_OF_FRAMES:
                    randomBoolean = Math.random() >= 0.1;
                    break;
                case currentHour < 0.75 * constants.NUMBER_OF_FRAMES:
                    randomBoolean = Math.random() >= 0.2;
                    break;
                case currentHour < 0.91 * constants.NUMBER_OF_FRAMES:
                    randomBoolean = Math.random() >= 0.5;
                    break;
                default:
                    randomBoolean = Math.random() >= 0.85;
            }
            point[2] = randomBoolean;
            if (point[2]) {
                const prevHourParking = history[currentHour - 1];
                if (prevHourParking && prevHourParking[i][j][2]) {
                    point[3] = prevHourParking[i][j][3];
                    point[4] = prevHourParking[i][j][4];
                } else {
                    point[3] = [0, Math.PI][Math.floor(Math.random() * 2)];
                    point[4] = Math.floor(Math.random() * constants.TOTAL_CARS);
                }
            }
        });
    });
};

module.exports = parkingHistoryRoute;
