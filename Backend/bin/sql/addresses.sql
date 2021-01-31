CREATE TABLE addresses (
    id              SERIAL PRIMARY KEY,
    btc_address     character(80) UNIQUE,
    first_update     TIMESTAMP DEFAULT NOW() , 
    last_update      TIMESTAMP DEFAULT NOW() ,
    deposits        NUMERIC(32,8) DEFAULT 0,
    withdrawals        NUMERIC(32,8) DEFAULT 0
);


CREATE TABLE address_blocks (
    id          SERIAL PRIMARY KEY,
    address_id  BIGINT,
    block_height  INT
);

CREATE TABLE TxIdOut (
    id          SERIAL PRIMARY KEY,
    txid        character(100),
    vout        SMALLINT,
    outaddress  character(40)
);
CREATE INDEX TxIdOut_txid_idx ON TxIdOut(txid);


CREATE TABLE block_details(
    id SERIAL PRIMARY KEY,
    block_height INT,
    block_time INT,
    block_hash character(100),
    tx_count INT,
    block_fee NUMERIC(322,8),
    max_fee NUMERIC(322,8),
    min_fee NUMERIC(322,8),
    reward_address_id INT    
);


