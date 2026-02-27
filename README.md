# Bitespeed Backend Task: Identity Reconciliation

An identity resolution API built for Bitespeed. This service acts as a detective, linking disparate customer orders made with different contact details (emails and phone numbers) to the same underlying individual. 

## 🚀 Tech Stack
* Runtime: Node.js
* Framework: Express.js
* Language: TypeScript
* ORM: Prisma
* Database: PostgreSQL (Neon)

## ⚙️ Local Setup Instructions

Follow these steps to run the project locally on your machine.

1. Clone the repository
\`\`\`bash
git clone <your-github-repo-url>
cd bitespeed-backend
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up Environment Variables
Create a `.env` file in the root directory and add your PostgreSQL connection string:
\`\`\`env
DATABASE_URL="postgresql://username:password@your-database-host/db_name?sslmode=require"
\`\`\`

4. Initialize the Database
Push the Prisma schema to your database to create the required tables:
\`\`\`bash
npx prisma db push
\`\`\`

5. Start the Server
Run the application in development mode:
\`\`\`bash
npm run dev
\`\`\`
The server will start running on `http://localhost:3000`.

## 📖 API Documentation

### Endpoint: `POST /identify`
Identifies and links a customer based on their email and/or phone number.

Request Body (JSON):
\`\`\`json
{
  "email": "mcfly@bates.com",
  "phoneNumber": "123456"
}
\`\`\`

Successful Response (200 OK):
\`\`\`json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@bates.com", "mcfly@bates.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
\`\`\`