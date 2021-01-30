const settingModel = require('../../Models/settings');

class Api {

    static getApiOutput() {
        
        return new Promise((resolve,reject) =>{

            settingModel.loadSetting('BitcoinNode')
            .then(rows=>{     
                let str = '';       
                rows.forEach(row => {
                    console.log('row',row);
                    str+= row['varname']  + ' : ' + row['varvalue'] + ' - ';
                });    
                console.log(global.newvar); 
                resolve(str);
            });
        });
        
    }

    static loadSettings() {
        
        return new Promise((resolve,reject) =>{
            settingModel.loadSetting('BitcoinNode','USERNAME')
            .then(()=>{
                console.log('setting 1',global.settings);

                settingModel.loadSetting('BitcoinNode')
                .then(()=>{
                    console.log('setting 2',global.settings);
                }).catch(error=>reject(error));
                
            }).catch(error=>reject(error));
            

            
            
            resolve('setting is loaded.');
        });
        
    }

}

module.exports  = Api;