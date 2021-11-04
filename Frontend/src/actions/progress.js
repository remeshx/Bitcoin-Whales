import { Blocks } from './types';
import { URL_PROGRESS_STATUS } from '../../config';

export const updateStartupProgress = (data) => dispatch => {
    console.log('updateStartupProgress', data);
    if (! typeof progressForTheFirstTime !== 'undefined') var progressForTheFirstTime = true;
    if (! typeof progressRunning !== 'undefined') var progressRunning = false;
    console.log('progressForTheFirstTime', progressForTheFirstTime);
    console.log('progressRunning', progressRunning);
    if (progressRunning) return false;

    if (!progressRunning && progressForTheFirstTime) {
        progressRunning = true;
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
                dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
                if (i == parseInt(data.step)) {
                    console.log('STOPPED');
                    progressForTheFirstTime = false;
                    progressRunning = false;
                }
            }, (i - 2) * 200);
        }
    } else {
        dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: data });
    }
}

export const fetchProgressStatus = () => dispatch => {

    console.log('fetchProgressStatus');
    fetch(URL_PROGRESS_STATUS)
        .then(response => response.json())
        .then(data => updateStartupProgress)
        .catch(error => console.log('error', error));
}

