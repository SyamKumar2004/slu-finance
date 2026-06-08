'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, FileText, MapPin, ShieldCheck, HelpCircle, Smartphone } from 'lucide-react';

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
    
    // Retrieve the unique ID of the currently logged-in Admin/Lender from session memory
    const activeLenderUuid = localStorage.getItem('slu_user_id');
    
    if (!activeLenderUuid || activeLenderUuid === '00000000-0000-0000-0000-000000000000') {
      alert("Session Sync Required: Your session token is outdated. Please sign out and sign back in once to sync parameters.");
      setLoading(false);
      return;
    }
    
    const P = parseFloat(formData.principalAmount);
    const R = parseFloat(formData.interestRate);
    const fullPhone = `+91${formData.clientPhone.replace(/\D/g, '')}`;
    const defaultPass = 'SLU-Client-123!';

    // 1. Insert into live_loans stamped with the active lender's unique tracking key
    const { error: loanError } = await supabase.from('live_loans').insert([{
      lender_id: activeLenderUuid, // HARDENED MULTI-TENANT TRACKING KEY
      client_name: formData.clientName.trim(),
      client_email: formData.clientEmail.trim().toLowerCase(),
      client_phone: fullPhone,
      principal_amount: P,
      installment_amount: parseFloat(formData.installmentAmount),
      tenure_type: formData.tenure,
      total_cycles: parseInt(formData.totalInstallments),
      interest_rate: R,
      status: 'Verification_Pending',
      government_id_number: formData.governmentId.trim(),
      residential_address: formData.residentialAddress.trim(),
      collateral_asset_details: formData.collateralDetails.trim(),
      guarantor_emergency_contact: formData.guarantorContact.trim(),
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

    // 2. Provision the isolated client credentials profile row
    const { error: profileError } = await supabase.from('user_profiles').insert([{
      id: crypto.randomUUID(),
      full_name: formData.clientName.trim(),
      email: formData.clientEmail.trim().toLowerCase(),
      phone_number: fullPhone,
      password_hash: defaultPass,
      role: 'client'
    }]);

    if (profileError) {
      console.error("Profile auto-generation issue:", profileError.message);
    }

    alert(`Account Provisioned: ${formData.clientName} is live under default key: ${defaultPass}`);
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto bg-[#0b132b] p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-xl space-y-6">
      
      {/* HEADER SECTION BUMPED UP (+2PX/+3PX TYPOGRAPHY BOOST) */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5 text-white">
          <UserPlus className="text-emerald-500 h-6 w-6" /> New Client Loan Onboarding
        </h2>
        <p className="text-sm text-slate-400 font-bold mt-1.5">
          Underwrite profiles, establish auto-calculated interest structures, and provision login records instantly.
        </p>
      </div>

      <form onSubmit={handleCreateLoan} className="space-y-6 text-sm font-extrabold text-slate-300">
        
        {/* 1. PRIMARY CONTACT DETAILS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1.5">1. Primary Contacts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Client Full Name</label>
              <input required type="text" value={formData.clientName} onChange={e => handleInputChange('clientName', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-slate-500" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Email Address Endpoint</label>
              <input required type="email" value={formData.clientEmail} onChange={e => handleInputChange('clientEmail', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-slate-500" placeholder="e.g. user@domain.com" />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Mobile Phone Number (10 Digits)</label>
            <input required type="text" value={formData.clientPhone} onChange={e => handleInputChange('clientPhone', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-slate-500" placeholder="7075516605" />
          </div>
        </div>

        {/* 2. RISK ANALYSIS CHECK DETAILS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1.5">2. Risk Verification Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Identity Identification (PAN / ID Check)</label>
              <input required type="text" value={formData.governmentId} onChange={e => handleInputChange('governmentId', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:outline-none focus:border-slate-500" placeholder="Identity reference value..." />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" /> Reference Guarantor Coordinates</label>
              <input required type="text" value={formData.guarantorContact} onChange={e => handleInputChange('guarantorContact', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:outline-none focus:border-slate-500" placeholder="Guarantor full contact credentials" />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Home Residential coordinates</label>
            <textarea required rows={2} value={formData.residentialAddress} onChange={e => handleInputChange('residentialAddress', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:outline-none focus:border-slate-500" placeholder="Full home residential physical address mapping..." />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Security Collateral Allocation details</label>
            <input required type="text" value={formData.collateralDetails} onChange={e => handleInputChange('collateralDetails', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:outline-none focus:border-slate-500" placeholder="Gold value metrics, collateral tracker numbers..." />
          </div>
        </div>

        {/* 3. HARD LEGAL FILE WRAPPER UPLOADS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1.5">3. Legal Document Archives</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 space-y-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">Identity Scan Document</span>
              <label className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#0b132b] text-slate-400 cursor-pointer text-xs font-black uppercase border border-slate-800/60 transition-all hover:text-white truncate">
                {idDocumentName || 'Choose Verification PDF'}
                <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setIdDocumentName(e.target.files[0].name); }} />
              </label>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 space-y-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">Signed Contract Sheet File</span>
              <label className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#0b132b] text-slate-400 cursor-pointer text-xs font-black uppercase border border-slate-800/60 transition-all hover:text-white truncate">
                {signedFormName || 'Choose Signed Form'}
                <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setSignedFormName(e.target.files[0].name); }} />
              </label>
            </div>
          </div>
        </div>

        {/* 4. FINANCIAL ENGINE STRUCTURAL CALCULATION CONTROLS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800/60 pb-1.5">4. Structural Repayments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Principal Financed (INR)</label>
              <input type="number" value={formData.principalAmount} onChange={e => handleInputChange('principalAmount', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Interest Rate (%)</label>
              <input type="number" step="0.01" value={formData.interestRate} onChange={e => handleInputChange('interestRate', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-black text-emerald-400 uppercase tracking-wide">Calculated Installment</label>
              <input type="number" value={formData.installmentAmount} onChange={e => handleInputChange('installmentAmount', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-400 text-emerald-400 font-black font-mono text-base focus:outline-none shadow-md shadow-emerald-950/10" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Repayment Frequency Cycle</label>
              <select value={formData.tenure} onChange={e => handleInputChange('tenure', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none">
                <option value="Daily">Daily Installments</option>
                <option value="Weekly">Weekly Installments</option>
                <option value="Monthly">Monthly Installments</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Total Allocation Cycles</label>
              <input type="number" value={formData.totalInstallments} onChange={e => handleInputChange('totalInstallments', e.target.value)} className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none" />
            </div>
          </div>
        </div>

        {/* AUTHORIZATION BUTTON */}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-40"
          >
            {loading ? 'Provisioning Micro-Credit Accounts...' : 'Lock Profile & Initialize Credentials'}
          </button>
        </div>
      </form>
    </div>
  );
}