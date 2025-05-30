FROM node:18

# Crée le dossier app dans le conteneur
WORKDIR /app

# Copie les dépendances et installe-les
COPY package*.json ./
RUN npm install

# Copie le reste du projet
COPY . .

# Expose le port de l'API
EXPOSE 3000

# Lance le serveur
CMD ["node", "src/server.js"]
