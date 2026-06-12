NODE_ENV=production
GIT_AUTHOR_NAME=Thach
GIT_AUTHOR_EMAIL=thach11149@gmail.com
GIT_COMMITTER_NAME=Thach
GIT_COMMITTER_EMAIL=thach11149@gmail.com




---
#!/bin/bash
# Cài Node dependencies
npm install

# Cấu hình git
git config --global user.name "Thach"
git config --global user.email "thach11149@gmail.com"
git config --global --add safe.directory /home/user/repo
