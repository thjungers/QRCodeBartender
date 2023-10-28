# QR Code Bartender

A simple web app to order drinks and food to your table from a QR code.

## Usage

### Frontend

Add your locale files to `locale/{language}/`. 

Create a `frontend/config.json` file containing the following keys:

```json
{
    "backend_url": ""
}
```

Host the `frontend` folder on a server.

### Backend

Install the required dependencies

```bash
pip install -r requirements.txt
```

Run the Python backend using

```bash
uvicorn backend.main:app
```