import vscode, { l10n } from 'vscode';
import { makeid, Code4i, sanitizeSearchTerm, nthIndex } from '../tools';
export namespace HawkeyeSearch {
  const QSYS_PATTERN = /(?:\/\w{1,10}\/QSYS\.LIB\/)|(?:\/QSYS\.LIB\/)|(?:\.LIB)|(?:\.FILE)|(?:\.MBR)/g;
  const NEWLINE = `\r\n`;

  export interface Result {
    path: string
    lines: Line[]
    readonly?: boolean
    label?: string
    contextValue?: string
  }

  export interface Line {
    number: number
    content: string
  }

  export async function hwksearchMembers(library: string, sourceFile: string, memberFilter: string, searchTerm: string, readOnly?: boolean): Promise<Result[]> {
    const connection = Code4i.getConnection();
    const config = Code4i.getConfig();
    const content = Code4i.getContent();
    const lib = (library !== '*' ? library : '*ALL');
    const spf = (sourceFile !== '*' ? sourceFile : '*ALL');
    let mbrExt = memberFilter.split(`.`);
    const member = (mbrExt[0] !== '*' ? mbrExt[0] : '*ALL');
    const memberExt = (mbrExt[1] !== '*' ? mbrExt[1] : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName = makeid();

    if (connection && config && content) {
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName} MBR(HWKSEARCH)`, noLibList: true });
      await Code4i.runCommand({ command: `DSPSCNSRC SRCFILE(${connection.sysNameInAmerican(lib)}/${connection.sysNameInAmerican(spf)}) SRCMBR(${connection.sysNameInAmerican(member)}) TYPE(${connection.sysNameInAmerican(memberExt)}) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName}) OUTMBR(HWKSEARCH) SCAN('${sanitizeSearchTerm(searchTerm).substring(0, 30)}') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)`, noLibList: true });
      const result = await connection.sendQsh({
        command: `db2 -s "select '/WIASP/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'||(case when SP.SOURCE_TYPE is not null then SP.SOURCE_TYPE when SP.SOURCE_TYPE is null and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end)||':'||char(SCDSEQ)||':'||varchar(rtrim(SCDSTM),112) from ${tempLibrary}.${tempName} left join QSYS2.SYSPARTITIONSTAT SP on SP.SYSTEM_TABLE_SCHEMA=SCDLIB and SP.SYSTEM_TABLE_NAME=SCDFIL and SP.SYSTEM_TABLE_MEMBER=SCDMBR where ucase(rtrim(SCDSTM)) like ucase('%${sanitizeSearchTerm(searchTerm)}%')" | sed -e '1,3d' -e 's/\(.*\)/&/' -e '/^$/d' -e '/RECORD.*.*.* SELECTED/d' ;`,
      }); // add to end of list in future => -e 's/:/~/' -e 's/:/~/'

      if (!result.stderr) {
        return parseGrepOutput(result.stdout || '', readOnly,
          path => connection.sysNameInLocal(path.replace(QSYS_PATTERN, ''))); //Transform QSYS path to URI 'member:' compatible path
      }
      else {
        throw new Error(result.stderr);
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i'));
    }
  }
  export async function hwkdisplayFileSetsUsed(library: string, dbFile: string, searchTerm: string, readOnly?: boolean): Promise<Result[]> {
    const connection = Code4i.getConnection();
    const config = Code4i.getConfig();
    const content = Code4i.getContent();
    const lib = (library !== '*' ? library : '*ALL');
    const file = (dbFile !== '*' ? dbFile : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = makeid();
    const tempName2 = makeid();
    searchTerm = searchTerm === `*NA` ? `` : searchTerm;

    if (connection && config && content) {
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPFSU)`, noLibList: true });
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPFSU)`, noLibList: true });
      await Code4i.runCommand({ command: `DSPFILSETU FILE(${connection.sysNameInAmerican(lib)}/${connection.sysNameInAmerican(file)}) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName1}) OUTMBR(HWKDSPFSU)`, noLibList: true });
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      if ((await Code4i.runSQL(`with t1 as (select distinct TUDFLL,TUDFL,TUDSLB,TUDSFL,TUDSMB from ${tempLibrary}.${tempName1} left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=TUDSLB and SP.SYS_TNAME=TUDSFL and SP.SYS_MNAME=TUDSMB where TUDSLB > '     ' ) select qcmdexc('DSPSCNSRC SRCFILE('||trim(TUDSLB)||'/'||trim(TUDSFL)||') SRCMBR('||trim(TUDSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN(${sanitizeSearchTerm(searchTerm) ? `''${sanitizeSearchTerm(searchTerm)}''  ` : ""}'''||trim(TUDFL)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)') from T1 order by TUDFLL,TUDSLB,TUDSFL`)).length > 0) {
        const result = await connection.sendQsh({
          command: `db2 -s "select '/WIASP/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'||(case when SP.SRCTYPE is not null then SP.SRCTYPE when SP.SRCTYPE is null and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end)||':'||char(SCDSEQ)||':'||varchar(rtrim(SCDSTM),112) from ${tempLibrary}.${tempName2} left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR where 1=1 " | sed -e '1,3d' -e 's/\(.*\)/&/' -e '/^$/d' -e '/RECORD.*.*.* SELECTED/d' ;`,
        }); // add to end of list in future => -e 's/:/~/' -e 's/:/~/'

        if (!result.stderr) {
          // const result = await connection.sendQsh({ command: `system -q "DLTF ${tempLibrary}/${tempName}";`});
          return parseGrepOutput(result.stdout || '', readOnly,
            path => connection.sysNameInLocal(path.replace(QSYS_PATTERN, ''))); //Transform QSYS path to URI 'member:' compatible path
        }
        else {
          throw new Error(result.stderr);
        }
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i'));
    }
    return [];
  }
  export async function hwkdisplayProgramObjects(library: string, program: string, searchTerm: string, readOnly?: boolean): Promise<Result[]> {
    const connection = Code4i.getConnection();
    const config = Code4i.getConfig();
    const content = Code4i.getContent();
    const lib = (library !== '*' ? library : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = makeid();
    const tempName2 = makeid();
    searchTerm = searchTerm === `*NA` ? `` : searchTerm;

    if (connection && config && content) {
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPPGMO)`, noLibList: true });
      await Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPPGMO)`, noLibList: true });
      await Code4i.runCommand({ command: `DSPPGMOBJ PGM(${connection.sysNameInAmerican(lib)}/${connection.sysNameInAmerican(program)}) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName1}) OUTMBR(HWKDSPPGMO)`, noLibList: true });
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      if ((await Code4i.getContent().runSQL(`with t1 as (select distinct PODLIB,PODOBJ,case when APISTS = '1' then APISF  else PODSFL end PODSFL,case when APISTS = '1' then APISFL else PODSLB end PODSLB,case when APISTS = '1' then APISFM else PODSMB end PODSMB from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10' ,APIOPT => '80' ,APIOB => PODOBJ ,APIOBL => PODLIB ,APIOBM => ' ',APIOBA => PODTYP )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=PODSLB and SP.SYS_TNAME=PODSFL and SP.SYS_MNAME=PODSMB where PODSLB > '     ' ) select qcmdexc('DSPSCNSRC SRCFILE('||trim(PODSLB)||'/'||trim(PODSFL)||') SRCMBR('||trim(PODSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) SCAN(${sanitizeSearchTerm(searchTerm) ? `''${sanitizeSearchTerm(searchTerm)}''  ` : ""}'''||trim(PODOBJ)||''') CASE(*IGNORE) BEGPOS(001) ENDPOS(240)') from T1 order by PODLIB,PODSLB,PODSFL`)).length > 0) {
        const result = await connection.sendQsh({
          command: `db2 -s "select '/WIASP/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'||(case when SP.SRCTYPE is not null then SP.SRCTYPE when SP.SRCTYPE is null and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end)||':'||char(SCDSEQ)||':'||varchar(rtrim(SCDSTM),112) from ${tempLibrary}.${tempName2} left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR where 1=1 " | sed -e '1,3d' -e 's/\(.*\)/&/' -e '/^$/d' -e '/RECORD.*.*.* SELECTED/d' ;`,
        }); // add to end of list in future => -e 's/:/~/' -e 's/:/~/'

        if (!result.stderr) {
          // const result = await connection.sendQsh({ command: `system -q "DLTF ${tempLibrary}/${tempName}";`});
          return parseGrepOutput(result.stdout || '', readOnly,
            path => connection.sysNameInLocal(path.replace(QSYS_PATTERN, ''))); //Transform QSYS path to URI 'member:' compatible path
        }
        else {
          throw new Error(result.stderr);
        }
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i'));
    }
    return [];
  }
  export async function hwkdisplayObjectUsed(library: string, object: string, objType: string, searchTerm: string, howUsed: string, readOnly?: boolean): Promise<Result[]> {
    const connection = Code4i.getConnection();
    // const config = Code4i.getConfig();
    // const content = Code4i.getContent();
    const lib = (library !== '*' ? library : '*ALL');
    const type = (objType !== '*' ? objType : '*ALL');
    const tempLibrary = Code4i.getTempLibrary();
    const tempName1 = makeid();
    const tempName2 = makeid();
    searchTerm = searchTerm === `*NA` ? `` : searchTerm;
    howUsed = howUsed === `*NA` ? `` : howUsed;

    if (connection) {
      // let result = ``;
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName1} MBR(HWKDSPOBJU)`, noLibList: true });
      Code4i.runCommand({ command: `CLRPFM ${tempLibrary}/${tempName2} MBR(HWKDSPOBJU)`, noLibList: true });
      const commandResult = await Code4i.runCommand({
        command: `DSPOBJU OBJ(${connection.sysNameInAmerican(lib)}/${connection.sysNameInAmerican(object)}) OBJTYPE(${connection.sysNameInAmerican(type)})${sanitizeSearchTerm(howUsed) ? ` HOWUSED(''${sanitizeSearchTerm(howUsed)}'')  ` : ""}${sanitizeSearchTerm(searchTerm) ? ` SCAN(''${sanitizeSearchTerm(searchTerm)}'')  ` : ""} OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName1}) OUTMBR(HWKDSPOBJU)`, noLibList: true
      });
      // discover output quantity
      const resultSetQty = await Code4i!.runSQL(`select count(*) as RS_QTY from ${tempLibrary}.${tempName1}`);
      if (resultSetQty.length === 0 || resultSetQty[0].RS_QTY === 0) { throw new Error(`No records found in Hawkeye database.`); }
      if ((await Code4i.getContent().runSQL(`with t1 as (select distinct OUDLIB,OUDPGM,case when APISTS = '1' then APISF  else OUDSFL end OUDSFL,case when APISTS = '1' then APISFL else OUDSLB end OUDSLB,case when APISTS = '1' then APISFM else OUDSMB end OUDSMB from ${tempLibrary}.${tempName1} left join table ( ${tempLibrary}.HWK_GetObjectSourceInfo(APITYP => '10' ,APIOPT => '80' ,APIOB => OUDPGM ,APIOBL => OUDLIB ,APIOBM => ' ',APIOBA => OUDATR )) HWKF on 1=1 left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=OUDSLB and SP.SYS_TNAME=OUDSFL and SP.SYS_MNAME=OUDSMB where OUDSLB > '     ' ) select qcmdexc('DSPSCNSRC SRCFILE('||trim(OUDSLB)||'/'||trim(OUDSFL)||') SRCMBR('||trim(OUDSMB)||') TYPE(*ALL) OUTPUT(*OUTFILE) OUTFILE(${tempLibrary}/${tempName2}) OUTMBR(HWKSEARCH *ADD) CASE(*IGNORE) BEGPOS(001) ENDPOS(240) SCAN(''${connection.sysNameInAmerican(object)}'')') from T1 order by OUDLIB,OUDSLB,OUDSFL`)).length > 0) {


        const command = `db2 -s "select '/WIASP/QSYS.LIB/'||trim(SCDLIB)||'.LIB/'||trim(SCDFIL)||'.FILE/'||trim(SCDMBR)||'.'||(case when SP.SRCTYPE is not null then SP.SRCTYPE when SP.SRCTYPE is null and SCDFIL = 'QSQDSRC' then 'SQL' else 'MBR' end)||':'||char(SCDSEQ)||':'||varchar(rtrim(SCDSTM),112) from ${tempLibrary}.${tempName2} left join QSYS2.SYSPSTAT SP on SP.SYS_DNAME=SCDLIB and SP.SYS_TNAME=SCDFIL and SP.SYS_MNAME=SCDMBR where 1=1 " | sed -e '1,3d' -e 's/\(.*\)/&/' -e '/^$/d' -e '/RECORD.*.*.* SELECTED/d' ;`;
        let result = await connection.sendQsh({ command: command }); // add to end of list in future => -e 's/:/~/' -e 's/:/~/'

        if (!result.stderr) {
          return parseGrepOutput(result.stdout || '', readOnly,
            path => connection.sysNameInLocal(path.replace(QSYS_PATTERN, ''))); //Transform QSYS path to URI 'member:' compatible path
        }
        else {
          throw new Error(result.stderr);
        }
      }
    }
    else {
      throw new Error(l10n.t('Please connect to an IBM i'));
    }
    return [];
  }

  function parseGrepOutput(output: string, readonly?: boolean, pathTransformer?: (path: string) => string): Result[] {
    const results: Result[] = [];
    for (const line of output.split('\n')) {
      if (!line.startsWith(`Binary`)) {
        const parts = line.split(`:`); //path:line
        const path = pathTransformer?.(parts[0]) || parts[0];
        let result = results.find(r => r.path === path);
        if (!result) {
          result = {
            path,
            lines: [],
            readonly,
          };
          results.push(result);
        }

        const contentIndex = nthIndex(line, `:`, 2);
        if (contentIndex >= 0) {
          const curContent = line.substring(contentIndex + 1);

          result.lines.push({
            number: Number(parts[1]),
            content: curContent
          });
        }
      }
    }

    return results;
  }
}