import { Blocks } from './types';
import { URL_PROGRESS_STATUS } from '../../config';
global.progressForTheFirstTime = true;
global.progressRunning = false;

export const updateStartupProgress = (data) => dispatch => {
    console.log('updateStartupProgress', data);
    console.log('progressForTheFirstTime', global.progressForTheFirstTime);
    console.log('progressRunning', global.progressRunning);
    if (global.progressForTheFirstTime || global.progressRunning) return false;

    dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: data });
}

export const fetchProgressStatus = () => dispatch => {
    console.log('updateStartupProgress', data);
    console.log('progressForTheFirstTime', global.progressForTheFirstTime);
    console.log('progressRunning', global.progressRunning);

    console.log('fetchProgressStatus');
    fetch(URL_PROGRESS_STATUS)
        .then(response => response.json())
        .then(data => {
            global.progressRunning = true;
            let stepjson = {}
            stepjson.step = 2;
            console.log('data.step', data.step);
            console.log('json.step', 2);
            dispatch({ type: 'FETCH_PROGRESS_STATUS', progress: stepjson });
            for (let i = 2; i <= parseInt(data.step); i++) {
                setTimeout(() => {
                    let j = (i - 2) * 200
                    let json = {};
                    json.step = i;
                    console.log('data.step', data.step);
                    console.log('json.step', json.step);
                    console.log('timeout ' + i + '/' + j, json.step);
                    dispatch({ type: 'FETCH_PROGRESS_STATUS', progress: json });
                    if (i == parseInt(data.step)) {
                        console.log('STOPPED');
                        global.progressForTheFirstTime = false;
                        global.progressRunning = false;
                    }
                }, (i - 2) * 200);
            }
        })
        .catch(error => console.log('error', error));
}

