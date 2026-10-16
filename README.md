Create a booking system for the Adelaide automotive garage.Develop a booking system for Adelaide automotive garage. 

A Website based appointment booking and management system for Adelaide Automotive. The app lets customers make online auto bookings, and also helps employees manage bookings via a secure administration dashboard. 

# Features 

Online Booking: The customer can enter an appointment in the system by entering his/her details, vehicle registration, date, time and service. Services offered include General Service, Tyres & Wheels and Mechanical Repairs. Employees are able to search, filter and change booking statuses. Email Notifications: confirmation of bookings and status updates via email. 

- Staff Authentication: Staff registration, email verification, logon and secure administrative access. - Invoice Management = Generate invoice for eligible completed bookings. Contact Form: API endpoint in the backend of the site which is used for sending contact enquiries. 

- Database Integration: Booking, application data in PostgreSQL storage. 

# Technology Stack 

| Component | Technology | |---|---| | Frontend | React, Vite | | Backend | Node.js, Express.js | | Database | PostgreSQL | Sign in | bcrypt, JSON Web Tokens (JWT) | To your email | Nodemailer, Gmail SMTP | Conflict Resolution | Merge, Rebase | 

# Project Structure 

- ```text garage-booking-system/ ├── frontend/ │   ├── src/ 

- │   ├── public/ 

- │   ├── package.json 

- │   └── README.md 

- ├── backend/ 

- │   ├── server.js │   ├── package.json │   └── .env └── README.md 

Note: The above is a schematic and actual configuration files and created directories may differ. 

Prerequisites 

Before attempting to run the application locally make sure you have installed: 

- Node.js and npm 

- PostgreSQL 

- Git 

Local Setup 

1. Clone the repository 

```bash git clone https://github.com/TanvirIstiakAKM/garage-booking-system.git cd garage-booking-system ``` 

# 2. Configure the database 

Create a database in PostgreSQL called `garage_booking. Set up the Database connection as per the existing Database setup and configuration of the back end application. 

3. Configure environment variables 

Prepare and/or modify the back-end `.env` file with the variable names that are used by the application. These may include: 

- Database connection settings 

- JWT secret 

Make sure you configure your email account and SMTP.Be sure to setup your email account and SMTP. 

- Application port 

Never give any sensitive information, such as passwords, email app passwords, JWT secrets, etc., to GitHub. 

# 4. Install dependencies 

Install the dependencies for the backend: 

```bash cd backend 

npm install ``` 

In another terminal install the front-end dependencies: 

```bash cd frontend npm install ``` 

# 5. Run the application 

To start the backend: run the script specified in `backend/package.json`, for instance: 

```bash npm start ``` 

Start the frontend with the command defined in the frontend/package.json, e.g.: 

```bash npm run dev ``` 

Follow the scripts and configuration provided in the project. When used locally, the frontend/backend could be on different terminals. 

# Booking Workflow 

The first step is for the customer to choose an automotive service. Contact, vehicle, date and time are entered into the customer. 

3. The back end verifies the booking request and for existing bookings, it checks for any conflicting active bookings. 

4. Booking is stored in PostgreSQL. 

5. Emails notifications are sent as configured and possible. 

6. Bookings are controlled via the admin dashboard by staff. 

Completed bookings that meet all the eligibility requirements can be taken through the invoice workflow. 

# Project Scope 

Online appointments, staff management, notifications of bookings, invoice management are the major features in which the system is focused. The project does not include the costs associated with repairing or replacing vehicles that have crashed or been in an accident. 

Service prices displayed are provisional demonstration and are not considered to be business service prices. 

Current Status 

The application is in use and piloted at the local level. A source code is hosted in GitHub. 

The project cannot be guaranteed as deployed to a production environment. If you wanted to use it in production, it would need to undergo additional testing, security review, configuration, and verification of business needs. 

Repository GitHub: htps://github.com/TanvirIstt <u>akAKM/garagei</u> -booking-system 

Author 

A K M Tanvir Istiak 

University of the Sunshine Coast (UniSC) 

Acknowledgement 

This is an industry project for Adelaide Automotive to enhance the appointment booking and administration processes of an automotive service. 

