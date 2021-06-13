//import {BLOCKS} from '../actions/types';
//import fetchStates from './fetchStates';

const DEFAULT_BLOCK = {
    blockInfo : {
        lastBlockRead: 0,
        lastBlock: 999
    },
    trxInfo : {
        trxCount : 0,
        trxRead : 0
    },
    progress : {
        step1_status : 'Not Started',
        step1_progress : '0',
        step1_icon_class : 'ion-md-analytics bg-secondary',
        step2_status : 'Not Started',
        step2_progress : '0',
        step2_icon_class : 'ion-md-grid bg-secondary',
        step3_status : 'Not Started',
        step3_progress : '0',
        step3_icon_class : 'ion-logo-bitcoin bg-secondary',
        step4_status : 'Not Started',
        step4_progress : '0',
        step4_icon_class : 'ion-ios-code-working bg-secondary'
    },
    time: '0000-00-00 00:00:00.000'
};


export const blockReducer = (state = DEFAULT_BLOCK, action) => {
    const newState= {...state};
    
    //console.log('blockreducer', state);
    if (action.type=='UPDATE_BLK') {
        //console.log('action',action);
         newState.blockInfo = {...action.blockInfo}
         newState.trxInfo = {...DEFAULT_BLOCK.trxInfo}
         newState.progress = {...DEFAULT_BLOCK.progress}
    }

    if (action.type=='UPDATE_TIME') {
        newState.time = action.time;
    }

    console.log('action.type', action.type);
    if (action.type=='UPDATE_TRX') {
        //console.log('action.trxInfo', action.trxInfo);
        newState.trxInfo = {...action.trxInfo}
    }

    if (action.type=='FETCH_PROGRESS_STATUS') {
        console.log('action : FETCH_PROGRESS_STATUS', action);
        const fetchResult = {...action.progress};
        let progressResult = {...DEFAULT_BLOCK.progress};
        let i=1;
        while (i<fetchResult.step) 
        {
            progressResult['step'+i+'_status'] = 'Completed';
            progressResult['step'+i+'_progress'] = '0';
            progressResult['step'+i+'_icon_class'] = 'ion-md-checkmark bg-success';
            i++;
        }

        if (fetchResult.step==i) 
        {
            progressResult['step'+i+'_status'] = fetchResult.status;
            progressResult['step'+i+'_progress'] = fetchResult.progress;
            progressResult['step'+i+'_icon_class'] =progressResult['step'+i+'_icon_class'] +  ' bg-warning';
        } 

        newState.progress = {...progressResult}
        console.log('progressResult: ', progressResult);
    }

    if (action.type=='UPDATE_STARTUP_PROGRESS') {
        //console.log('action : UPDATE_STARTUP_PROGRESS', action);
        const data = {...action.progress};

        let progressResult = {...DEFAULT_BLOCK.progress};
        let i=1;
        let step=data.step;
        let progress= Math.round((10000 * data.currPos) / data.finalPos) /100;
        let status = '';
        switch (parseInt(data.step)) {
            case 1:                
                status = 'Reading Block ' + data.currPos + ' of ' + data.finalPos; 
                break;    
            case 2:                
                status = 'importing to DB ' + data.currPos + ' of ' + data.finalPos; 
                break;    
            case 3:                
                status = 'Mark Spent ' + data.currPos + ' of ' + data.finalPos; 
                break;   
            case 4:                
                status = 'Creating Tables ' + data.currPos + ' of ' + data.finalPos; 
                break;         
            case 5:                
                status = 'Finding whales ' + data.currPos + ' of ' + data.finalPos; 
                break;             
        }

        while (i<parseInt(step)) 
        {
            progressResult['step'+i+'_status'] = 'Completed';
            progressResult['step'+i+'_progress'] = '0';
            progressResult['step'+i+'_icon_class'] = 'ion-md-checkmark bg-success';
            i++;
        }

        if (parseInt(step)==i) 
        {
            progressResult['step'+i+'_status'] = status;
            progressResult['step'+i+'_progress'] = progress;
            progressResult['step'+i+'_icon_class'] =progressResult['step'+i+'_icon_class'] +  ' bg-warning';
        } 

        newState.progress = {...progressResult}
        //console.log('progressResult: ', progressResult);  
     
    }

    return newState;
}

export default blockReducer;