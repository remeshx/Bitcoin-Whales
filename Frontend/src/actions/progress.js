import { Blocks } from './types';
import { URL_PROGRESS_STATUS } from '../../config';
var progressForTheFirstTime = true;

export const fetchProgressStatus = () => dispatch => {
    console.log('fetchProgressStatus');
    fetch(URL_PROGRESS_STATUS)
        .then(response => response.json())
        .then(json => dispatch({ type: 'FETCH_PROGRESS_STATUS', progress: json }))
        .catch(error => console.log('error', error));
}


export const updateStartupProgress = (data) => dispatch => {

    if (! typeof progressForTheFirstTime !== 'undefined') var progressForTheFirstTime = true;
    if (! typeof progressRunning !== 'undefined') var progressRunning = false;

    if (!progressRunning && progressForTheFirstTime && data.step > 2) {
        progressRunning = true;
        let i = 2;
        let json = {};
        json.step = i;
        console.log('dispatch', json);
        dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
        while (i <= parseInt(data.step)) {
            json.step++;
            i++;
            setTimeout(() => {
                console.log('dispatch', json);
                dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
                if (i == parseInt(data.step)) {
                    console.log('STOPPED');
                    progressForTheFirstTime = false;
                }
            }, (i - 2) * 1000);

        }
    } else if (!progressForTheFirstTime) {
        //dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: data });
    }
}

