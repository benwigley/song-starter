# This is the script that gets run with every jenkins deployment
# View jenkings at: http://toastrooster.com:8080/


# Deploy project
# --------------

# Check if tmp dir is clean (doesn't exist)
if [ -d /var/www/song-starter-tmp ]
then
  echo "LOG: Cleaning 'tmp' directory";
  rm -rf /var/www/song-starter-tmp
fi

# Check if old dir is clean (doesn't exist)
if [ -d /var/www/song-starter-old ]
then
  echo "LOG: Cleaning 'old' directory";
  rm -rf /var/www/song-starter-old
fi

# Copy project to a tmp location
echo "LOG: Copying project to a tmp location";
cp -r . /var/www/song-starter-tmp

# Move old project away
echo "LOG: Moving old project away";
if [ -d /var/www/song-starter ]
then
  mv /var/www/song-starter /var/www/song-starter-old
fi

# Switch names, instant changeover
echo "LOG: Switch folder names for an instant changeover";
mv /var/www/song-starter-tmp /var/www/song-starter

# Remove old project
echo "LOG: Removing old project";
rm -rf /var/www/song-starter-old
