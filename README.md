# Disscount

## Description

Web and mobile (PWA) application for comparing product prices in Croatian shops, creating shopping lists, storing digital loyalty cards, and getting deal alerts with barcode scanning and AI suggestions.

### Link: _TODO_

## Visuals

<p align="center">
  <img width="90%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Home page"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Search products"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Product details"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Shopping lists"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Shopping list details"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Digital cards"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Digital card details"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Statistics"/>
  
  <img width="45%" src="https://pic.pnnet.dev/960x540" alt="Disscount - Prefrences"/>
</p>

## Attribution

**Created by:**

- Jakov Jakovac

## License [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-cyan.svg

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

## How to run

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 18+ (or latest LTS)
- pnpm (or npm/yarn)
- PostgreSQL (local or remote)
- Git

### Game flow

- Start the backend first (so API is available), then start the frontend.

### Running the backend

1. Database (PostgreSQL)

- Create database and user (example):
  sudo -u postgres psql -c "CREATE USER disccount WITH PASSWORD 'secret';"
  sudo -u postgres psql -c "CREATE DATABASE disccount OWNER disccount;"
- Adjust names/passwords as needed.

2. Backend setup

- Copy/configure environment variables (backend expects):
  - SPRING_DATASOURCE_URL (e.g. jdbc:postgresql://localhost:5432/disscount)
  - SPRING_DATASOURCE_USERNAME
  - SPRING_DATASOURCE_PASSWORD
  - JWT_SECRET (strong random string)
- You can copy `.env.example` to `.env` in the backend folder if present.
- Build and run:
  cd backend
  mvn clean install
  mvn spring-boot:run
- The backend starts on port 8080 by default. Open API docs at:
  http://localhost:8080/api-docs

### Running the frontend

3. Frontend setup

- Install and run:
  cd frontend
  pnpm install
  pnpm dev
- The frontend runs on port 3000 by default: http://localhost:3000
