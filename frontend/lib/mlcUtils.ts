
export const printMlcCertificate = (mlcData: any, patient: any) => {
    if (!mlcData || !patient) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>MLC Certificate - ${mlcData.mlc_number || 'Draft'}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; color: #000; }
                .header { text-align: center; margin-bottom: 40px; }
                .header h2 { margin: 0; font-size: 18px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
                .meta-info { margin-bottom: 30px; }
                .meta-line { margin-bottom: 5px; }
                .subject { font-weight: bold; text-decoration: underline; margin: 20px 0; }
                .content-section { margin-bottom: 20px; }
                .section-label { font-weight: bold; text-decoration: underline; display: block; margin-bottom: 5px; }
                .field-row { display: flex; margin-bottom: 8px; }
                .field-label { width: 150px; flex-shrink: 0; }
                .field-value { flex: 1; border-bottom: 1px dotted #000; padding-left: 5px; }
                .footer { margin-top: 60px; }
                .signature-block { float: right; width: 250px; text-align: center; }
                @media print { body { padding: 20px; } button { display: none; } }
            </style>
        </head>
        <body>
             <div class="header">
                <h2>MEDICO-LEGAL CASE (MLC) – HOSPITAL TO POLICE INTIMATION</h2>
            </div>
            <div class="meta-info">
                <div class="meta-line"><strong>From:</strong></div>
                <div class="meta-line">The Medical Officer</div>
                <div class="meta-line"><strong>Dr. ${mlcData.doctor_first_name || ''} ${mlcData.doctor_last_name || ''}</strong></div>
                <div class="meta-line">Reg. No: ${mlcData.registration_number || 'N/A'}</div>
                <div class="meta-line">${mlcData.branch_name || 'Hospital Management System'}</div>
                <div class="meta-line">${mlcData.branch_address ? `${mlcData.branch_address}, ${mlcData.branch_city || ''}` : ''}</div>
                <br>
                <div class="meta-line"><strong>To:</strong></div>
                <div class="meta-line">The Station House Officer (SHO)</div>
                <div class="meta-line">${mlcData.police_station ? mlcData.police_station + ' Police Station' : '______________________ Police Station'}</div>
                <div class="meta-line">${mlcData.police_station_district ? mlcData.police_station_district + ' District' : '______________________ District'}</div>
            </div>
            <div class="subject">Subject: Intimation regarding Medico-Legal Case (MLC)</div>
            <p>Sir / Madam,</p>
            <p>This is to inform you that the following Medico-Legal Case has been registered and examined at this hospital.</p>
            <div class="content-section">
                <span class="section-label">MLC Details:</span>
                <div class="field-row">
                    <span class="field-label">MLC No.:</span>
                    <span class="field-value"><strong>${mlcData.mlc_number || 'Pending'}</strong></span>
                </div>
                <div class="field-row">
                    <span class="field-label">Date & Time:</span>
                    <span class="field-value">${mlcData.created_at ? new Date(mlcData.created_at).toLocaleString() : new Date().toLocaleString()}</span>
                </div>
            </div>
            <div class="content-section">
                <span class="section-label">Patient Details:</span>
                <div class="field-row">
                    <span class="field-label">Name:</span>
                    <span class="field-value">${patient.first_name} ${patient.last_name}</span>
                </div>
                <div class="field-row">
                    <span class="field-label">Age / Gender:</span>
                    <span class="field-value">${patient.age} Yrs / ${patient.gender}</span>
                </div>
                <div class="field-row">
                    <span class="field-label">Address:</span>
                    <span class="field-value">${patient.address || ''} ${patient.city || ''}</span>
                </div>
                <div class="field-row">
                    <span class="field-label">Brought by:</span>
                    <span class="field-value">${mlcData.brought_by || '______________________'}</span>
                </div>
            </div>
            <div class="content-section">
                <span class="section-label">History (As alleged by patient / attendant):</span>
                <p style="border-bottom: 1px dotted #000; min-height: 40px;">${mlcData.history_alleged || ''}</p>
            </div>
            <div class="content-section">
                <span class="section-label">Brief Injury Description:</span>
                <p style="border-bottom: 1px dotted #000; min-height: 40px;">${mlcData.injury_description || ''}</p>
            </div>
            <div class="content-section">
                <span class="section-label">Opinion:</span>
                <div class="field-row">
                    <span class="field-label">Nature of Injuries:</span>
                    <span class="field-value">${mlcData.nature_of_injury || 'Simple / Grievous / Dangerous to Life'}</span>
                </div>
            </div>
            <p>The patient is undergoing / has been given necessary medical treatment. You are requested to take necessary action as deemed fit.</p>
            <p>Thanking you,</p>
            <p>Yours faithfully,</p>
            <div class="footer">
                <div class="signature-block">
                    <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 40px;"></div>
                    <div><strong>Dr. ${mlcData.doctor_first_name || ''} ${mlcData.doctor_last_name || ''}</strong></div>
                    <div>${mlcData.qualification || 'MBBS'}</div>
                    <div>Reg. No: ${mlcData.registration_number || ''}</div>
                    <div style="margin-top: 5px;">Signature: ____________________</div>
                    <div>${new Date().toLocaleDateString()}</div>
                </div>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const printWoundCertificate = (mlcData: any, woundData: any, patient: any) => {
    if (!mlcData || !patient || !woundData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Wound Certificate - ${mlcData.mlc_number || 'Draft'}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.4; color: #000; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h2 { margin: 0; text-decoration: underline; }
                .field-line { display: flex; align-items: baseline; margin-bottom: 10px; }
                .field-label { font-weight: bold; margin-right: 5px; flex-shrink: 0; }
                .field-value { border-bottom: 1px dotted #000; flex: 1; padding-left: 5px; }
                .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
                .row { display: flex; gap: 20px; }
                .col { flex: 1; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
                .police-section { margin-top: 50px; border-top: 2px solid #000; padding-top: 30px; }
                @media print { body { padding: 20px; } button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>LEGAL / MEDICO-LEGAL CASE (MLC) WOUND CERTIFICATE FORMAT</h2>
            </div>

            <div class="field-line">
                <span class="field-label">Hospital Name & Address:</span>
                <span class="field-value">${mlcData.branch_name || 'Hospital Details'} ${mlcData.branch_address ? ', ' + mlcData.branch_address : ''}</span>
            </div>
            <div class="row">
                <div class="col field-line">
                    <span class="field-label">MLC No.:</span>
                    <span class="field-value">${mlcData.mlc_number || 'Pending'}</span>
                </div>
                <div class="col field-line">
                    <span class="field-label">Police Station:</span>
                    <span class="field-value">${mlcData.police_station || ''}</span>
                </div>
            </div>
            <div class="field-line">
                <span class="field-label">Date & Time of Examination:</span>
                <span class="field-value">${mlcData.created_at ? new Date(mlcData.created_at).toLocaleString() : new Date().toLocaleString()}</span>
            </div>

            <div class="section-title">Patient Details</div>
            <div class="row">
                <div class="col field-line">
                    <span class="field-label">Name:</span>
                    <span class="field-value">${patient.first_name} ${patient.last_name}</span>
                </div>
                <div class="col field-line">
                    <span class="field-label">Age:</span>
                    <span class="field-value">${patient.age}</span>
                </div>
                <div class="col field-line">
                    <span class="field-label">Gender:</span>
                    <span class="field-value">${patient.gender}</span>
                </div>
            </div>
            <div class="field-line">
                <span class="field-label">Address:</span>
                <span class="field-value">${patient.address || ''} ${patient.city || ''}</span>
            </div>
            <div class="field-line">
                <span class="field-label">Brought by:</span>
                <span class="field-value">${mlcData.brought_by || ''}</span>
            </div>

            <div class="section-title">History (As alleged)</div>
            <div class="field-line">
                <span class="field-label">Date & Time of Incident:</span>
                <span class="field-value">${woundData.incident_date_time ? new Date(woundData.incident_date_time).toLocaleString() : ''}</span>
            </div>
            <div class="field-line">
                <span class="field-label">Alleged Cause/Weapon:</span>
                <span class="field-value">${woundData.alleged_cause || ''}</span>
            </div>
            <p style="border-bottom: 1px dotted #000; min-height: 40px; margin-top: 10px;">${woundData.history_alleged || ''}</p>

            <div class="section-title">Examination Findings</div>
            <p style="border-bottom: 1px dotted #000; min-height: 60px; white-space: pre-wrap;">${woundData.examination_findings || ''}</p>

            <div class="section-title">Opinion</div>
            <div class="field-line">
                <span class="field-label">Nature of Injuries:</span>
                <span class="field-value">${woundData.nature_of_injury}</span>
            </div>
            <div class="field-line">
                <span class="field-label">Danger to Life:</span>
                <span class="field-value">${woundData.danger_to_life}</span>
            </div>
            <div class="field-line">
                <span class="field-label">Age of Injuries:</span>
                <span class="field-value">${woundData.age_of_injuries || ''}</span>
            </div>

            <div class="section-title">Treatment Given:</div>
            <p style="border-bottom: 1px dotted #000; min-height: 40px;">${woundData.treatment_given || ''}</p>

            <div class="section-title">Remarks:</div>
            <p style="border-bottom: 1px dotted #000; min-height: 40px;">${woundData.remarks || ''}</p>

            <div class="footer">
                <div></div>
                <div style="text-align: center;">
                    <div style="font-weight: bold;">Dr. ${mlcData.doctor_first_name || ''} ${mlcData.doctor_last_name || ''}</div>
                    <div>Reg No.: ${mlcData.registration_number || ''}</div>
                    <div style="margin-top: 30px;">Signature & Hospital Seal</div>
                </div>
            </div>

            <div class="police-section">
                <div class="header">
                    <h2>POLICE-USE WOUND CERTIFICATE FORMAT</h2>
                </div>
                 <div class="row">
                    <div class="col field-line">
                        <span class="field-label">Police Station:</span>
                        <span class="field-value">${mlcData.police_station || ''}</span>
                    </div>
                </div>
                 <div class="field-line">
                    <span class="field-label">Patient Name:</span>
                    <span class="field-value">${patient.first_name} ${patient.last_name}</span>
                </div>
                <div class="section-title">Injuries Certified</div>
                <p style="border-bottom: 1px dotted #000; min-height: 40px;">${woundData.examination_findings || ''}</p>
                
                <div class="section-title">Opinion for Investigation</div>
                 <div class="field-line">
                    <span class="field-label">Nature of Injuries:</span>
                    <span class="field-value">${woundData.nature_of_injury}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">Weapon Used:</span>
                    <span class="field-value">${woundData.alleged_cause || ''}</span>
                </div>
                 <div class="field-line">
                    <span class="field-label">Whether injuries possible as alleged:</span>
                    <span class="field-value">Yes / No</span>
                </div>
                
                <div class="footer">
                     <div style="text-align: right;">
                        <div style="font-weight: bold;">Dr. ${mlcData.doctor_first_name || ''} ${mlcData.doctor_last_name || ''}</div>
                        <div style="margin-top: 20px;">Signature & Seal</div>
                    </div>
                </div>
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
