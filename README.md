# 🧠 AI-Based Alzheimer's Disease Detection System

An AI-powered web application that detects Alzheimer's disease from retinal images using a deep learning model. The project consists of a React frontend and a Python (Flask) backend.

---

## 📌 Features

- User Authentication (Login & Signup)
- Upload retinal images
- AI-based Alzheimer's disease prediction
- Dashboard for viewing results
- Responsive user interface
- REST API communication between frontend and backend

---

## 🛠️ Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML
- CSS

### Backend
- Python
- Flask
- TensorFlow / Keras
- NumPy
- OpenCV
- Pillow

---

## 📂 Project Structure

```
Capstone-project/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── alzheimers_model.h5   (Download separately)
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

# 🚀 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/sagarm2005/Capstone-project.git
cd Capstone-project
```

---

## 2. Download the AI Model

The trained model file is not included in this repository because it is large.

Download:

**alzheimers_model.h5**

From:

**Google Drive Link:** *(Add your Google Drive link here)*

Place the downloaded file inside:

```
backend/
```

Final structure:

```
backend/
│
├── app.py
├── requirements.txt
└── alzheimers_model.h5
```

---

## 3. Backend Setup

Go to the backend folder:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
python app.py
```

Backend will start at:

```
http://localhost:5000
```

---

## 4. Frontend Setup

Open a new terminal.

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

or

```bash
pnpm install
```

Start the development server:

```bash
npm run dev
```

or

```bash
pnpm dev
```

Frontend will run at:

```
http://localhost:5173
```

---

# ▶️ Running the Project

### Terminal 1

```bash
cd backend
venv\Scripts\activate
python app.py
```

### Terminal 2

```bash
cd frontend
npm install
npm run dev
```

Open your browser:

```
http://localhost:5173
```

---

# 📷 How to Use

1. Open the application.
2. Login or create an account.
3. Upload a retinal image.
4. Click **Predict**.
5. View the Alzheimer's disease prediction result.

---

# 📦 Requirements

- Python 3.10 or later
- Node.js 18 or later
- npm or pnpm
- Git

---

# 📥 Model File

The trained model file is not included in this repository due to GitHub file size limitations.

Download it from:

**Google Drive:** *(Add your download link here)*

Copy the file to:

```
backend/alzheimers_model.h5
```

---

