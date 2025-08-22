import { Code4i } from '../tools';

/**
   *
   * @param filter: the criterias used to count the members
   * @returns number
   */
export async function getMemberCount(filter: { library: string, sourceFile?: string, members?: string, extensions?: string }): Promise<number> {
  let library = filter.library.toLocaleUpperCase();
  let sourceFile = filter.sourceFile?.toLocaleUpperCase().replace(/[*]/g, `%`);
  let singleMember = filter.members?.toLocaleUpperCase().replace(/[*]/g, `%`);
  let singleMemberExtension = filter.extensions?.toLocaleUpperCase().replace(/[*]/g, `%`);

  // library = (library !== '*' ? library : ``); // Library is required.
  sourceFile = (sourceFile !== '%' ? sourceFile : ``);
  singleMember = (singleMember !== '%' ? singleMember : ``);
  singleMemberExtension = (singleMemberExtension !== '%' ? singleMemberExtension : ``);
  if (sourceFile) {
    if ((/.*%.*/gi.test(sourceFile)) && sourceFile !== '%ALL') {
      sourceFile = ` like '${sourceFile}'`;
    }
    else if (sourceFile.length === 0 || sourceFile === '%ALL') {
      // sourceFile = `*ALL`;
      sourceFile = undefined;
    }
    else {
      sourceFile = ` = '${sourceFile}'`;
    }
  }
  if (singleMember) {
    if ((/.*%.*/gi.test(singleMember)) && singleMember !== '%ALL') {
      singleMember = ` like '${singleMember}'`;
    }
    else if (singleMember.length === 0 || singleMember === '%ALL') {
      // sourceFile = `*ALL`;
      singleMember = undefined;
    }
    else {
      singleMember = ` = '${singleMember}'`;
    }
  }
  if (singleMemberExtension) {
    if ((/.*%.*/gi.test(singleMemberExtension)) && singleMemberExtension !== '%ALL') {
      singleMemberExtension = ` like '${singleMemberExtension}'`;
    }
    else if (singleMemberExtension.length === 0 || singleMemberExtension === '%ALL') {
      // sourceFile = `*ALL`;
      singleMemberExtension = undefined;
    }
    else {
      singleMemberExtension = ` = '${singleMemberExtension}'`;
    }
  }
  let statement = ``;
  let libl = await getLibList(library);
  if (!libl) { return 0; }
  // filter patterns
  // No source file + member details (it seemed quicker on some tests )
  if (!sourceFile && !singleMember && !singleMemberExtension) {
    statement =
      `select sum(STS.NUMBER_PARTITIONS) MEMBER_COUNT from QSYS2.SYSTABLESTAT STS 
      inner join QSYS2.SYSTABLES ST on STS.SYSTEM_TABLE_NAME=ST.SYSTEM_TABLE_NAME and STS.SYSTEM_TABLE_SCHEMA=ST.SYSTEM_TABLE_SCHEMA and ST.FILE_TYPE = 'S'
      where STS.SYSTEM_TABLE_SCHEMA in (${libl})
      `.replace(/\n\s*/g, ' ');
  }
  // user specified any other value for member details.
  else {
    statement =
      `select count(*) MEMBER_COUNT from QSYS2.SYSPARTITIONSTAT STS
      inner join QSYS2.SYSTABLES ST on STS.SYSTEM_TABLE_NAME=ST.SYSTEM_TABLE_NAME and STS.SYSTEM_TABLE_SCHEMA=ST.SYSTEM_TABLE_SCHEMA and ST.FILE_TYPE = 'S'
      where STS.SYSTEM_TABLE_SCHEMA in (${libl})
        ${sourceFile ? `and STS.SYSTEM_TABLE_NAME ${sourceFile}` : ``}
        ${singleMember ? `and STS.SYSTEM_TABLE_MEMBER ${singleMember}` : ``}
        ${singleMemberExtension ? `and STS.SOURCE_TYPE ${singleMemberExtension}` : ''}
      `.replace(/\n\s*/g, ' ');
  }

  const results = await Code4i.runSQL(statement, { forceSafe: true });
  if (results.length) {
    return Number(results[0].MEMBER_COUNT);
  }
  else {
    return 0;
  }
}
export async function getHwkDocLibl(lib: string): Promise<string> {
  let liblist: string = ``;
  const templib = Code4i.getTempLibrary();
  const tempName = Code4i.makeid();
  let statement = `create or replace alias ${templib}.${tempName} for HAWKEYE.H$DDOCL (##HAWKEYE)`;
  let results = await Code4i.runSQL(statement, { forceSafe: true });
  statement =
    `select varchar(listagg(''''||trim(b.element),''',')||'''',2750) DOCLIBL from ${templib}.${tempName}
      , table ( systools.split(INPUT_LIST => trim(H$DDOCL), DELIMITER => '2') ) B where ELEMENT > '  '
      `.replace(/\n\s*/g, ' ');
  results = await Code4i.runSQL(statement, { forceSafe: true });
  if (results.length) {
    liblist = String(results[0].DOCLIBL);
  }
  return liblist;
}
export async function getHwkSrcLibl(lib: string): Promise<string> {
  let liblist: string = ``;
  const templib = Code4i.getTempLibrary();
  const tempName = Code4i.makeid();
  let statement = `create or replace alias ${templib}.${tempName} for HAWKEYE.H$DSRCFL (##HAWKEYE)`;
  let results = await Code4i.runSQL(statement, { forceSafe: true });
  statement = `with recursive THESPLIT (ID, THESPLITVALUE, REMAINING_VALUE) as (
    select 1 as ID ,substring(H$DSRCFL, 1, 20) as THESPLITVALUE ,substring(H$DSRCFL, 21) as REMAINING_VALUE
      from ${templib}.${tempName}
    union all
    select ID+1 ,substring(REMAINING_VALUE, 1, 20) ,substring(REMAINING_VALUE, 21)
      from THESPLIT
      where length(REMAINING_VALUE) > 0
  ) select varchar(listagg(distinct ''''||varchar(trim(substr(THESPLITVALUE, 11, 10)), 10), ''',')
            within group (order by substr(THESPLITVALUE, 11, 10))||'''',3300) as LIBL
    from THESPLIT where THESPLITVALUE <> ' '`.replace(/\n\s*/g, ' ');
  results = await Code4i?.runSQL(statement, { forceSafe: true });
  if (results.length) {
    liblist = String(results[0].LIBL);
  }
  return liblist;
}
export async function getLibList(lib: string): Promise<string> {
  let liblist: string = ``;
  let statement: string = ``;
  switch (lib) {
  case '*DOCLIBL':
  case '*ALL': // For some commands we dont really want to know about all libraries so default to this list version
    liblist = await getHwkDocLibl(lib);
    break;
  case '*SRCL':
    liblist = await getHwkSrcLibl(lib);
    break;
  case '*LIBL':
    statement = `select listagg(distinct ''''||SYSTEM_SCHEMA_NAME,''',')||'''' LIBLIST from QSYS2.LIBRARY_LIST_INFO`;
    break;
  case '*USRLIBL':
    statement = `select listagg(distinct ''''||SYSTEM_SCHEMA_NAME,''',')||'''' LIBLIST from QSYS2.LIBRARY_LIST_INFO where TYPE = 'USER'`;
    break;
  case '*ALLUSR':
    statement = `select listagg(distinct ''''||trim(cast(OBJNAME as clob(1m))), ''',')||'''' LIBLIST from table (QSYS2.OBJECT_STATISTICS(OBJECT_SCHEMA => '*ALLUSR', OBJTYPELIST => 'LIB'))`;
    break;
  case '*CURLIB':
    statement = `select SYSTEM_SCHEMA_NAME LIBLIST from QSYS2.LIBRARY_LIST_INFO where TYPE = 'CURRENT'`;
    break;
  default: // named
    liblist = `'`+lib+`'`;
    break;
  }
  if (statement) {
    const results = await Code4i.runSQL(statement, { forceSafe: true });
    if (results.length) {
      liblist = String(results[0].LIBLIST);
    }
  }
  return liblist;
}
export async function getIASP(library:string): Promise<string>{
  let aspa = Code4i.getLibraryIAsp(library);
  let aspb = Code4i.getCurrentIAspName();
  let asp = await Code4i.lookupLibraryIAsp(library);
  return asp ? asp : aspa ? aspa : aspb||'';
}