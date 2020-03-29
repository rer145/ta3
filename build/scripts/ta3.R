############# Helper Functions #############
trim <- function (x) gsub("^\\s+|\\s+$", "", x)


############# Gathering of Arguments Passed In #############
args = commandArgs(trailingOnly=TRUE)
temp_dir<-trim(args[1])  # directory where input and output files will be
scripts_dir<-trim(args[2])  # directory where R related files will be
pkg_dir<-trim(args[3])  # directory where R install packages will be
v<-trim(args[4])  # version number of the application


############# Update Environment #############
.libPaths(c(pkg_dir, .libPaths()))
rm(randomGLM)


############# Creating Local Variables for Saving/Usage #############

rda_fileB <- file.path(scripts_dir, "TA3BUM.Rda")
rda_fileO <- file.path(scripts_dir, "TA3OUM.Rda")
case_tall_file <- file.path(scripts_dir, "TA3_Case_Scores.Rda")

input_file<-file.path(temp_dir, "TA3_Input.csv")

output_file<-file.path(temp_dir, "output.txt")
output_image1<-file.path(temp_dir, "output1.png")
#output_image2<-file.path(temp_dir, "output2.png")




############# Import Required Packages #############
library("gtools")
library("MASS") 
library("foreach")
library("iterators")
library("doParallel")
library("randomGLM")
library("glmnet")
library("msir")











############# TA3 Analysis #############

TA3BUM<-readRDS(rda_fileB)
TA3OUM<-readRDS(rda_fileO)

# read in case template; all NA except for first one, will be changed.
TA3_Case_Scores <- readRDS(case_tall_file)

# convert factors to character format in case scores 
TA3_Case_Scores$TraitDBName <- as.character(TA3_Case_Scores$TraitDBName)
TA3_Case_Scores$TraitText <- as.character(TA3_Case_Scores$TraitText)

# process trait scores file
TA3_Input <- read.csv(input_file)

# update values in case file (tall) from scores file (wide)
for (i in (1:nrow(TA3_Case_Scores) ) ) {
  
  for (j in (1:ncol(TA3_Input) ) ) {
    
    if (TA3_Case_Scores$TraitDBName[i] == names(TA3_Input)[j]) {
      
      TA3_Case_Scores$TraitScore[i]  <- TA3_Input[1,j]
    }
    
  }
  
}


# Remove NAs in case tabular data (but there may be no NAs, so cant just use !which)
TA3_Case_Scores <- TA3_Case_Scores[which(complete.cases(TA3_Case_Scores$TraitScore)),]

# copy case scores to analysis data
AnalCase <- data.frame('parietal_depressionL' = 0); # create data frame();

for (i in (1:nrow(TA3_Case_Scores) ) ) {
  
  AnalCase[i] <- TA3_Case_Scores[i,'TraitScore']
  #names(AnalCase)[i] <- as.character(TA3_Case_Scores[i,'TraitDBName']);
  names(AnalCase)[i] <- TA3_Case_Scores[i,'TraitDBName'];
  #  NOTE: as.character() added because it failed after running successfully for many time. Why?
  #  BECAUSE they are factors now, need to convert.
  
}

### convert left and right Case values into unilateral
# get L and R fields
BiTraitList <- NULL

# AnalCase already no NAs (blanks)
for (i in (1:ncol(AnalCase))) {
  
   lside <- paste(substr(names(AnalCase[i]), 1, nchar(names(AnalCase[i]))-1 ), 'L', sep = '');  
   rside <- paste(substr(names(AnalCase[i]), 1, nchar(names(AnalCase[i]))-1 ), 'R', sep = '');  
 
                                     # OR     take care of DISH for now
  if  ( (lside %in% names(AnalCase)    ||  rside %in% names(AnalCase)) 
                                     # take care of DISH and max lengths (XL) for now
         & !(regexpr('DISH', lside) > 0) & !(regexpr('XL', lside) > 0)  ) {

         BiTraitList <- append(BiTraitList, names(AnalCase[i]) );   #paste(substr(lside,1, nchar(lside)-1), sep = '') )
    
         }
}

# check if there are indeed bilateral traits scored
if (length(BiTraitList) > 0) { 
# sweep through all Case fields, assign Left to neutral trait if not null; 
for (i in (1:length(BiTraitList))) {
  
  currfld <- BiTraitList[i];
  biside <- substr(currfld, 1, nchar(currfld)-1);

  AnalCase[biside] <- AnalCase[currfld];

  # set up lookuplist for later better formatting
  # TraitNames <-   append TraitNames
  
  }  #for

# remove left or right fields   
AnalCase <- AnalCase[,-which(names(AnalCase) %in% BiTraitList)]

}  # if bitraits there, not present id midline



##########################################################
### Convert raw data into binary-only values
AnalCaseB <- AnalCase;

# Go through all column names in AnalCase (non-blank ones would be better)
# see which ones have ordinal values in reference data

# set up list for converted columns
OrdinalCols <- ''
i <- 1;

for (col in 1:ncol(AnalCaseB))
{
  colname <- names(AnalCaseB)[col]
  collen <- length(table(TA3OUM[colname]))
    
  if (collen > 2)
  {
    # print(colname);
    OrdinalCols[i] <- colname;
    i <- i + 1;
    if (collen == 3)
    {
      AnalCaseB[paste(colname, '_0_12', sep = '')] <- NA
      
      AnalCaseB[paste(colname, '_01_2', sep = '')] <- NA
      
      
      AnalCaseB[which(AnalCaseB[colname] == 0), paste(colname, '_0_12', sep = '')] <-  0
      AnalCaseB[which(AnalCaseB[colname] == 0), paste(colname, '_01_2', sep = '')] <-  0
      
      AnalCaseB[which(AnalCaseB[colname] == 1), paste(colname, '_0_12', sep = '')] <-  0
      AnalCaseB[which(AnalCaseB[colname] == 1), paste(colname, '_01_2', sep = '')] <-  1
      
      AnalCaseB[which(AnalCaseB[colname] == 2), paste(colname, '_0_12', sep = '')] <-  1
      AnalCaseB[which(AnalCaseB[colname] == 2), paste(colname, '_01_2', sep = '')] <-  1
      
    } else
    {
      if (collen == 4)
      {
        AnalCaseB[paste(colname, '_0_123', sep = '')] <- NA
        
        AnalCaseB[paste(colname, '_01_23', sep = '')] <- NA
        
        AnalCaseB[paste(colname, '_012_3', sep = '')] <- NA
        
        
        AnalCaseB[which(AnalCaseB[colname] == 0), paste(colname, '_0_123', sep = '')] <- 0
        AnalCaseB[which(AnalCaseB[colname] == 0), paste(colname, '_01_23', sep = '')] <- 0
        AnalCaseB[which(AnalCaseB[colname] == 0), paste(colname, '_012_3', sep = '')] <- 0
        
        AnalCaseB[which(AnalCaseB[colname] == 1), paste(colname, '_0_123', sep = '')] <-  1
        AnalCaseB[which(AnalCaseB[colname] == 1), paste(colname, '_01_23', sep = '')] <-  0
        AnalCaseB[which(AnalCaseB[colname] == 1), paste(colname, '_012_3', sep = '')] <-  0
        
        AnalCaseB[which(AnalCaseB[colname] == 2), paste(colname, '_0_123', sep = '')] <-   1
        AnalCaseB[which(AnalCaseB[colname] == 2), paste(colname, '_01_23', sep = '')] <-   1
        AnalCaseB[which(AnalCaseB[colname] == 2), paste(colname, '_012_3', sep = '')] <-   0
        
        AnalCaseB[which(AnalCaseB[colname] == 3), paste(colname, '_0_123', sep = '')] <-  1
        AnalCaseB[which(AnalCaseB[colname] == 3), paste(colname, '_01_23', sep = '')] <-  1
        AnalCaseB[which(AnalCaseB[colname] == 3), paste(colname, '_012_3', sep = '')] <-  1
        
            #table(AnalCaseB[c(colname, paste(colname,'_0_123', sep= ''), paste(colname,'_01_23', sep= ''), paste(colname,'_012_3', sep= ''))])
            #table(AnalCaseB[colname])
      

      } # if
      
    } #else
    
  } #if collen > 2
  
} # for each col


# remove non-binary fields from newly binarized table, remove fields by name
if (OrdinalCols[1] > '') {
    AnalCaseB <- AnalCaseB[,-which(names(AnalCaseB) %in% OrdinalCols)]
}


# AnalCase and AnalCaseB are set up;
# SEE NOTE 4 in TA3_Application Notes-RCran-Electron-Windows.txt


####### Extract Data; choice is for binary or ordinal, still uncertain in many cases  ###########################
#### Extract binary data for now
# get field names not blank (no NAs)
NBF <- names(AnalCaseB)


AnalDat <- na.omit(TA3BUM[c('RandID','age',NBF)])

# pre-process data
# separate RandIDs
RandIDs <- AnalDat$RandID
# remove column from analyzed data
AnalDat <- AnalDat[,-which(colnames(AnalDat) == 'RandID')]

## GLM needs numerical values anyway- so convert all

# separate ages?
ages <- AnalDat["age"]
# remove ages column from analyzed data?
#AnalDat <- AnalDat[,-which(colnames(AnalDat) == 'age')]


# y must be numeric (not integer)
agesn <- lapply(ages, as.numeric)

# strip name from vector
agesnu <- unlist(agesn, use.names = F)


# the predictors need to be numeric
#AnalDat <- lapply(AnalDat, as.numeric)

# need to convert back into a dataframe:
AnalDat <- as.data.frame(AnalDat);

#str(AnalDat)
#'data.frame':	199 obs. of  89 variables:
cat(nrow(AnalDat), 'records in reference data.');

ages <- AnalDat["age"]
AnalDat <- AnalDat[,-which(colnames(AnalDat) == 'age')]

agesn <- lapply(ages, as.numeric)

agesnu <- unlist(agesn, use.names = F)

AnalDat <- lapply(AnalDat, as.numeric)

AnalDat <- as.data.frame(AnalDat)

####################### Preprocessing Done ###################


# TODO: figure out how to show progress bar and estimate time remaining
RGLM <- randomGLM(AnalDat, agesnu, classify = F, nBags = 100)



############# End of TA3 Analysis #############











############# Output to Application #############

# write results to a file for reading
v_line<-paste('                   v', v, sep='')
write(
  paste(
    '---------------------------------------------',
    '             TA3 Age Estimation',
    v_line,
    '---------------------------------------------',
    'Using traits:',
    '---------------------------------',
    sep='\n'
  ), 
  file=output_file,
  append=FALSE,
  sep=''
)