import { l10n } from 'vscode';
import { Code4i, sanitizeSearchTerm, nthIndex, checkObject, getSourceObjectType, showCustomInputs } from '../tools';
import { HawkeyeSearchMatches, SourceFileMatch } from '../types/types';
import { CommandResult } from '@halcyontech/vscode-ibmi-types';

export namespace HawkeyeSearch {
  const QSYS_PATTERN = /^(?:\/)|(?:QSYS\.LIB\/)|(?:\.LIB)|(?:\.FILE)|(?:\.MBR)/g;
  const NEWLINE = `\r\n`;

  export interface Result {
    path: string
    howUsed: string
    lines: Line[]
    readonly?: boolean
    label?: string
    srcObjType?: string
  }

  export interface Line {
    number: number
    content: string
  }

  export async function searchMembers(library: string, sourceFile: string, memberFilter: string, searchTerm: string, readOnly?: boolean)
    // : Promise<HawkeyeSearchMatches> {
    : Promise<SourceFileMatch[]> {
    const connection = Code4i.getConnection();
    library = (library !== '*ALL' ? library : '*ALL');
    sourceFile = (sourceFile !== '*ALL' ? sourceFile : '*ALL');
    let mbrExt = memberFilter.split(`.`);
    const member = (mbrExt[0] !== '*ALL' ? mbrExt[0] : '*ALL');
    const memberExt = (mbrExt[1] !== '*ALL' ? mbrExt[1] : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    // let searchMatches: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKSEARCH)`, noLibList: true });
      let aspa = await Code4i.getLibraryIAsp(library);
      let aspb = await Code4i.getCurrentIAspName();
      let asp = await Code4i.lookupLibraryIAsp(library);
      asp = asp ? asp : aspa ? aspa : aspb;
      // console.log(asp);
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
        let statement = `with SEARCHMATCHES (SEARCHMATCH) 
                            as (select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                                ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                                  ,'howused' : ''
                                                  ,'fileText' : min(trim(SCDTXT))
                                                  ,'matches' : JSON_ARRAYAGG( JSON_OBJECT('line': SCDSEQ, 'content': trim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ ) returning clob format json )
                                from ${tempLibrary}.${tempName1}
                                left join QSYS2.SYSPARTITIONSTAT SP on SP.SYSTEM_TABLE_SCHEMA = SCDLIB and SP.SYSTEM_TABLE_NAME = SCDFIL and SP.SYSTEM_TABLE_MEMBER = SCDMBR
                                group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL) 
                            select SEARCHMATCH from SEARCHMATCHES order by SEARCHMATCH`.replace(/\n\s*/g, ' ');
        let results = await Code4i.runSQL(statement);
        const parsedRows = results.map(row => JSON.parse(String(row.SEARCHMATCH)));
        const Q: SourceFileMatch[] = parsedRows.map(row => ({
          fileName: row.fileName,
          fileText: row.fileText,
          howused: row.howused,
          matches: row.matches,
        }));
        searchMatches = Q;
        // searchMatches = { command:`DSPSCNSRC`, searchDescription: `DSPSCNSRC ${new Date().toLocaleString()}`, searchTerm: searchTerm, files: Q };
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i'));
    }
    return searchMatches;
  }
  export async function hwkdisplayFileSetsUsed(library: string, dbFile: string, searchTerm: string, readOnly?: boolean)
  // : Promise<HawkeyeSearchMatches> {
  : Promise<SourceFileMatch[]> {
    const connection = Code4i.getConnection();
    let aspa = await Code4i.getLibraryIAsp(library);
    let aspb = await Code4i.getCurrentIAspName();
    let asp = await Code4i.lookupLibraryIAsp(library);
    asp = asp ? asp : aspa ? aspa : aspb;
    library = (library !== '*ALL' ? library : '*ALL');
    dbFile = (dbFile !== '*ALL' ? dbFile : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    const tempName2 = Code4i.makeid();
    searchTerm = searchTerm === `*NONE` ? `` : searchTerm;
    // let searchMatches: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPFSU)`, noLibList: true });
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPFSU)`, noLibList: true });
      // let commandResult = await Code4i.runCommand({ command: `DSPFILSETU FILE(${connection.sysNameInAmerican(lib)}/${connection.sysNameInAmerican(file)}) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName1}) OUTMBR(HWKDSPFSU)`, noLibList: true });
      let runDSPSCNSRC = Code4i.getContent().toCl(`DSPFILSETU`, {
        file: `${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(dbFile)}`.toLocaleUpperCase(),
        output: `*OUTFILE`,
        outfile: `${tempLibrary}/${tempName1}`.toLocaleUpperCase(),
        outmbr: `HWKDSPFSU`,
      });
      let cmdResult = await Code4i.runCommand({ command: runDSPSCNSRC, environment: `ile`, noLibList: true });
      if (cmdResult.code !== 0) { throw new Error(`${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(dbFile)}    \n` + cmdResult.stderr); }
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      if ((await Code4i.runSQL(`with t1 as (select distinct TUDFLL,TUDFL,TUDSLB,TUDSFL,TUDSMB from ${tempLibrary}.${tempName1} left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=TUDSLB and SP.SYS_TNAME=TUDSFL and SP.SYS_MNAME=TUDSMB where TUDSLB > '     ' ) select qcmdexc('DSPSCNSRC SRCFILE('||trim(TUDSLB)||'/'||trim(TUDSFL)||') SRCMBR('||trim(TUDSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN(${sanitizeSearchTerm(searchTerm) ? `''${sanitizeSearchTerm(searchTerm)}''  ` : ""}'''||trim(TUDFL)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)') from T1 order by TUDFLL,TUDSLB,TUDSFL`)).length > 0) {
        let statement = `with HOW_USED_CONDENSED (HOW_USED, TUDSFL, TUDSLB, TUDSMB, TUDTXT) 
                      as (select min(trim(left(TUDHOW ,( case locate('-', TUDHOW) when 0 then length(TUDHOW) else locate('-', TUDHOW) end))))||''||
                                  listagg( distinct  (trim(right(TUDHOW, locate('-', TUDHOW) + 2))) , ':') within group (order by TUDPGM, TUDLIB, TUDATR) as HOW_USED
                                  ,TUDSFL ,TUDSLB ,TUDSMB ,TUDTXT from ${tempLibrary}.${tempName1} group by TUDSFL ,TUDSLB ,TUDSMB ,TUDTXT)
                      , SEARCHMATCHES (SEARCHMATCH) 
                      as ( select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                            ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                              ,'howused' : min(HOW_USED)
                                              ,'fileText' : min(trim(TUDTXT))
                                              ,'matches' : JSON_ARRAYAGG(JSON_OBJECT('line': SCDSEQ, 'content': trim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ) returning clob format json)
                        from ${tempLibrary}.${tempName2}
                        left join HOW_USED_CONDENSED on TUDSFL=SCDFIL and TUDSLB=SCDLIB and TUDSMB=SCDMBR
                        left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR
                        group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL)
                    select SEARCHMATCH from SEARCHMATCHES order by SEARCHMATCH`.replace(/\n\s*/g, ' ');
        let results = await Code4i.runSQL(statement);
        const parsedRows = results.map(row => JSON.parse(String(row.SEARCHMATCH)));
        const Q: SourceFileMatch[] = parsedRows.map(row => ({
          fileName: row.fileName,
          fileText: row.fileText,
          howused: row.howused,
          matches: row.matches,
        }));
        // searchMatches = { command:`DSPSCNSRC`, searchDescription: `DSPFILSETU ${new Date().toLocaleString()}`, searchTerm: searchTerm, files: Q };
        searchMatches = Q;
        throw new Error(l10n.t('No results for Display File Set Used.'));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i.'));
    }
    return searchMatches;
  }
  export async function hwkdisplayProgramObjects(library: string, program: string, searchTerm: string, readOnly?: boolean)
   // : Promise<HawkeyeSearchMatches> {
    : Promise<SourceFileMatch[]> {

    const connection = Code4i.getConnection();
    library = (library !== '*ALL' ? library : '*ALL').toLocaleUpperCase();
    program = (program !== '*ALL' ? program.toLocaleUpperCase() : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    const tempName2 = Code4i.makeid();
    searchTerm = searchTerm === `*NONE` ? `` : searchTerm.toLocaleUpperCase();
    let aspa = await Code4i.getLibraryIAsp(library);
    let aspb = await Code4i.getCurrentIAspName();
    let asp = await Code4i.lookupLibraryIAsp(library);
    asp = asp ? asp : aspa ? aspa : asp;
    // let searchMatches: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {

      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPPGMO)`, noLibList: true });
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPPGMO)`, noLibList: true });
      let asp = await Code4i.getLibraryIAsp(library);
      // let commandResult = await Code4i.runCommand({ command: `DSPPGMOBJ PGM(${connection.sysNameInAmerican(lib)}/${connection.sysNameInAmerican(program)}) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName1}) OUTMBR(HWKDSPPGMO)`, noLibList: true });
      let runDSPSCNSRC = Code4i.getContent().toCl(`DSPPGMOBJ`, {
        pgm: `${connection.sysNameInAmerican(library).toLocaleUpperCase()}/${connection.sysNameInAmerican(program).toLocaleUpperCase()}`,
        output: `*OUTFILE`,
        outfile: `${tempLibrary}/${tempName1}`.toLocaleUpperCase(),
        outmbr: `DSPPGMOBJ`,
      });
      let cmdResult = await Code4i.runCommand({ command: runDSPSCNSRC, environment: `ile`, noLibList: true });
      if (cmdResult.code !== 0) { throw new Error(`${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(program)}    \n` + cmdResult.stderr); }
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      if ((await Code4i.runSQL(`with t1 as (select distinct PODLIB,PODOBJ,case when APISTS='1' then APISF  else case when PODSFL=' ' then POHSFL else PODSFL end end PODSFL,case when APISTS='1' then APISFL else case when PODSLB=' ' then POHSLB else PODSLB end end PODSLB,case when APISTS='1' then APISFM else case when PODSMB=' ' then POHSMB else PODSMB end end PODSMB from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10' ,APIOPT => '80' ,APIOB => PODOBJ ,APIOBL => PODLIB ,APIOBM => ' ',APIOBA => PODTYP )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=PODSLB and SP.SYS_TNAME=PODSFL and SP.SYS_MNAME=PODSMB where (PODLIB not in ('*NONE','QTEMP') and PODCMD not in ('RPG-COPY') and case when PODSLB=' ' then POHSLB else PODSLB end > '     ' or PODOBJ='PRP03L')),T2 as (select PODLIB,PODOBJ,PODSFL,PODSLB,PODSMB,case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and PODSFL='QSQDSRC' then 'SQL' else 'MBR' end PODATR from T1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=PODSLB and SP.SYS_TNAME=PODSFL and SP.SYS_MNAME=PODSMB) select qcmdexc('DSPSCNSRC SRCFILE('||trim(PODSLB)||'/'||trim(PODSFL)||') SRCMBR('||trim(PODSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN(${sanitizeSearchTerm(searchTerm) ? `''${sanitizeSearchTerm(searchTerm)}''  ` : ""}'''||trim(PODOBJ)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)') from T1`)).length > 0) {
        /* ADD after T1 above:: union ALL select qcmdexc('DSPSCNSRC SRCFILE('||trim(POHSLB)||'/'||trim(POHSFL)||') SRCMBR('||trim(POHSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN('''||trim(PODOBJ)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)') from ${tempLibrary}.${tempName1} where POHPGM<>PODOBJ and PODATR<>'  ' and PODSFL<>'     '*/
        // const result = await connection.sendQsh({
        //   command: `db2 -s "with CONDENSE_HOW_USED (PODSFL,PODSLB,PODSMB,HOW_USED_LIST,PODTXT) 
        //   as (select case when PODSFL=' ' or PODSFL like 'Z_%' then POHSFL else PODSFL end,case when PODSLB=' '  or PODSLB like 'ACMS%' then POHSLB else PODSLB end,case when PODSMB=' ' or PODSLB like 'ACMS%' then POHSMB else PODSMB end 
        //   ,varchar((listagg(distinct trim(right(PODCMD,case locate('-', PODCMD) when 0 then length(PODCMD) else locate('-', PODCMD)+2 end)),':') within group (order by PODSFL,PODSLB,PODSMB,PODCMD)),256),PODTXT 
        //   from ${tempLibrary}.${tempName1} where PODCMD not in ('BIND') 
        //   group by PODSFL,POHSFL,PODSLB,POHSLB,PODSMB,POHSMB,right(PODCMD,( case locate('-',PODCMD) when 0 then length(PODCMD) else locate('-',PODCMD) end)),PODTXT) 

        //   select 
        //   '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'||(case when SP.SRCTYPE is not null then SP.SRCTYPE when SP.SRCTYPE is null and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end)||'~'||trim(ifnull(HOW_USED_LIST,''))||'~'||char(SCDSEQ)||'~'||varchar(rtrim(SCDSTM),112) OLD_RESULTS
        //   ,JSON_OBJECT( 'timestamp': 'DSPPGMOBJ '||VARCHAR(NOW()) ,'files' : JSON_OBJECT( 'fileName': '${asp ? `${asp}` : ``}/QSYS.LIB/' || trim(SCDLIB) || '.LIB/' || trim(SCDFIL) || '.FILE/' || trim(SCDMBR) || '.' || ( case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end),'matches' : JSON_OBJECT('line': SCDSEQ, 'content': trim(SCDSTM)))) as HawkeyeSearchMatches
        //   from ${tempLibrary}.${tempName2} left join CONDENSE_HOW_USED on PODSFL=SCDFIL and PODSLB=SCDLIB and PODSMB=SCDMBR left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR" | sed -e '1,3d' -e 's/\(.*\)/&/' -e '/^$/d' -e '/RECORD.*.*.* SELECTED/d';`.replace(/\n\s*/g, ' '),
        // }); // add to end of list in future => -e 's/:/~/' -e 's/:/~/'
        // // const statement = `with CONDENSE_HOW_USED (PODSFL,PODSLB,PODSMB,HOW_USED_LIST,PODTXT) 
        // //   as (select case when PODSFL=' ' or PODSFL like 'Z_%' then POHSFL else PODSFL end,case when PODSLB=' '  or PODSLB like 'ACMS%' then POHSLB else PODSLB end,case when PODSMB=' ' or PODSLB like 'ACMS%' then POHSMB else PODSMB end 
        // //   ,varchar((listagg(distinct trim(right(PODCMD,case locate('-', PODCMD) when 0 then length(PODCMD) else locate('-', PODCMD)+2 end)),':') within group (order by PODSFL,PODSLB,PODSMB,PODCMD)),256),PODTXT 
        // //   from ${tempLibrary}.${tempName1} where PODCMD not in ('BIND') 
        // //   group by PODSFL,POHSFL,PODSLB,POHSLB,PODSMB,POHSMB,right(PODCMD,( case locate('-',PODCMD) when 0 then length(PODCMD) else locate('-',PODCMD) end)),PODTXT) 

        // //   select 
        // //   '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'||(case when SP.SRCTYPE is not null then SP.SRCTYPE when SP.SRCTYPE is null and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end)||'~'||trim(ifnull(HOW_USED_LIST,''))||'~'||char(SCDSEQ)||'~'||varchar(rtrim(SCDSTM),112) OLD_RESULTS
        // //   ,JSON_OBJECT( 'timestamp': 'DSPPGMOBJ '||VARCHAR(NOW()) ,'files' : JSON_OBJECT( 'fileName': '${asp ? `${asp}` : ``}/QSYS.LIB/' || trim(SCDLIB) || '.LIB/' || trim(SCDFIL) || '.FILE/' || trim(SCDMBR) || '.' || ( case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end),'matches' : JSON_OBJECT('line': SCDSEQ, 'content': trim(SCDSTM)))) as HawkeyeSearchMatches
        // //   from ${tempLibrary}.${tempName2} left join CONDENSE_HOW_USED on PODSFL=SCDFIL and PODSLB=SCDLIB and PODSMB=SCDMBR left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR';`.replace(/\n\s*/g, ' ');

        const statement = `with HOW_USED_CONDENSED (HOW_USED, PODSFL, PODSLB, PODSMB, PODTXT) 
              as ( select min(trim(left(PODCMD ,( case locate('-', PODCMD) when 0 then length(PODCMD) else locate('-', PODCMD) end))))||''||
                          listagg( distinct  (trim(right(PODCMD, locate('-', PODCMD) + 2))) , ':') within group (order by PODCMD, PODSLB, PODOBJ) as HOW_USED
                    ,case when PODSFL = ' ' or PODSFL like 'Z_%' then POHSFL else PODSFL end
                    ,case when PODSLB = ' ' or PODSLB like 'ACMS%' then POHSLB else PODSLB end
                    ,case when PODSMB = ' ' or PODSLB like 'ACMS%' then POHSMB else PODSMB end
                    ,min(trim(PODTXT))
                    from ${tempLibrary}.${tempName1} where PODCMD not in ('BIND') group by PODSFL ,POHSFL ,PODSLB ,POHSLB ,PODSMB ,POHSMB)
              , SEARCHMATCHES (SEARCHMATCH) 
              as ( select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                    ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                      ,'fileText' : min(PODTXT)
                                      ,'howused' : min(HOW_USED) 
                                      ,'matches' : JSON_ARRAYAGG( JSON_OBJECT('line': SCDSEQ, 'content': trim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ) returning clob format json )
                  from ${tempLibrary}.${tempName2}
                  left join HOW_USED_CONDENSED on PODSFL = SCDFIL and PODSLB = SCDLIB and PODSMB = SCDMBR
                  left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR
                  group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL )
              select SEARCHMATCH from SEARCHMATCHES
              order by SEARCHMATCH`.replace(/\n\s*/g, ' ');

        let results = await Code4i.runSQL(statement);
        const parsedRows = results.map(row => JSON.parse(String(row.SEARCHMATCH)));
        const Q: SourceFileMatch[] = parsedRows.map(row => ({
          fileName: row.fileName,
          fileText: row.fileText,
          howused: row.howused,
          matches: row.matches,
        }));
        searchMatches = Q;
        // searchMatches = { command:`DSPSCNSRC`, searchDescription: `DSPPGMOBJ ${new Date().toLocaleString()}`, searchTerm: searchTerm, files: Q };
      } else {
        throw new Error(l10n.t('No results for Display Program Objects.'));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i.'));
    }
    return searchMatches;
  }
  export async function hwkdisplayObjectUsed(library: string, object: string, objType: string, searchTerm: string, howUsed: string, readOnly?: boolean)
    // : Promise<HawkeyeSearchMatches> {
    : Promise<SourceFileMatch[]> {
    const connection = Code4i.getConnection();
    library = (library !== '*ALL' ? library.toLocaleUpperCase() : '*ALL');
    object = object === `*ALL` ? `` : object.toLocaleUpperCase();
    objType = (objType !== '*ALL' ? objType.toLocaleUpperCase() : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = Code4i.makeid();
    const tempName2 = Code4i.makeid();
    let aspa = await Code4i.getLibraryIAsp(library);
    let aspb = await Code4i.getCurrentIAspName();
    let asp = await Code4i.lookupLibraryIAsp(library);
    asp = asp ? asp : aspa ? aspa : aspb;
    // let searchMatches: HawkeyeSearchMatches = {} as HawkeyeSearchMatches;
    let searchMatches: SourceFileMatch[] = {} as SourceFileMatch[];

    if (connection) {
      // let result = ``;
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPOBJU)`, noLibList: true });
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPOBJU)`, noLibList: true });
      let asp = await Code4i.getLibraryIAsp(library);
      let runDSPSCNSRC = Code4i.getContent().toCl(`DSPOBJU`, {
        obj: `${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(object)}`.toLocaleUpperCase(),
        objtype: `${connection.sysNameInAmerican(objType).toLocaleUpperCase()}`,
        howused: `${howUsed === `*ALL` ? `` : howUsed.toLocaleUpperCase()}`,
        scan: `${sanitizeSearchTerm(searchTerm === `*NONE` ? `` : searchTerm.toLocaleUpperCase())}`,
        output: `*OUTFILE`,
        outfile: `${tempLibrary.toLocaleUpperCase()}/${tempName1.toLocaleUpperCase()}`,
        outmbr: `DSPOBJU`,
      });
      let cmdResult = await Code4i.runCommand({ command: runDSPSCNSRC, environment: `ile`, noLibList: true });
      if (cmdResult.code !== 0) { throw new Error(`${connection.sysNameInAmerican(library)}/${connection.sysNameInAmerican(object)}    \n` + cmdResult.stderr); }
      // discover output quantity
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      if ((await Code4i.runSQL(`with t1 as (select distinct OUDLIB,OUDPGM,case when APISTS='1' then APISF  else OUDSFL end OUDSFL,case when APISTS='1' then APISFL else OUDSLB end OUDSLB,case when APISTS='1' then APISFM else OUDSMB end OUDSMB from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10' ,APIOPT => '80' ,APIOB => OUDPGM ,APIOBL => OUDLIB ,APIOBM => ' ',APIOBA => OUDATR )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=OUDSLB and SP.SYS_TNAME=OUDSFL and SP.SYS_MNAME=OUDSMB where OUDSLB > '     ' ) select qcmdexc('DSPSCNSRC SRCFILE('||trim(OUDSLB)||'/'||trim(OUDSFL)||') SRCMBR('||trim(OUDSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) CASE(*IGNORE) BEGPOS(001) ENDPOS(240) SCAN(''${connection.sysNameInAmerican(object)}'')') from T1 order by OUDLIB,OUDSLB,OUDSFL`.replace(/\n\s*/g, ' '))).length > 0) {

        const statement = `with HOW_USED_CONDENSED (HOW_USED, OUHOBJ, OUHLIB, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB, OUDTXT ) 
                  as ( select min(trim(left(OUDHOW ,( case locate('-', OUDHOW) when 0 then length(OUDHOW) else locate('-', OUDHOW) end))))||''||
                              listagg( distinct  (trim(right(OUDHOW, locate('-', OUDHOW) + 2))) , ':') within group (order by OUDPGM, OUDLIB, OUDATR) as HOW_USED
                              ,OUHOBJ, OUHLIB ,OUDPGM, OUDLIB, OUDATR ,OUDSFL, OUDSLB, OUDSMB, min(trim(OUDTXT))
                        from ${tempLibrary}.${tempName1} a where OUDHOW not in ('BIND')
                        group by OUHOBJ, OUHLIB, OUDPGM, OUDLIB, OUDATR, OUDSFL, OUDSLB, OUDSMB)
                  , SEARCHMATCHES (SEARCHMATCH) 
                  as (select JSON_OBJECT('fileName' : '${asp ? `${asp}` : ``}/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'
                                                      ||(case when SP.SRCTYPE is not NULL then SP.SRCTYPE when SP.SRCTYPE is NULL and SCDFIL='QSQDSRC' then 'SQL' else 'MBR' end)
                                        ,'fileText' : min(OUDTXT)
                                        ,'howused' : min(HOW_USED) 
                                        ,'matches' : JSON_ARRAYAGG(JSON_OBJECT('line': SCDSEQ, 'content': trim(SCDSTM)) order by SCDLIB,SCDFIL,SCDMBR,SCDSEQ) returning clob format json)
                      from ${tempLibrary}.${tempName2} 
                      left join HOW_USED_CONDENSED on OUDSFL=SCDFIL and OUDSLB=SCDLIB and OUDSMB=SCDMBR 
                      left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR
                      group by SCDLIB,SCDFIL,SCDMBR,SP.SRCTYPE,SCDFIL
                    )
                    select SEARCHMATCH from SEARCHMATCHES order by SEARCHMATCH`.replace(/\n\s*/g, ' ');
        let results = await Code4i.runSQL(statement);
        const parsedRows = results.map(row => JSON.parse(String(row.SEARCHMATCH)));
        const Q: SourceFileMatch[] = parsedRows.map(row => ({
          fileName: row.fileName,
          fileText: row.fileText,
          howused: row.howused,
          matches: row.matches,
        }));
        searchMatches = Q;
        // searchMatches = { command:`DSPSCNSRC`, searchDescription: `DSPOBJU ${new Date().toLocaleString()}`, searchTerm: searchTerm, files: Q };
      } else {
        throw new Error(l10n.t('No results for Display Object Used.'));
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i.'));
    }
    return searchMatches;
  }

  // function parseGrepOutput(output: string, readonly?: boolean, pathTransformer?: (path: string) => string): Result[] {
  //   const results: Result[] = [];
  //   for (const line of output.split('\n')) {
  //     if (!line.startsWith(`Binary`)) {
  //       const parts = line.split(`~`); //path:line
  //       const path = pathTransformer?.(parts[0]) || parts[0];
  //       let result = results.find(r => r.path === path);
  //       let howUsed = parts[1] ? parts[1] : `*NA`;
  //       if (!result) {
  //         result = {
  //           path,
  //           howUsed,
  //           lines: [],
  //           readonly,
  //           srcObjType: getSourceObjectType(path),
  //         };
  //         results.push(result);
  //       }

  //       const contentIndex = nthIndex(line, `~`, 3);
  //       if (contentIndex >= 0) {
  //         const curContent = line.substring(contentIndex + 1);

  //         result.lines.push({
  //           number: Number(parts[2]),
  //           content: curContent
  //         });
  //       }
  //     }
  //   }

  //   return results;
  // }

  // function resultsToSearchMatch(results: any[]): HawkeyeSearchMatches[] {
  //   const matches = results.map(result => {
  //     try {
  //       return JSON.parse(String(result.HawkeyeSearchMatches));
  //     } catch (e) {
  //       console.error(`Error parsing line "${result}":`, e);
  //       return null;
  //     }
  //   }).filter(item => item !== null);
  //   return matches;
  // }

}