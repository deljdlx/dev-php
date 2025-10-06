
mkdir -p backups

# list docker volumes in light blue
echo -e "\e[94mAvailable Docker Volumes:\e[0m"


# store volumes in a variable
VOLUMES=$(docker volume ls --format "{{.Name}}")

# print volumes line by line in green
echo -e "\e[32m$VOLUMES\e[0m"



# ask for volume name
read -p "Enter the database volume name (e.g. stimdata-myurgo_db_data): " VOLUME_NAME
if [ -z "$VOLUME_NAME" ]; then

    echo -e "\e[31mNo volume name provided. Exiting.\e[0m"
    exit 1
fi

# check if volume exists
if ! echo "$VOLUMES" | grep -q "^${VOLUME_NAME}$"; then
    echo -e "\e[31mVolume '$VOLUME_NAME' does not exist. Exiting.\e[0m"
    exit 1
fi

# ask for confirmation
read -p "Are you sure you want to restore the database in volume '$VOLUME_NAME'? This will overwrite existing data. (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
  # echo message cancel in red
    echo -e "\e[31mRestore cancelled.\e[0m"
  exit 1
fi

# list files in backups folder in light blue
echo -e "\e[94mAvailable Backup Files:\e[0m"
ls -1 backups

# ask for backup file name
read -p "Enter the backup file name (e.g. stimdata-myurgo_db_data_2023-10-05_14-30-00.tar.gz): " BACKUP_FILE
if [ -z "$BACKUP_FILE" ]; then
    echo -e "\e[31mNo backup file name provided. Exiting.\e[0m"
    exit 1
fi

if [ ! -f "backups/$BACKUP_FILE" ]; then
    echo -e "\e[31mBackup file 'backups/$BACKUP_FILE' does not exist. Exiting.\e[0m"
    exit 1
fi

echo "Restoring volume '$VOLUME_NAME' from 'backups/$BACKUP_FILE'..."

docker run --rm -v ${VOLUME_NAME}:/data -v $(pwd)/backups:/backup alpine sh -c "cd /data && tar -xvzf /backup/$BACKUP_FILE"




# docker run --rm \
#   -v db:/data \
#   -v $(pwd):/backup \
#   alpine sh -c "cd /data && tar -xzf /backup/urgo_snapshot.tar.gz"