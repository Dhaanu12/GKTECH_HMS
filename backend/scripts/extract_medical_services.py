"""
PDF Table Extraction Script
Extracts medical procedures, lab tests, and scans from 'lab tes.pdf'

Based on user specifications:
- Sr No 1-1338: Procedures
- Sr No 1339-1559: Lab Tests
- Sr No 1560-1832: Scans  
- Sr No 1833-1853: Can Procedures

Only first two columns (Sr No, Name) are needed.
"""

import pdfplumber
import pandas as pd
import json
import os

PDF_PATH = r"c:\Users\Punith\HMS\hms_integrated_13\hms_integrated_13\lab tes.pdf"
OUTPUT_DIR = r"c:\Users\Punith\HMS\hms_integrated_13\hms_integrated_13\backend\data"

def extract_tables_from_pdf(pdf_path):
    """Extract all tables from PDF using pdfplumber"""
    all_rows = []
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        
        for i, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            
            for table in tables:
                for row in table:
                    if row and len(row) >= 2:
                        # Get first two columns
                        sr_no = row[0]
                        name = row[1] if len(row) > 1 else ""
                        
                        # Clean data
                        if sr_no and name:
                            sr_no = str(sr_no).strip()
                            name = str(name).strip()
                            
                            # Skip header rows
                            if sr_no.lower() in ['sr no', 'sl no', 'sno', 's.no', 'sr.no', 'sl.no', 'sr no.', 'no', 'no.']:
                                continue
                                
                            # Try to parse sr_no as integer
                            try:
                                sr_num = int(sr_no)
                                all_rows.append({
                                    'sr_no': sr_num,
                                    'name': name
                                })
                            except ValueError:
                                # If not a number, might be part of name continuation
                                if all_rows and name:
                                    # Append to previous row's name if continuation
                                    pass
            
            if i % 10 == 0:
                print(f"Processed page {i+1}/{len(pdf.pages)}, rows so far: {len(all_rows)}")
    
    return all_rows

def categorize_data(rows):
    """Categorize data based on serial numbers per user specification"""
    procedures = []
    lab_tests = []
    scans = []
    can_procedures = []
    
    for row in rows:
        sr_no = row['sr_no']
        name = row['name']
        
        # Skip empty names
        if not name or name.lower() == 'nan':
            continue
            
        if 1 <= sr_no <= 1338:
            procedures.append({'id': sr_no, 'name': name, 'category': 'procedure'})
        elif 1339 <= sr_no <= 1559:
            lab_tests.append({'id': sr_no, 'name': name, 'category': 'lab_test'})
        elif 1560 <= sr_no <= 1832:
            scans.append({'id': sr_no, 'name': name, 'category': 'scan'})
        elif 1833 <= sr_no <= 1853:
            # Map "can_procedure" items to regular "procedure" as requested
            procedures.append({'id': sr_no, 'name': name, 'category': 'procedure'})
    
    return {
        'procedures': procedures,
        'lab_tests': lab_tests,
        'scans': scans
    }

def save_to_json(data, output_dir):
    """Save categorized data to JSON files"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save individual files
    for category, items in data.items():
        filepath = os.path.join(output_dir, f'{category}.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(items)} items to {filepath}")
    
    # Save combined file for reference
    all_items = []
    for items in data.values():
        all_items.extend(items)
    
    combined_path = os.path.join(output_dir, 'medical_services_master.json')
    with open(combined_path, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_items)} total items to {combined_path}")

def generate_sql_seed(data, output_dir):
    """Generate SQL seed file for database"""
    sql_lines = []
    
    sql_lines.append("-- Medical Services Database Seed")
    sql_lines.append("-- Auto-generated from lab tes.pdf")
    sql_lines.append("")
    sql_lines.append("-- Create medical_services table if not exists")
    sql_lines.append("""
CREATE TABLE IF NOT EXISTS medical_services (
    service_id SERIAL PRIMARY KEY,
    service_code VARCHAR(20),
    service_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_services_category ON medical_services(category);
CREATE INDEX IF NOT EXISTS idx_medical_services_name ON medical_services(service_name);
CREATE INDEX IF NOT EXISTS idx_medical_services_search ON medical_services USING gin(to_tsvector('english', service_name));
""")
    
    sql_lines.append("")
    sql_lines.append("-- Insert medical services data")
    sql_lines.append("INSERT INTO medical_services (service_code, service_name, category) VALUES")
    
    values = []
    for category, items in data.items():
        for item in items:
            # Escape single quotes in names
            name = item['name'].replace("'", "''")
            code = f"{category[:3].upper()}-{item['id']:04d}"
            values.append(f"  ('{code}', '{name}', '{item['category']}')")
    
    sql_lines.append(',\n'.join(values) + ';')
    
    sql_path = os.path.join(output_dir, 'seed_medical_services.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    print(f"Generated SQL seed file: {sql_path}")

if __name__ == '__main__':
    print("Starting PDF extraction...")
    print(f"PDF Path: {PDF_PATH}")
    
    # Extract tables
    rows = extract_tables_from_pdf(PDF_PATH)
    print(f"\nTotal rows extracted: {len(rows)}")
    
    # Show sample
    if rows:
        print("\nFirst 10 rows:")
        for row in rows[:10]:
            print(f"  {row}")
        print("\nLast 10 rows:")
        for row in rows[-10:]:
            print(f"  {row}")
    
    # Categorize
    categorized = categorize_data(rows)
    print(f"\nCategorization summary:")
    for category, items in categorized.items():
        print(f"  {category}: {len(items)} items")
    
    # Save to JSON
    save_to_json(categorized, OUTPUT_DIR)
    
    # Generate SQL
    generate_sql_seed(categorized, OUTPUT_DIR)
    
    print("\nExtraction complete!")
