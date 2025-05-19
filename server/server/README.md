# Enquiries Management System

This project is an Enquiries Management System that allows users to create, view, update, and delete visa enquiries. It consists of a server-side application built with Node.js and Express, along with a client-side application built with React.

## Project Structure

```
server
├── controllers
│   └── enquiriesController.js
├── models
│   └── enquiriesModel.js
└── README.md
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up the database:**
   Ensure you have a MongoDB database set up. Update the database connection string in your environment variables or configuration file.

4. **Run the server:**
   ```
   npm start
   ```

## Usage

- **Create an Enquiry:**
  Send a POST request to `/api/enquiries` with the enquiry details in the request body.

- **Get All Enquiries:**
  Send a GET request to `/api/enquiries` to retrieve all enquiries.

- **Update an Enquiry:**
  Send a PATCH request to `/api/enquiries/:id` with the updated enquiry details in the request body.

- **Delete an Enquiry:**
  Send a DELETE request to `/api/enquiries/:id` to delete the specified enquiry.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.