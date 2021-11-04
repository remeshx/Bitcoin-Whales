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

    if (typeof progressForTheFirstTime !== 'undefined') var progressForTheFirstTime = true;

    if (progressForTheFirstTime && data.step > 2) {
        let i = 2;
        let json = {};
        json.step = i;
        progressForTheFirstTime = false;
        dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
        while (i < parseInt(data.step)) {
            json.step++;
            i++;
            setTimeout(() => {
                dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
            }, (i - 2) * 500);

        }
    } else {
        dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: data });
    }
}

