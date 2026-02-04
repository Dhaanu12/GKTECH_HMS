# Feasibility Study: Fetching Patient Details via Aadhaar Number

## Executive Summary
You asked if it is possible to automatically populate **Name, Age, and Gender** simply by typing an **Aadhaar Number** in the OPD Entry form.

**The Short Answer:**
**No, you cannot primarily just "type and fetch" details directly.**
Direct access to the UIDAI (Aadhaar) database to pull demographic data based *solely* on a number is **strictly prohibited** for security and privacy reasons.

However, there are legal and technical ways to achieve similar results, but they require complex integration and user interaction (OTP).

---

## 1. Why direct fetching is not possible
The Unique Identification Authority of India (UIDAI) does not provide an open API where you can send an Aadhaar Number and get back personal details. This is to prevent data mining and privacy violations.

## 2. The Only Legal Method: e-KYC (Know Your Customer)
To fetch details from Aadhaar, your application would need to perform **e-KYC**. This involves:

1.  **User Consent:** The patient must agree to share their details.
2.  **Authentication:** You must trigger an **OTP (One Time Password)** sent to the patient's Aadhaar-linked mobile number OR use a **Biometric Device** (fingerprint/iris scanner).
3.  **License:** Your hospital/software provider must be registered as a **KUA (KYC User Agency)** or use a **Sub-KUA** provider (third-party service).

**The Workflow would look like this:**
1.  Enter Aadhaar Number.
2.  Click "Verify" -> User receives OTP on mobile.
3.  Enter OTP.
4.  If OTP matches -> Name, Age, Gender, Address are auto-filled.

## 3. The Better Alternative: ABHA (Ayushman Bharat Health Account)
The Indian government (NHA) is promoting **ABHA** (formerly Health ID) for hospitals.
*   **How it works:** You integrate with the **ABDM (Ayushman Bharat Digital Mission)** sandbox.
*   **Benefit:** Patients can share their profile via their ABHA Address (e.g., `name@abdm`).
*   **Process:** Similar to Aadhaar, it requires an OTP verification to fetch the profile.

## 4. Technical Recommendation
For a standard hospital management system (HMS) like this, fully integrating Aadhaar e-KYC is often:
*   **Too Expensive:** Third-party APIs charge per verification (approx ₹5 - ₹20 per check).
*   **Legally Complex:** Requires strict data auditing and security compliance.
*   **User Friction:** Waiting for OTPs for every OPD entry might slow down the queue.

### Best Practice for your App:
1.  **Local Database:** When you type the Aadhaar number, check **YOUR own database** first. If the patient visited before, auto-fill the details.
2.  **QR Code Scan:** If the patient has their physical Aadhaar card, you can implement a **QR Code Scanner** (using a webcam or barcode gun).
    *   **Pros:** The QR code on the Aadhaar card contains Name, DOB, Gender, and masked Aadhaar number in a secure XML/text format.
    *   **Feasibility:** **High.** This is free, offline, and instant. You just need to write logic to parse the QR code data.

## Conclusion
If you want to auto-fill details **without** OTPs or expensive licenses, I recommend implementing **Aadhaar QR Code Scanning** or simply searching your local database history. Typing the number to fetch live data from the government is not feasible for a standard app.
