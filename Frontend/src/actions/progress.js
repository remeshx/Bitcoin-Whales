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


export const updateStartupProgress = (data) => async (dispatch) => {
    if (progressForTheFirstTime) {
        let i = 2;
        let json = {};
        json.step = i;
        while (i < parseInt(data.step)) {
            json.step++;
            i++;
            dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
            await sleep(500);
        }
    }
    dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: data });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

