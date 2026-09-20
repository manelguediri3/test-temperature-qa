# API Tests — Temperature Sensor (Karate)

Tests d'API pour `POST /api/temperature/capture` et `PUT /api/thresholds`.

## Pré-requis

- Java 17+
- Maven 3.8+
- L'app cible lancée en mode déterministe :

```bash
FIXED_TEMPERATURE=25.5 docker compose up --build
```

## Lancer les tests (une seule commande)

```bash
mvn test
```

Par défaut, les tests visent `http://localhost:3000`. Pour cibler une autre URL :

```bash
mvn test -DbaseUrl=http://localhost:4000
```

## Structure

```
src/test/java/karate/TestRunner.java        # runner JUnit5
src/test/resources/karate-config.js         # config globale (baseUrl)
src/test/resources/karate/capture/          # tests POST /capture
src/test/resources/karate/thresholds/       # tests GET/PUT /thresholds
```

## ⚠️ À adapter avant exécution réelle

Ce projet a été écrit sans accès direct au code source de l'app (voir contexte).
Les noms de champs JSON (`temperature`, `status`, `cold`, `hot`...) et les codes
de statut HTTP attendus en cas d'erreur (`400` supposé) sont des **hypothèses**
à valider contre l'API réelle avant de considérer ces tests comme définitifs.

## Rapports

Karate génère un rapport HTML dans `target/karate-reports/karate-summary.html`
après exécution.
