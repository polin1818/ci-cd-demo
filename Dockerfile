# Dockerfile
# 1. Choisir une image Node officielle
FROM node:18-alpine

# 2. Définir le répertoire de travail
WORKDIR /app

# 3. Copier package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# 4. Installer les dépendances
RUN npm install --production

# 5. Copier le reste du code
COPY . .

# 6. Exposer le port
EXPOSE 3000

# 7. Commande pour démarrer l'app
CMD ["node", "src/app.js"]