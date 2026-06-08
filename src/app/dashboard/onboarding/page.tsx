'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, FileText, MapPin, ShieldCheck, HelpCircle, Eye } from 'lucide-react';

export default function OnboardingTab() {
  const supabase = createClient();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    principalAmount: '20000',
    interestRate: '24',
    installmentAmount: '248',
    tenure: 'Daily',
    totalInstallments: '100',
    governmentId: '',
    residentialAddress: '',
    collateralDetails: '',
    guarantorContact: ''
  });

  const [idDocumentName, setIdDocumentName] = useState('');
  const [signedFormName, setSignedFormName] = useState('');
  const [loading, setLoading] = useState(false);

  // DYNAMIC MATH HANDLER 1: Fires when Principal, Rate, or Cycles change
  const recalculateInstallment = (principal: string, rate: string, cycles: string) => {
    const P = parseFloat(principal || '0');
    const R = parseFloat(rate || '0');
    const C = parseInt(cycles || '1');

    if (P > 0 && C > 0) {
      const totalPayableDebt = P + (P * (R / 100));
      const preciseInstallment = totalPayableDebt / C;
      return Math.ceil(preciseInstallment).toString();
    }
    return '0';
  };

  // DYNAMIC MATH HANDLER 2: Fires when the Installment Target is typed manually
  const reverseCalculateInterest = (installment: string, principal: string, cycles: string) => {
    const I = parseFloat(installment || '0');
    const P = parseFloat(principal || '0');
    const C = parseInt(cycles || '1');

    if (I > 0 && P > 0 && C > 0) {
      const targetTotalDebt = I * C;
      const computedRate = ((targetTotalDebt - P) / P) * 100;
      return parseFloat(computedRate.toFixed(2)).toString();
    }
    return '0';
  };

  // Input Monitor Tracker Engine
  const handleInputChange = (field: string, value: string) => {
    let updatedFields = { ...formData, [field]: value };

    if (field === 'principalAmount' || field === 'interestRate' || field === 'totalInstallments') {
      const newInstallment = recalculateInstallment(
        field === 'principalAmount' ? value : formData.principalAmount,
        field === 'interestRate' ? value : formData.interestRate,
        field === 'totalInstallments' ? value : formData.totalInstallments
      );
      updatedFields.installmentAmount = newInstallment;
    } 
    else if (field === 'installmentAmount') {
      const newRate = reverseCalculateInterest(
        value,
        formData.principalAmount,
        formData.totalInstallments
      );
      updatedFields.interestRate = newRate;
    }

    setFormData(updatedFields);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const P = parseFloat(formData.principalAmount);
    const R = parseFloat(formData.interestRate);
    const fullPhone = `+91${formData.clientPhone.replace(/\D/g, '')}`;
    const defaultPass = 'SLU-Client-123!';

    const { error: loanError } = await supabase.from('live_loans').insert([{
      client_name: formData.clientName.trim(),
      client_email: formData.clientEmail.trim().toLowerCase(),
      client_phone: fullPhone,
      principal_amount: P,
      installment_amount: parseFloat(formData.installmentAmount),
      tenure_type: formData.tenure,
      total_cycles: parseInt(formData.totalInstallments),
      interest_rate: R,
      status: 'Verification_Pending',
      government_id_number: formData.governmentId,
      residential_address: formData.residentialAddress,
      collateral_asset_details: formData.collateralDetails,
      guarantor_emergency_contact: formData.guarantorContact,
      uploaded_id_document_url: idDocumentName || 'ID_Attached.pdf',
      signed_agreement_document_url: signedFormName || 'Signed_Sheet.pdf',
      system_access_password: defaultPass,
      loan_issued_date: new Date().toISOString()
    }]);

    if (loanError) { 
      alert(`Database Fault: ${loanError.message}`); 
      setLoading(false); 
      return; 
    }

    await supabase.from('user_profiles').insert([{
      id: crypto.randomUUID(),
      full_name: formData.clientName.trim(),
      email: formData.clientEmail.trim().toLowerCase(),
      phone_number: fullPhone,
      password_hash: defaultPass,
      role: 'client'
    }]);

    alert(`Account Provisioned: ${formData.clientName} is live under default key: ${defaultPass}`);
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-xl font-black flex items-center gap-2 text-white"><UserPlus className="text-emerald-500" /> New Client Loan Onboarding</h2>
        <p className="text-xs text-slate-400 mt-0.5">Underwrite profiles, establish auto-calculated parameters, and provision login records instantly.</p>
      </div>

      <form onSubmit={handleCreateLoan} className="space-y-6">
        {/* 1. PRIMARY CONTACTS */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">1. Primary Contacts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Client Full Name</label>
              <input required type="text" value={formData.clientName} onChange={e => handleInputChange('clientName', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
              <input required type="email" value={formData.clientEmail} onChange={e => handleInputChange('clientEmail', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="e.g. user@domain.com" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Mobile Phone Number (10 Digits)</label>
            <input required type="text" value={formData.clientPhone} onChange={e => handleInputChange('clientPhone', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="7075516605" />
          </div>
        </div>

        {/* 2. RISK PARAMETERS */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">2. Risk Verification Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><FileText className="h-3 w-3" /> Identity Identification (PAN / Aadhaar)</label>
              <input required type="text" value={formData.governmentId} onChange={e => handleInputChange('governmentId', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="PAN/Aadhaar string..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Backup Reference Guarantor</label>
              <input required type="text" value={formData.guarantorContact} onChange={e => handleInputChange('guarantorContact', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="Guarantor Name & Contact" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Home Residential Coordinates</label>
            <textarea required rows={2} value={formData.residentialAddress} onChange={e => handleInputChange('residentialAddress', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="Full home coordinates..." />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Security Collateral Note</label>
            <input required type="text" value={formData.collateralDetails} onChange={e => handleInputChange('collateralDetails', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none" placeholder="e.g. Gold asset weight, vehicle tracking serials..." />
          </div>
        </div>

        {/* 3. LEGAL ARCHIVES */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">3. Legal Document Archives</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-300">Identity Scan File Upload</span>
              <label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs font-bold uppercase">{idDocumentName || 'Choose ID Document'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setIdDocumentName(e.target.files[0].name); }} /></label>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-300">Physical Signed Contract Sheet</span>
              <label className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-900 text-slate-400 cursor-pointer text-xs font-bold uppercase">{signedFormName || 'Choose Signed Form'}<input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setSignedFormName(e.target.files[0].name); }} /></label>
            </div>
          </div>
        </div>

        {/* 4. STRUCTURAL REPAYMENTS (DYNAMIC SYSTEM ENGINE) */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1">4. Structural Repayments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Principal Financed</label>
              <input type="number" value={formData.principalAmount} onChange={e => handleInputChange('principalAmount', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Interest Rate (%)</label>
              <input type="number" step="0.01" value={formData.interestRate} onChange={e => handleInputChange('interestRate', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-400 uppercase">Installment Target</label>
              <input type="number" value={formData.installmentAmount} onChange={e => handleInputChange('installmentAmount', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-400 text-emerald-400 font-black text-sm focus:outline-none shadow-md shadow-emerald-950/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Repayment Cycle</label>
              <select value={formData.tenure} onChange={e => handleInputChange('tenure', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"><option value="Daily">Daily Basis</option><option value="Weekly">Weekly Basis</option><option value="Monthly">Monthly Basis</option></select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Total Cycles</label>
              <input type="number" value={formData.totalInstallments} onChange={e => handleInputChange('totalInstallments', e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg">{loading ? 'Provisioning Accounts...' : 'Lock Profile & Initialize Credentials'}</button>
      </form>
    </div>
  );
}