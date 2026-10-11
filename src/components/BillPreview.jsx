import React from 'react';

export default function BillPreview({ data, previewRef }) {
  const safeItems = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [{ desc: '', qty: '', unit: 'Nos', rate: '', amount: '' }];

  const calculateTotal = () => {
    return safeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  // Dynamic page layout calculation based on item description lengths & page space
  const getItemHeight = (item) => {
    const desc = item.desc || '';
    const lines = desc.split('\n');
    let lineCount = 0;
    for (const line of lines) {
      // 60% of A4 width (~410px) fits ~65 chars of 11px Arial per line
      lineCount += Math.max(1, Math.ceil(line.length / 65));
    }
    // padding (8px) + lineCount * 16px line-height + border
    return Math.max(26, 8 + lineCount * 16);
  };

  const total = calculateTotal();
  const taxType = data.taxType || 'With GST & Cess';
  const hasGST = taxType === 'With GST & Cess' || taxType === 'With GST';
  const hasCess = taxType === 'With GST & Cess';

  const cgst = hasGST ? Math.round(total * 0.09) : 0;
  const sgst = hasGST ? Math.round(total * 0.09) : 0;
  const amountBeforeCess = total + cgst + sgst;
  const cess = hasCess ? amountBeforeCess * 0.01 : 0;
  const grandTotal = hasCess ? (amountBeforeCess + cess) : amountBeforeCess;
  const billAmount = Math.round(grandTotal);

  const rowSpanCount = (hasGST && hasCess) ? 5 : hasGST ? 3 : 2;

  // Space constants (for 297mm A4 with 15mm padding at 96 DPI: ~1009px usable height)
  const AVAILABLE_PAGE_HEIGHT = 1009;
  const workNameLines = Math.max(1, Math.ceil((data.workName || '').length / 65));
  const workInfoHeight = 56 + (workNameLines - 1) * 16;
  const topFixedContentHeight = 20 + 192 + 36 + workInfoHeight; // Banner + Header Table + thead + work info row

  const totalsHeight = (hasGST && hasCess) ? 120 : hasGST ? 88 : 56;
  const footerHeight = 84;
  const lastPageBottomHeight = totalsHeight + footerHeight; // Room required by calculations and footer at bottom
  const carriedOverRowHeight = 28;

  // Space available for items on a page that also holds totals & footer
  const maxSpaceWithCalculations = AVAILABLE_PAGE_HEIGHT - topFixedContentHeight - lastPageBottomHeight - 10;
  // Space available for items on an intermediate page (with Carried Over row at bottom)
  const maxSpaceIntermediate = AVAILABLE_PAGE_HEIGHT - topFixedContentHeight - carriedOverRowHeight - 10;

  // Fill the page first, add calculations if space allows; otherwise break to next page
  const pages = [];
  let itemIndex = 0;

  while (itemIndex < safeItems.length) {
    const pageStartIndex = itemIndex;
    const pageItems = [];
    let currentItemsHeight = 0;

    // 1. Check if ALL remaining items can fit on this page together with calculations & footer
    let allRemainingHeight = 0;
    for (let j = itemIndex; j < safeItems.length; j++) {
      allRemainingHeight += getItemHeight(safeItems[j]);
    }

    if (allRemainingHeight <= maxSpaceWithCalculations) {
      // All remaining items + calculations fit on this single page!
      for (let j = itemIndex; j < safeItems.length; j++) {
        pageItems.push(safeItems[j]);
      }
      pages.push({
        items: pageItems,
        startIndex: pageStartIndex,
        hasCalculations: true
      });
      itemIndex = safeItems.length;
      break;
    }

    // 2. If not all remaining items fit with calculations:
    // Fill this page with as many items as can physically fit!
    while (itemIndex < safeItems.length) {
      const item = safeItems[itemIndex];
      const h = getItemHeight(item);

      // Stop adding if this item would exceed intermediate page space
      if (pageItems.length > 0 && (currentItemsHeight + h > maxSpaceIntermediate)) {
        break;
      }

      pageItems.push(item);
      currentItemsHeight += h;
      itemIndex++;
    }

    // If after filling items, all items fit and calculations can also squeeze in:
    if (itemIndex === safeItems.length && currentItemsHeight <= maxSpaceWithCalculations) {
      pages.push({
        items: pageItems,
        startIndex: pageStartIndex,
        hasCalculations: true
      });
      break;
    }

    // Otherwise, this is an intermediate page
    pages.push({
      items: pageItems,
      startIndex: pageStartIndex,
      hasCalculations: false
    });
  }

  // If the last page does not have calculations, add a page for calculations & footer
  if (pages.length === 0 || !pages[pages.length - 1].hasCalculations) {
    pages.push({
      items: [],
      startIndex: safeItems.length,
      hasCalculations: true
    });
  }

  // If 2 or more pages are used in a bill, but the last page has no items:
  // Move the last item from the previous page to the last page so Page 2 always has an item
  if (pages.length >= 2) {
    const lastPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];
    if (lastPage.items.length === 0 && prevPage.items.length > 1) {
      const movedItem = prevPage.items.pop();
      lastPage.items.push(movedItem);
      lastPage.startIndex = prevPage.startIndex + prevPage.items.length;
    }
  }

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
      {pages.map((pageData, pageIndex) => {
        const pageItems = pageData.items;
        const isLastPage = pageData.hasCalculations;
        const pageItemsHeight = pageItems.reduce((sum, item) => sum + getItemHeight(item), 0);
        const availableTableSpace = isLastPage
          ? AVAILABLE_PAGE_HEIGHT - topFixedContentHeight - lastPageBottomHeight
          : AVAILABLE_PAGE_HEIGHT - topFixedContentHeight - carriedOverRowHeight;

        // Distribute extra space as vertical padding across items
        // so Page 1 (and intermediate pages) look full and spacious rather than huddled at the top
        const extraSpace = Math.max(0, availableTableSpace - pageItemsHeight);
        const perItemExtra = pageItems.length > 0 ? Math.min(22, Math.floor((extraSpace * 0.55) / pageItems.length)) : 0;
        const itemPadY = 6 + Math.floor(perItemExtra / 2);
        const distributedItemHeight = perItemExtra * pageItems.length;
        const spacerHeight = Math.max(20, extraSpace - distributedItemHeight);
        
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

            {/* Items Table Container: absorbs available vertical space so blank space is in the middle */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <table className="bill-table" style={{ borderTop: 'none', height: '100%', flex: 1 }}>
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
                  {pageItems.length === 0 ? (
                    <tr>
                      <td className="text-center" style={{ padding: '6px' }}>-</td>
                      <td colSpan="3" style={{ padding: '6px', fontStyle: 'italic', fontWeight: 'bold' }}>
                        Brought Forward from Page {pageIndex} (Details Continued)
                      </td>
                      <td className="text-right font-bold" style={{ padding: '6px' }}>
                        {total.toFixed(2)}
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((item, index) => {
                      const globalIndex = (pageData.startIndex ?? 0) + index;
                      return (
                        <tr key={globalIndex}>
                          <td className="text-center" style={{ padding: `${itemPadY}px 6px`, verticalAlign: 'middle' }}>{globalIndex + 1}</td>
                          <td style={{ padding: `${itemPadY}px 8px`, verticalAlign: 'middle', lineHeight: 1.5 }}>{item.desc}</td>
                          <td className="text-center" style={{ padding: `${itemPadY}px 6px`, verticalAlign: 'middle' }}>{item.rate}</td>
                          <td className="text-center" style={{ padding: `${itemPadY}px 6px`, verticalAlign: 'middle' }}>
                            <div>{item.qty}</div>
                            <div style={{ fontSize: '9px', marginTop: '2px' }}>{item.unit || 'Nos'}</div>
                          </td>
                          <td className="text-right" style={{ padding: `${itemPadY}px 8px`, verticalAlign: 'middle' }}>{item.amount}</td>
                        </tr>
                      );
                    })
                  )}
                  
                  {/* Single vertical spacer row extending column borders in the middle */}
                  <tr style={{ height: `${spacerHeight}px` }}>
                    <td style={{ height: `${spacerHeight}px` }}></td>
                    <td style={{ height: `${spacerHeight}px` }}></td>
                    <td style={{ height: `${spacerHeight}px` }}></td>
                    <td style={{ height: `${spacerHeight}px` }}></td>
                    <td style={{ height: `${spacerHeight}px` }}></td>
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
                        <td className="text-right font-bold">{billAmount.toFixed(2)}</td>
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
            </div>

            {/* Footer - Only on Last Page */}
            {isLastPage && (
              <div style={{ marginTop: '14px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Left Column: Rupees in Word & UBN / EB numbers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, paddingRight: '24px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', lineHeight: 1.4 }}>
                      (Rupees in Word): {numberToWords(billAmount)}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span>UBN NO:</span>
                        <span style={{ borderBottom: '1.5px dotted #000', minWidth: '220px', display: 'inline-block', fontWeight: data.ubnNo ? 'bold' : 'normal', paddingLeft: '4px' }}>
                          {data.ubnNo || ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span>EB NO:</span>
                        <span style={{ borderBottom: '1.5px dotted #000', minWidth: '220px', display: 'inline-block', fontWeight: data.ebNo ? 'bold' : 'normal', paddingLeft: '4px' }}>
                          {data.ebNo || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column: Contractor Signature & Seal */}
                  <div style={{ textAlign: 'center', width: '230px', flexShrink: 0 }}>
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
