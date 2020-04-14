#rm(list = ls())


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


############# Development Options #############
development <- FALSE
if (development) { scripts_dir <- file.path("c:", "rthings") }
if (development) { temp_dir <- file.path("c:", "rthings") }




############# Creating Local Variables for Saving/Usage #############

rda_fileB <- file.path(scripts_dir, "TA3BUM.Rda")
rda_fileO <- file.path(scripts_dir, "TA3OUM.Rda")
case_tall_file <- file.path(scripts_dir, "TA3_Case_Scores.Rda")

input_file<-file.path(temp_dir, "TA3_Input.csv")

output_file<-file.path(temp_dir, "output.txt")
output_image1<-file.path(temp_dir, "output1.png")
#output_image2<-file.path(temp_dir, "output2.png")



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
#sessionInfo()
#.libPaths()
#getwd()




############# TA3 Analysis (Stephen D. Ousley) #############


   
#  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ #
##################  copy below to %APPDATA% ###############

###############################################################################
######################### Start of R Processing ###############################
#
#         0.45 added binary vs. raw data 
#         0.44 - fixed plots and sped up calculations
#         0.43 - fixed development colons; smarter output; 
#         0.42 - fixed x y
#
###############################################################################
###############################################################################

# NEW / MODIFIED BELOW
# R code version
      TA3RCodeVersion <- '0.45.0';

# software version.  currently or soon 0.70 
      #TA3ProgramVersion <- '0.70';


# use binary or raw scores?
UseBinaryScores <- TRUE;

# set some vars to nothing so errors do not get repeated
PredAge <- 0;
AnalDat <- 0;
TA3_Case_Scores <- 0;


# read in reference data files if not already present
if (!(exists('TA3BUM'))) {TA3BUM<-readRDS(rda_fileB)}
if (!(exists('TA3OUM'))) {TA3OUM<-readRDS(rda_fileO)}
if (!(exists('TA3_Case_Scores'))) {TA3_Case_Scores<-readRDS(case_tall_file)}



# convert factors to character format in case scores 
TA3_Case_Scores$TraitDBName <- as.character(TA3_Case_Scores$TraitDBName)
TA3_Case_Scores$TraitText <- as.character(TA3_Case_Scores$TraitText)

# process trait scores file, has ALL scores including NAs
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

if (UseBinaryScores) # binary
{ 
  NBF <- names(AnalCaseB)   
  #read from binary file 
  AnalDat <- na.omit(TA3BUM[c('RandID','age',NBF)])

  
} else   # ordinal
{
  NBF <- names(AnalCase)   
  #read from ordinal file 
  AnalDat <- na.omit(TA3OUM[c('RandID','age',NBF)])
  
  
}


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

####### Start of R Statistical Analysis (example: randomGLM) ############

#require(randomGLM)
#require(msir)
#require(glmnet)
# parallel
#nThr <- detectCores()


# TODO: can we show progress bar and estimate time remaining?
# nFeaturesinBag 
# nBags usually 100, but 20 or 30 should be just fine

RGLM <- randomGLM(AnalDat, agesnu, classify = F, nBags = 100) #  , keepModels = T) (no need to keep models)
#RGLM <- randomGLM(AnalDat, agesnu, classify = F, nBags = 100, keepModels = T, maxInteractionOrder = 2, nFeaturesInBag = 100)

#, nThreads=nThr,
#replace = TRUE,
#sampleWeight=NULL,
# nObsInBag = if (replace) nrow(AnalDat) else as.integer(0.632 * nrow(AnalDat)),
#nFeaturesInBag = ceiling(ifelse(ncol(AnalDat)<=10, ncol(AnalDat),
#ifelse(ncol(AnalDat)<=300, (1.0276-0.00276*ncol(AnalDat))*ncol(AnalDat), ncol(AnalDat)/5))),
#minInBagObs = min( max( nrow(AnalDat)/2, 5), 2*nrow(AnalDat)/3))


#GLMN <- glmnet(AnalDat, agesnu, classify = F, nBags = 100, minInBagObs = 20)

# Calculates and plots a 1.96 * SD prediction band, that is,
# a 95% prediction band
DFP <- cbind(RGLM$predictedOOB, agesnu)
DFP <- as.data.frame(DFP)
names(DFP) <- c('PredAge','Age')

# larger span now makes MUCH better (default = 0.67, Weisberg (2005):112 )
lol <- loess.sd(DFP, nsigma = 1.96, span = 1)  

# predicted age
if (UseBinaryScores)
  { PredAge <- predict(RGLM,AnalCaseB, type='response')

  }  else
  { PredAge <- predict(RGLM,AnalCase, type='response')
}


# produce basic output: MSE
MeanStdError <- sqrt(mean((DFP$PredAge - DFP$Age)^2))


# get prediction intervals for this individual 
ADindex <- which.min(abs(lol$x  - PredAge))
LB <- lol$lower[ADindex]
UB <- lol$upper[ADindex]


# Save plot to file (enhanced plot)  IF APP RUNNING
if (!development) { png(filename=output_image1, width = 1400, height = 1200, res = 300, pointsize = 7)   }

# plot OOB estimated age and 95% CI for OOB individuals
plot(DFP$PredAge, DFP$Age, ylim = c(15,110), xlim = c(15,110), , pch = 17, cex = 0.7, col = 'blue',
     xlab = 'Predicted Age', ylab = 'Age', main = 'TA3 Age Estimation (Random GLM) 95% OOB PI')

lines(lol$x, lol$y, lw = 3, lty=3, col= 'purple')
lines(lol$x, lol$upper, lty=2, lw = 1, col= 'purple')
lines(lol$x, lol$lower, lty=2, lw = 1, col= 'purple')
# line of perfect agreement
abline(0,1, lw = 1)

if (!development) {  dev.off()  }


#print(paste('The estimated age at death is', round(PredAge), 'years and the Standard Error is', round(MeanStdError,1),'\n', 'using a sample size of',nrow(AnalDat)))


if (UseBinaryScores) {scorestr <- 'Using binary scores from'} else {scorestr <- 'Using raw scores from'};


############# End of TA3 Analysis #############







############# Save output to Application #############


# write results to a file for reading
progVersion<-paste('  Program Version ', TA3ProgramVersion, sep='')
codeVersion<-paste('  R Code Version ', TA3RCodeVersion, sep='')
write(
  paste(
    '---------------------------------------------',
    'TA3 Age Estimation',
    progVersion,
    codeVersion,
    '---------------------------------------------',
    ' ',
    sep='\n'
  ), 
  file=output_file,
  append=FALSE,
  sep=''
)


write(paste(
    scorestr,
    '---------------------------------',
    sep='\n'),
    file=output_file,
    append=TRUE,
    sep=''
)

for (trait in TA3_Case_Scores$TraitText) {
  write(paste('  ', trait, sep=''), file=output_file, append=TRUE, sep='\n')
}

write(
  paste(
    ' ',
    paste('Sample size = ', round(nrow(AnalDat)), sep=''),
    ' ',
    'Random GLM Analysis',
    paste('  Estimated age at death = ', round(PredAge,1), ' years', sep=''),
    paste('  Estimated lower 95% bound = ', round(LB,1), ' years', sep=''),
    paste('  Estimated upper 95% bound = ', round(UB,1), ' years', sep=''),
    paste('  '),
    paste('  Standard Error = ', round(MeanStdError,1), sep=''),
    paste('  Corr(Age and Pred Age) = ', round(cor(DFP$Age,DFP$PredAge),3), sep=''),
    sep='\n'
  ),
  file=output_file,
  append=TRUE,
  sep=''
)



if (development) {  read.delim(file.path(temp_dir, 'output.txt'))  }