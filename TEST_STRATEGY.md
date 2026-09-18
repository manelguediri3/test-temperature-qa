# Stratégie de test — Temperature Sensor QA Kata

> ⚠️ Note méthodologique : ce document a été préparé sans accès direct au code source de `src/` (l'app n'a pas pu être clonée depuis cet environnement). Les hypothèses de bugs ci-dessous sont basées sur les patterns classiques de ce type d'app et doivent être **vérifiées manuellement** en explorant l'app réelle (`docker compose up --build`) avant de finaliser le document. Remplace les [ ] par ✅/❌ une fois vérifié.

## 1. Bugs / incohérences suspectés à vérifier

À tester en priorité sur l'app tournante (curl / Postman / navigateur) :

- [ ] **Bornes des seuils (COLD/HOT)** : que se passe-t-il exactement à la valeur pivot ? (`>=` vs `>`, cohérence entre l'affichage dashboard et la logique API)
- [ ] **Validation à la création des seuils (`PUT /api/thresholds`)** : peut-on définir `cold > hot` ? Une valeur négative, non numérique, ou vide est-elle rejetée avec un message clair (400) ou silencieusement acceptée ?
- [ ] **`FIXED_TEMPERATURE`** : le typage est-il correct (string env var → number) ? Une valeur `0` ou `0.0` est-elle bien interprétée comme "valeur fixée" et non comme "vide/falsy" (piège JS classique `if (FIXED_TEMPERATURE)`) ?
- [ ] **`GET /api/temperature/history`** : retourne-t-il réellement exactement 15 éléments quand il y en a plus ? Trie-t-il par date décroissante de façon fiable (pas d'ambiguïté sur des captures à la même milliseconde) ?
- [ ] **Concurrence** : deux captures quasi simultanées créent-elles bien 2 lignes distinctes, sans écrasement ni ID dupliqué ?
- [ ] **Persistance des unités/format** : la température est-elle toujours renvoyée avec la même précision (arrondi cohérent entre capture, historique, dashboard) ?
- [ ] **Réponses d'erreur** : les endpoints renvoient-ils des codes HTTP cohérents (400 vs 500) et un corps JSON exploitable en cas d'entrée invalide ?
- [ ] **État initial / seed** : les seuils par défaut au premier lancement sont-ils cohérents avec ce qu'affiche le dashboard avant toute config ?

## 2. Plan de test — quoi tester et pourquoi

| Zone | Pourquoi c'est à risque |
|---|---|
| Logique de seuils (COLD/HOT) | Cœur métier de l'app — une erreur ici invalide toute la valeur du produit |
| Validation des entrées (`PUT /thresholds`, capture) | Zone typique où les katas QA plantent des bugs volontaires |
| Mode déterministe (`FIXED_TEMPERATURE`) | Condition de testabilité de tout le reste — s'il est cassé, aucun test déterministe n'est fiable |
| Historique (limite à 15, tri) | Bug d'off-by-one ou de tri classique |
| Dashboard ↔ API (cohérence d'affichage) | Les tests E2E doivent vérifier que l'UI reflète fidèlement ce que l'API renvoie |

## 3. Priorisation (si temps limité)

1. **Tests API sur la logique de seuils** (capture + PUT thresholds) — cœur métier, rapide à automatiser, haute valeur
2. **Tests de validation des entrées invalides** — c'est souvent là que sont les bugs plantés
3. **Test du mode déterministe** — condition bloquante pour tout le reste
4. **E2E du parcours principal** (capture → historique → mise à jour seuils → nouvelle capture reflète les nouveaux seuils)
5. **Cas limites/UI** (formulaire de seuils, états vides, erreurs réseau affichées à l'utilisateur)

## 4. Cas limites à couvrir

- Température exactement égale au seuil COLD, au seuil HOT, et à ±0.1 de chaque côté
- Seuils égaux (`cold == hot`)
- Seuils inversés (`cold > hot`)
- Température négative / extrême (-50, +150)
- Payload vide, champs manquants, types invalides (string au lieu de number)
- Historique avec 0, 1, 14, 15, 16+ captures
- Rafraîchissement du dashboard après une mise à jour de seuils sans recharger la page

## 5. Avec plus de temps

- **CI/CD** : pipeline (GitHub Actions) qui lance `docker-compose.test.yml` avec `FIXED_TEMPERATURE`, exécute Karate + Playwright, publie les rapports en artefacts
- **Performance** : script K6 sur `POST /capture` pour vérifier le comportement sous charge (accumulation en base, temps de réponse)
- **Accessibilité** : navigation clavier complète du dashboard, attributs ARIA sur le formulaire de seuils et le tableau d'historique
- **Contract testing** : schéma JSON des réponses API versionné pour détecter les breaking changes
