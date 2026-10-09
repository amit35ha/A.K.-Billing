import React from 'react';

export default function InvoicePreview({ data, previewRef }) {
  const calculateTotal = () => {
    return (data.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const total = calculateTotal();
  const taxType = data.taxType || 'With GST & Cess';
  const hasGST = taxType === 'With GST & Cess' || taxType === 'With GST';
  const hasCess = taxType === 'With GST & Cess';

  const cgst = hasGST ? total * 0.09 : 0;
  const sgst = hasGST ? total * 0.09 : 0;
  const amountBeforeCess = total + cgst + sgst;
  const cess = hasCess ? amountBeforeCess * 0.01 : 0;
  const grandTotal = hasCess ? (amountBeforeCess + cess) : amountBeforeCess;

  // Indian Currency Number to Words
  const numberToWords = (num) => {
    if (isNaN(num) || num <= 0) return "Zero Rupees Only/-";
    const rounded = Math.round(num);
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertBelowThousand = (n) => {
      let str = '';
      if (n >= 100) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
      return str.trim();
    };

    let result = '';
    const crore = Math.floor(rounded / 10000000);
    let rem = rounded % 10000000;
    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;
    const thousand = Math.floor(rem / 1000);
    rem = rem % 1000;
    const hundreds = rem;

    if (crore > 0) result += convertBelowThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertBelowThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertBelowThousand(thousand) + ' Thousand ';
    if (hundreds > 0) result += convertBelowThousand(hundreds) + ' ';

    return (result.trim() || 'Zero') + ' Rupees Only/-';
  };

  const invoiceNo = data.invoiceNo || '-';
  const invoiceDate = data.invoiceDate || '-';
  const billTypeLabel = data.billType === 'Part Bill'
    ? `${data.partBillNumber || '1st'} PART BILL`
    : 'FINAL BILL';



  return (
    <div className="preview-card" style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--preview-container-bg)' }} ref={previewRef}>
      <div className="bill-document" style={{ position: 'relative', minHeight: '297mm', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '15mm' }}>
        
        {/* Header with Title and Copy Type */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '6px', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>TAX INVOICE</div>
            <div style={{ fontSize: '10px', color: '#444' }}>Issued under Section 31 of CGST Act / WBGST Act, 2017</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ border: '1.5px solid black', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              ORIGINAL FOR RECIPIENT
            </div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px', color: '#2563eb' }}>
              ({billTypeLabel})
            </div>
          </div>
        </div>

        {/* Supplier & Recipient 2-Column Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '8px' }}>
          
          {/* Supplier Details */}
          <div style={{ padding: '8px 10px', borderRight: '1px solid black' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
              DETAILS OF SUPPLIER / CONTRACTOR:
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>
              {data.contractorName || ''}
            </div>
            {data.partyCode && (
              <div style={{ fontSize: '11px' }}><strong>Party Code:</strong> {data.partyCode}</div>
            )}
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>Address:</strong> {data.address || ''}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>GSTIN:</strong> {data.gstin || '-'}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>PAN:</strong> {data.pan || '-'}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>State:</strong> West Bengal &nbsp;|&nbsp; <strong>State Code:</strong> 19
            </div>
          </div>

          {/* Recipient Details */}
          <div style={{ padding: '8px 10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
              DETAILS OF RECIPIENT / BILLED TO:
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>
              THE KOLKATA MUNICIPAL CORPORATION
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>Department:</strong> {data.department || 'Lighting'}, Zone-{data.zone || 'II'}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>Address:</strong> 5, S.N. Banerjee Road, Kolkata - 700 013
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>GSTIN:</strong> 19AAALT1025G1Z6
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              <strong>State:</strong> West Bengal &nbsp;|&nbsp; <strong>State Code:</strong> 19
            </div>
          </div>
        </div>

        {/* Invoice, Work Order, Commencement, Completion & MB Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid black', marginBottom: '8px', fontSize: '11px' }}>
          {/* Row 1: Invoice & Work Order Info */}
          <div style={{ padding: '6px 8px', borderRight: '1px solid black', borderBottom: '1px solid black' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Invoice No.:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{invoiceNo}</div>
          </div>
          <div style={{ padding: '6px 8px', borderRight: '1px solid black', borderBottom: '1px solid black' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Invoice Date:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{invoiceDate}</div>
          </div>
          <div style={{ padding: '6px 8px', borderRight: '1px solid black', borderBottom: '1px solid black' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Work Order No.:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.workOrderNo || '-'}</div>
          </div>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid black' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Work Order Date:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.workOrderDate || '-'}</div>
          </div>

          {/* Row 2: Commencement, Completion, MB No, MB Page No */}
          <div style={{ padding: '6px 8px', borderRight: '1px solid black', borderBottom: (data.ubnNo || data.ebNo) ? '1px solid black' : 'none' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Date of Commencement:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.dateOfCommencement || '-'}</div>
          </div>
          <div style={{ padding: '6px 8px', borderRight: '1px solid black', borderBottom: (data.ubnNo || data.ebNo) ? '1px solid black' : 'none' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Date of Completion:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.dateOfCompletion || '-'}</div>
          </div>
          <div style={{ padding: '6px 8px', borderRight: '1px solid black', borderBottom: (data.ubnNo || data.ebNo) ? '1px solid black' : 'none' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Measurement Book No.:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.mbNo || '-'}</div>
          </div>
          <div style={{ padding: '6px 8px', borderBottom: (data.ubnNo || data.ebNo) ? '1px solid black' : 'none' }}>
            <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>M.B. Page No.:</span>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.mbPageNo || '-'}</div>
          </div>

          {/* Row 3: Optional UBN, EB, Zone, Bill Type */}
          {(data.ubnNo || data.ebNo) && (
            <>
              <div style={{ padding: '6px 8px', borderRight: '1px solid black' }}>
                <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>UBN No.:</span>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.ubnNo || '-'}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid black' }}>
                <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>EB No.:</span>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.ebNo || '-'}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid black' }}>
                <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Department / Zone:</span>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.department || 'Lighting'} / Zone-{data.zone || 'II'}</div>
              </div>
              <div style={{ padding: '6px 8px' }}>
                <span style={{ color: '#475569', fontSize: '10px', display: 'block' }}>Bill Type:</span>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{billTypeLabel}</div>
              </div>
            </>
          )}
        </div>

        {/* Items Table */}
        <table className="bill-table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '8%', textAlign: 'center' }}>Sl. No.</th>
              <th style={{ width: '60%', textAlign: 'center' }}>Description of Work</th>
              <th style={{ width: '14%', textAlign: 'center' }}>HSN/SAC</th>
              <th style={{ width: '18%', textAlign: 'center' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center" style={{ verticalAlign: 'top', padding: '14px 8px', fontWeight: 'bold' }}>1</td>
              <td style={{ verticalAlign: 'top', padding: '14px 10px', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#000', marginBottom: '8px' }}>
                  {data.workName || 'Work Done as per Bill'}
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 10px', fontSize: '11px', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {data.workOrderNo && (
                    <div>
                      <strong>Work Order No.:</strong> {data.workOrderNo} {data.workOrderDate ? `| Date: ${data.workOrderDate}` : ''}
                    </div>
                  )}
                  {(data.dateOfCommencement || data.dateOfCompletion) && (
                    <div>
                      <strong>Date of Commencement:</strong> {data.dateOfCommencement || '-'} &nbsp;&nbsp;|&nbsp;&nbsp; 
                      <strong>Date of Completion:</strong> {data.dateOfCompletion || '-'}
                    </div>
                  )}
                  {(data.mbNo || data.mbPageNo) && (
                    <div>
                      <strong>Measurement Book Details:</strong> M.B. No. {data.mbNo || '-'} {data.mbPageNo ? `, Page No. ${data.mbPageNo}` : ''}
                    </div>
                  )}
                  {(data.ubnNo || data.ebNo) && (
                    <div>
                      {data.ubnNo ? <span><strong>UBN No.:</strong> {data.ubnNo} &nbsp;&nbsp;|&nbsp;&nbsp; </span> : null}
                      {data.ebNo ? <span><strong>EB No.:</strong> {data.ebNo}</span> : null}
                    </div>
                  )}
                </div>
              </td>
              <td className="text-center" style={{ verticalAlign: 'top', padding: '14px 8px' }}>9954</td>
              <td className="text-right font-bold" style={{ verticalAlign: 'top', padding: '14px 10px', fontSize: '13px' }}>
                {total.toFixed(2)}
              </td>
            </tr>

            {/* Subtotal */}
            <tr>
              <td colSpan="3" className="text-right font-bold" style={{ padding: '6px 8px' }}>
                Total Taxable Value:
              </td>
              <td className="text-right font-bold" style={{ padding: '6px 8px' }}>
                {total.toFixed(2)}
              </td>
            </tr>

            {/* GST */}
            {hasGST && (
              <>
                <tr>
                  <td colSpan="2"></td>
                  <td className="text-center font-bold">CGST @ 9%</td>
                  <td className="text-right font-bold">{cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="2"></td>
                  <td className="text-center font-bold">SGST @ 9%</td>
                  <td className="text-right font-bold">{sgst.toFixed(2)}</td>
                </tr>
              </>
            )}

            {/* Cess */}
            {hasCess && (
              <>
                <tr>
                  <td colSpan="2"></td>
                  <td className="text-center font-bold">Amount Before Cess</td>
                  <td className="text-right font-bold">{amountBeforeCess.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="2"></td>
                  <td className="text-center font-bold">Cess @ 1%</td>
                  <td className="text-right font-bold">{cess.toFixed(2)}</td>
                </tr>
              </>
            )}

            {/* Grand Total */}
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan="3" className="text-right font-bold" style={{ fontSize: '13px', padding: '8px' }}>
                Total Invoice Value:
              </td>
              <td className="text-right font-bold" style={{ fontSize: '13px', padding: '8px' }}>
                ₹ {grandTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words */}
        <div style={{ marginTop: '10px', fontSize: '11px', padding: '6px 8px', border: '1px solid black', background: '#fafafa' }}>
          <strong>Invoice Amount (in words):</strong> {numberToWords(grandTotal)}
        </div>

        {/* Footer & Signature Section */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px' }}>
          <div style={{ width: '55%' }}>
            <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>Declaration:</div>
            <div style={{ fontSize: '10px', color: '#444', lineHeight: 1.4 }}>
              We declare that this invoice shows the actual price of the services / goods described and that all particulars are true and correct.
            </div>
            {(data.mbNo || data.mbPageNo) && (
              <div style={{ fontSize: '10px', marginTop: '6px', color: '#1e293b' }}>
                <strong>Measurement Book Ref:</strong> M.B. No. {data.mbNo || '-'} {data.mbPageNo ? `, Page ${data.mbPageNo}` : ''}
              </div>
            )}
            {(data.dateOfCommencement || data.dateOfCompletion) && (
              <div style={{ fontSize: '10px', marginTop: '2px', color: '#1e293b' }}>
                <strong>Execution Period:</strong> {data.dateOfCommencement || '-'} to {data.dateOfCompletion || '-'}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              For {data.contractorName || ''}
            </div>
            <div style={{ height: '48px' }}></div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              Authorised Signatory
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
