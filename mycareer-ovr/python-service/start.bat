@echo off
echo Starting Resume NER Service...
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing/updating dependencies...
pip install -r requirements.txt
echo.

echo Starting Flask service on http://localhost:5001
echo Press Ctrl+C to stop
echo.
python resume_ner.py

