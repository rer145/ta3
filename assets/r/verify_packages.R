trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
pkg_path<-trim(args[1])	# directory where zip files are located

to_install<-c(
	paste(pkg_path, "\\", ),
	""
)


############# Auto-install of packages #############
# r = getOption("repos")
# r["CRAN"] = "http://cran.us.r-project.org"
# options(repos = r)
# install.packages("gtools")

# install.packages("E:\\R-Packages\\plyr_1.8.4.zip", repos = NULL, type="source")
# library("myRPackage", lib.loc="/usr/me/local/R/library")

# > install.packages("D:\\work\\ousley\\nij-milner\\packages\\doParallel_1.0.15.zip", lib="D:\\work\\ousley\\nij-milner\\packages", repos=NULL)
# > library("doParallel", lib.loc="D:\\work\\ousley\\nij-milner\\packages")

# const requiredPackages = [
# 	{package: 'gtools', url: 'https://cran.r-project.org/src/contrib/Archive/gtools/gtools_3.5.0.tar.gz'},
# 	{package: 'MASS', url: 'https://cran.r-project.org/src/contrib/Archive/MASS/MASS_7.3-51.3.tar.gz'},
# 	{package: 'foreach', url: 'https://cran.r-project.org/src/contrib/Archive/foreach/foreach_1.4.4.tar.gz'},
# 	{package: 'iterators', url: 'https://cran.r-project.org/src/contrib/Archive/iterators/iterators_1.0.10.tar.gz'},
# 	{package: 'doParallel', url: 'https://cran.r-project.org/src/contrib/Archive/doParallel/doParallel_1.0.14.tar.gz'},
# 	{package: 'randomGLM', url: 'https://cran.r-project.org/src/contrib/Archive/randomGLM/randomGLM_1.00-1.tar.gz'},
# 	{package: 'glmnet', url: 'https://cran.r-project.org/src/contrib/Archive/glmnet/glmnet_3.0-1.tar.gz'},
# 	{package: 'msir', url: 'https://cran.r-project.org/src/contrib/Archive/msir/msir_1.3.1.tar.gz'},
# ];



installed<-require(p, character.only=TRUE)
#print("INSTALLATION: [" + installed + "]")
installed
