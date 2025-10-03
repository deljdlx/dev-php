# Copilot Instructions (Repo)


## Contexte
- Le code s'execute dans un environnement dockerisé dans un container nommé web
- Le doc root du serveur web est /var/www/html/laravel/public
- pour lancer phpstan, il faut le lancer dans le container web, dans le dossier /var/www/html/laravel

## Code style
- Toujours utiliser le code style PSR-12
- Toujours utiliser les namespaces
- Privilégier les classes aux fonctions
- Documenter le code avec des docblocks pour que des développeurs juniors puissent comprendre
- Toujours typer les arguments et les retours de fonctions/méthodes

## Consignes PHP
- Toujours utiliser les bonnes pratiques de Laravel 12 et PHP 8.3
- Toujours tester avec phpstan niveau 10
