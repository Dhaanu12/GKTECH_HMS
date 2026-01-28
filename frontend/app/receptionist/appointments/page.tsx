'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Calendar, FileText, X, Save, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const API_URL = 'http://localhost:5000/api';

export default function AppointmentsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showOpdModal, setShowOpdModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

    const [appointmentForm, setAppointmentForm] = useState({
        patient_name: '',
        phone_number: '',
        email: '',
        age: '',
        gender: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        reason_for_visit: '',
        notes: ''
    });

    const [opdForm, setOpdForm] = useState({
        first_name: '',
        last_name: '',
        age: '',
        gender: '',
        contact_number: '',
        doctor_id: '',
        visit_type: 'Walk-in',
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: new Date().toTimeString().slice(0, 5),
        chief_complaint: '',
        symptoms: '',
        vital_signs: {
            bp_systolic: '',
            bp_diastolic: '',
            pulse: '',
            temperature: '',
            weight: '',
            height: '',
            spo2: ''
        },
        consultation_fee: '',
        payment_status: 'Pending',
        adhaar_number: '',
        blood_group: ''
    });

    useEffect(() => {
        fetchDoctors();
        fetchAppointments();
    }, []);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/doctors/my-branch`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data.data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/appointments`, appointmentForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment created successfully!');
            setShowModal(false);
            resetAppointmentForm();
            fetchAppointments();
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            alert(error.response?.data?.message || 'Failed to create appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/appointments/${appointmentId}/status`, {
                status: 'Cancelled',
                cancellation_reason: 'Cancelled by receptionist'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Appointment cancelled successfully!');
            fetchAppointments();
        } catch (error: any) {
            console.error('Error cancelling appointment:', error);
            alert(error.response?.data?.message || 'Failed to cancel appointment');
        } finally {
            setLoading(false);
        }
    };

    const convertToOPD = (appointment: any) => {
        // Split patient name into first and last
        const nameParts = appointment.patient_name?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Find the doctor to get consultation fee
        const selectedDoc = doctors.find((d: any) => d.doctor_id === appointment.doctor_id);
        const consultationFee = selectedDoc?.consultation_fee?.toString() || '';

        setOpdForm({
            first_name: firstName,
            last_name: lastName,
            age: appointment.age?.toString() || '',
            gender: appointment.gender || '',
            contact_number: appointment.phone_number || '',
            doctor_id: appointment.doctor_id || '',
            visit_type: 'Appointment',
            visit_date: new Date().toISOString().split('T')[0],
            visit_time: new Date().toTimeString().slice(0, 5),
            chief_complaint: appointment.reason_for_visit || '',
            symptoms: appointment.notes || '',
            vital_signs: {
                bp_systolic: '',
                bp_diastolic: '',
                pulse: '',
                temperature: '',
                weight: '',
                height: '',
                spo2: ''
            },
            consultation_fee: consultationFee,
            payment_status: 'Pending',
            adhaar_number: '',
            blood_group: ''
        });

        setSelectedAppointment(appointment);
        setShowOpdModal(true);
    };

    const handleCreateOPD = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...opdForm,
                patient_id: selectedAppointment?.patient_id,
                appointment_id: selectedAppointment?.appointment_id,
                vital_signs: JSON.stringify(opdForm.vital_signs)
            };

            await axios.post(`${API_URL}/opd`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });



            alert('OPD Entry created successfully!');
            setShowOpdModal(false);
            setSelectedAppointment(null);
            fetchAppointments();
        } catch (error: any) {
            console.error('Error creating OPD entry:', error);
            alert(error.response?.data?.message || 'Failed to create OPD entry');
        } finally {
            setLoading(false);
        }
    };

    const resetAppointmentForm = () => {
        setAppointmentForm({
            patient_name: '',
            phone_number: '',
            email: '',
            age: '',
            gender: '',
            doctor_id: '',
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '',
            reason_for_visit: '',
            notes: ''
        });
    };

    const doctorOptions = doctors.map((doc: any) => ({
        value: doc.doctor_id,
        label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization})`
    }));

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-gray-600 text-sm mt-1">Schedule and manage patient appointments</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-5 h-5" />
                    New Appointment
                </button>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Appointment #</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Reason</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {appointments.map((apt: any) => (
                                <tr key={apt.appointment_id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-mono text-purple-700 font-medium">{apt.appointment_number}</div>
                                        <div className="text-xs text-gray-500">{new Date(apt.booking_date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{apt.patient_name}</div>
                                        <div className="text-xs text-gray-500">{apt.phone_number}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</div>
                                        <div className="text-xs text-gray-500">{apt.specialization}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{new Date(apt.appointment_date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{apt.appointment_time}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 max-w-xs truncate">{apt.reason_for_visit || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${apt.appointment_status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            apt.appointment_status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                apt.appointment_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {apt.appointment_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {apt.appointment_status === 'Scheduled' || apt.appointment_status === 'Confirmed' ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => convertToOPD(apt)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                    Convert to OPD
                                                </button>
                                                <button
                                                    onClick={() => handleCancelAppointment(apt.appointment_id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {appointments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p>No appointments found. Create your first appointment!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Appointment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-xl font-bold">New Appointment</h2>
                            <button onClick={() => { setShowModal(false); resetAppointmentForm(); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAppointment} className="p-6 space-y-6">
                            {/* Patient Info */}
                            <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-lg p-5 border border-purple-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Patient Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name <span className="text-red-500">*</span></label>
                                        <input type="text" required value={appointmentForm.patient_name} onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={appointmentForm.phone_number}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "");
                                                if (value.length <= 10) {
                                                    setAppointmentForm({ ...appointmentForm, phone_number: value });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            placeholder="10-digit number"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" value={appointmentForm.email} onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                        <input type="number" value={appointmentForm.age} onChange={(e) => setAppointmentForm({ ...appointmentForm, age: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select value={appointmentForm.gender} onChange={(e) => setAppointmentForm({ ...appointmentForm, gender: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Pediatric">Pediatric</option>
                                            <option value="Other">Other</option>

                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Details */}
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-5 border border-blue-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Appointment Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <SearchableSelect label="Doctor *" options={doctorOptions} value={appointmentForm.doctor_id} onChange={(val) => setAppointmentForm({ ...appointmentForm, doctor_id: val })} placeholder="Select Doctor" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                                        <input type="date" required value={appointmentForm.appointment_date} onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
                                        <input type="time" required value={appointmentForm.appointment_time} onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit <span className="text-red-500">*</span></label>
                                        <input type="text" required value={appointmentForm.reason_for_visit} onChange={(e) => setAppointmentForm({ ...appointmentForm, reason_for_visit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., Routine checkup" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea rows={2} value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Any additional notes..." />
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button type="button" onClick={() => { setShowModal(false); resetAppointmentForm(); }} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-medium shadow-lg shadow-purple-500/30">
                                    <Save className="w-5 h-5" />
                                    {loading ? 'Creating...' : 'Create Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* OPD Conversion Modal (Same as OPD Entry but pre-filled) */}
            {showOpdModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold">Convert Appointment to OPD Entry</h2>
                                <p className="text-sm text-blue-100 mt-1">Appointment: {selectedAppointment?.appointment_number}</p>
                            </div>
                            <button onClick={() => { setShowOpdModal(false); setSelectedAppointment(null); }} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOPD} className="p-6 space-y-6">
                            {/* Patient Info (Pre-filled) */}
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-5 border border-blue-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Patient Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label><input type="text" required value={opdForm.first_name} onChange={(e) => setOpdForm({ ...opdForm, first_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label><input type="text" required value={opdForm.last_name} onChange={(e) => setOpdForm({ ...opdForm, last_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label><input type="number" required value={opdForm.age} onChange={(e) => setOpdForm({ ...opdForm, age: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label><select required value={opdForm.gender} onChange={(e) => setOpdForm({ ...opdForm, gender: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option><option value="Pediatric">Pediatric</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={opdForm.contact_number}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "");
                                                if (value.length <= 10) {
                                                    setOpdForm({ ...opdForm, contact_number: value });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="10-digit number"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                        <select value={opdForm.blood_group} onChange={(e) => setOpdForm({ ...opdForm, blood_group: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adhaar Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={opdForm.adhaar_number}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "");
                                                if (value.length <= 12) {
                                                    setOpdForm({ ...opdForm, adhaar_number: value });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="12-digit UID"
                                            maxLength={12}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Visit Details */}
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-5 border border-blue-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Visit Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label><select value={opdForm.visit_type} onChange={(e) => setOpdForm({ ...opdForm, visit_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="Walk-in">Walk-in</option><option value="Appointment">Appointment</option><option value="Follow-up">Follow-up</option><option value="Emergency">Emergency</option><option value="Referral">Referral</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={opdForm.visit_date} onChange={(e) => setOpdForm({ ...opdForm, visit_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="time" value={opdForm.visit_time} onChange={(e) => setOpdForm({ ...opdForm, visit_time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                    <div><SearchableSelect label="Doctor *" options={doctorOptions} value={opdForm.doctor_id} onChange={(val) => setOpdForm({ ...opdForm, doctor_id: val })} placeholder="Select Doctor" /></div>
                                </div>
                            </div>

                            {/* Clinical Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint <span className="text-red-500">*</span></label><textarea required rows={3} value={opdForm.chief_complaint} onChange={(e) => setOpdForm({ ...opdForm, chief_complaint: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Main reason for visit..." /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label><textarea rows={3} value={opdForm.symptoms} onChange={(e) => setOpdForm({ ...opdForm, symptoms: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Observed symptoms..." /></div>
                            </div>

                            {/* Vitals */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-lg p-5 border border-purple-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Vital Signs</h3>
                                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">BP Sys</label><input type="text" value={opdForm.vital_signs.bp_systolic} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, bp_systolic: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="mmHg" /></div>
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">BP Dia</label><input type="text" value={opdForm.vital_signs.bp_diastolic} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, bp_diastolic: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="mmHg" /></div>
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Pulse</label><input type="text" value={opdForm.vital_signs.pulse} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, pulse: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="bpm" /></div>
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Temp</label><input type="text" value={opdForm.vital_signs.temperature} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, temperature: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="°F" /></div>
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Weight</label><input type="text" value={opdForm.vital_signs.weight} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, weight: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="kg" /></div>
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Height</label><input type="text" value={opdForm.vital_signs.height} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, height: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="cm" /></div>
                                    <div><label className="block text-xs font-medium text-gray-500 mb-1">SpO2</label><input type="text" value={opdForm.vital_signs.spo2} onChange={(e) => setOpdForm({ ...opdForm, vital_signs: { ...opdForm.vital_signs, spo2: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="%" /></div>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-lg p-5 border border-green-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label><div className="relative"><span className="absolute left-3 top-2.5 text-gray-500">₹</span><input type="number" value={opdForm.consultation_fee} onChange={(e) => setOpdForm({ ...opdForm, consultation_fee: e.target.value })} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label><select value={opdForm.payment_status} onChange={(e) => setOpdForm({ ...opdForm, payment_status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Waived">Waived</option></select></div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button type="button" onClick={() => { setShowOpdModal(false); setSelectedAppointment(null); }} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
                                <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium shadow-lg shadow-blue-500/30">
                                    <Save className="w-5 h-5" />
                                    {loading ? 'Creating...' : 'Create OPD Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
