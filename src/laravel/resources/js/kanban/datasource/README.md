# Datasource (démo) — Guide rapide

Ce dossier fournit une implémentation “démo” du DataSource attendu par `KanbanState`.

## Contrat DataSource (ce que `KanbanState` appelle)

- getBoardMeta(): Promise<BoardMeta>
- setBoardMeta(board): Promise<void>
- getColumnsMeta(): Promise<Array<{ id, name }>>
- getTicketsByColumnId(columnId): Promise<Array<TicketDTO>>
- getColumns(): Promise<Array<ColumnModel>>
- save(columns): Promise<void>

BoardMeta attendu (normalisé):
- taxonomies: Record<key, { label: string, options: Array<{key,label}> }>
- authors?: Array<{ id: string, name: string, avatar?: string }>
- name?: string, backgroundImage?: string

> Remarque: getColumns() retourne aujourd’hui des modèles `Column` (héritage historique),
> tandis que les autres méthodes renvoient des DTO bruts. C’est OK pour la démo,
> mais si vous créez une impl API, restez cohérent (soit DTO partout, soit mapping côté State).

## Flux interne (démo)

KanbanApplication → DemoDataSourceAdapter → DemoRepository → (SnapshotStore, SeedProvider, BoardMetaNormalizer, Serializers)

- DemoDataSourceAdapter: façade utilisée par l’app (API stable)
- DemoRepository: lit/écrit un snapshot JSON et gère seed/normalisation
- SnapshotStore: lecture/écriture JSON via `storage`
- SeedProvider: transforme une factory/config en snapshot initial
- BoardMetaNormalizer: remet `board` au bon format (taxonomies, auteurs)
- Serializers: conversions utilitaires (ex: Column ⟷ DTO)

## Changer de source (ex: API HTTP)

1) Créez `ApiDataSource.js` dans ce dossier, qui expose le même contrat que ci-dessus.
2) Dans `KanbanApplication`, remplacez l’instanciation de `DemoDataSourceAdapter` par votre `ApiDataSource`.
3) Gardez une seule convention d’échange (DTO ou modèles) pour rester simple.

## Nettoyage et simplification

Pour un onboarding débutant, vous pouvez:
- Garder seulement `DemoDataSourceAdapter`, `DemoRepository`, `SnapshotStore`.
- Inliner la normalisation et le seed dans le repository.
- Documenter clairement les formats via JSDoc.

Ce README est volontairement court pour faciliter la prise en main.
