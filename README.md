# cigma-spm-mock-webservices (SPM Mock Webservices)


## Description du Projet :
Ce projet mock est conçu pour les étudiants du laboratoire Angular afin de leur fournir une API backend simulée en utilisant `json-server`. L'objectif est de permettre aux étudiants de se familiariser avec les interactions backend/frontend dans une application de gestion de projets scolaires.

## Fonctionnement du Projet :
Le projet utilise `json-server` pour simuler une API RESTful. Les données sont stockées dans un fichier JSON (`db.json`) et les routes API sont définies dans `server.js`.

### Clonez le Projet :
Pour cloner le projet, utilisez la commande suivante :
```
git clone https://github.com/ymahtat-dev/cigma-spm-mock-webservices.git
cd cigma-spm-mock-webservices
```

### Installation des Dépendances :
Pour installer les dépendances, utilisez la commande suivante :
```
npm install
```

### Démarrage du Serveur :
Pour démarrer le serveur, utilisez la commande suivante :
```
npm start
```
ou
```
node server.js
```
Le serveur s'exécutera sur http://localhost:3000.
Tous les services ont l'url prefixé par http://localhost:3000/api.

### Authentification :
L'authentification est gérée à l'aide de JSON Web Tokens (JWT). Pour vous authentifier, envoyez une requête POST à http://localhost:3000/api/auth/login avec les informations d'identification suivantes :

- Utilisateur Administrateur
```
{
    "username": "admin",
    "password": "admin"
}
```
- Utilisateur Etudiant
```
{
    "username": "azbennani",
    "password": "1234567"
}
```

En cas de succès, un token JWT sera retourné. Utilisez ce token pour accéder aux routes protégées en l'ajoutant dans l'en-tête Authorization de vos requêtes comme suit :
```
Authorization: Bearer <votre_token_jwt>
```

### Endpoints Disponibles (APIs) :
- Authentification :
  - POST http://localhost:3000/api/auth/login : Authentification de l'utilisateur.
  - GET http://localhost:3000/api/auth/validate-token : Validation du token JWT.
  - GET http://localhost:3000/api/auth/profile : Récupérer le profil de l'utilisateur connecté.
  - PUT http://localhost:3000/api/auth/update-password : Modifier le mot de passe de l'utilisateur connecté.
  - POST http://localhost:3000/api/auth/logout : Déconnexion de l'utilisateur.
- Gestion des Utilisateurs (Admin uniquement) :
  - GET http://localhost:3000/api/users : Récupérer tous les utilisateurs.
  - POST http://localhost:3000/api/users : Créer un nouvel utilisateur.
  - PUT http://localhost:3000/api/users/:id : Mettre à jour un utilisateur existant.
  - DELETE http://localhost:3000/api/users/:id : Supprimer un utilisateur.
- Gestion des Étudiants (Admin uniquement) :
  - GET http://localhost:3000/api/students : Récupérer tous les étudiants.
  - POST http://localhost:3000/api/students : Créer un nouvel étudiant.
- Gestion des Projets :
  - GET http://localhost:3000/api/projects : Récupérer tous les projets (Admin) ou les projets de l'utilisateur connecté.
  - POST http://localhost:3000/api/projects : Créer un nouveau projet (Étudiant uniquement).
  - PUT http://localhost:3000/api/projects/:id : Mettre à jour un projet (Admin ou Étudiant responsable).
  - DELETE http://localhost:3000/api/projects/:id : Supprimer un projet (Admin ou Étudiant responsable).
  - GET http://localhost:3000/api/projects/:id : Récupérer un projet spécifique (Admin, Étudiant responsable ou membre).
- Gestion des Tâches :
  - GET http://localhost:3000/api/tasks : Récupérer toutes les tâches (Admin) ou les tâches de l'utilisateur connecté.
  - GET http://localhost:3000/api/projects/:projectId/tasks : Récupérer les tâches d'un projet spécifique (Admin, Étudiant responsable ou membre).
  - POST http://localhost:3000/api/projects/:projectId/tasks : Créer une nouvelle tâche dans un projet (Admin, Étudiant responsable ou membre).
  - PUT http://localhost:3000/api/tasks/:id : Mettre à jour une tâche (Admin ou propriétaire de la tâche).
  - DELETE http://localhost:3000/api/tasks/:id : Supprimer une tâche (Admin ou propriétaire de la tâche).
  - GET http://localhost:3000/api/tasks/:id : Récupérer une tâche spécifique (Admin ou propriétaire de la tâche).
- Gestion des Commentaires :
  - GET http://localhost:3000/api/comments : Récupérer tous les commentaires (Admin) ou les commentaires de l'utilisateur connecté.
  - GET http://localhost:3000/api/tasks/:taskId/comments : Récupérer les commentaires d'une tâche spécifique (Admin ou propriétaire de la tâche).
  - POST http://localhost:3000/api/tasks/:taskId/comments : Créer un nouveau commentaire dans une tâche (Admin ou propriétaire de la tâche).
  - PUT http://localhost:3000/api/comments/:id : Mettre à jour un commentaire (Admin ou propriétaire du commentaire).
  - DELETE http://localhost:3000/api/comments/:id : Supprimer un commentaire (Admin ou propriétaire du commentaire).
  - GET http://localhost:3000/api/comments/:id : Récupérer un commentaire spécifique (Admin ou propriétaire du commentaire).
- Données Maîtres (sans authentification) :
  - GET http://localhost:3000/api/masterdata/user-types : Récupérer les types d'utilisateurs.
  - GET http://localhost:3000/api/masterdata/studies-types : Récupérer les types de programmes d'études.
  - GET http://localhost:3000/api/masterdata/status-flows : Récupérer les statuts de flux.
  - GET http://localhost:3000/api/masterdata/task-types : Récupérer les types de tâches