---
marp: true
---

# 🏋️‍♂️ Tests de charge

## Principes & introduction pratique avec K6

[arnaud.renaud.part@servier.com](mailto:arnaud.renaud.part@servier.com)

---

## Principe des tests de charge

Identifier les points faibles (goulots d'étranglement) d'un service soumis à une certaine charge :

1. Définir un scénario de test exécuté par une masse d'utilisateurs virtuels en parallèle
2. Définir les critères de réussite sous forme de seuils de tolérance :

   - Quel taux d'erreur ?
   - Quel temps de réponse moyen, médian ?
   - Quel temps de réponse maximum ou au 95e, 99e centile ?

<!-- Contrairement aux tests fonctionnels, la notion de réussite n'est pas binaire -->

---

## K6

- Application CLI (installable sur Windows, Linux, macOS ; image Docker disponible)
- Pour tester des services web (requêtes HTTP, WebSockets, gRPC)
- Résultats exportables à la fin du test (CSV, JSON, services cloud) ou en temps réel au cours d'un test
- Scénarios à écrire en JavaScript (support expérimental pour TypeScript)

<!-- C'est pour cette dernière raison que j'ai choisi K6 pour notre base de code en TS, afin que les développeurs puissent lire et écrire les tests de charge -->

---

## Pratique avec K6

---

### Scénario simple

Créer un fichier `get-crocodiles.js` et définir un scénario de test avec une seule requête :

```js
import http from "k6/http";

export default function () {
  http.get("https://test-api.k6.io/public/crocodiles/");
}
```

[Documentation de l'API test-api.k6.io](https://test-api.k6.io)

---

### Exécution d'un scénario

---

#### Exécution par défaut

Lancer le test : `k6 run get-crocodiles.js`

Le scénario n'est exécuté qu'une fois.

---

#### Exécution d'un nombre donné d'itérations séquentielles

Lancer le test avec 5 exécutions séquentielles du scénario :

`k6 run get-crocodiles.js --iterations 5`

_Cette configuration ne permet pas de simuler plusieurs utilisateurs simultanés._

---

#### Exécution d'un nombre donné d'itérations simultanées

Lancer le test avec 5 utilisateurs en parallèle et l'interrompre quand le scénario a été exécuté 5 fois au total :

`k6 run get-crocodiles.js --vus 5 --iterations 5`

---

#### Exécution d'un nombre variable d'itérations sur une durée donnée

Lancer le test avec 5 utilisateurs en parallèle, en boucle, et l'interrompre au bout de 30 secondes :

`k6 run get-crocodiles.js --vus 5 --duration 30s`

---

### Lecture des résultats

Par défaut, les résultats sont transmis à la sortie standard (affichés dans le terminal).

On remarque ici notamment :

- les statistiques du temps de réponse total : `http_req_duration` avec `avg`, `min`, `med`, `max`, `p(90)`, `p(95)`
- le taux d'échec de la requête : `http_req_failed`

---

### Scénario complexe

Créer un fichier `new-user-actions.js` et copier-coller [ce scénario qui simule les actions d'un nouvel utilisateur](https://raw.githubusercontent.com/arnaudrenaud/articles-cheatsheets-courses/d73c5798e78b69ce36efa2f8cfd954a31fa33a41/courses/slide-decks/tests-de-charge/new-user-actions.js).

Lancer le test en affichant toutes les requêtes et réponses (en-têtes et corps) pour s'assurer que les requêtes sont bien formulées :

`k6 run new-user-actions.js --http-debug=full`

On constate que les cookies sont automatiquement transmis à chaque requête suivant l'authentification, comme dans un navigateur.

---

### Lecture des résultats d'un scénario complexe

Lancer le test pour simuler une arrivée de nouveaux utilisateurs en masse :

`k6 run new-user-actions.js --vus 50 --duration 60s`

On constate que les résultats ne distinguent pas les requêtes selon leur type.
Or, on aimerait identifier un potentiel goulot d'étranglement : un type de requête est-il signficativement plus lent que les autres ?

---

### Détail des résultats par type de requête

On souhaite voir le détail, par groupe de requêtes, des statistiques suivantes :

- `http_req_duration`
- `http_req_failed`

Pour cela, remplacer le contenu du fichier `new-user-actions.js` par [cette version](https://raw.githubusercontent.com/arnaudrenaud/articles-cheatsheets-courses/cc9a8ded39e5f5413ccb109638dac2b9b59bbc5d/courses/slide-decks/tests-de-charge/new-user-actions.js).

Relancer le test :
`k6 run new-user-actions.js --vus 50 --duration 60s`

On constate que les requêtes "Register" et "Login" sont nettement plus lentes que les requêtes "Create crocodile" et "Get my crocodiles".

---

### Définition des seuils de réussite (1/2)

On souhaite que le test réussisse à condition que :

- moins d'une requête sur 1000 (0,1 %) échoue
- les 5% des requêtes les plus lentes (95e centile) présentent un temps de réponse inférieur à :
  - 5 secondes pour "Register" et "Login"
  - 1 seconde pour "Create crocodile" et "Get my crocodiles"

---

### Définition des seuils de réussite (2/2)

Pour cela, remplacer les `thresholds` par :

```js
    [`http_req_duration{group: ${REQUEST_GROUPS.register}}`]: ["p(95) < 5000"],
    [`http_req_duration{group: ${REQUEST_GROUPS.login}}`]: ["p(95) < 5000"],
    [`http_req_duration{group: ${REQUEST_GROUPS.createCrocodile}}`]: [
      "p(95) < 1000",
    ],
    [`http_req_duration{group: ${REQUEST_GROUPS.getMyCrocodiles}}`]: [
      "p(95) < 1000",
    ],

    ["http_req_failed"]: ["rate<0.1"],
    [`http_req_failed{group: ${REQUEST_GROUPS.register}}`]: [],
    [`http_req_failed{group: ${REQUEST_GROUPS.login}}`]: [],
    [`http_req_failed{group: ${REQUEST_GROUPS.createCrocodile}}`]: [],
    [`http_req_failed{group: ${REQUEST_GROUPS.getMyCrocodiles}}`]: [],
```

On définit ici un seuil d'échec toléré (`http_req_failed`) pour l'ensemble des requêtes et pas pour un groupe particulier.

---

### Intégration des seuils de réussite aux résultats

Relancer le test :
`k6 run new-user-actions.js --vus 50 --duration 60s`

On constate que chaque ligne de résultat est précédée par ✓ ou ✗ en fonction de la validation du seuil ou non.
Si au moins l'un des seuils de réussite n'est pas atteint, le programme finit en erreur.

---

## Utilisation dans le projet Secure GenAI

---

## Intégration au travail des développeurs, devops, tech leads

- Maintenance des tests par les développeurs
- Exécution possible chez le développeur ou dans un environnement de CI
- Les résultats peuvent être copiés et collés manuellement ou communiqués automatiquement
