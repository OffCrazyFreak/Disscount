# Disscount

## Description

Web app for managing collaboration status records with companies per project.

## License

Licensed under GNU GPL v3 license.

## Prerequisites

### Backend Requirements

- Java JDK 21
- Maven 3.9.9
- PostgreSQL

### Frontend Requirements

- Node.js with npm

## Setup and Running Instructions

### Backend Setup

1. Install all the required prerequisites listed above
2. Create a PostgreSQL database:

```sql
CREATE DATABASE your_database_name;
```

3. Configure environment variables:

- Navigate to the Backend folder
- Copy .env.example to a new file named .env
- Update the following variables in .env:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/your_database_name
SPRING_DATASOURCE_USERNAME=your_postgres_username
SPRING_DATASOURCE_PASSWORD=your_postgres_password
```

4. Run the backend server:

```bash
mvn spring-boot:run
```

This will create all necessary database tables automatically.

5. Create the initial user:

- Open your browser and navigate to the Swagger documentation at localhost:8080/api-docs
- Use the appropriate endpoint to create your first user with email that you can login via google

### Frontend Setup

1. Open a terminal and navigate to the Frontend directory:

```bash
cd Frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will open automatically in your default browser at http://localhost:3000
