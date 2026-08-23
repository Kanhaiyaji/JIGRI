#!/usr/bin/env bash
set -e

echo "🚀 Building JIGRI Docker Runner Images..."

docker build -t jigri-runner-python:latest docker/runners/python
docker build -t jigri-runner-node:latest docker/runners/node
docker build -t jigri-runner-cpp:latest docker/runners/cpp
docker build -t jigri-runner-java:latest docker/runners/java
docker build -t jigri-runner-go:latest docker/runners/go
docker build -t jigri-runner-ruby:latest docker/runners/ruby
docker build -t jigri-runner-php:latest docker/runners/php
docker build -t jigri-runner-rust:latest docker/runners/rust
docker build -t jigri-notebook-python:latest docker/notebook-python

echo "🎉 All runner images built successfully!"
