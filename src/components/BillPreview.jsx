import React from 'react';

export default function BillPreview({ data, previewRef }) {
  const safeItems = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [{ desc: '', qty: '', unit: 'Nos', rate: '', amount: '' }];

  const calculateTotal = () => {
    return safeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const ITEMS_PER_PAGE = 6;
  const pages = [];
  for (let i = 0; i < safeItems.length; i += ITEMS_PER_PAGE) {
    pages.push(safeItems.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const total = calculateTotal();
  const taxType = data.taxType || 'With GST & Cess';
  const hasGST = taxType === 'With GST & Cess' || taxType === 'With GST';
  const hasCess = taxType === 'With GST & Cess';

  const cgst = hasGST ? total * 0.09 : 0;
  const sgst = hasGST ? total * 0.09 : 0;
  const amountBeforeCess = total + cgst + sgst;
  const cess = hasCess ? amountBeforeCess * 0.01 : 0;
  const grandTotal = hasCess ? (amountBeforeCess + cess) : amountBeforeCess;

  const rowSpanCount = (hasGST && hasCess) ? 5 : hasGST ? 3 : 2;
  const extraSpacer = (5 - rowSpanCount) * 22;

  // Indian Currency Number to Words converter
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

  const billTypeLabel = (data.billType === 'Part Bill')
    ? `${(data.partBillNumber || '1st').toUpperCase()} PART BILL`
    : 'FINAL BILL';

  return (
    <div className="preview-card" style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--preview-container-bg)' }} ref={previewRef}>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        
        return (
          <div
            key={pageIndex}
            className="bill-document"
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              minHeight: '297mm',
              boxSizing: 'border-box',
              flexShrink: 0,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            
            {/* Top of page banner with Accounts Form info and prominent Bill Type */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                Accounts FoR.M. No. 65 (Chapter VII Art,127) {pages.length > 1 && ` - Page ${pageIndex + 1} of ${pages.length}`}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                border: '1.5px solid black',
                padding: '1px 10px',
                textTransform: 'uppercase',
                background: '#ffffff'
              }}>
                {billTypeLabel}
              </div>
            </div>

            {/* Main Table */}
            <table className="bill-table" style={{ marginTop: 0 }}>
              <tbody>
                {/* Row 1 */}
                <tr>
                  <td style={{ width: '20%', verticalAlign: 'top', height: '40px' }}>
                    <div style={{ fontWeight: 'bold' }}>Date of receipt in the Acctt. Dept.</div>
                  </td>
                  <td rowSpan="3" style={{ width: '60%', textAlign: 'center', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>CONTRACTOR'S BILL</div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '2px' }}>FOR</div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '2px' }}>WORK DONE</div>
                    <div style={{ marginTop: '8px', color: '#555' }}>VARITIES TO NOTE</div>
                    <div style={{ fontSize: '10px', marginTop: '4px', padding: '0 10px' }}>Memo of bill Form., date of sibmission of bill and name of department where it was submitted are absolutely necessary for any enquiry regarding a bill</div>
                  </td>
                  <td style={{ width: '20%', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold' }}>Month of</div>
                  </td>
                </tr>
                {/* Row 2 */}
                <tr>
                  <td style={{ verticalAlign: 'top', height: '40px' }}>
                    <div style={{ fontWeight: 'bold' }}>Dy .C.M.F.A's</div>
                    <div style={{ fontWeight: 'bold' }}>Register No</div>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold' }}>Cash Voucher No.</div>
                  </td>
                </tr>
                {/* Row 3 */}
                <tr>
                  <td style={{ verticalAlign: 'top', height: '50px' }}>
                    <div style={{ fontWeight: 'bold' }}>Drawn in Cheque</div>
                    <div style={{ fontWeight: 'bold' }}>No. &nbsp;&nbsp;&nbsp;&nbsp; Date</div>
                    <div style={{ marginTop: '5px' }}>---------</div>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold' }}>Cash Folio</div>
                  </td>
                </tr>
                {/* Row 4 (KMC Details) */}
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>THE KOLKATA MUNICIPAL CORPORATION &nbsp; Ex. Engg-Elec &nbsp; Z-{data.zone || 'II'} DT.</div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '2px' }}>GSTIN/UIN - 19AAALT1025G1Z6</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>
                      A/C---{data.contractorName || ''}
                      {data.partyCode ? <span style={{ marginLeft: '20px' }}>(Party Code: {data.partyCode})</span> : null}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>Address - {data.address || ''}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '2px', display: 'flex', justifyContent: 'center', gap: '80px' }}>
                      <span>GSTIN: {data.gstin || ''}</span>
                      <span>PAN:- {data.pan || ''}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Items Table */}
            <table className="bill-table" style={{ borderTop: 'none' }}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ width: '5%', textAlign: 'center', verticalAlign: 'bottom' }}>Sl. No.</th>
                  <th rowSpan="2" style={{ width: '60%', textAlign: 'center', verticalAlign: 'bottom' }}>Description of Work</th>
                  <th rowSpan="2" style={{ width: '10%', textAlign: 'center', verticalAlign: 'bottom' }}>Rate</th>
                  <th colSpan="2" style={{ width: '25%', textAlign: 'center' }}>Since last bill</th>
                </tr>
                <tr>
                  <th style={{ textAlign: 'center', width: '10%' }}>Quantity</th>
                  <th style={{ textAlign: 'center', width: '15%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Work info row */}
                <tr>
                  <td></td>
                  <td colSpan="4">
                    <div className="font-bold">Work Name: {data.workName}</div>
                    <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
                      <span className="font-bold">Work Order No. : {data.workOrderNo}</span>
                      <span className="font-bold">Date: {data.workOrderDate}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '40px', marginTop: '10px', marginBottom: '10px' }}>
                      <span className="font-bold">Date of Commencement :- {data.dateOfCommencement}</span>
                      <span className="font-bold">Date of Completion :- {data.dateOfCompletion}</span>
                    </div>
                  </td>
                </tr>
                
                {/* Items */}
                {pageItems.map((item, index) => {
                  const globalIndex = (pageIndex * ITEMS_PER_PAGE) + index;
                  return (
                    <tr key={globalIndex}>
                      <td className="text-center">{globalIndex + 1}</td>
                      <td>{item.desc}</td>
                      <td className="text-center">{item.rate}</td>
                      <td className="text-center">
                        <div>{item.qty}</div>
                        <div style={{ fontSize: '9px', marginTop: '2px' }}>{item.unit || 'Nos'}</div>
                      </td>
                      <td className="text-right">{item.amount}</td>
                    </tr>
                  );
                })}
                
                {/* Single vertical spacer row extending column borders */}
                <tr style={{ height: `${isLastPage ? Math.max(8, 70 - pageItems.length * 15 + (extraSpacer ? Math.min(extraSpacer, 50) : 0)) : Math.max(40, 240 - pageItems.length * 28 + extraSpacer)}px` }}>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>

                {/* Totals - Only on Last Page */}
                {isLastPage ? (
                  <>
                    <tr>
                      <td colSpan="2" rowSpan={rowSpanCount} style={{ verticalAlign: 'top', padding: '10px 12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline', marginBottom: '8px' }}>
                          MEASUREMENT BOOK DETAILS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 'bold' }}>Measurement Book No. :</span>
                            <span style={{ fontWeight: data.mbNo ? 'bold' : 'normal' }}>
                              {data.mbNo || '................................'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 'bold' }}>Page No. :</span>
                            <span style={{ fontWeight: data.mbPageNo ? 'bold' : 'normal' }}>
                              {data.mbPageNo || '................................'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td colSpan="2" className="text-center font-bold">Total Say</td>
                      <td className="text-right font-bold">{total.toFixed(2)}</td>
                    </tr>

                    {hasGST && (
                      <tr>
                        <td className="text-center font-bold">ADDING 18% GST</td>
                        <td className="text-center">
                          <div>CGST @9%</div>
                          <div style={{ borderTop: '1px solid black' }}>SGST @9%</div>
                        </td>
                        <td className="text-right">
                          <div>{cgst.toFixed(2)}</div>
                          <div style={{ borderTop: '1px solid black' }}>{sgst.toFixed(2)}</div>
                        </td>
                      </tr>
                    )}

                    {hasCess && (
                      <>
                        <tr>
                          <td colSpan="2" className="text-center font-bold">Amount Before CESS---</td>
                          <td className="text-right font-bold">{amountBeforeCess.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="text-center font-bold">CESS-1%----</td>
                          <td className="text-right">{cess.toFixed(2)}</td>
                        </tr>
                      </>
                    )}

                    <tr>
                      <td colSpan="2" className="text-center font-bold">Bill Amount</td>
                      <td className="text-right font-bold">{grandTotal.toFixed(2)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="2"></td>
                    <td colSpan="2" className="text-center font-bold">Page Total (Carried Over)</td>
                    <td className="text-right font-bold">
                      {pageItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer - Only on Last Page */}
            {isLastPage && (
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '14px' }}>
                  (Rupees in Word): {numberToWords(grandTotal)}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span>UBN NO:</span>
                      <span style={{ borderBottom: '1.5px dotted #000', minWidth: '200px', display: 'inline-block', fontWeight: data.ubnNo ? 'bold' : 'normal', paddingLeft: '4px' }}>
                        {data.ubnNo || ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span>EB NO:</span>
                      <span style={{ borderBottom: '1.5px dotted #000', minWidth: '200px', display: 'inline-block', fontWeight: data.ebNo ? 'bold' : 'normal', paddingLeft: '4px' }}>
                        {data.ebNo || ''}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', width: '230px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      For {data.contractorName || ''}
                    </div>
                    {/* Space for stamp / seal */}
                    <div style={{ height: '48px' }}></div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                      Signature of contractor
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
