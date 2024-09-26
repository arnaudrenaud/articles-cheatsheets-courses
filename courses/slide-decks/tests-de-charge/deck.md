---
marp: true
---

# 🏋️‍♂️ Tests de charge

## Principes & introduction pratique avec K6

---

## Principe des tests de charge

Identifier les points faibles (goulots d'étranglement) d'un service soumis à une certaine charge :

1. 📝 Définir un scénario de test exécuté par une masse d'utilisateurs virtuels en parallèle
2. 🤔 Définir des critères d'acceptation sous forme de seuils de tolérance :

- Quel taux d'erreur ?
- Quel temps de réponse moyen ?
- Quel temps de réponse maximum ou au 95e percentile ?

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

Créer un fichier JS (par exemple `get-crocodiles.js`) et définir un scénario de test avec une seule requête :

```js
import http from "k6/http";

export default function () {
  http.get("https://test-api.k6.io/public/crocodiles/");
}
```

[Documentation de l'API test-api.k6.io](https://test-api.k6.io)

---

### Exécution

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
