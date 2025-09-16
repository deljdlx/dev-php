#!/bin/bash
set -e

cp ~/.ssh/id_rsa ./docker/id_rsa
cp ~/.bashrc ./docker/.bashrc

docker compose build && docker compose up
