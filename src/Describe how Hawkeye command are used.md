# DSPSCNSRC
    *  LIB/SRCF MBR TYPE
    *  from
        *  EDITOR 
            *  path contains open member, second parm searchText has highlighted text
            *  Search for highlighted token in *DOCLIBL/Q*/*ALL for promptedValue
            *  Default searchText for secondary prompteValue
        *  SEARCH
            *  path contains open member, second parm searchText has highlighted text
            *  ignore value in path
            *  level 1
                *  In object searchResults use searchItem for promptedValue
            *  level 2
                *  In object HitSource use sourceName for promptedValue
            *  level 3
                *  In object LineHit use value from label.highlights for promptedValue
        *  Member Filter
            *  path contains selected member
            *  default library (?src file?) for promptedValue
            *  default member name for second promptedValue
                    ** Defaults to srclib/srcfile
        *  Object Filter
            *  path contains selected object
            *  default library for promptedValue
            *  default object name for second promptedValue
                    ** Defaults to *DOCLIBL/Q*/*ALL
# DSPOBJU
    *  LIB/OBJ TYPE
    *  from
        *  EDITOR 
            *  path contains open member, second parm searchText has highlighted text
            *  default *ALL/searchText for promptedValue
            *  ignore populating the second promptedValue.
        *  SEARCH
            *  no searchText passed
            *  default searchItem, from level 1, for promptedValue
            *  default object from path, from level 2, for promptedValue
            *  default value from highlights, from level 3, for promptedValue
        *  Member Filter
            *  get the name from sub-object (member), for promptedValue. 
            *  does this really need the *ALL for library???>
            *  ignore populating second promptedValue
        *  Object Filter
            *  get the name from sub-object (object), for promptedValue
            *  ignore populating second promptedValue
# DSPPGMOBJ
    *  LIB/OBJ.[*PGM|*MENU|*MODULE|*QRYDFN|*SRVPGM|*CMD|*JOBD|*SBSD|*USRPRF|*EXT|*EXTSQL]
    *  from
        *  EDITOR 
            *  path contains open member, second parm searchText has highlighted text
            *  default *ALL/searchText for promptedValue
            *  ignore populating the second promptedValue.
        *  SEARCH
        *  Member Filter
            *  get the name from sub-object (member), for promptedValue. 
            *  does this really need the *ALL for library???>
            *  ignore populating second promptedValue
        *  Object Filter
            *  get the name from sub-object (object), for promptedValue
            *  ignore populating second promptedValue
# DSPFILSETU
    *  LIB/OBJ
    *  from
        *  EDITOR 
            *  path contains open member, second parm searchText has highlighted text
            *  default *DOCLIBL/searchText for promptedValue
            *  ignore populating the second promptedValue.
        *  SEARCH
        *  Member Filter
            *  default member from path string, for promptedValue
            *  ignore second promptedValue
        *  Object Filter
            *  default object from path string, for promptedValue
            *  ignore second promptedValue
# DSPPRCU
    *  OBJ
    *  from
        *  EDITOR 
            *  path contains open member, second parm searchText has highlighted text
            *  defaut in searchText for promptedValue 
        *  SEARCH
            *  no searchText passed
            *  command not available at level 1
            *  command not available at level 2
            *  default value from highlights, from level 3, for promptedValue
        *  Member Filter
            *  default member from path string, for promptedValue
            *  ignore second promptedValue
        *  Object Filter
            *  default object from path string, for promptedValue
            *  ignore second promptedValue
