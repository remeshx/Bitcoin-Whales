TRUNCATE TABLE settings;
INSERT INTO settings (varCategory,varName,varValue,lastUpdate) VALUES 
        ('BitcoinNode','LastBlockHeightRead','0',CURRENT_TIMESTAMP ),
        ('BitcoinNode','LastFileWritten','0',CURRENT_TIMESTAMP ),
        ('BitcoinNode','trxRead','-1',CURRENT_TIMESTAMP),
        ('BitcoinNode','totalTrxRead','0',CURRENT_TIMESTAMP),
        ('BitcoinNode','CurrentStage','1',CURRENT_TIMESTAMP),
        ('BitcoinNode','CurrentStageTitle','preloading_stage1_getblockinfo',CURRENT_TIMESTAMP);