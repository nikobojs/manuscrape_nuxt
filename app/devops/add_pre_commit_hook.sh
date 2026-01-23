#!/usr/bin/env bash

HOOK_FILE=.git/hooks/pre-commit.sh

echo "#!/usr/bin/env bash" > $HOOK_FILE
echo "npx vue-tsc" >> $HOOK_FILE
chmod +x $HOOK_FILE
echo 'Pre-commit git hook added.'