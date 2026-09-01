# Guide de déploiement : Footeco Sheet sur Portainer (Ubuntu)

Ce guide détaille les étapes simples pour déployer l'application **Footeco Sheet** sur votre serveur **Ubuntu** géré avec **Portainer**.

---

## 📋 Prérequis
- Un serveur Ubuntu (20.04, 22.04 ou 24.04 LTS) avec **Docker** et **Portainer** installés.
- Accès à l'interface web de Portainer (`http://IP_DE_VOTRE_SERVEUR:9000` ou `:9443`).

---

## 🚀 Méthode 1 : Déploiement direct via le dossier de l'app (Recommandé)

### 1. Transférer ou cloner le projet sur votre serveur Ubuntu
Placez les fichiers du projet dans un dossier sur votre serveur Ubuntu (par exemple `/opt/foot-eco-sheet` ou `/home/ubuntu/foot-eco-sheet`) :

```bash
# Exemple sur le serveur Ubuntu
mkdir -p /opt/foot-eco-sheet
cd /opt/foot-eco-sheet
# Déposez ici l'archive zip ou clonez votre dépôt git
```

### 2. Déployer via Portainer (Stacks / Docker Compose)
1. Ouvrez votre interface **Portainer**.
2. Allez dans votre environnement (**local** ou **primary**).
3. Dans le menu de gauche, cliquez sur **Stacks** -> **+ Add stack**.
4. Donnez un nom à votre stack (ex: `footeco-app`).
5. Choisissez l'une des 2 options :
   - **Option A (Web Editor)** : Collez le contenu suivant :
   ```yaml
   version: '3.8'

   services:
     foot-eco-sheet:
       build: /opt/foot-eco-sheet # Chemin vers le dossier sur le serveur Ubuntu
       container_name: foot-eco-sheet
       restart: unless-stopped
       ports:
         - "8085:80"
   ```
   - **Option B (Repository / Git)** : Renseignez l'URL de votre dépôt Git public ou privé avec vos identifiants, et pointez vers `docker-compose.yml`.

6. Cliquez en bas sur **Deploy the stack**.

---

## 🐳 Méthode 2 : Build de l'image Docker en ligne de commande puis gestion Portainer

Si vous préférez compiler l'image directement en ligne de commande sur Ubuntu :

```bash
cd /opt/foot-eco-sheet

# 1. Construire l'image Docker
docker build -t foot-eco-sheet:latest .

# 2. Lancer le conteneur
docker run -d \
  --name foot-eco-sheet \
  --restart unless-stopped \
  -p 8085:80 \
  foot-eco-sheet:latest
```

Le conteneur apparaîtra immédiatement dans la liste **Containers** de Portainer, où vous pourrez le surveiller, le redémarrer ou consulter les logs.

---

## 🌐 Accéder à l'application
Une fois le conteneur démarré, ouvrez votre navigateur web et rendez-vous sur :
```
http://IP_DE_VOTRE_SERVEUR_UBUNTU:8085
```
*(Si vous avez choisi un autre port que `8085` dans le compose, adaptez le numéro de port).*

---

## ⚙️ Configuration Firewall (UFW) sur Ubuntu (si activé)
Si le pare-feu UFW est actif sur votre serveur Ubuntu, autorisez le port :
```bash
sudo ufw allow 8085/tcp
sudo ufw reload
```

---

## 🔄 Mise à jour de l'application
Pour mettre à jour l'application dans Portainer :
1. Allez dans **Stacks** -> cliquez sur `footeco-app`.
2. Cliquez sur **Editor**.
3. Cochez la case **Re-pull image and redeploy** si vous utilisez un dépôt Git ou une registry.
4. Cliquez sur **Update the stack**.
