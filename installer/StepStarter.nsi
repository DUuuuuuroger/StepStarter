!include "MUI2.nsh"
!include "FileFunc.nsh"

Name "StepStarter"
OutFile "StepStarter-Setup.exe"
InstallDir "$LOCALAPPDATA\\StepStarter"
InstallDirRegKey HKCU "Software\\StepStarter" "InstallDir"
RequestExecutionLevel user

!define APP_EXE "StepStarter.exe"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "SimpChinese"

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  WriteRegStr HKCU "Software\\StepStarter" "InstallDir" "$INSTDIR"

  File /r "..\\dist\\StepStarter\\*.*"

  WriteUninstaller "$INSTDIR\\Uninstall.exe"
SectionEnd

Section /o "Shortcuts (Desktop + Start Menu)" SEC02
  CreateDirectory "$SMPROGRAMS\\StepStarter"
  CreateShortCut "$SMPROGRAMS\\StepStarter\\StepStarter.lnk" "$INSTDIR\\${APP_EXE}"
  CreateShortCut "$SMPROGRAMS\\StepStarter\\Uninstall.lnk" "$INSTDIR\\Uninstall.exe"
  CreateShortCut "$DESKTOP\\StepStarter.lnk" "$INSTDIR\\${APP_EXE}"
SectionEnd

Section "Uninstall"
  ExecWait 'taskkill /F /IM StepStarter.exe'
  Delete "$DESKTOP\\StepStarter.lnk"
  Delete "$SMPROGRAMS\\StepStarter\\StepStarter.lnk"
  Delete "$SMPROGRAMS\\StepStarter\\Uninstall.lnk"
  RMDir "$SMPROGRAMS\\StepStarter"

  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\\StepStarter"
SectionEnd
