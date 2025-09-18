#!/bin/bash
set -e

# check if ssh keys exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "SSH private key not found at ~/.ssh/id_rsa. Please create one and add it to your SSH agent."

    echo "To create a new SSH key, use the following command:"
    echo 'ssh-keygen -t rsa -b 4096 -C "your_email"'

    exit 1
fi

cp ~/.ssh/id_rsa ./docker/id_rsa
cp ~/.bashrc ./docker/.bashrc

docker compose build && docker compose up
