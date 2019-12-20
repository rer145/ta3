trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
pkg_path<-trim(args[1])	# directory where zip files are located

setwd(pkg_path)
pkgs<-list.files()

install.packages(c(print(as.character(pkgs), collapse="\", \"")), repos=NULL)
