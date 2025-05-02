
create or replace variable APITYP char(2);
create or replace variable APIOPT char(2);
create or replace variable APIOB  char(10);
create or replace variable APIOBL char(10);
create or replace variable APIOBM char(10);
create or replace variable APIOBA char(10);
create or replace variable APISTS  char(1) default ' ';
create or replace variable APISF  char(10) default ' ';
create or replace variable APISFL char(10) default ' ';
create or replace variable APISFM char(10) default ' ';
create or replace variable APISEQ char(7) default ' ';
    set APITYP = '20'; 
    set APIOPT = '80';
--     set APIOB = 'QCPYSRC';
    set APIOB = 'PRP03L';
--     set APIOB = 'PRPATGI0';
--     set APIOBL = 'WFISRC';
    set APIOBL = 'WFIOBJ';
--     set APIOBL = 'WFIDTA';
    set APIOBM = ' ';
--     set APIOBA = '*FILE';
    set APIOBA = '*MODULE';
    set APISTS = ' ';
    set APISF  = ' ';
    set APISFL = ' ';
    set APISFM = ' ';
--     set APISEQ = '0453.00';
    commit;
    call HWK_getHawkeyeProgramObjectSourceList(APITYP,APIOPT,APIOB,APIOBL,APIOBM,APIOBA,APISTS,APISF,APISFL,APISFM);
--     return select * from table( values(APISF,APISFL,APISFM) ) x (APISF,APISFL,APISFM);

select ifnull(nullif(APISF,''),APIOB) OBJ
,ifnull(nullif(APISFL,''),APIOBL) LIB
,ifnull(nullif(APISFM,''),APIOBA) MBR_OR_TYP from table( values(APISF,APISFL,APISFM,APIOB,APIOBL,APIOBA) ) x (APISF,APISFL,APISFM,APIOB,APIOBL,APIOBA) where APISEQ is null or APISEQ ='  '
;
union
;
select 
PODOBJ,PODLIB,PODTYP,dec(PODSEQ,7,2),PODCMD,OXNAME,OXLIB,OXTYPE,X.OXSEQ,x.OXCMD,
A.*
, X.*
-- , X2.*
-- x2.*,
-- X2.OXLIB, X.OXNAME, X2.OXNAME,POHPGM,POHLIB,PODTYP
from ILEDITOR.O_KLA2CAD3 a 
left join HAWKEYE.H$DOBJS x on x.OXPGML = (POHPGM||' '||POHLIB) 
-- and x.OXCMD = PODCMD 
and X.OXSEQ = dec(PODSEQ,7,2)  
and (PODOBJ,PODLIB,PODTYP) = (OXNAME,OXLIB,OXTYPE)
-- left join HAWKEYE.H$DOBJS x2 on X2.OXID = X.OXID and X2.OXCMD = 'RPG-COPY' and x2.OXSEQ = 0 and X2.OXTYPE = 'MBR'
where 1=1 
-- and POHLIB = APIOBL 
-- and POHPGM  = APIOB 
-- and PODCMD  = 'RPG-COPY'
-- and PODSEQ = '0047.00'
-- and PODOBJ = 'PRPETXTB'
;


(PODOBJ,PODLIB,PODTYP) = (OXNAME,OXLIB,OXTYPE)