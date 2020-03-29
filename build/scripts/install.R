print("Starting Install of R Packages")

trim <- function (x) gsub("^\\s+|\\s+$", "", x)
args<-commandArgs(trailingOnly=TRUE)

do.package.install<-function(pkg_name, build_date) {
  print(paste("  Installing package:", pkg_name))
  if (!require(pkg_name, lib.loc=dest_path, character.only=TRUE, warn.conflicts=FALSE)) {
    tryCatch(
      {
        install.packages(
          pkg_name, 
          repos=paste("https://mran.microsoft.com/snapshot/", build_date, sep=""),
          lib=dest_path,
          verbose=FALSE,
          quiet=TRUE)
        print("    Package installed successfully!")
      },
      error=function(cond) {
        print("    ERROR: Could not install package")
        print(cond)
      }
    )
  } else {
    print("    Package already installed")
  }
}

dest_path<-trim(args[1])

if (is.na(dest_path)) {
  print("  ERROR: Cannot install - no destination path defined")
}


if (!is.na(dest_path)) {
  print(paste("Installing TO", dest_path))
  #print(paste("libPaths()", .libPaths()))

  #.libPaths(c(dest_path, .libPaths()))
  .libPaths(c(dest_path))
  print(paste(".libPaths()", .libPaths()))
  
	do.package.install("gtools", "2020-03-01")
	do.package.install("MAAS", "2020-03-01")
	do.package.install("foreach", "2020-03-01")
	do.package.install("iterators", "2020-03-01")
	do.package.install("doParallel", "2020-03-01")
	do.package.install("randomGLM", "2020-03-01")
	do.package.install("glmnet", "2020-03-01")
	do.package.install("msir", "2020-03-01")
}

print("Finished Install of R Packages")