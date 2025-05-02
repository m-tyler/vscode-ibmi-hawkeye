;commit
;select * from table ( PGMT.HWK_getHawkeyeProgramObjectSourceListTF(APITYP => '20' ,APIOPT => '80',APIOB => 'PRPATGI0', APIOBL => 'WFIDTA', APIOBM => ' ', APIOBA => '*FILE') );
;select * from table ( PGMT.HWK_getHawkeyeProgramObjectSourceListTF(APITYP => '20' ,APIOPT => '80',APIOB => 'PRP07KCL', APIOBL => 'WFIOBJ', APIOBM => ' ', APIOBA => '*MODULE') );
;select * from table ( PGMT.HWK_getHawkeyeProgramObjectSourceListTF(APITYP => '20' ,APIOPT => '80',APIOB => 'UTL25SCL', APIOBL => 'WFIOBJ', APIOBM => ' ', APIOBA => '*MODULE ') );
;select * from table ( PGMT.HWK_getHawkeyeProgramObjectSourceListTF(APITYP => '20' ,APIOPT => '80',APIOB => 'PRP03L ', APIOBL => 'WFIOBJ', APIOBM => ' ', APIOBA => '*MODULE ', APISEQ =>'0359.00') );
;with FILTERED (/*APISF, APISFL, APISFM,*/ PODSFL, PODSLB, PODSMB, HOW_USED, PODTXT--, PODSEQ
) as (
    select distinct 
        case when APISF = ' '  then '' else APISF end 
       ,case when APISFL = ' ' then '' else APISFL end 
       ,case when APISFM = ' ' then '' else APISFM end 
--        ,case when PODSFL = ' ' then APISF else PODSFL end
--        ,case when PODSLB = ' ' then APISFL else PODSLB end
--        ,case when PODSMB = ' ' then APISFM else PODSMB end
       ,trim(right(PODCMD, case locate('-', PODCMD) when 0 then length(PODCMD) else locate('-', PODCMD)+2 end)) 
       ,ifnull(PODTXT,'')
--        , case when PODCMD like '%COPY%' then PODSEQ else '0000.00' end PODSEQ
      from ILEDITOR.O_KLA2CAD3
      left join table ( PGMT.HWK_getHawkeyeProgramObjectSourceListTF(APITYP => '20' ,APIOPT => '80'
                                                                    , APIOB => case when PODCMD <> 'RPG-COPY' then PODOBJ else POHPGM end 
                                                                    , APIOBL => case when PODCMD <> 'RPG-COPY' then PODLIB else POHLIB end 
                                                                    , APIOBM => ' '
                                                                    , APIOBA => case PODTYP when '*PGM' then '*MODULE' else PODTYP end
                                                                    , APISEQ => PODSEQ) ) HS on 1=1 --PODCMD  = 'RPG-COPY'
--       left join HAWKEYE.H$DOBJS on OXSEQ = PODSEQ and OXNAME = PODOBJ and OXPGML = POHPGM||' '||POHLIB

      where PODCMD not in ('BIND') and PODSEQ <> '0000.00'
  )
-- select * from FILTERED where 1=1 /*and PODSMB like 'PRPATG%' */order by PODSEQ, PODSFL, PODSLB, PODSMB, HOW_USED, PODTXT;  
,CONDENSE_HOW_USED (PODSFL, PODSLB, PODSMB, HOW_USED_LIST, PODTXT) as 
(
  select PODSFL, PODSLB, PODSMB
  ,varchar( (listagg( distinct HOW_USED, ':') within group (order by PODSFL, PODSLB, PODSMB)) ,256) HOW_USED_LIST
  ,min(ifnull(PODTXT,''))
  from FILTERED 
  group by PODSFL, PODSLB, PODSMB, HOW_USED
)  
-- select * from CONDENSE_HOW_USED order by PODSFL, PODSLB, PODSMB, HOW_USED_LIST ;


select '/WIASP/QSYS.LIB/' || trim(SCDLIB) || '.LIB/' || trim(SCDFIL) ||'.FILE/' || trim(SCDMBR) || '.' || (
  case
    when SP.SRCTYPE is not NULL then SP.SRCTYPE
    when SP.SRCTYPE is NULL and SCDFIL = 'QSQDSRC' then 'SQL'
    else 'MBR'
  end) || '~' || trim(ifnull(HOW_USED_LIST, '')) || '~' || char(SCDSEQ)
  || '~' || varchar(rtrim(SCDSTM), 112)||'~'||ifnull(PODTXT,'')
from ILEDITOR.O_ZQ1TTFRH
left join CONDENSE_HOW_USED on PODSFL = SCDFIL and PODSLB = SCDLIB and PODSMB = SCDMBR
left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME = SCDLIB and SP.SYS_TNAME = SCDFIL and SP.SYS_MNAME = SCDMBR


;select a.* from ILEDITOR.O_KLA2CAD3 a where 1=1 
-- and PODSMB =  ' '
-- and POHLIB = 'WFIOBJ' 
-- and POHPGM  = 'PRP03L' 
-- and PODCMD  = 'RPG-COPY'
-- and PODOBJ like 'PRP07E%'
-- and PODSFL like 'Z_%'
;select * from ILEDITOR.O_ZQ1TTFRH




;
select '/WIASP/QSYS.LIB/' || trim(SCDLIB) || '.LIB/' || trim(SCDFIL) || '.FILE/' || trim(SCDMBR) ||
    '.' || (
    case
      when SP.SOURCE_TYPE is not NULL then SP.SOURCE_TYPE
      when SP.SOURCE_TYPE is NULL and SCDFIL = 'QSQDSRC' then 'SQL'
      else 'MBR'
    end) || '~' || '~' || char(SCDSEQ) || '~' || varchar(rtrim(SCDSTM), 112)
  from ILEDITOR.O_iz2jbqaz
       left join QSYS2.SYSPARTITIONSTAT SP
         on SP.SYSTEM_TABLE_SCHEMA = SCDLIB and SP.SYSTEM_TABLE_NAME = SCDFIL and
           SP.SYSTEM_TABLE_MEMBER = SCDMBR;