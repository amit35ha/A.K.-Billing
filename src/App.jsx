import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Save, FolderOpen, LogOut, Trash2, FileText, Receipt, PlusCircle, Sun, Moon } from 'lucide-react';
import BillForm from './components/BillForm';
import BillPreview from './components/BillPreview';
import InvoicePreview from './components/InvoicePreview';
import Login from './components/Login';
import { DialogProvider, useDialog } from './components/ModalDialog';

const defaultBillData = {
  billType: 'Final Bill',
  partBillNumber: '1st',
  taxType: 'With GST & Cess',
  contractorName: '',
  partyCode: '',
  address: '',
  gstin: '',
  pan: '',
  workName: '',
  department: 'Lighting',
  zone: 'II',
  workOrderNo: '',
  workOrderDate: '',
  dateOfCommencement: '',
  dateOfCompletion: '',
  mbNo: '',
  mbPageNo: '',
  ubnNo: '',
  ebNo: '',
  invoiceNo: '',
  invoiceDate: '',
  items: [
    {
      desc: '',
      qty: '',
      unit: 'Nos',
      rate: '',
      amount: ''
    }
  ]
};

function MainApp() {
  const { showAlert, showConfirm } = useDialog();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('kmc_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kmc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kmc_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('kmc_user')));
  const [loadedBillId, setLoadedBillId] = useState(null);
  const [billData, setBillData] = useState(defaultBillData);
  const [activeDoc, setActiveDoc] = useState('bill'); // 'bill' or 'invoice'

  const [savedBills, setSavedBills] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const previewRef = useRef(null);

  const handleNewBill = async () => {
    const ok = await showConfirm('Clear form and start a new blank bill? Any unsaved changes will be lost.', {
      title: 'Start New Bill',
      confirmText: 'Yes, New Bill',
      type: 'warning'
    });
    if (ok) {
      setBillData(defaultBillData);
      setLoadedBillId(null);
      setActiveDoc('bill');
    }
  };

  const getBillIdentifier = (data) => {
    const rawOrder = (data.workOrderNo || '').trim() || 'Draft';
    if (data.billType === 'Part Bill') {
      const part = (data.partBillNumber || '1st').trim();
      return `${rawOrder} (${part} Part Bill)`;
    }
    return rawOrder;
  };

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills');
      const data = await response.json();
      setSavedBills(Array.isArray(data) ? data : []);
      setShowSaved(true);
    } catch {
      await showAlert('Error fetching bills. Is the server running?', {
        title: 'Network Error',
        type: 'error'
      });
    }
  };

  const saveBill = async () => {
    const rawOrder = (billData.workOrderNo || '').trim();
    if (!rawOrder) {
      const ok = await showConfirm('Work Order No. is empty. Do you want to save as "Draft"?', {
        title: 'Empty Work Order No.',
        confirmText: 'Save as Draft',
        type: 'warning'
      });
      if (!ok) {
        return;
      }
    }

    const identifier = getBillIdentifier(billData);

    try {
      // Check existing saved bills for duplicate
      const listRes = await fetch('/api/bills');
      const list = await listRes.json();
      const existing = Array.isArray(list) ? list.find((b) => {
        if (!b.workOrderNo) return false;
        const savedWo = b.workOrderNo.trim().toLowerCase();
        const targetId = identifier.trim().toLowerCase();
        if (savedWo === targetId) return true;

        if (billData.billType === 'Final Bill' || !billData.billType) {
          const raw = (rawOrder || 'draft').toLowerCase();
          return savedWo === raw || savedWo === `${raw} (final bill)`;
        } else {
          const partPattern = `${(rawOrder || 'draft').toLowerCase()} (${(billData.partBillNumber || '1st').toLowerCase()} part bill)`;
          return savedWo === partPattern;
        }
      }) : null;

      if (existing) {
        const confirmUpdate = await showConfirm(
          `A bill for "${existing.workOrderNo}" is already saved in the database!\n` +
          `${existing.workName ? `\nWork Name: ${existing.workName}\n` : ''}` +
          `\nDo you want to overwrite and update the existing bill?\n(Click Cancel to abort and prevent duplicate saving)`,
          {
            title: 'Overwrite Existing Bill?',
            confirmText: 'Overwrite Bill',
            type: 'warning'
          }
        );
        if (!confirmUpdate) {
          return;
        }

        const updateRes = await fetch(`/api/bills/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...billData,
            workOrderNo: identifier,
            contractorName: billData.contractorName || ''
          })
        });

        if (updateRes.ok) {
          setLoadedBillId(existing.id);
          await showAlert(`Bill "${identifier}" updated successfully!`, {
            title: 'Bill Updated',
            type: 'success'
          });
        } else {
          const err = await updateRes.json().catch(() => ({}));
          await showAlert(err.error || 'Failed to update bill', {
            title: 'Update Error',
            type: 'error'
          });
        }
        return;
      }

      // New bill save
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...billData,
          workOrderNo: identifier,
          contractorName: billData.contractorName || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLoadedBillId(result.id);
        await showAlert(`Bill "${identifier}" saved successfully!`, {
          title: 'Bill Saved',
          type: 'success'
        });
      } else {
        const err = await response.json().catch(() => ({}));
        await showAlert(err.error || 'Failed to save bill', {
          title: 'Save Error',
          type: 'error'
        });
      }
    } catch {
      await showAlert('Error saving bill. Is the server running?', {
        title: 'Connection Error',
        type: 'error'
      });
    }
  };

  const loadBill = async (id) => {
    try {
      const response = await fetch(`/api/bills/${id}`);
      const resData = await response.json();
      if (!resData || !resData.data) {
        await showAlert('Could not read bill data', {
          title: 'Error Loading Bill',
          type: 'error'
        });
        return;
      }

      const rawSavedWO = resData.data.workOrderNo || resData.workOrderNo || '';
      const rawOrderNo = rawSavedWO.replace(/\s*\((Final Bill|.*Part Bill)\)$/i, '').trim();
      const partMatch = rawSavedWO.match(/\((.*?) Part Bill\)/i);
      const isPart = Boolean(partMatch) || resData.data.billType === 'Part Bill';
      const billType = isPart ? 'Part Bill' : 'Final Bill';
      const partBillNumber = resData.data.partBillNumber || (partMatch ? partMatch[1] : '1st');

      const rawData = resData.data || {};
      const loadedItems = Array.isArray(rawData.items) && rawData.items.length > 0
        ? rawData.items
        : [{ desc: '', qty: '', unit: 'Nos', rate: '', amount: '' }];

      setBillData({
        ...defaultBillData,
        ...rawData,
        workOrderNo: rawOrderNo || rawSavedWO,
        billType,
        partBillNumber,
        taxType: rawData.taxType || 'With GST & Cess',
        items: loadedItems
      });
      setLoadedBillId(id);
      setShowSaved(false);
      setActiveDoc('bill');
      await showAlert(`Loaded ${billType === 'Part Bill' ? `${partBillNumber} Part Bill` : 'Final Bill'} for Work Order: ${rawOrderNo || 'Draft'}`, {
        title: 'Bill Loaded',
        type: 'success'
      });
    } catch (err) {
      console.error('Error loading bill:', err);
      await showAlert('Error loading bill', {
        title: 'Error',
        type: 'error'
      });
    }
  };

  const deleteBill = async (id) => {
    const ok = await showConfirm('Are you sure you want to delete this bill? This cannot be undone.', {
      title: 'Delete Bill',
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!ok) {
      return;
    }
    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await showAlert('Bill deleted successfully', {
          title: 'Bill Deleted',
          type: 'success'
        });
        setSavedBills((prev) => prev.filter((b) => b.id !== id));
        if (loadedBillId === id) {
          setLoadedBillId(null);
          setBillData(defaultBillData);
        }
      } else {
        await showAlert('Failed to delete bill', {
          title: 'Error',
          type: 'error'
        });
      }
    } catch {
      await showAlert('Error connecting to server to delete bill', {
        title: 'Connection Error',
        type: 'error'
      });
    }
  };

  const downloadPDF = async () => {
    const pages = document.querySelectorAll('.bill-document');
    if (pages.length === 0) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = await html2canvas(page, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      const fileLabel = getBillIdentifier(billData).replace(/[/\\?%*:|"<>]/g, '-');
      if (activeDoc === 'invoice') {
        pdf.save(`KMC-Tax-Invoice-${fileLabel}.pdf`);
      } else {
        pdf.save(`KMC-Bill-${fileLabel}.pdf`);
      }
    } catch {
      await showAlert('Failed to generate PDF', {
        title: 'Export Error',
        type: 'error'
      });
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('kmc_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem('kmc_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h1>KMC Billing System</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate standard Contractor's Bills & Tax Invoices for Kolkata Municipal Corporation</p>
          {currentUser && (
            <p style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.25rem', fontWeight: 500 }}>
              Logged in as: <strong>{currentUser.email}</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '9999px',
              padding: '0.5rem 0.9rem',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={17} color="#f59e0b" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={17} color="#6366f1" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleNewBill}
            title="Start a new blank bill"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={18} /> New Bill
          </button>
          <button className="btn btn-secondary" onClick={fetchBills}>
            <FolderOpen size={18} style={{ marginRight: '0.4rem' }} /> Load Bills
          </button>
          <button className="btn" onClick={saveBill} style={{ backgroundColor: '#10b981' }}>
            <Save size={18} style={{ marginRight: '0.4rem' }} /> Save Bill
          </button>
          <button
            className="btn"
            onClick={() => setActiveDoc(activeDoc === 'bill' ? 'invoice' : 'bill')}
            style={{
              display: 'flex',
              gap: '0.4rem',
              alignItems: 'center',
              backgroundColor: activeDoc === 'invoice' ? '#2563eb' : '#0891b2'
            }}
          >
            {activeDoc === 'invoice' ? <FileText size={18} /> : <Receipt size={18} />}
            {activeDoc === 'invoice' ? "View Contractor's Bill" : 'Generate Invoice'}
          </button>
          <button className="btn" onClick={downloadPDF} style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#2563eb' }}>
            <Download size={18} /> {activeDoc === 'invoice' ? 'Download Invoice PDF' : 'Download PDF'}
          </button>
          {loadedBillId && (
            <button
              className="btn btn-secondary"
              onClick={() => deleteBill(loadedBillId)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}
              title="Delete currently loaded bill"
            >
              <Trash2 size={18} /> Delete Loaded Bill
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            title="Log out"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', borderColor: '#fca5a5' }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {showSaved && (
        <div style={{ gridColumn: '1 / -1', background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderOpen size={20} color="#2563eb" /> Saved Bills
            </h3>
            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setShowSaved(false)}>
              Close
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {savedBills.map((bill) => {
              const isPart = bill.workOrderNo && /part bill/i.test(bill.workOrderNo);
              const partMatch = bill.workOrderNo ? bill.workOrderNo.match(/\((.*?) Part Bill\)/i) : null;
              const cleanWO = bill.workOrderNo
                ? bill.workOrderNo.replace(/\s*\((Final Bill|.*Part Bill)\)$/i, '').trim()
                : 'Draft';
              const typeLabel = isPart ? (partMatch ? `${partMatch[1]} Part Bill` : 'Part Bill') : 'Final Bill';

              return (
                <li
                  key={bill.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: loadedBillId === bill.id ? (theme === 'dark' ? '#064e3b' : '#f0fdf4') : 'var(--item-row-bg)',
                    borderRadius: '0.5rem',
                    border: loadedBillId === bill.id ? '1px solid #10b981' : '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        W.O. No: <span style={{ color: '#2563eb' }}>{cleanWO}</span>
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isPart ? '#fef3c7' : '#dcfce7',
                          color: isPart ? '#92400e' : '#166534',
                          border: isPart ? '1px solid #fde68a' : '1px solid #bbf7d0'
                        }}
                      >
                        {typeLabel}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        | Contractor: <strong style={{ color: 'var(--text-main)' }}>{bill.contractorName}</strong>
                      </span>
                      {bill.createdAt && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({new Date(bill.createdAt).toLocaleDateString('en-GB')})
                        </span>
                      )}
                    </div>
                    {bill.workName && (
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        <strong style={{ color: 'var(--text-main)' }}>Work Name:</strong> {bill.workName}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem', background: '#2563eb' }}
                      onClick={() => loadBill(bill.id)}
                    >
                      Load
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.85rem',
                        color: '#dc2626',
                        borderColor: '#fca5a5',
                        background: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      onClick={() => deleteBill(bill.id)}
                      title="Delete bill"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </li>
              );
            })}
            {savedBills.length === 0 && (
              <li style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No saved bills found.</li>
            )}
          </ul>
        </div>
      )}

      <div>
        <BillForm data={billData} onChange={setBillData} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Document Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--tab-bar-bg)', padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--border)', width: 'fit-content' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setActiveDoc('bill')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '6px',
              background: activeDoc === 'bill' ? '#2563eb' : 'var(--tab-inactive-bg)',
              color: activeDoc === 'bill' ? '#ffffff' : 'var(--tab-inactive-text)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} />
            Contractor's Bill (Form 65)
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setActiveDoc('invoice')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '6px',
              background: activeDoc === 'invoice' ? '#0891b2' : 'var(--tab-inactive-bg)',
              color: activeDoc === 'invoice' ? '#ffffff' : 'var(--tab-inactive-text)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <Receipt size={16} />
            Tax Invoice
          </button>
        </div>

        {activeDoc === 'bill' ? (
          <BillPreview data={billData} previewRef={previewRef} />
        ) : (
          <InvoicePreview data={billData} previewRef={previewRef} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DialogProvider>
      <MainApp />
    </DialogProvider>
  );
}
