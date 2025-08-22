import { Action } from '@halcyontech/vscode-ibmi-types';

export function getHawkeyeAction(id:number): Action {
  // console.log(hawkeyeActions);
  // console.log(JSON.stringify(hawkeyeActions,null,2));
  let workAction: Action = {} as Action;
  if (id >= 0 && id <= 3 ) {
    workAction = hawkeyeActions[id];
    return workAction;
  }
  else 
  {
    return {} as Action;
  }
}
const hawkeyeActions: Action[] =
  [
    {
      "name": `DSPSCNSRC`,
      "command": "DSPSCNSRC SRCLIB(${LIBRARY|Source Library . . . : <b>Name,*LIBL,*DOCLIBL,*USRLIBL,*ALLUSR,*CURLIB,*SRCL</b>|*DOCLIBL}) SRCFILE(${SRCFILE|Source File  . . . . : <b>Name, generic*, *ALL</b>|*ALL}) SRCMBR(${MEMBER|Source Member  . . . : <b>Name, generic*, *ALL</b>|*ALL}) TYPE(${MEMBEREXT|Source Type  . . . . : <b>Name, generic*, *ALL</b>|*ALL}) CASE(${CASE|Text case match  . . :<b>*IGNORE,*MATCH</b>|*IGNORE,*MATCH}) LOGIC(${LOGIC|Matching logic . . . : <b>*OR,*AND</b>|*OR,*AND}) BEGPOS(${BEGPOS|Source scan begin pos: <B>1-240</B>|001}) ENDPOS(${ENDPOS|Source scan end pos  : <b>1-240</b>|240}) SCAN1(${SCAN1|Scan string 1|}) SCAN2(${scan2|Scan string 2|}) SCAN3(${scan3|Scan string 3|}) SCAN4(${SCAN4|Scan string 4|}) SCAN5(${scan5|Scan string 5|}) SCAN6(${scan6|Scan string 6|}) SCAN7(${scan7|Scan string 7|}) SCAN8(${scan8|Scan string 8|}) SCAN9(${scan9|Scan string 9|}) SCANA(${scanA|Scan string 10|})",
      "environment": "ile",
      "type": "file",
      "extensions": [
        "GLOBAL"
      ],
      "postDownload": [
        "DSPSCNSRC.txt",
        "tmp/"
      ]
    }, {
      "name": `DSPFILSET`,
      "command": "DSPFILSETU FILELIB(${FILELIB|File Library . . . : <b>Name, *ALL, *CURLIB, *DOCLIBL</b>|*DOCLIBL}) FILE(${FILE|File name  . . . . : <b>Name, generic*, *ALL</b>|*ALL}) HOWUSED(${HOWUSED|How used . . . . . :|*ALL,RPG-COPY,RPG-FILE,RPG-INP,RPG-OUT,RPG-UPD,RPG-CMB,RPG-INP/AD,RPG-OUT/AD,RPG-UPD/AD,RPG-CMB/AD,RPG-***/AD,RPG-WRITE,SQL-CALL,SQL-INP,SQL-OUT,SQL-UPD,SQL-I-O,SQL-INP/AD,SQL-OUT/AD,SQL-UPD/AD,SQL-I-O/AD,SQL-***/AD,DFUFILE,QRYFILE}) SEQUENCE(${SEQUENCE|Sequence results by <b>*PGM</b> or <b>*FILE</b>|*PGM, *FILE}) SCAN(${SCAN|Scan for value . . . : <b>value, *NONE</b>|*NONE})",
      "environment": "ile",
      "type": "file",
      "extensions": [
        "GLOBAL"
      ],
      "postDownload": [
        "DSPPGMOBJ.txt",
        "tmp/"
      ]
    }
    , {
      "name": `DSPPGMOBJ`,
      "command": "DSPPGMOBJ OBJLIB(${OBJLIB|Object Library . . . : <b>Name, *ALL, *CURLIB</b>|*ALL}) OBJ(${OBJ|Object name  . . . . : <b>Name, generic*, *ALL</b>|*ALL}) OBJTYPE(${OBJTYPE|Object Type  . . . . : |*PGM ,*MENU ,*MODULE ,*QRYDFN ,*SRVPGM ,*CMD ,*JOBD ,*SBSD ,*USRPRF ,*EXT}) SCAN(${SCAN|Scan for value . . . : <b>value, *NONE</b>|*NONE})",
      "environment": "ile",
      "type": "file",
      "extensions": [
        "GLOBAL"
      ],
      "postDownload": [
        "DSPPGMOBJ.txt",
        "tmp/"
      ]
    }
    , {
      "name": `DSPOBJU`,
      "command": "DSPOBJU OBJLIB(${OBJLIB|Object Library . . . : <b>Name, *ALL, *CURLIB, *VARIABLE</b>|*ALL}) OBJ(${OBJ|Object name  . . . . : <b>Name, generic*, *ALL</b>|*ALL}) OBJTYPE(${OBJTYPE|Object Type  . . . . : |*ALL ,*PGM ,*CMD ,*FILE ,*MODULE ,*SRVPGM ,*BNDDIR ,*DTAARA ,*DTAQ ,*PNLGRP ,*LIB ,*MENU ,*MSGF ,*MSGQ ,*OUTQ ,*JRN ,*JRNRCV ,*AUTL ,*EXITRG ,*OVL ,*PAGDFN ,*PAGSEG ,*QMFORM ,*QMQRY ,*SQLPKG ,*USRIDX ,*USRPRF ,*USRQ ,*USRSPC ,*WSCST}) HOWUSED(${HOWUSED|How used . . . . . . :|*ALL ,RPG-COPY ,RPG-FILE ,RPG-INP ,RPG-OUT ,RPG-UPD ,RPG-CMB ,RPG-INP/AD ,RPG-OUT/AD ,RPG-UPD/AD ,RPG-CMB/AD ,RPG-***/AD ,RPG-WRITE ,SQL-CALL ,SQL-INP ,SQL-OUT ,SQL-UPD ,SQL-I-O ,SQL-INP/AD ,SQL-OUT/AD ,SQL-UPD/AD ,SQL-I-O/AD ,SQL-***/AD ,DFUFILE ,QRYFILE}) SCAN(${SCAN|Scan for value . . . : <b>value, *NONE</b>|*NONE})",
      "environment": "ile",
      "type": "file",
      "extensions": [
        "GLOBAL"
      ],
      "postDownload": [
        "DSPOBJU.txt",
        "tmp/"
      ]
    }
  ];