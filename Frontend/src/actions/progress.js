import { Blocks } from './types';
import { URL_PROGRESS_STATUS } from '../../config';
var progressForTheFirstTime = true;

export const fetchProgressStatus = () => dispatch => {

    if (! typeof progressForTheFirstTime !== 'undefined') var progressForTheFirstTime = true;
    if (! typeof progressRunning !== 'undefined') var progressRunning = false;
    if (progressForTheFirstTime && progressRunning) return false;

    console.log('fetchProgressStatus');
    fetch(URL_PROGRESS_STATUS)
        .then(response => response.json())
        .then(data => {
            progressRunning = true;
            let i = 2;
            let json = {};
            let j = 0;
            json.step = i;
            console.log('data.step', data.step);
            console.log('json.step', json.step);
            dispatch({ type: 'FETCH_PROGRESS_STATUS', progress: json });
            while (i <= parseInt(data.step)) {
                i += 1;
                json.step = i;
                setTimeout(() => {
                    j = (i - 2) * 1000
                    console.log('timeout ' + j, json.step);
                    dispatch({ type: 'FETCH_PROGRESS_STATUS', progress: json });
                    if (i == parseInt(data.step)) {
                        console.log('STOPPED');
                        progressForTheFirstTime = false;
                    }
                }, (i - 2) * 1000);
            }
            //dispatch({ type: 'FETCH_PROGRESS_STATUS', progress: data });

        })
        .catch(error => console.log('error', error));
}


export const updateStartupProgress = (data) => dispatch => {

    if (! typeof progressForTheFirstTime !== 'undefined') var progressForTheFirstTime = true;
    if (progressForTheFirstTime) return;
    dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: data });

    // if (progressForTheFirstTime && data.step > 2) {
    //     // progressRunning = true;
    //     // let i = 2;
    //     // let json = {};
    //     // json.step = i;
    //     // console.log('dispatch', json);
    //     // dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
    //     // while (i <= parseInt(data.step)) {
    //     //     i += 1;
    //     //     json.step = i;
    //     //     setTimeout(() => {
    //     //         console.log('dispatch', json);
    //     //         dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: json });
    //     //         if (i == parseInt(data.step)) {
    //     //             console.log('STOPPED');
    //     //             progressForTheFirstTime = false;
    //     //         }
    //     //     }, (i - 2) * 1000);

    //     // }
    // } else if (!progressForTheFirstTime) {
    //     //dispatch({ type: 'UPDATE_STARTUP_PROGRESS', progress: data });
    // }
}

