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
  if (sourceFile && (/.*%.*/gi.test(sourceFile))) {
    sourceFile = ` like '${sourceFile}'`;
  }
  else {
    sourceFile = ` = '${sourceFile}'`;
  }
  let statement = ``;
  if (!sourceFile && !singleMember && !singleMemberExtension) {
    statement =
      `select sum(NUMBER_PARTITIONS) MEMBER_COUNT from QSYS2.SYSTABLESTAT
      where SYSTEM_TABLE_SCHEMA = '${library}'
      `;
  }
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

    const results = await Code4i!.runSQL(statement);
    if (results.length) {
      return Number(results[0].MEMBER_COUNT);
    }
    else {
      return 0;
    }
  }