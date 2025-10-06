FROM composer:2 AS composer_stage
FROM debian:bullseye

# Build args to remap www-data user to host UID/GID for proper file ownership on bind mounts
ARG HOST_UID=1000
ARG HOST_GID=1000

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer \
    PATH="/tmp/composer/vendor/bin:${PATH}"

# Add Sury repo and install Apache + BOTH PHP 7.4 & 8.4 (FPM) with needed extensions
RUN apt-get update && apt-get install -y \
    ca-certificates apt-transport-https curl gnupg lsb-release \
    && apt-get install -y openssh-client \
    && apt-get install -y vim \
    && curl -fsSL https://packages.sury.org/php/apt.gpg | gpg --dearmor -o /usr/share/keyrings/sury.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/sury.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/sury.list \
    && apt-get update

RUN apt-get update && apt-get install -y --no-install-recommends \
    apache2 \
    sqlite3 \
    php7.4-cli php7.4-common php7.4-fpm \
    php7.4-mysql php7.4-curl php7.4-xml php7.4-mbstring \
    php7.4-zip php7.4-gd php7.4-bcmath php7.4-imagick php7.4-xdebug php7.4-sqlite3 \
    php8.3-cli php8.3-common php8.3-fpm \
    php8.3-mysql php8.3-curl php8.3-xml php8.3-mbstring \
    php8.3-zip php8.3-gd php8.3-bcmath php8.3-imagick php8.3-xdebug php8.3-intl php8.3-sqlite3 \
    php8.4-cli php8.4-common php8.4-fpm \
    php8.4-mysql php8.4-curl php8.4-xml php8.4-mbstring \
    php8.4-zip php8.4-gd php8.4-bcmath php8.4-imagick php8.4-xdebug php8.4-intl php8.4-sqlite3 \
 && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --set php /usr/bin/php8.4
RUN a2enmod proxy proxy_fcgi setenvif rewrite headers expires

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    mariadb-client \
    vim \
    tree \
    wget \
    curl \
    jq \
    sudo \
 && rm -rf /var/lib/apt/lists/*

# ===================================================
# Network & debugging tools (essentials + QoL)
# ===================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    iproute2 \
    net-tools \
    iputils-ping \
    dnsutils \
    traceroute \
    mtr-tiny \
    netcat-openbsd \
    tcpdump \
    lsof \
    procps \
    psmisc \
    rsync \
    openssl \
    less \
    htop \
    bash-completion \
    ncdu \
    socat \
    httpie \
    inotify-tools \
 && rm -rf /var/lib/apt/lists/*

# ===================================================
# Donner les droits root à www-data (via sudo NOPASSWD)
# ===================================================
RUN echo "www-data ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/www-data \
 && chmod 0440 /etc/sudoers.d/www-data \
 && usermod -s /bin/bash www-data

# Provide the same bash profile to root
COPY .bashrc /root/.bashrc

# Switch to www-data automatically for interactive root shells (docker exec -it)
RUN cat >> /root/.bashrc <<'EOF'
# Auto-switch to www-data for interactive shells
if [ "$EUID" -eq 0 ] && [[ $- == *i* ]] && [ -t 0 ]; then
    exec sudo -u www-data -H bash -l
fi
EOF

# ===================================================
# Elastic APM PHP agent
# ===================================================
ARG ELASTIC_APM_PHP_VERSION=1.15.1
RUN apt-get update && apt-get install -y curl libcurl4 ca-certificates \
 && curl -fsSL -o /tmp/apm-agent-php.deb \
    https://github.com/elastic/apm-agent-php/releases/download/v1.15.1/apm-agent-php_1.15.1_amd64.deb \
 && dpkg -i /tmp/apm-agent-php.deb || apt-get -f install -y \
 && rm /tmp/apm-agent-php.deb


RUN rm -rf /var/lib/apt/lists/*

# ===================================================
# Install npm and n
# ===================================================
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && npm install -g n \
 && n stable \
 && apt-get purge -y nodejs npm \
 && ln -sf /usr/local/bin/node /usr/bin/node \
 && ln -sf /usr/local/bin/npm /usr/bin/npm \
 && ln -sf /usr/local/bin/npx /usr/bin/npx

# ===================================================
# Dependencies for wkhtmltopdf
# ===================================================
RUN apt-get install -y libxrender1 libfontconfig1 libx11-dev libxext6

# ===================================================
# Remap www-data UID/GID to host values (improves permissions on mounted volume)
# ===================================================
RUN groupmod -o -g ${HOST_GID} www-data \
    && usermod -o -u ${HOST_UID} www-data \
    && install -d -m 0775 -o www-data -g www-data /var/www/html

# ===================================================
# Install Composer by copying from official image
# ===================================================
COPY --from=composer_stage /usr/bin/composer /usr/bin/composer

# Developer tooling via PHARs is installed below; skipping composer-global installs to keep image lean.

# ===================================================
# Install tools via Composer projects in /opt/tools (accessible to all users)
# ===================================================
RUN set -eux; \
    mkdir -p /opt/tools/phpstan /opt/tools/rector /opt/tools/phpcs; \
    cd /opt/tools/phpstan; \
    COMPOSER_HOME=/root/.composer composer require --no-interaction --prefer-dist phpstan/phpstan; \
    ln -sf /opt/tools/phpstan/vendor/bin/phpstan /usr/local/bin/phpstan; \
    cd /opt/tools/rector; \
    COMPOSER_HOME=/root/.composer composer require --no-interaction --prefer-dist rector/rector; \
    ln -sf /opt/tools/rector/vendor/bin/rector /usr/local/bin/rector; \
    cd /opt/tools/phpcs; \
    COMPOSER_HOME=/root/.composer composer require --no-interaction --prefer-dist squizlabs/php_codesniffer; \
    ln -sf /opt/tools/phpcs/vendor/bin/phpcs /usr/local/bin/phpcs; \
    ln -sf /opt/tools/phpcs/vendor/bin/phpcbf /usr/local/bin/phpcbf; \
    mkdir -p /opt/tools/phpunit /opt/tools/phpmetrics; \
    cd /opt/tools/phpunit; \
    COMPOSER_HOME=/root/.composer composer require --no-interaction --prefer-dist phpunit/phpunit; \
    ln -sf /opt/tools/phpunit/vendor/bin/phpunit /usr/local/bin/phpunit; \
    cd /opt/tools/phpmetrics; \
    COMPOSER_HOME=/root/.composer composer require --no-interaction --prefer-dist phpmetrics/phpmetrics; \
    ln -sf /opt/tools/phpmetrics/vendor/bin/phpmetrics /usr/local/bin/phpmetrics


 # ===================================================
# PHP Configuration
# ===================================================
COPY php/php-dev.ini /etc/php/8.4/fpm/conf.d/99-dev.ini
COPY php/xdebug.ini /etc/php/8.4/fpm/conf.d/99-xdebug.ini.disabled
# COPY php/php-dev.ini /etc/php/8.4/cli/conf.d/99-dev.ini

COPY php/php-dev.ini /etc/php/8.3/fpm/conf.d/99-dev.ini
COPY php/xdebug.ini /etc/php/8.3/fpm/conf.d/99-xdebug.ini.disabled
# COPY php/php-dev.ini /etc/php/8.3/cli/conf.d/99-dev.ini

COPY php/php-dev.ini /etc/php/7.4/fpm/conf.d/99-dev.ini
COPY php/xdebug.ini /etc/php/7.4/fpm/conf.d/99-xdebug.ini.disabled
COPY php/php-dev.ini /etc/php/7.4/cli/conf.d/99-dev.ini

COPY php/opcache.ini /etc/php/8.4/fpm/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/8.4/cli/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/8.3/fpm/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/8.3/cli/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/7.4/fpm/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/7.4/cli/conf.d/99-opcache.ini

COPY php/elastic_apm.ini /etc/php/8.4/fpm/conf.d/98-elastic-apm.ini
# COPY php/elastic_apm.ini /etc/php/8.4/cli/conf.d/98-elastic-apm.ini
COPY php/elastic_apm.ini /etc/php/8.3/fpm/conf.d/98-elastic-apm.ini
# COPY php/elastic_apm.ini /etc/php/8.3/cli/conf.d/98-elastic-apm.ini
COPY php/elastic_apm.ini /etc/php/7.4/fpm/conf.d/98-elastic-apm.ini
# COPY php/elastic_apm.ini /etc/php/7.4/cli/conf.d/98-elastic-apm.ini


# ===================================================
# Apache Configuration
# ===================================================
RUN a2dissite 000-default.conf && a2dismod php7.* php8.* || true

# handlind now by docker-compose volume mount
# COPY apache/web.conf /etc/apache2/sites-available/web.conf
# RUN a2ensite web.conf

# COPY apache/monitor.conf /etc/apache2/sites-available/monitor.conf
# RUN a2ensite monitor.conf


RUN git config --global --add safe.directory /var/www/html

# ===================================================
# USER PROFILE
# ===================================================

# set user as www-data
USER www-data

# Create and configure SSH directory for www-data (do privileged ops as root)
USER root
# RUN install -d -m 700 -o www-data -g www-data /var/www/.ssh
# COPY --chown=www-data:www-data id_rsa /var/www/.ssh/id_rsa
# RUN chmod 600 /var/www/.ssh/id_rsa \
#  && printf "Host *\n    IdentityFile /var/www/.ssh/id_rsa\n    StrictHostKeyChecking no\n" > /var/www/.ssh/config \
#  && chmod 600 /var/www/.ssh/config \
#  && chown www-data:www-data /var/www/.ssh/config

# Copy developer bash profile for www-data and ensure it's loaded for login shells
COPY --chown=www-data:www-data .bashrc /var/www/.bashrc
RUN printf '# ~/.profile\nif [ -f "$HOME/.bashrc" ]; then\n  . "$HOME/.bashrc"\nfi\n' > /var/www/.profile \
 && chown www-data:www-data /var/www/.profile \
 && chmod 0644 /var/www/.profile

RUN mkdir -p /var/www/.cache/composer \
    && chown -R www-data:www-data /var/www/.cache

WORKDIR /var/www/html
EXPOSE 80

# Start script (launch both php-fpm daemons then Apache)
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Xdebug toggle helper
COPY xdebug-on.sh /usr/local/bin/xdebug-on
RUN chmod +x /usr/local/bin/xdebug-on \
 && ln -sf /usr/local/bin/xdebug-on /usr/local/bin/xdebug-on.sh

COPY xdebug-off.sh /usr/local/bin/xdebug-off
RUN chmod +x /usr/local/bin/xdebug-off \
 && ln -sf /usr/local/bin/xdebug-off /usr/local/bin/xdebug-off.sh

USER root

# copy xdebug toggle scripts
COPY xdebug-on.sh /usr/local/bin/xdebug-on.sh
COPY xdebug-off.sh /usr/local/bin/xdebug-off.sh
RUN chmod +x /usr/local/bin/xdebug-on.sh /usr/local/bin/xdebug-off.sh


CMD ["/usr/local/bin/start.sh"]
