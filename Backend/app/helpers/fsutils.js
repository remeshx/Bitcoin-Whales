const fs = require('fs');
   
async function writeAllAddresses(fileStream,addQueries,addQueriesKeys) {        
    let sql='';
     var i=0;
     for  await(var key of addQueriesKeys) { 
        if (!key) continue;
        i++;
        sql = addQueries[key];
        sql = sql.replace(/(^,)|(,$)/g, "");
        await writeout(fileStream,'addresses',sql,key);
      }
}


   async function writeAllTransaction(fileStream,vinQuery,voutQuery,txQuery,vinQueryKeys,voutQueryKeys,txQueryKeys) {
        
            let sql='';
            var i=0;

            for await(var key of vinQueryKeys) { 
                if (!key) continue;
                i++;
                sql = vinQuery[key];
                sql = sql.replace(/(^,)|(,$)/g, "");
                await writeout(fileStream,'inputs',sql,key);
            }

            i=0;
            for await(var key of voutQueryKeys) { 
                if (!key) continue;
                i++;
                sql = voutQuery[key];
                sql = sql.replace(/(^,)|(,$)/g, "");
                await writeout(fileStream,'outputs',sql,key);
            }   


            i=0;
            for await (var key of txQueryKeys) { 
                if (!key) continue;
                i++;
                sql = txQuery[key];
                sql = sql.replace(/(^,)|(,$)/g, "");            
                await writeout(fileStream,'trx',sql,key);
            }
      
    }


    
    async function writeout(fileStream,type,line,key) {
      
            try {
                await fileStream[type+key].write(line);
            } catch (error) {                
                fileStream[type+key] = fs.createWriteStream('outputs/'+ type +'_'+ key +'.csv', {flags:'a'});
                await fileStream[type+key].write(line);
            }         
    }

    module.exports = {writeAllTransaction,writeAllAddresses,writeout}