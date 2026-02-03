#!/bin/bash

# ====================================================================
# 📦 SCRIPT COMPRESSION RSU MOBILE SURVEYOR
# ====================================================================
# Objectif: Créer archive .tar.gz ou .zip du projet
# Exclusions: node_modules, .expo, build, cache
# ====================================================================

# Couleurs pour logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================================${NC}"
echo -e "${BLUE}📦 RSU MOBILE SURVEYOR - COMPRESSION PROJET${NC}"
echo -e "${BLUE}=====================================================================${NC}\n"

# ====================================================================
# CONFIGURATION
# ====================================================================

PROJECT_NAME="rsu-mobile-surveyor"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_NAME="${PROJECT_NAME}_${TIMESTAMP}"
OUTPUT_DIR="$(pwd)/compressed"

# Créer dossier output
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}📂 Dossier source:${NC} $(pwd)"
echo -e "${YELLOW}📦 Archive de sortie:${NC} ${OUTPUT_DIR}/${OUTPUT_NAME}.tar.gz\n"

# ====================================================================
# EXCLUSIONS
# ====================================================================

EXCLUSIONS=(
    # Dependencies
    "node_modules"
    "node_modules/**"
    
    # Expo
    ".expo"
    ".expo/**"
    ".expo-shared"
    ".expo-shared/**"
    
    # Build artifacts
    "android/app/build"
    "android/.gradle"
    "ios/build"
    "ios/Pods"
    "build"
    "dist"
    
    # Cache
    ".cache"
    ".webpack"
    "tmp"
    "temp"
    
    # Logs
    "*.log"
    "npm-debug.log*"
    "yarn-debug.log*"
    "yarn-error.log*"
    
    # Environment
    ".env.local"
    ".env.*.local"
    
    # OS
    ".DS_Store"
    "Thumbs.db"
    
    # IDE
    ".vscode"
    ".idea"
    "*.swp"
    "*.swo"
    "*~"
    
    # Git
    ".git"
    ".gitignore"
)

# ====================================================================
# OPTION 1: TAR.GZ (Recommandé - Meilleure compression)
# ====================================================================

echo -e "${GREEN}🗜️  Création archive TAR.GZ...${NC}"

# Construire la commande tar avec exclusions
TAR_CMD="tar -czf \"${OUTPUT_DIR}/${OUTPUT_NAME}.tar.gz\""

for exclusion in "${EXCLUSIONS[@]}"; do
    TAR_CMD+=" --exclude=\"${exclusion}\""
done

TAR_CMD+=" ."

# Exécuter
eval $TAR_CMD

if [ $? -eq 0 ]; then
    SIZE_TAR=$(du -h "${OUTPUT_DIR}/${OUTPUT_NAME}.tar.gz" | cut -f1)
    echo -e "${GREEN}✅ Archive TAR.GZ créée: ${SIZE_TAR}${NC}"
    echo -e "${GREEN}   Fichier: ${OUTPUT_DIR}/${OUTPUT_NAME}.tar.gz${NC}\n"
else
    echo -e "${RED}❌ Erreur création TAR.GZ${NC}\n"
fi

# ====================================================================
# OPTION 2: ZIP (Compatible Windows)
# ====================================================================

echo -e "${GREEN}📦 Création archive ZIP...${NC}"

# Construire la commande zip avec exclusions
ZIP_CMD="zip -r \"${OUTPUT_DIR}/${OUTPUT_NAME}.zip\" ."

for exclusion in "${EXCLUSIONS[@]}"; do
    ZIP_CMD+=" -x \"${exclusion}\""
done

# Exécuter
eval $ZIP_CMD > /dev/null 2>&1

if [ $? -eq 0 ]; then
    SIZE_ZIP=$(du -h "${OUTPUT_DIR}/${OUTPUT_NAME}.zip" | cut -f1)
    echo -e "${GREEN}✅ Archive ZIP créée: ${SIZE_ZIP}${NC}"
    echo -e "${GREEN}   Fichier: ${OUTPUT_DIR}/${OUTPUT_NAME}.zip${NC}\n"
else
    echo -e "${RED}❌ Erreur création ZIP${NC}\n"
fi

# ====================================================================
# RÉSUMÉ
# ====================================================================

echo -e "${BLUE}=====================================================================${NC}"
echo -e "${BLUE}📊 RÉSUMÉ COMPRESSION${NC}"
echo -e "${BLUE}=====================================================================${NC}\n"

if [ -f "${OUTPUT_DIR}/${OUTPUT_NAME}.tar.gz" ]; then
    echo -e "${GREEN}✅ TAR.GZ:${NC} ${OUTPUT_DIR}/${OUTPUT_NAME}.tar.gz"
    ls -lh "${OUTPUT_DIR}/${OUTPUT_NAME}.tar.gz" | awk '{print "   Taille: " $5}'
fi

if [ -f "${OUTPUT_DIR}/${OUTPUT_NAME}.zip" ]; then
    echo -e "${GREEN}✅ ZIP:${NC}    ${OUTPUT_DIR}/${OUTPUT_NAME}.zip"
    ls -lh "${OUTPUT_DIR}/${OUTPUT_NAME}.zip" | awk '{print "   Taille: " $5}'
fi

echo -e "\n${YELLOW}📋 Fichiers exclus:${NC}"
echo -e "   - node_modules/"
echo -e "   - .expo/"
echo -e "   - build/"
echo -e "   - cache & logs"
echo -e "   - .git/"

echo -e "\n${GREEN}✅ Compression terminée !${NC}\n"

# ====================================================================
# INSTRUCTIONS EXTRACTION
# ====================================================================

cat << 'EOF'

📖 INSTRUCTIONS EXTRACTION
====================================================================

Pour TAR.GZ:
  tar -xzf rsu-mobile-surveyor_XXXXXXXX_XXXXXX.tar.gz

Pour ZIP:
  unzip rsu-mobile-surveyor_XXXXXXXX_XXXXXX.zip

Après extraction:
  cd rsu-mobile-surveyor/
  npm install          # ou yarn install
  expo start

====================================================================
EOF