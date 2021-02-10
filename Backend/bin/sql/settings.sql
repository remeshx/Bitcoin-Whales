CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    varCategory varChar(20),
    varName varChar(50),
    varValue varChar(50),
    varDefault boolean NOT NULL Default 'false',
    lastUpdate TIMESTAMP NOT NULL
);

INSERT INTO settings (varCategory,varName,varValue,lastUpdate) VALUES 
        ('BitcoinNode','IPPORT','136.243.88.216:8332',CURRENT_TIMESTAMP),
        ('BitcoinNode','USERNAME','root',CURRENT_TIMESTAMP),
        ('BitcoinNode','PASSWORD','HSsdxYdihe',CURRENT_TIMESTAMP),
        ('BitcoinNode','LastBlockHeightRead','0',CURRENT_TIMESTAMP );


        
INSERT INTO settings (varCategory,varName,varValue,lastUpdate) VALUES 
        ('BitcoinNode','trxRead','-1',CURRENT_TIMESTAMP);