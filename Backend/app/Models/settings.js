const db = require('./db');

class settingModel {
    static loadSetting(category,name=null) {
        return new Promise((resolve,reject)=> {
            let query = `SELECT * FROM settings WHERE varCategory = $1`;
            let inputs = [];
            inputs.push(category);
            if (name) {
                query += ` and varName = $2`;
                inputs.push(name);
            }
            db.query(query,
                inputs,
                (error,response)=>{
                    if (error) reject(error);
                    response.rows.forEach(row => {
                        global.settings[category+'_'+row['varname']] = row['varvalue'];
                    });    
                    resolve();
                });
        })
    }
    static getSetting(category) {
        return new Promise((resolve,reject)=> {
            db.query(`SELECT * FROM settings WHERE varCategory = $1;`,
            [category],
            (error,response)=>{
                if (error) reject(error);
                resolve(response.rows);
            });
        })
    }
}

module.exports = settingModel;