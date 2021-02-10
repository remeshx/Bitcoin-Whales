CREATE TABLE addresses (
    id              SERIAL PRIMARY KEY,
    btc_address     character(80) UNIQUE,
    first_update     TIMESTAMP DEFAULT NOW() , 
    last_update      TIMESTAMP DEFAULT NOW() ,
    deposits        NUMERIC(32,8) DEFAULT 0,
    withdrawals        NUMERIC(32,8) DEFAULT 0
);
CREATE INDEX addressid ON addresses(id);


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
    min_fee NUMERIC(322,8) 
);


CREATE TABLE block_rewards (
    id SERIAL PRIMARY KEY,
    block_height INT,
    block_reward_total NUMERIC(322,8),
    reward_address_id INT,
    reg_time TIMESTAMP DEFAULT NOW(),
    reward_time INT 
);

CREATE TABLE transactions (
    id          SERIAL PRIMARY KEY,
    blockid     INT,
    txid        character(100),
    txseq       SMALLINT
);
CREATE INDEX transactionsid ON transactions(txid);


CREATE TABLE addresses_input  (
    id          SERIAL PRIMARY KEY,
    addressid     INT,
    txid          INT,
    vout          INT,
    amount        NUMERIC(322,8),
    FOREIGN KEY (txid) REFERENCES transactions(id),
    FOREIGN KEY (addressid) REFERENCES addresses(id)
);
CREATE INDEX adresses_input_txid_idx ON addresses_input(txid);


CREATE TABLE inputs  (
    id          SERIAL PRIMARY KEY,
    blockheight INT,
    txid          INT,
    vouttxid      character(100),
    vout          INT,
    amount        NUMERIC(322,8) Default 0
);

CREATE TABLE outputs  (
    id          SERIAL PRIMARY KEY,
    blockheight INT,
    txid          INT,
    outaddress        character(100),
    vout          INT,
    amount        NUMERIC(322,8)
);
CREATE INDEX outputs_txid ON outputs(txid);
