# DocuMind

DocuMind is a web application that helps users interact with PDF documents more efficiently. Instead of manually searching through long PDFs, users can upload a document, view it in the browser, and ask questions about its content.

## Features

* Upload PDF files
* View PDFs directly in the browser
* Chat with uploaded PDFs
* Get answers based on document content
* Generate document summaries
* Responsive and user-friendly interface

## Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router DOM

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Storage

* Cloudinary

### AI

* LLM API (Gemini/OpenAI)

## Project Structure

```text
DocuMind/
│
├── Frontend/
│
├── Backend/
│
└── README.md
```

## Installation

### Clone the repository

```bash
git clone https://github.com/divya240918/DocuMind.git
```

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd Backend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file inside the Backend folder:

```env
MONGODB_URI=your_mongodb_uri

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_api_key
```

## Future Improvements

* User authentication
* Multiple PDF support
* Chat history
* Highlight relevant PDF sections
* Export chat conversations

## Author

Divya Das
