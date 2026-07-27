# ------------ STAGE 1 : BUILDER -----------------
FROM node:20-bullseye AS builder

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Désactiver la télémétrie Next.js
RUN npx next telemetry disable

# ⚠️ Pas de variables Cognito injectées ici
# Build Next.js en standalone
RUN npm run build

# ------------ STAGE 2 : RUNNER -----------------
FROM node:20-bullseye AS runner

WORKDIR /app

# Variables d’environnement nécessaires au runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV MONGODB_URI="mongodb+srv://echry_app_user:Mavieenrose123@echry-eks-cluster.33yoiqx.mongodb.net/echrydb?retryWrites=true&w=majority"
ENV NEXTAUTH_URL=https://www.ech-ry.com
ENV NEXTAUTH_SECRET=rlbFNT/F/HQDBvqO/MBRRkImZQDXpOLhmcJ7jbrwUGs=
ENV JWT_SECRET=35ba767220f8821fc56a5e5129dd4aefbbb66c73d1d9edfc72c94ed02e60b32f

# Copier la sortie standalone générée par Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"] 
