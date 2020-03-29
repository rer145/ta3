@echo off

setlocal ENABLEDELAYEDEXPANSION

:: Full setup of R packages for Windows
:: Arguments - paths must be surrounded by double quotes
::   %1 Path to Rscript.exe
::     (DEV=./build/R-Portable/R-Portable-Win/bin/Rscript.exe)
::     (PROD=process.resourcesPath/R-Portable/bin/Rscript.exe)
::   %2 Path to R analysis file
::     (path.join(store.get("app.r_analysis_path"), "ta3.R"))
::   %3 Path to user's analysis path
::     (store.get("user.analysis_path"))
::   %4 Path to app's analysis scripts
::     (store.get("app.r_analysis_path"))
::   %5 Path to user's packages
::     (store.get("user.packages_path"))
::   %6 Version of the application
::     (store.get("version"))

:: Example
:: "D:\\work\\ousley\\nij-milner\\ta3\\build\\R-Portable\\R-Portable-Win\\bin\\RScript.exe "D:\\work\\ousley\\nij-milner\\ta3\\build\\scripts\\ta3.R" "C:\\Users\\ronri\\TA3\\analysis" "D:\\work\\ousley\\nij-milner\\ta3\\build\\scripts" "C:\\Users\\ronri\\TA3\\packages" "0.7.0"

SET RSCRIPT_PATH=%~1
SET R_FILE_PATH=%~2
SET TEMP_DIR=%~3
SET SCRIPTS_DIR=%~4
SET PKG_DIR=%~5
SET VER=%~6

"%RSCRIPT_PATH%" "%R_FILE_PATH%" "%TEMP_DIR%" "%SCRIPTS_DIR%" "%PKG_DIR%" "%VER%"
IF %ERRORLEVEL% NEQ 0 (
	EXIT %ERRORLEVEL%
)