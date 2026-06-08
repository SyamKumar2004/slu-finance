'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Percent, FileText, MapPin, ShieldCheck, HelpCircle, ArrowRight, Upload, FileCheck } from 'lucide-react';

export default function OnboardingTab() {
  const supabase = createClient();
  const router = useRouter();
  const [formData, setFormData] = useState({ clientName: '', clientEmail: '', clientPhone: '', principalAmount: '10000', installmentAmount: '110', tenure: 'Daily', totalInstallments: '100', interestRate: '24', governmentId: '', residentialAddress: '', collateralDetails: '', guarantorContact: '' });
  const [idDocumentName, setIdDocumentName] = useState('');
  const [signedFormName, setSignedFormName] = useState('');

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const P = parseFloat(formData.principalAmount);
    const R = parseFloat(formData.interestRate);
    const totalPayableDebt = P + (P * (R / 100));

    await supabase.from('live_loans').insert([{
      client_name: formData.clientName, client_email: formData.clientEmail, client_phone: `+91${formData.clientPhone}`,
      principal_amount: P, installment_amount: parseFloat(formData.installmentAmount), tenure_type: formData.tenure, total_cycles: parseInt(formData.totalInstallments), interest_rate: R,
      status: 'Verification_Pending', government_id_number: formData.governmentId, residential_address: formData.residentialAddress, collateral_asset_details: formData.collateralDetails, guarantor_emergency_contact: formData.guarantorContact,
      uploaded_id_document_url: idDocumentName || 'ID_Attached.pdf', signed_agreement_document_url: signedFormName || 'Signed_Sheet.pdf', loan_issued_date: new Date().toISOString()
    }]);

    if (formData.clientEmail) {
      const subject = encodeURIComponent(`Action Required: Loan Terms Signature Verification`);
      const body = encodeURIComponent(`Dear ${formData.clientName},\n\nYour application has been logged under status Verification_Pending.\n\nTotal Contract Liabilities: ₹${totalPayableDebt.toLocaleString()}\nInstallment Target: ₹${formData.installmentAmount} (${formData.tenure})\n\nPlease reply with confirmation to active your profile.\n\nSLU Finance`);
      window.location.href = `mailto:${formData.clientEmail}?subject=${subject}&body=${body}`;
    }

    alert(`Success: ${formData.clientName} onboarded under holding check stage!`);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-xl font-black flex items-center gap-2 text-white"><UserPlus className="text-emerald-500" /> New Client Loan Onboarding</h2>
        <p className="text-xs text-slate-400 mt-0.5">Collect background check data parameters, link identification variables, and trigger swift validation email templates.</p>
      </div>
      <form onSubmit={handleCreateLoan} className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">1. Primary Contacts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Client Full Name (Holder Name)</label><input required type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="e.g. John Doe" /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase">Email Address Address</label><input required type="email" value={formData.clientEmail} onChange={e => setFormData({ ...formData, clientEmail: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="e.g. user@domain.com" /></div>
          </div>
          <div><label className="text-xs font-bold text-slate-400 uppercase">Mobile Phone Number Contact</label><input required type="text" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value.replace(/\D/g, '').slice(0,10) })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="XXXXX-XXXXX (10 Digits)" /></div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">2. Risk Verification Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><FileText className="h-3 w-3" /> Identity Card Identification (Aadhaar / PAN)</label><input required type="text" value={formData.governmentId} onChange={e => setFormData({ ...formData, governmentId: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="XXXX-XXXX-XXXX Format" /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Backup Reference Guarantor</label><input required type="text" value={formData.guarantorContact} onChange={e => setFormData({ ...formData, guarantorContact: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="Guarantor Name & Phone contact ID" /></div>
          </div>
          <div><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Home Residential Coordinates</label><textarea required rows={2} value={formData.residentialAddress} onChange={e => setFormData({ ...formData, residentialAddress: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="Full home landmarks, street, village layout..." /></div>
          <div><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Underwritten Pledged Security Collateral Asset Note</label><input required type="text" value={formData.collateralDetails} onChange={e => setFormData({ ...formData, collateralDetails: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="e.g. Gold asset weight weight, original vehicle papers..." /></div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">3. Legal Document Archives</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"><span className="text-xs font-bold text-slate-300">Identity Scan File Upload</span><label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs font-bold uppercase">{idDocumentName || 'Choose ID Document'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setIdDocumentName(e.target.files[0].name); }} /></label></div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"><span className="text-xs font-bold text-slate-300">Physical Signed Mutual Contract Sheet</span><label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs font-bold uppercase">{signedFormName || 'Choose Signed Form'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setSignedFormName(e.target.files[0].name); }} /></label></div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">4. Structural Repayments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Principal Financed</label><input type="number" value={formData.principalAmount} onChange={e => setFormData({ ...formData, principalAmount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold" /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase">Interest Charging Rate (%)</label><input type="number" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold" /></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase">Installment Target Target</label><input type="number" value={formData.installmentAmount} onChange={e => setFormData({ ...formData, installmentAmount: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Repayment Cycle</label><select value={formData.tenure} onChange={e => setFormData({ ...formData, tenure: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"><option value="Daily">Daily Basis</option><option value="Weekly">Weekly Basis</option><option value="Monthly">Monthly Basis</option></select></div>
            <div><label className="text-xs font-bold text-slate-400 uppercase">Total Cycles</label><input type="number" value={formData.totalInstallments} onChange={e => setFormData({ ...formData, totalInstallments: e.target.value })} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold" /></div>
          </div>
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md">Lock Profile & Dispatch Check Link</button>
      </form>
    </div>
  );
}