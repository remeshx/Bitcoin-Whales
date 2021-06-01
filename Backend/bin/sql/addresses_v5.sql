CREATE TABLE addresses__ (
    id              SERIAL PRIMARY KEY,
    btc_address     character(80) UNIQUE,
    first_update     TIMESTAMP DEFAULT NOW() , 
    last_update      TIMESTAMP DEFAULT NOW() ,
    deposits        NUMERIC(32,8) DEFAULT 0,
    withdrawals        NUMERIC(32,8) DEFAULT 0
);
CREATE INDEX addressid ON addresses__(id);


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


CREATE TABLE transactions (
    id          SERIAL PRIMARY KEY,
    block_height     INT,
    txid        character(80),
    txseq       SMALLINT
);


do $transactions$
declare
  chars CHAR[] := array['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
  ch1 CHAR;
  ch2 CHAR;
  ch3 CHAR;
  tbl text;
begin
  <<"FOREACH 1">>
  foreach ch1 in array chars loop
    <<"FOREACH 2">>
    foreach ch2 in array chars loop
       <<"FOREACH 3">>
        foreach ch3 in array chars loop
            tbl := CONCAT('transactions_', ch1 , ch2 , ch3);
            raise info 'Create table %', tbl;
            EXECUTE format('create table %s ( like transactions including all)',tbl);
        end loop "FOREACH 3";
    end loop "FOREACH 2";
  end loop "FOREACH 1";
end;
$transactions$;



CREATE TABLE outputs  (
    id          SERIAL,
    txid          INT,
    outaddress    character(80),
    vout          INT,
    amount        NUMERIC(16,8),
    spend       SMALLINT DEFAULT 0,
    primary key (id)
) ;


do $outputs$
declare
  chars CHAR[] := array['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
  ch1 CHAR;
  ch2 CHAR;
  ch3 CHAR;
  tbl text;
begin
  <<"FOREACH 1">>
  foreach ch1 in array chars loop
    <<"FOREACH 2">>
    foreach ch2 in array chars loop
       <<"FOREACH 3">>
        foreach ch3 in array chars loop
            tbl := CONCAT('outputs_', ch1 , ch2 , ch3);
            raise info 'Create table %', tbl;
            EXECUTE format('create table %s ( like outputs including all)',tbl);
        end loop "FOREACH 3";
    end loop "FOREACH 2";
  end loop "FOREACH 1";
end;
$outputs$;



CREATE TABLE inputs  (
    id          SERIAL,
    txid          INT ,
    vouttx      character(80),
    vouttxid      INT Default 0,
    vout          INT
    primary key (id)
) ;

do $inputs$
declare
  chars CHAR[] := array['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
  ch1 CHAR;
  ch2 CHAR;
  ch3 CHAR;
  tbl text;
begin
  <<"FOREACH 1">>
  foreach ch1 in array chars loop
    <<"FOREACH 2">>
    foreach ch2 in array chars loop
       <<"FOREACH 3">>
        foreach ch3 in array chars loop
            tbl := CONCAT('inputs_', ch1 , ch2 , ch3);
            raise info 'Create table %', tbl;
            EXECUTE format('create table %s ( like inputs including all)',tbl);
        end loop "FOREACH 3";
    end loop "FOREACH 2";
  end loop "FOREACH 1";
end;
$inputs$;





CREATE TABLE addresses (
    id              SERIAL PRIMARY KEY,
    blockheight     INT,
    btc_address     character(80) UNIQUE,
    created_time      TIMESTAMP DEFAULT NOW() ,
    amount        NUMERIC(16,8) DEFAULT 0,
    spend        SMALLINT DEFAULT 0,
    txid        character(80),
    vout        SMALLINT
);

do $addresses$
declare
--   chars CHAR[] := array['0','1','2','3','4','5','6','7','8','9','a',
--                         'b','c','d','e','f','g','h','i','j','k','l',
--                         'm','n','o','p','q','r','s','t','u','v','w',
--                         'x','y','z','A','B','C','D','E','F','G','H',
--                         'I','J','K','L','M','N','O','P','Q','R','S',
--                         'T','U','V','W','X','Y','Z'];
  chars TEXT[] := array['48','49','50','51','52','53','54','55','56',
                        '57','97','98','99','100','101','102','103',
                        '104','105','106','107','108','109','110','111',
                        '112','113','114','115','116','117','118','119',
                        '120','121','122','65','66','67','68','69','70',
                        '71','72','73','74','75','76','77','78','79','80',
                        '81','82','83','84','85','86','87','88','89','90'];
  ch1 TEXT;
  ch2 TEXT;
  tbl text;
begin
  <<"FOREACH 1">>
  foreach ch1 in array chars loop
    <<"FOREACH 2">>
    foreach ch2 in array chars loop
            tbl := CONCAT('addresses_', ch1 , ch2);
            raise info 'Create table %', tbl;
            EXECUTE format('create table %s ( like addresses including all)',tbl);
    end loop "FOREACH 2";
  end loop "FOREACH 1";
end;
$addresses$;



CREATE TABLE richestAddresses (
    id              SERIAL PRIMARY KEY,
    btc_address     character(80) UNIQUE,
    created_at      TIMESTAMP DEFAULT NOW() ,
    updated_at      TIMESTAMP DEFAULT NOW() ,
    balance        NUMERIC(16,8) DEFAULT 0    
);