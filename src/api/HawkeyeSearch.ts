import { l10n } from 'vscode';
import { Code4i, sanitizeSearchTerm, checkObject } from '../tools';
import { getIASP } from '../api/IBMiTools';
import { SourceFileMatch } from '../types/types';
import { CommandResult } from '@halcyontech/vscode-ibmi-types';

export namespace HawkeyeSearch {


  export async function searchMembers(library: string, sourceFile: string, memberFilter: string, searchTerm: string, readOnly?: boolean): Promise<SourceFileMatch[]> {
    const connection = Code4i.getConnection();
    library = (library !== '*ALL' ? library : '*ALL');
    sourceFile = (sourceFile !== '*ALL' ? sourceFile : '*ALL');
    let mbrExt = memberFilter.split(`.`);
    const member = (mbrExt[0] !== '*ALL' ? mbrExt[0] : '*ALL');
    const memberExt = (mbrExt[1] !== '*ALL' ? mbrExt[1] : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKSEARCH)`, noLibList: true });
      const asp = await getIASP(library);

      let arrayofSearchTokens = searchTerm.split(',').map(term => `'` + term.substring(0, 30).replace(/['"]/g, '').trim() + `'`);// wrapped in single quotes for DSPSCNSRC SCAN() keyword
      let stringofSearchTokens = sanitizeSearchTerm(arrayofSearchTokens.join(` `));

      let runDSPSCNSRC = Code4i.getContent().toCl(`DSPSCNSRC`, {
        srcfile: `${connection.sysNameInAmerican(library).toLocaleUpperCase()}/${connection.sysNameInAmerican(sourceFile).toLocaleUpperCase()}`,
        srcmbr: `${connection.sysNameInAmerican(member).toLocaleUpperCase()}`,
        type: `${connection.sysNameInAmerican(memberExt).toLocaleUpperCase()}`,
        output: `*OUTFILE`,
        outfile: `${tempLibrary}/${tempName1}`.toLocaleUpperCase(),
        outmbr: `HWKSEARCH`,
        case: `*IGNORE`,
        begpos: `001`,
        endpos: `240`
      });
      runDSPSCNSRC += ` SCAN(${stringofSearchTokens})`;
      let cmdResult: CommandResult;
      cmdResult = await Code4i.runCommand({ command: runDSPSCNSRC, environment: `ile`, noLibList: true });
      const resultsExist = await checkObject(`${tempLibrary}`, `${tempName1}`, `*FILE`);
      if (!resultsExist) {
        throw new Error(l10n.t('No results for Display Scan Source.'));
      }
      else {
        let statement = `
          with SEARCHMATCHES (SEARCHMATCH) 
          as (select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                              ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                              , 'howUsed' : ''
                              , 'fileText' : min(trim(SCDTXT))
                              , 'matches' : JSON_ARRAYAGG( JSON_OBJECT('line': SCDSEQ, 'content': rtrim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ ) returning clob format json )
              from ${tempLibrary}.${tempName1}
              left join QSYS2.SYSPARTITIONSTAT SP on SP.SYSTEM_TABLE_SCHEMA = SCDLIB and SP.SYSTEM_TABLE_NAME = SCDFIL and SP.SYSTEM_TABLE_MEMBER = SCDMBR
              group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL) 
          select cast( SEARCHMATCH as varchar(32000)) SEARCHMATCH from SEARCHMATCHES order by SEARCHMATCH`.replace(/\n\s*/g, ' ');
        let queryResults = await Code4i.runSQL(statement);
        const parsedRows = queryResults.map(row => parseSearchMatch(row.SEARCHMATCH));
        searchMatches = parsedRows.map(row => ({
          fileName: row.fileName,
          fileText: row.fileText,
          howUsed: row.howUsed,
          matchCount: row.matches.length,
          matches: row.matches,
        } as SourceFileMatch));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i'));
    }
    return searchMatches;
  }
  export async function hwkdisplayFileSetsUsed(library: string, dbFile: string, searchTerm: string, readOnly?: boolean, resultSequence?: string): Promise<SourceFileMatch[]> {
    // Function steps.
    // 1. run main command, DSPFILSETU, to produce initial results
    // 2. pass items from DSPFILSETU into DSPSCNSRC to find the source used to display in search results.
    // 3. reprocess the results from DSPFILSETU and DSPSCNSRC into presentable results in the custom search view. 
    const connection = Code4i.getConnection();
    const asp = await getIASP(library);
    library = (library !== '*ALL' ? library : '*ALL');
    dbFile = (dbFile !== '*ALL' ? dbFile : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    const tempName2 = Code4i.makeid();
    searchTerm = searchTerm === `*NONE` ? `` : searchTerm;
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPFSU)`, noLibList: true });
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPFSU)`, noLibList: true });
      let runDSPFILSETU = Code4i.getContent().toCl(`DSPFILSETU`, {
        file: `${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(dbFile)}`.toLocaleUpperCase(),
        output: `*OUTFILE`,
        outfile: `${tempLibrary}/${tempName1}`.toLocaleUpperCase(),
        outmbr: `HWKDSPFSU`,
      });
      let cmdResult = await Code4i.runCommand({ command: runDSPFILSETU, environment: `ile`, noLibList: true });
      if (cmdResult.code !== 0) { throw new Error(`${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(dbFile)}    \n` + cmdResult.stderr); }
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      let fsuSourceScanResults = await Code4i.runSQL(`
        with t1 as (select distinct TUDFLL,TUDFL,TUDSLB,TUDSFL,TUDSMB 
          from ${tempLibrary}.${tempName1} 
          left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=TUDSLB and SP.SYS_TNAME=TUDSFL and SP.SYS_MNAME=TUDSMB where TUDSLB > '     ' ) 
        select qcmdexc('DSPSCNSRC SRCFILE('||trim(TUDSLB)||'/'||trim(TUDSFL)||') SRCMBR('||trim(TUDSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN(${sanitizeSearchTerm(searchTerm) ? `''${sanitizeSearchTerm(searchTerm)}''  ` : ""}'''||trim(TUDFL)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)') 
        from T1 order by TUDFLL,TUDSLB,TUDSFL`.replace(/\n\s*/g, ' '));
      if (fsuSourceScanResults && fsuSourceScanResults.length > 0) {
        let statement = `with HOW_USED_CONDENSED (HOW_USED, TUDSFL, TUDSLB, TUDSMB, TUDTXT) 
                      as (select min(trim(left(TUDHOW, ( case locate('-', TUDHOW) when 0 then length(TUDHOW) else locate('-', TUDHOW) end))))||''||
                                  listagg( distinct  (trim(right(TUDHOW, locate('-', TUDHOW) + 2))),  ':') within group (order by TUDPGM, TUDLIB, TUDATR) as HOW_USED
                                , TUDSFL, TUDSLB, TUDSMB, TUDTXT from ${tempLibrary}.${tempName1} group by TUDSFL, TUDSLB, TUDSMB, TUDTXT)
                    ,  SEARCHMATCHES (SEARCHMATCH) 
                      as ( select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                            ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                            , 'howUsed' : min(HOW_USED)
                                            , 'fileText' : min(trim(TUDTXT))
                                            , 'matches' : JSON_ARRAYAGG(JSON_OBJECT('line': SCDSEQ, 'content': rtrim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ) returning clob format json)
                        from ${tempLibrary}.${tempName2}
                        left join HOW_USED_CONDENSED on TUDSFL=SCDFIL and TUDSLB=SCDLIB and TUDSMB=SCDMBR
                        left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR
                        group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL)
                    select cast( SEARCHMATCH as varchar(32000)) SEARCHMATCH from SEARCHMATCHES order by SEARCHMATCH`.replace(/\n\s*/g, ' ');
        let queryResults = await Code4i.runSQL(statement);
        const parsedRows = queryResults.map(row => parseSearchMatch(row.SEARCHMATCH));
        searchMatches = parsedRows
          .filter(row => row && Object.keys(row).length > 0) // filter out empty objects
          .map(row => ({
            fileName: row.fileName,
            fileText: row.fileText,
            howUsed: row.howUsed,
            matchCount: Array.isArray(row.matches) ? row.matches.length : 0,
            matches: Array.isArray(row.matches) ? row.matches : [],
          } as SourceFileMatch));
      } else {
        throw new Error(l10n.t('No results for Display File Set Used.'));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i.'));
    }
    return searchMatches;
  }
  export async function hwkdisplayProgramObjects(library: string, program: string, searchTerm: string, readOnly?: boolean): Promise<SourceFileMatch[]> {

    const connection = Code4i.getConnection();
    library = (library !== '*ALL' ? connection.sysNameInAmerican(library).toLocaleUpperCase() : '*ALL');
    program = (program !== '*ALL' ? connection.sysNameInAmerican(program).toLocaleUpperCase() : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    const tempName2 = Code4i.makeid();
    searchTerm = searchTerm === `*NONE` ? `` : searchTerm.toLocaleUpperCase();
    const asp = await getIASP(library);

    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {

      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPPGMO)`, noLibList: true });
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPPGMO)`, noLibList: true });
      let asp = await Code4i.getLibraryIAsp(library);
      let runDSPPGMOBJ = Code4i.getContent().toCl(`DSPPGMOBJ`, {
        pgm: `${library}/${program}`,
        output: `*OUTFILE`,
        outfile: `${tempLibrary}/${tempName1}`.toLocaleUpperCase(),
        outmbr: `DSPPGMOBJ`,
      });
      let cmdResult = await Code4i.runCommand({ command: runDSPPGMOBJ, environment: `ile`, noLibList: true });
      if (cmdResult.code !== 0) { throw new Error(`${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(program)}    \n` + cmdResult.stderr); }
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      let dpoSourceScanResults = await Code4i.runSQL(`with t1 as (select distinct PODLIB,PODOBJ,case when APISTS='1' then APISF when PODSFL=' ' then POHSFL else PODSFL end PODSFL,case when APISTS='1' then APISFL when PODSLB=' ' then POHSLB else PODSLB end PODSLB,case when APISTS='1' then APISFM when PODSMB=' ' then POHSMB else PODSMB end PODSMB from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10', APIOPT => '80', APIOB => PODOBJ, APIOBL => PODLIB, APIOBM => ' ',APIOBA => PODTYP )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=PODSLB and SP.SYS_TNAME=PODSFL and SP.SYS_MNAME=PODSMB where (PODLIB not in ('*NONE','QTEMP') and PODCMD not in ('RPG-COPY') and case when PODSLB=' ' then POHSLB else PODSLB end > '     ')),T2 as (select PODLIB,PODOBJ,PODSFL,PODSLB,PODSMB,case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and PODSFL='QSQDSRC' then 'SQL' else 'MBR' end PODATR from T1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=PODSLB and SP.SYS_TNAME=PODSFL and SP.SYS_MNAME=PODSMB) 
      select qcmdexc('DSPSCNSRC SRCFILE('||trim(PODSLB)||'/'||trim(PODSFL)||') SRCMBR('||trim(PODSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN(${sanitizeSearchTerm(searchTerm) ? `''${sanitizeSearchTerm(searchTerm)}''  ` : ""}'''||trim(PODOBJ)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)')
    ,  qcmdexc('DSPSCNSRC SRCFILE(*SRCL/Q*) SRCMBR(${program}) TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN(${sanitizeSearchTerm(searchTerm) ? `''${sanitizeSearchTerm(searchTerm)}''  ` : ""}'''||trim(PODOBJ)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)') from T1 where PODSMB <> '${program}'`.replace(/\n\s*/g, ' '));
      if (dpoSourceScanResults && dpoSourceScanResults.length > 0) {

        const statement = `with HOW_USED_CONDENSED (HOW_USED, PODSFL, PODSLB, PODSMB, PODTXT) 
              as ( select min(trim(left(PODCMD, ( case locate('-', PODCMD) when 0 then length(PODCMD) else locate('-',PODCMD) end))))||''||
                          listagg( distinct  (trim(right(PODCMD,locate('-',PODCMD) +2))), ':') within group (order by PODCMD,PODSLB,PODOBJ) as HOW_USED
                  , case when APISTS='1' then APISF  when PODSFL=' ' then POHSFL else PODSFL end PODSFL
                  , case when APISTS='1' then APISFL when PODSLB=' ' then POHSLB else PODSLB end PODSLB
                  , case when APISTS='1' then APISFM when PODSMB=' ' then POHSMB else PODSMB end PODSM
                  , min(trim(PODTXT))
                    from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10',APIOPT => '80',APIOB => PODOBJ,APIOBL => PODLIB,APIOBM => ' ',APIOBA => PODTYP )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=PODSLB and SP.SYS_TNAME=PODSFL and SP.SYS_MNAME=PODSMB
                    where PODCMD not in ('BIND') group by APISF,PODSFL,POHSFL,APISFL,PODSLB,POHSLB,APISFM,PODSMB,POHSMB,APISTS)
            , SEARCHMATCHES (SEARCHMATCH) 
              as ( select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                    ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                    , 'fileText' : min(PODTXT)
                                    , 'howUsed' : min(HOW_USED) 
                                    , 'matches' : JSON_ARRAYAGG( JSON_OBJECT('line': SCDSEQ, 'content': rtrim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ) returning clob format json )
                  from ${tempLibrary}.${tempName2}
                  left join HOW_USED_CONDENSED on PODSFL = SCDFIL and PODSLB = SCDLIB and PODSMB = SCDMBR
                  left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR
                  group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL )
              select cast( SEARCHMATCH as varchar(32000)) SEARCHMATCH from SEARCHMATCHES
              order by SEARCHMATCH`.replace(/\n\s*/g, ' ');

        let queryResults = await Code4i.runSQL(statement);
        const parsedRows = queryResults.map(row => parseSearchMatch(row.SEARCHMATCH));
        searchMatches = parsedRows
          .filter(row => row && Object.keys(row).length > 0) // filter out empty objects
          .map(row => ({
            fileName: row.fileName,
            fileText: row.fileText,
            howUsed: row.howUsed,
            matchCount: Array.isArray(row.matches) ? row.matches.length : 0,
            matches: Array.isArray(row.matches) ? row.matches : [],
          } as SourceFileMatch));
      } else {
        throw new Error(l10n.t('No results for Display Program Objects.'));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i.'));
    }
    return searchMatches;
  }
  export async function hwkdisplayObjectUsed(library: string, object: string, objType: string, searchTerm: string, howUsed: string, readOnly?: boolean): Promise<SourceFileMatch[]> {
    const connection = Code4i.getConnection();
    library = (library !== '*ALL' ? library.toLocaleUpperCase() : '*ALL');
    object = object === `*ALL` ? `` : object.toLocaleUpperCase();
    objType = (objType !== '*ALL' ? objType.toLocaleUpperCase() : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    const tempName2 = Code4i.makeid();
    const asp = await getIASP(library);
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPOBJU)`, noLibList: true });
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPOBJU)`, noLibList: true });
      let asp = await Code4i.getLibraryIAsp(library);
      let runDSPOBJU = Code4i.getContent().toCl(`DSPOBJU`, {
        obj: `${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(object)}`.toLocaleUpperCase(),
        objtype: `${connection.sysNameInAmerican(objType).toLocaleUpperCase()}`,
        howUsed: `${howUsed === `*ALL` ? `` : howUsed.toLocaleUpperCase()}`,
        scan: `${sanitizeSearchTerm(searchTerm === `*NONE` ? `` : searchTerm.toLocaleUpperCase())}`,
        output: `*OUTFILE`,
        outfile: `${tempLibrary.toLocaleUpperCase()}/${tempName1.toLocaleUpperCase()}`,
        outmbr: `DSPOBJU`,
      });
      let cmdResult = await Code4i.runCommand({ command: runDSPOBJU, environment: `ile`, noLibList: true });
      if (cmdResult.code !== 0) { throw new Error(`${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(object)}    \n` + cmdResult.stderr); }
      // discover output quantity
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      let douSourceScanResults = await Code4i.runSQL(`with t1 as (select distinct OUDLIB,OUDPGM,case when APISTS='1' then APISF else OUDSFL end OUDSFL,case when APISTS='1' then APISFL else OUDSLB end OUDSLB,case when APISTS='1' then APISFM else OUDSMB end OUDSMB from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10', APIOPT => '80', APIOB => OUDPGM, APIOBL => OUDLIB, APIOBM => ' ',APIOBA => OUDATR )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=OUDSLB and SP.SYS_TNAME=OUDSFL and SP.SYS_MNAME=OUDSMB where OUDSLB > '     ' ) select qcmdexc('DSPSCNSRC SRCFILE('||trim(OUDSLB)||'/'||trim(OUDSFL)||') SRCMBR('||trim(OUDSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) CASE(*IGNORE) BEGPOS(001) ENDPOS(240) SCAN(''${connection.sysNameInAmerican(object)}'')') from T1 order by OUDLIB,OUDSLB,OUDSFL`.replace(/\n\s*/g, ' '));
      if (douSourceScanResults && douSourceScanResults.length > 0) {
        const statement = `with HOW_USED_CONDENSED (HOW_USED, OUHOBJ, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB, OUDTXT ) 
                  as ( select min(trim(left(OUDHOW, ( case locate('-', OUDHOW) when 0 then length(OUDHOW) else locate('-', OUDHOW) end))))||''||
                              listagg( distinct  (trim(right(OUDHOW, locate('-', OUDHOW) + 2))),  ':') within group (order by OUDPGM, OUDLIB, OUDATR) as HOW_USED
                            , OUHOBJ, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB, min(trim(OUDTXT))
                        from ${tempLibrary}.${tempName1} a where OUDHOW not in ('BIND')
                        group by OUHOBJ, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB)
                ,  SEARCHMATCHES (SEARCHMATCH) 
                  as (select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                      ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                      , 'fileText' : min(OUDTXT)
                                      , 'howUsed' : min(HOW_USED) 
                                      , 'matches' : JSON_ARRAYAGG(JSON_OBJECT('lineNumber': SCDSEQ, 'content': rtrim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ) returning clob format json)
                      from ${tempLibrary}.${tempName2} 
                      left join HOW_USED_CONDENSED on OUDSFL=SCDFIL and OUDSLB=SCDLIB and OUDSMB=SCDMBR 
                      left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR
                      group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL
                    )
                    select cast( SEARCHMATCH as varchar(32000)) SEARCHMATCH from SEARCHMATCHES order by SEARCHMATCH`.replace(/\n\s*/g, ' ');
        let queryResults = await Code4i.runSQL(statement);
        const parsedRows = queryResults.map(row => parseSearchMatch(row.SEARCHMATCH));
        searchMatches = parsedRows
          .filter(row => row && Object.keys(row).length > 0) // filter out empty objects
          .map(row => ({
            fileName: row.fileName,
            fileText: row.fileText,
            howUsed: row.howUsed,
            matchCount: Array.isArray(row.matches) ? row.matches.length : 0,
            matches: Array.isArray(row.matches) ? row.matches : [],
          } as SourceFileMatch));

      } else {
        searchMatches = [];
        throw new Error(l10n.t('No results for Display Object Used.'));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i.'));
    }
    return searchMatches;
  }
  export async function hwkdisplayProcedureUsed(
    library: string, 
    procedure: string
    //,  objType: string
  ,  searchTerm: string, howUsed: string, readOnly?: boolean
  ): Promise<SourceFileMatch[]> {
    const connection = Code4i.getConnection();
    // library = (library !== '*ALL' ? library.toLocaleUpperCase() : '*ALL');
    // object = object === `*ALL` ? `` : object.toLocaleUpperCase();
    // objType = (objType !== '*ALL' ? objType.toLocaleUpperCase() : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    const tempName2 = Code4i.makeid();
    const asp = await getIASP(library);
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPPRCU)`, noLibList: true });
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPPRCU)`, noLibList: true });
      let asp = await Code4i.getLibraryIAsp(library);
      let runDSPOBJU = Code4i.getContent().toCl(`DSPPRCU`, {
        prc: `${connection.sysNameInAmerican(procedure)}`.toLocaleUpperCase(),
        // scan: `${sanitizeSearchTerm(searchTerm === `*NONE` ? `` : searchTerm.toLocaleUpperCase())}`,
        output: `*OUTFILE`,
        outfile: `${tempLibrary.toLocaleUpperCase()}/${tempName1.toLocaleUpperCase()}`,
        outmbr: `DSPPRCU`,
      });
      let cmdResult = await Code4i.runCommand({ command: runDSPOBJU, environment: `ile`, noLibList: true });
      if (cmdResult.code !== 0) { throw new Error(`${connection.sysNameInAmerican(procedure)}    \n` + cmdResult.stderr); }
      // discover output quantity
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      let douSourceScanResults = await Code4i.runSQL(`with t1 as (select distinct OUDLIB,OUDPGM,case when APISTS='1' then APISF else OUDSFL end OUDSFL,case when APISTS='1' then APISFL else OUDSLB end OUDSLB,case when APISTS='1' then APISFM else OUDSMB end OUDSMB from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10', APIOPT => '80', APIOB => OUDPGM, APIOBL => OUDLIB, APIOBM => ' ',APIOBA => OUDATR )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=OUDSLB and SP.SYS_TNAME=OUDSFL and SP.SYS_MNAME=OUDSMB where OUDSLB > '     ' ) select qcmdexc('DSPSCNSRC SRCFILE('||trim(OUDSLB)||'/'||trim(OUDSFL)||') SRCMBR('||trim(OUDSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) CASE(*IGNORE) BEGPOS(001) ENDPOS(240) SCAN(''${connection.sysNameInAmerican(procedure)}'')') from T1 order by OUDLIB,OUDSLB,OUDSFL`.replace(/\n\s*/g, ' '));
      if (douSourceScanResults && douSourceScanResults.length > 0) {
        const statement = `with HOW_USED_CONDENSED (HOW_USED, OUHPRC, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB, OUDTXT ) 
                  as ( select 'CALLPRC' HOW_USED, OUHPRC, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB, min(trim(OUDTXT))
                        from ${tempLibrary}.${tempName1} a 
                        group by OUHPRC, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB)
                ,  SEARCHMATCHES (SEARCHMATCH) 
                  as (select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                      ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                      , 'fileText' : min(OUDTXT)
                                      , 'howUsed' : min(HOW_USED) 
                                      , 'matches' : JSON_ARRAYAGG(JSON_OBJECT('lineNumber': SCDSEQ, 'content': rtrim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ) returning clob format json)
                      from ${tempLibrary}.${tempName2} 
                      left join HOW_USED_CONDENSED on OUDSFL=SCDFIL and OUDSLB=SCDLIB and OUDSMB=SCDMBR 
                      left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR
                      group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL
                    )
                    select cast( SEARCHMATCH as varchar(32000)) SEARCHMATCH from SEARCHMATCHES order by SEARCHMATCH`.replace(/\n\s*/g, ' ');
        let queryResults = await Code4i.runSQL(statement);
        const parsedRows = queryResults.map(row => parseSearchMatch(row.SEARCHMATCH));
        searchMatches = parsedRows
          .filter(row => row && Object.keys(row).length > 0) // filter out empty objects
          .map(row => ({
            fileName: row.fileName,
            fileText: row.fileText,
            howUsed: row.howUsed,
            matchCount: Array.isArray(row.matches) ? row.matches.length : 0,
            matches: Array.isArray(row.matches) ? row.matches : [],
          } as SourceFileMatch));

      } else {
        searchMatches = [];
        throw new Error(l10n.t('No results for Display Object Used.'));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i.'));
    }
    return searchMatches;
  }
  function parseSearchMatch(searchMatch: any): any {
    try {
      return JSON.parse(String(searchMatch));
      // const parsedRows = JSON.parse(String(searchMatch));
      // const searchMatches = parsedRows.map(row => ({
      //     fileName: row.fileName,
      //     fileText: row.fileText,
      //     howUsed: row.howUsed,
      //     matchCount: row.matches.length,
      //     matches: row.matches,
      //   } as SourceFileMatch));
      // return searchMatches;
    } catch (e) {
      return {};
    }
  }

}