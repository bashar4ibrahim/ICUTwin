#  NeoCare – ICU Twin

NeoCare is an AI-powered Digital Twin platform designed to support Intensive Care Unit (ICU) operations through real-time patient monitoring, predictive analytics, intelligent alerting, and resource management.

The platform provides healthcare professionals with a centralized dashboard that combines patient data, risk prediction models, and operational insights to improve decision-making and response times in critical care environments.

---

##  Features

### Patient Monitoring

* View and manage ICU patient records.
* Monitor patient conditions through a centralized interface.
* Access historical and current patient information.

### AI Risk Prediction

* Predict patient deterioration risks using machine learning models.
* Identify high-risk patients early.
* Support clinical decision-making with intelligent insights.

### Real-Time Alerts

* Receive notifications for critical events.
* Monitor high-risk patient conditions.
* Improve response times for emergency situations.

### Resource Management

* Track ICU resources and availability.
* Monitor operational capacity.
* Improve resource allocation and planning.

### Reports & Analytics

* Generate patient and operational reports.
* Analyze ICU performance metrics.
* Review historical trends and insights.

### Security

* JWT Authentication
* Role-Based Access Control (RBAC)
* Secure API communication
* Audit logging

---

##  System Architecture

```text
┌─────────────────────┐
│     React + Vite    │
│      Frontend       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    FastAPI Backend  │
│ https://capstone.dpdns.org
└──────────┬──────────┘
           │
 ┌─────────┼─────────┐
 │         │         │
 ▼         ▼         ▼
AI      Alerts    Reports
Models  System    Module
```

---

##  Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* FastAPI
* Python

### Security

* JWT Authentication
* Role-Based Access Control (RBAC)

### AI Components

* Predictive Analytics
* Risk Assessment Models

---

##  Prerequisites

Before running the project, make sure you have:

* Node.js 18 or later
* npm

Verify installation:

```bash
node -v
npm -v
```

---

##  Installation

Clone the repository:

```bash
git clone https://github.com/bashar4ibrahim/ICUTwin.git
```

Navigate to the project directory:

```bash
cd ICUTwin
```

Install dependencies:

```bash
npm install
```

---

##  Environment Configuration

Create a `.env` file in the project root:

```env
VITE_API_URL=https://capstone.dpdns.org
```

---

##  Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to:

```text
http://localhost:5173
```

---

##  Production Build

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

##  API Documentation

The application communicates with a FastAPI backend deployed at:

**API Base URL**

```text
https://capstone.dpdns.org
```

**Swagger Documentation**

```text
https://capstone.dpdns.org/docs
```

The Swagger interface provides detailed information about available endpoints, request formats, and API responses.

---

## How to Use

### 1. Login

Authenticate using your assigned credentials.

### 2. Dashboard

The dashboard provides:

* ICU overview
* Active alerts
* Patient summaries
* Resource utilization statistics

### 3. Patient Management

View and manage patient information including:

* Personal details
* Clinical records
* Current status
* Historical information

### 4. Risk Analysis

Access AI-generated insights to:

* View risk predictions
* Monitor risk scores
* Identify critical patients

### 5. Resource Monitoring

Track ICU resources such as:

* Bed availability
* Equipment utilization
* Capacity statistics

### 6. Reports

Generate and review reports for:

* Patients
* Risk assessments
* ICU operations

---

##  Project Objectives

* Improve ICU visibility through real-time monitoring.
* Support healthcare professionals with predictive analytics.
* Enhance patient safety through early risk detection.
* Optimize ICU resource utilization.
* Demonstrate the integration of AI and cybersecurity concepts in healthcare systems.

---

##  Disclaimer

NeoCare was developed as an academic graduation project. The platform is intended for educational, research, and demonstration purposes and should not replace certified clinical systems or professional medical judgment.

---

##  License

This project was developed as part of a Bachelor of Science in Cyber Security Capstone Project.
For educational and research purposes.
