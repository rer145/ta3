rm(list = ls())


############# Helper Functions #############
trim <- function (x) gsub("^\\s+|\\s+$", "", x)


############# Gathering of Arguments Passed In #############
args = commandArgs(trailingOnly=TRUE)
temp_dir<-trim(args[1])  # directory where input and output files will be
scripts_dir<-trim(args[2])  # directory where R related files will be
pkg_dir<-trim(args[3])  # directory where R install packages will be
TA3ProgramVersion<-trim(args[4])  # version number of the application


############# Update Environment #############
#.libPaths(c(pkg_dir, .libPaths()))
.libPaths(c(pkg_dir))
setwd(scripts_dir)


############# List of Required Packages #############
require("gtools")
require("MASS") 
require("foreach")
require("iterators")
require("doParallel")
require("randomGLM")
#require("glmnet")
require("msir")



############# Debugging Information #############
print("*** sessionInfo() ***")
sessionInfo()

print("*** .libPaths() ***")
.libPaths()

print("*** getwd() ***")
getwd()

