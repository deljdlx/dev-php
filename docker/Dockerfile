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

RUN apt-get install -y --no-install-recommends \
    apache2 \
    php7.4-cli php7.4-common php7.4-fpm \
    php7.4-mysql php7.4-curl php7.4-xml php7.4-mbstring \
    php7.4-zip php7.4-gd php7.4-bcmath php7.4-imagick php7.4-xdebug \
    php8.4-cli php8.4-common php8.4-fpm \
    php8.4-mysql php8.4-curl php8.4-xml php8.4-mbstring \
    php8.4-zip php8.4-gd php8.4-bcmath php8.4-imagick php8.4-xdebug php8.4-intl

RUN update-alternatives --set php /usr/bin/php8.4
RUN a2enmod proxy proxy_fcgi setenvif rewrite headers expires

RUN apt-get install -y \
    git \
    unzip \
    zip \
    mariadb-client \
    vim \
    tree \
    wget \
    curl \
    jq

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
# Remap www-data UID/GID to host values (improves permissions on mounted volume)
# ===================================================
RUN groupmod -o -g ${HOST_GID} www-data \
 && usermod -o -u ${HOST_UID} www-data \
 && install -d -m 0775 -o www-data -g www-data /var/www/html


# ===================================================
# Install Composer by copying from official image
# ===================================================
COPY --from=composer_stage /usr/bin/composer /usr/bin/composer

# ===================================================
# Developer tooling: install PHP_CodeSniffer globally
# - Install into /root/.composer so it's not masked by the runtime volume mounted on /tmp/composer
# - Expose phpcs/phpcbf via /usr/local/bin
# ===================================================
RUN COMPOSER_HOME=/root/.composer composer global require --no-interaction --prefer-dist squizlabs/php_codesniffer \
 && ln -s /root/.composer/vendor/bin/phpcs /usr/local/bin/phpcs \
 && ln -s /root/.composer/vendor/bin/phpcbf /usr/local/bin/phpcbf

# ===================================================
# Install phpstan globally
# ===================================================
RUN COMPOSER_HOME=/root/.composer composer global require --no-interaction --prefer-dist phpstan/phpstan \
 && ln -s /root/.composer/vendor/bin/phpstan /usr/local/bin/phpstan

# ===================================================
# Install rector globally
# ===================================================
RUN COMPOSER_HOME=/root/.composer composer global require --no-interaction --prefer-dist rector/rector \
 && ln -s /root/.composer/vendor/bin/rector /usr/local/bin/rector

 COPY php/rector/php5.4.php /root/.composer/vendor/rector/config/php5.4.php
 COPY php/rector/php7.3.php /root/.composer/vendor/rector/config/php7.3.php

 # ===================================================
# PHP Configuration
# ===================================================
COPY php/php-dev.ini /etc/php/8.4/fpm/conf.d/99-dev.ini
COPY php/php-dev.ini /etc/php/8.4/cli/conf.d/99-dev.ini
COPY php/xdebug.ini /etc/php/8.4/fpm/conf.d/50-xdebug.ini

COPY php/php-dev.ini /etc/php/7.4/fpm/conf.d/99-dev.ini
COPY php/php-dev.ini /etc/php/7.4/cli/conf.d/99-dev.ini
COPY php/xdebug.ini /etc/php/7.4/fpm/conf.d/50-xdebug.ini

COPY php/opcache.ini /etc/php/8.4/fpm/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/8.4/cli/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/7.4/fpm/conf.d/99-opcache.ini
COPY php/opcache.ini /etc/php/7.4/cli/conf.d/99-opcache.ini

COPY php/elastic_apm.ini /etc/php/8.4/fpm/conf.d/98-elastic-apm.ini
COPY php/elastic_apm.ini /etc/php/8.4/cli/conf.d/98-elastic-apm.ini
COPY php/elastic_apm.ini /etc/php/7.4/fpm/conf.d/98-elastic-apm.ini
COPY php/elastic_apm.ini /etc/php/7.4/cli/conf.d/98-elastic-apm.ini


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

COPY .bashrc /root/.bashrc
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh
COPY id_rsa /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa \
 && echo "    IdentityFile /root/.ssh/id_rsa" >> /etc/ssh/ssh_config \
 && echo "    StrictHostKeyChecking no" >> /etc/ssh/ssh_config


WORKDIR /var/www/html
EXPOSE 80

# Start script (launch both php-fpm daemons then Apache)
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh
CMD ["/usr/local/bin/start.sh"]
