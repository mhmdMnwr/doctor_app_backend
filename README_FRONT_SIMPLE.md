# Frontend Routes (Simple)

Base URL:
- http://localhost:3000

Auth header for protected routes:
- Authorization: Bearer <accessToken>

Pagination query (patient routes):
- page: optional, default 1
- limit: optional, default 10, max 100

Important:
- `patientId` used in certificates/ordonnances/analyzes must be the Mongo `_id` of a patient created from `/patients`.

## Patients

### Create patient
- POST /patients
- Protected: Yes

Body:
```json
{
  "name": "John",
  "familyName": "Doe",
  "birthdate": "1990-05-20",
  "comment": "Optional note",
  "phoneNumber": "0555123456"
}
```

Notes:
- `comment` is optional.
- `phoneNumber` is optional.
- Save returned patient `_id` to use as `patientId` in medical records.

### Update patient
- PUT /patients/:id
- Protected: Yes

Body (partial update allowed):
```json
{
  "comment": "Updated note",
  "phoneNumber": "0555000000"
}
```

### Delete patient (cascade delete)
- DELETE /patients/:id
- Protected: Yes

Behavior:
- Deletes the patient.
- Deletes all related certificates, ordonnances, and analyzes for that patient.

## Certificate

### Create certificate
- POST /certificates
- Protected: Yes

Body:
```json
{
  "patientId": "<patient _id>",
  "commentaire": "Patient needs rest"
}
```

### Get certificates by patient id (paginated)
- GET /certificates/patient/:patientId?page=1&limit=10
- Protected: Yes

Response shape:
```json
{
  "message": "Certificates fetched successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

### Get certificates by date
- GET /certificates/by-date?date=2026-04-07
- GET /certificates/by-date?date=2026-04-01&endDate=2026-04-07
- Protected: Yes

Behavior:
- If `endDate` is missing, API returns records for the exact `date` only.
- If `endDate` is provided, API returns records from `date` to `endDate`.

## Ordonnance

### Create ordonnance
- POST /ordonnances
- Protected: Yes

Body:
```json
{
  "patientId": "<patient _id>",
  "medicines": [
    { "medicine": "Paracetamol", "dosage": "500mg twice daily" }
  ],
  "diagnostic": "Flu"
}
```

### Get ordonnances by patient id (paginated)
- GET /ordonnances/patient/:patientId?page=1&limit=10
- Protected: Yes

### Get ordonnance by id
- GET /ordonnances/:id
- Protected: Yes

### Update ordonnance
- PUT /ordonnances/:id
- Protected: Yes

Body (partial update allowed):
```json
{
  "patientId": "<patient _id>",
  "diagnostic": "Updated diagnostic"
}
```

### Get ordonnances by date
- GET /ordonnances/by-date?date=2026-04-07
- GET /ordonnances/by-date?date=2026-04-01&endDate=2026-04-07
- Protected: Yes

Behavior:
- If `endDate` is missing, API returns records for the exact `date` only.
- If `endDate` is provided, API returns records from `date` to `endDate`.

## Analyze

### Create analyze
- POST /analyzes
- Protected: Yes

Body:
```json
{
  "patientId": "<patient _id>",
  "analyzeNames": ["CBC", "CRP", "Blood Sugar"]
}
```

### Get analyzes by patient id (paginated)
- GET /analyzes/patient/:patientId?page=1&limit=10
- Protected: Yes

### Get analyze by id
- GET /analyzes/:id
- Protected: Yes

### Update analyze
- PUT /analyzes/:id
- Protected: Yes

Body (partial update allowed):
```json
{
  "patientId": "<patient _id>",
  "analyzeNames": ["Ferritin", "Vitamin D"]
}
```

### Get analyzes by date
- GET /analyzes/by-date?date=2026-04-07
- GET /analyzes/by-date?date=2026-04-01&endDate=2026-04-07
- Protected: Yes

Behavior:
- If `endDate` is missing, API returns records for the exact `date` only.
- If `endDate` is provided, API returns records from `date` to `endDate`.
