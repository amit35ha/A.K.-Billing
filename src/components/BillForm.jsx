import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Building2, UserPlus, Pencil, X, FileText } from 'lucide-react';

export default function BillForm({ data, onChange }) {
  const [contractors, setContractors] = useState([]);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [statusMsg, setStatusMsg] = useState('');
  const [contractorForm, setContractorForm] = useState({
    name: '',
    partyCode: '',
    pan: '',
    gstin: '',
    address: ''
  });

  const fetchContractors = async () => {
    try {
      const res = await fetch('/api/contractors');
      const list = await res.json();
      if (Array.isArray(list)) {
        setContractors(list);
      }
    } catch {
      // server unreachable
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/contractors')
      .then((res) => res.json())
      .then((list) => {
        if (!ignore && Array.isArray(list)) {
          setContractors(list);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectContractor = (e) => {
    const id = e.target.value;
    setSelectedContractorId(id);
    if (!id) return;

    const found = contractors.find((c) => String(c.id) === String(id));
    if (found) {
      onChange({
        ...data,
        contractorName: found.name,
        partyCode: found.partyCode || '',
        address: found.address || '',
        gstin: found.gstin || '',
        pan: found.pan || ''
      });
      setStatusMsg(`Loaded ${found.name}`);
      setTimeout(() => setStatusMsg(''), 2500);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setContractorForm({ name: '', partyCode: '', pan: '', gstin: '', address: '' });
    setShowModal(true);
  };

  const handleOpenEdit = () => {
    if (!selectedContractorId) return;
    const found = contractors.find((c) => String(c.id) === String(selectedContractorId));
    if (found) {
      setModalMode('edit');
      setContractorForm({
        name: found.name || '',
        partyCode: found.partyCode || '',
        pan: found.pan || '',
        gstin: found.gstin || '',
        address: found.address || ''
      });
      setShowModal(true);
    }
  };

  const handleSaveContractor = async (e) => {
    e.preventDefault();
    if (!contractorForm.name.trim()) {
      alert('Contractor name is required');
      return;
    }

    try {
      if (modalMode === 'add') {
        const res = await fetch('/api/contractors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contractorForm)
        });
        const created = await res.json();
        if (res.ok) {
          await fetchContractors();
          setSelectedContractorId(String(created.id));
          onChange({
            ...data,
            contractorName: created.name,
            partyCode: created.partyCode || '',
            address: created.address || '',
            gstin: created.gstin || '',
            pan: created.pan || ''
          });
          setShowModal(false);
          setStatusMsg(`Added ${created.name}`);
          setTimeout(() => setStatusMsg(''), 2500);
        } else {
          alert(created.error || 'Failed to add contractor');
        }
      } else {
        // Edit mode
        const res = await fetch(`/api/contractors/${selectedContractorId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contractorForm)
        });
        const updated = await res.json();
        if (res.ok) {
          await fetchContractors();
          onChange({
            ...data,
            contractorName: updated.name,
            partyCode: updated.partyCode || '',
            address: updated.address || '',
            gstin: updated.gstin || '',
            pan: updated.pan || ''
          });
          setShowModal(false);
          setStatusMsg(`Updated ${updated.name}`);
          setTimeout(() => setStatusMsg(''), 2500);
        } else {
          alert(updated.error || 'Failed to update contractor');
        }
      }
    } catch {
      alert('Error connecting to server to save contractor');
    }
  };

  const handleDeleteContractor = async () => {
    if (!selectedContractorId) {
      alert('Please select a contractor to delete first');
      return;
    }

    const found = contractors.find((c) => String(c.id) === String(selectedContractorId));
    const contractorName = found ? found.name : 'this contractor';

    if (!window.confirm(`Are you sure you want to permanently delete "${contractorName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/contractors/${selectedContractorId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const remaining = contractors.filter((c) => String(c.id) !== String(selectedContractorId));
        setContractors(remaining);
        setSelectedContractorId('');
        onChange({
          ...data,
          contractorName: '',
          partyCode: '',
          address: '',
          gstin: '',
          pan: ''
        });
        setStatusMsg(`Deleted ${contractorName}`);
        setTimeout(() => setStatusMsg(''), 2500);
      } else {
        alert('Failed to delete contractor');
      }
    } catch {
      alert('Error connecting to server to delete contractor');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const current = Array.isArray(data.items) ? data.items : [];
    const newItems = [...current];
    if (!newItems[index]) return;
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate amount
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(newItems[index].qty) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = (qty * rate).toFixed(2);
    }
    
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const current = Array.isArray(data.items) ? data.items : [];
    onChange({
      ...data,
      items: [...current, { desc: '', qty: '', unit: 'Nos', rate: '', amount: '0.00' }]
    });
  };

  const removeItem = (index) => {
    const current = Array.isArray(data.items) ? data.items : [];
    const newItems = current.filter((_, i) => i !== index);
    onChange({ ...data, items: newItems.length > 0 ? newItems : [{ desc: '', qty: '', unit: 'Nos', rate: '', amount: '0.00' }] });
  };

  const handleClearEnterprise = () => {
    if (window.confirm('Are you sure you want to clear the form details?')) {
      onChange({
        ...data,
        contractorName: '',
        partyCode: '',
        address: '',
        gstin: '',
        pan: ''
      });
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ marginBottom: '1.5rem' }}>Bill Details</h2>

      {/* Enterprise / Contractor Section */}
      <div style={{
        background: 'var(--item-row-bg)',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>
            <Building2 size={20} color="#2563eb" />
            <span>Contractor / Enterprise Details</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClearEnterprise}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              borderColor: '#fca5a5',
              background: '#fef2f2',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Clear Form Details"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Contractor Selector Bar with Icon-only Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'var(--card-bg)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Select Contractor
            </label>
            <select
              className="form-control"
              value={selectedContractorId}
              onChange={handleSelectContractor}
              style={{ padding: '0.45rem', fontSize: '0.9rem' }}
            >
              <option value="">-- Choose Contractor --</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.partyCode ? `(${c.partyCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignSelf: 'flex-end' }}>
            {/* Add Button - Icon Only with Hover Tooltip */}
            <button
              type="button"
              className="btn"
              onClick={handleOpenAdd}
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Add New Contractor"
            >
              <UserPlus size={18} />
            </button>

            {/* Edit Button - Icon Only with Hover Tooltip */}
            {selectedContractorId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleOpenEdit}
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0fdf4',
                  borderColor: '#86efac',
                  color: '#16a34a',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                title="Edit Selected Contractor"
              >
                <Pencil size={18} />
              </button>
            )}

            {/* Delete Button - Icon Only with Hover Tooltip */}
            {selectedContractorId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDeleteContractor}
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fee2e2',
                  borderColor: '#fca5a5',
                  color: '#dc2626',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                title="Delete Selected Contractor"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {statusMsg && (
          <div style={{ color: '#059669', fontSize: '0.825rem', fontWeight: 500, marginBottom: '0.75rem' }}>
            ✓ {statusMsg}
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label>Contractor / Enterprise Name</label>
            <input
              type="text"
              className="form-control"
              name="contractorName"
              value={data.contractorName}
              onChange={handleChange}
              placeholder="e.g. M/S. R. ENTERPRISE"
            />
          </div>
          <div className="form-group">
            <label>Party Code</label>
            <input
              type="text"
              className="form-control"
              name="partyCode"
              value={data.partyCode}
              onChange={handleChange}
              placeholder="e.g. 12345"
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>PAN Number</label>
            <input type="text" className="form-control" name="pan" value={data.pan} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>GSTIN</label>
            <input type="text" className="form-control" name="gstin" value={data.gstin} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Address</label>
          <textarea className="form-control" name="address" value={data.address} onChange={handleChange} rows="2" />
        </div>
      </div>

      {/* Bill Type Selection: Final Bill vs Part Bill (1st, 2nd, 3rd) */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', fontSize: '1.05rem' }}>
          <FileText size={20} color="#2563eb" />
          <span>Bill Type</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={() => onChange({ ...data, billType: 'Final Bill' })}
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: (data.billType || 'Final Bill') === 'Final Bill' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: (data.billType || 'Final Bill') === 'Final Bill' ? '#eff6ff' : '#ffffff',
              color: (data.billType || 'Final Bill') === 'Final Bill' ? '#1d4ed8' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Final Bill
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => onChange({ ...data, billType: 'Part Bill', partBillNumber: data.partBillNumber || '1st' })}
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: data.billType === 'Part Bill' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: data.billType === 'Part Bill' ? '#eff6ff' : '#ffffff',
              color: data.billType === 'Part Bill' ? '#1d4ed8' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Part Bill
          </button>

          {data.billType === 'Part Bill' && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Select Part:</span>
              {['1st', '2nd', '3rd'].map((part) => (
                <button
                  key={part}
                  type="button"
                  className="btn"
                  onClick={() => onChange({ ...data, partBillNumber: part })}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: (data.partBillNumber || '1st') === part ? '2px solid #10b981' : '1px solid #cbd5e1',
                    background: (data.partBillNumber || '1st') === part ? '#ecfdf5' : '#ffffff',
                    color: (data.partBillNumber || '1st') === part ? '#047857' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {part}
                </button>
              ))}

              <input
                type="text"
                placeholder="Other (e.g. 4th)"
                value={!['1st', '2nd', '3rd'].includes(data.partBillNumber) ? (data.partBillNumber || '') : ''}
                onChange={(e) => onChange({ ...data, partBillNumber: e.target.value })}
                style={{
                  width: '110px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px'
                }}
              />
            </div>
          )}
        </div>

        {/* Tax Type Selector */}
        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
            Tax Type (GST 18%, Cess 1%):
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { id: 'With GST & Cess', label: 'With GST & Cess' },
              { id: 'With GST', label: 'With GST' },
              { id: 'No tax', label: 'No tax' }
            ].map((tax) => {
              const currentTax = data.taxType || 'With GST & Cess';
              const isSelected = currentTax === tax.id;
              return (
                <button
                  key={tax.id}
                  type="button"
                  className="btn"
                  onClick={() => onChange({ ...data, taxType: tax.id })}
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: isSelected ? '2px solid var(--tax-active-border)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--tax-active-bg)' : 'var(--card-bg)',
                    color: isSelected ? 'var(--tax-active-text)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tax.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            className="form-control"
            name="department"
            value={data.department !== undefined ? data.department : 'Lighting'}
            onChange={handleChange}
            placeholder="e.g. Lighting"
          />
        </div>
        <div className="form-group">
          <label>Zone (e.g., Z-II)</label>
          <select className="form-control" name="zone" value={data.zone || 'II'} onChange={handleChange}>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
            <option value="V">V</option>
            <option value="VI">VI</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Work Order No.</label>
        <input type="text" className="form-control" name="workOrderNo" value={data.workOrderNo} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Work Name</label>
        <textarea className="form-control" name="workName" value={data.workName} onChange={handleChange} rows="2" />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Date of Work Order</label>
          <input type="text" className="form-control" name="workOrderDate" value={data.workOrderDate} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Date of Commencement</label>
          <input type="text" className="form-control" name="dateOfCommencement" value={data.dateOfCommencement} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Date of Completion</label>
          <input type="text" className="form-control" name="dateOfCompletion" value={data.dateOfCompletion} onChange={handleChange} />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Measurement Book No. (M.B. No.)</label>
          <input
            type="text"
            className="form-control"
            name="mbNo"
            value={data.mbNo || ''}
            onChange={handleChange}
            placeholder="e.g. MB-104 / 2026"
          />
        </div>
        <div className="form-group">
          <label>Measurement Page No.</label>
          <input
            type="text"
            className="form-control"
            name="mbPageNo"
            value={data.mbPageNo || ''}
            onChange={handleChange}
            placeholder="e.g. 15 to 18"
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>UBN No.</label>
          <input
            type="text"
            className="form-control"
            name="ubnNo"
            value={data.ubnNo || ''}
            onChange={handleChange}
            placeholder="e.g. UBN/1023/26"
          />
        </div>
        <div className="form-group">
          <label>EB No.</label>
          <input
            type="text"
            className="form-control"
            name="ebNo"
            value={data.ebNo || ''}
            onChange={handleChange}
            placeholder="e.g. EB/554/26"
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Invoice No.</label>
          <input
            type="text"
            className="form-control"
            name="invoiceNo"
            value={data.invoiceNo || ''}
            onChange={handleChange}
            placeholder="e.g. 01/2026-27"
          />
        </div>
        <div className="form-group">
          <label>Invoice Date</label>
          <input
            type="text"
            className="form-control"
            name="invoiceDate"
            value={data.invoiceDate || ''}
            onChange={handleChange}
            placeholder="DD/MM/YYYY"
          />
        </div>
      </div>

      <h3 style={{ margin: '1.5rem 0 1rem' }}>Items of Work</h3>
      {(data.items || []).map((item, index) => (
        <div key={index} className="item-row">
          <div className="item-row-desc">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Description</label>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', border: '1px solid #fca5a5' }}
                onClick={() => removeItem(index)}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
            <input type="text" className="form-control" value={item.desc} onChange={(e) => handleItemChange(index, 'desc', e.target.value)} />
          </div>
          <div className="item-row-metrics">
            <div>
              <label>Qty</label>
              <input type="number" className="form-control" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} style={{ padding: '0.5rem' }} />
            </div>
            <div>
              <label>Unit</label>
              <input type="text" className="form-control" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} placeholder="Nos" style={{ padding: '0.5rem' }} />
            </div>
            <div>
              <label>Rate</label>
              <input type="number" className="form-control" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} style={{ padding: '0.5rem' }} />
            </div>
            <div>
              <label>Amount</label>
              <input type="text" className="form-control" value={item.amount} readOnly style={{ backgroundColor: '#e2e8f0', padding: '0.5rem' }} />
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={addItem}>
        <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Item
      </button>

      {/* Add / Edit Contractor Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--modal-overlay)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--modal-bg)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {modalMode === 'add' ? (
                  <>
                    <UserPlus size={20} color="#2563eb" /> Add New Contractor
                  </>
                ) : (
                  <>
                    <Pencil size={20} color="#16a34a" /> Edit Contractor Details
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveContractor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Contractor / Enterprise Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={contractorForm.name}
                  onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })}
                  placeholder="e.g. M/S. ABC ENTERPRISE"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Party Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={contractorForm.partyCode}
                    onChange={(e) => setContractorForm({ ...contractorForm, partyCode: e.target.value })}
                    placeholder="e.g. 54321"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>PAN Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={contractorForm.pan}
                    onChange={(e) => setContractorForm({ ...contractorForm, pan: e.target.value })}
                    placeholder="e.g. ABCDE1234F"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>GSTIN</label>
                <input
                  type="text"
                  className="form-control"
                  value={contractorForm.gstin}
                  onChange={(e) => setContractorForm({ ...contractorForm, gstin: e.target.value })}
                  placeholder="e.g. 19ABCDE1234F1Z5"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Address</label>
                <textarea
                  className="form-control"
                  value={contractorForm.address}
                  onChange={(e) => setContractorForm({ ...contractorForm, address: e.target.value })}
                  rows="2"
                  placeholder="Enter office address"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: modalMode === 'add' ? '#2563eb' : '#16a34a',
                    color: '#ffffff'
                  }}
                >
                  {modalMode === 'add' ? 'Save Contractor' : 'Update Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
