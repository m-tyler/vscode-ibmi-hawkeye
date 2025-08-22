;CL: addlible ILEDITOR 
;select * from table( values(APISF,APISFL,APISFM,APIOB,APIOBL,APIOBA) ) x (APISF,APISFL,APISFM,APIOB,APIOBL,APIOBA) where APISEQ is null or APISEQ ='  '
-- ;
-- union
;
-- csv:
with BASE_DATA as (
select '~'
,case when nullif(HS.APISFL ,' ') is null then ifnull(X2.OXLIB ,PODSLB) else HS.APISFL end ITEMSRFL
,case when nullif(HS.APISF ,' ')  is null then ifnull(X2.OXOVRF,PODSFL) else HS.APISF end ITEMSRCF
,case when nullif(HS.APISFM ,' ') is null then ifnull(X2.OXNAME,PODSMB) else HS.APISFM end ITEMSRCM
,ifnull(nullif(PODATR,''),POHATR) ITEMSRCT
,dec(PODSEQ,7,2) ITEMSRCSEQ
,ifnull(PODCMD,X.OXCMD) HOWUSED
,varchar(rtrim(substr(ifnull(X.OXSTMT,X2.OXSTMT),1,80)),112) ITEMSRCSTMT
,'~AA~'
,A.*
,'~XX~'
, X.*
-- ,'~X2~'
-- ,x2.*
-- ,'~HS~'
-- ,HS.*
from PGMT.H$PGMOBJ a -- PGMOBJs 
left join HAWKEYE.H$DOBJS x on (PODOBJ,PODLIB,PODTYP) = (X.OXNAME,X.OXLIB,X.OXTYPE) -- refs in PGMOBJ
                            and x.OXPGML = (POHPGM||' '||POHLIB) -- PGMOBJ references
                            and X.OXSEQ = dec(PODSEQ,7,2)  -- PGMOBJ references
-- and x.OXCMD = PODCMD 
left join HAWKEYE.H$DOBJS x2 on X2.OXID = X.OXID and X2.OXCMD = 'RPG-COPY' and x2.OXSEQ = 0 and X2.OXTYPE = 'MBR'
left join table ( HWK_GetObjectSourceInfo(APITYP => '20' ,APIOPT => '80'
                                          , APIOB => ifnull(X2.OXNAME, PODOBJ)
                                          , APIOBL => ifnull(X2.OXLIB, PODLIB)
                                          , APIOBM => ' '
                                          , APIOBA => PODTYP
                                          ) ) HS on 1=1 --PODTYP  = '*FILE'
)
select 'QQ'
,'WIASP/QSYS.LIB/'||trim(ITEMSRFL)||'.LIB/'||trim(ITEMSRCF)||'.FILE/'||trim(ITEMSRCM)||'.'|| ifnull(SP.SOURCE_TYPE,ITEMSRCT) 
||'~'
-- ||trim(ifnull(HOW_USED_LIST,''))
||'~'||char(ITEMSRCSEQ)||'~'||varchar(rtrim(ITEMSRCSTMT),112)
,BD.* 
-- ,SP.*
from BASE_DATA BD
left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=ITEMSRFL and SP.SYS_TNAME=ITEMSRCF and SP.SYS_MNAME=ITEMSRCM
;

;select * from HAWKEYE.H$DOBJS where OXPGML = 'PRP03P     WFIOBJ    '
;select rrn(s), S.OXTYPE, S.OXNAME, S.OXLIB, S.OXCMD, S.OXPGML, S.OXPGM, S.OXID, S.OXNUM, S.OXLVL, S.OXSEQ, S.OXSRCT, S.OXLVID, S.OXOVRF, S.OXLIBL, S.OXREAL
, hex( substr( S.OXSTMT ,1,1) ) 
, hex( substr( S.OXSTMT ,7,1) )
, trim( S.OXSTMT )
, hex(trim( S.OXSTMT ))

from HAWKEYE.H$DOBJS s where rrn(s) between 600501 and 600506 or rrn(s) = 600507
;select * from ILEDITOR.O_4FLOE8VN

;select * from ILEDITOR.O_4FLOE8VN a -- PGMOBJs 
left join HAWKEYE.H$DOBJS x on (PODOBJ,PODLIB,PODTYP) = (X.OXNAME,X.OXLIB,X.OXTYPE) -- refs in PGMOBJ
                            and x.OXPGML = (POHPGM||' '||POHLIB) -- PGMOBJ references
                            and X.OXSEQ = dec(PODSEQ,7,2)  -- PGMOBJ references
                            and PODCMD not in ('ENTMOD')
