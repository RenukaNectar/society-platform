import moment from 'moment';

export interface SocietyData {
  cooperative_society_name?: string;
  local_langauge_society_name?: string;
  registration_number?: string;
  society_id?: string;
  date_registration?: string;
  reference_year?: string;
  functional_status?: { name: string };
  area_of_operation?: { name: string };
  sector_of_operation?: { name: string };
  operation_area_location?: string;
  full_address?: string;
  state?: { name: string };
  district?: { name: string };
  pincode?: string;
  location_of_head_quarter?: string;
  block?: { name: string };
  gram_panchayat?: { name: string; village_name?: string };
  village_code?: string;
  annual_turnover?: string | number;
  annual_loss?: string | number;
  is_dividend_paid?: string;
  dividend_rate?: string | number;
  is_profit_making?: string;
  pan_no?: string;
  gst_no?: string;
  bank_type?: string;
  cooperative_society_bank?: { name: string };
  other_bank?: { name: string };
  how_many_branches?: string;
  financial_audit?: string;
  audit_complete_year?: string;
  category_audit?: string;
  secretary_name?: string;
  mobile_number_of_secretary?: string;
  full_time_secretary?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id?: string;
  name?: string;
  gender?: string;
  category?: string;
  designation?: string;
  created_at?: string;
}

export interface User {
  first_name?: string;
  last_name?: string;
}

export interface Status {
  key?: string;
  title?: string;
}

export const generateSocietyDetailsPDF = (
  society: SocietyData,
  members: Member[] = [],
  createdByUser: User | null = null,
  currentStatus: Status | null = null
) => {
  const formatDate = (date: string) => {
    return date ? moment(date).format('DD MMM, YYYY') : '-';
  };

  const formatCurrency = (amount: string | number) => {
    return amount ? `₹${Number(amount).toLocaleString('en-IN')}` : '₹0';
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Society Details - ${society?.cooperative_society_name || 'N/A'}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #1e40af;
                margin: 0;
                font-size: 28px;
            }
            .header .subtitle {
                color: #6b7280;
                margin: 5px 0;
                font-size: 16px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-left: 10px;
            }
            .status-approved { background-color: #dcfce7; color: #166534; }
            .status-pending { background-color: #dbeafe; color: #1e40af; }
            .status-rejected { background-color: #fecaca; color: #991b1b; }
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .section-title {
                background-color: #f3f4f6;
                padding: 12px 16px;
                margin: 0 0 15px 0;
                border-left: 4px solid #2563eb;
                font-size: 18px;
                font-weight: 600;
                color: #1e40af;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                margin-bottom: 12px;
            }
            .info-label {
                font-size: 11px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .info-value {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
            }
            .members-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            .members-table th,
            .members-table td {
                border: 1px solid #d1d5db;
                padding: 8px 12px;
                text-align: left;
                font-size: 12px;
            }
            .members-table th {
                background-color: #f9fafb;
                font-weight: 600;
                color: #374151;
            }
            .financial-highlight {
                background-color: #f0f9ff;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
            }
            .financial-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .financial-label {
                font-weight: 500;
                color: #374151;
            }
            .financial-value {
                font-weight: 600;
                color: #059669;
            }
            .metadata {
                background-color: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                margin-top: 30px;
                font-size: 12px;
                color: #64748b;
            }
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: #f8fafc;
                border-top: 1px solid #e2e8f0;
                padding: 8px 20px;
                font-size: 10px;
                color: #64748b;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            @media print {
                body { margin: 0; padding-bottom: 40px; }
                @page { margin: 1cm; margin-bottom: 2cm; }
                .section { page-break-inside: avoid; }
                .footer { 
                    position: fixed; 
                    bottom: 0; 
                    left: 0; 
                    right: 0; 
                    background-color: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    padding: 8px 20px;
                    font-size: 10px;
                    color: #64748b;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${society?.cooperative_society_name || 'Society Details'}</h1>
            <div class="subtitle">
                ${society?.local_langauge_society_name ? society.local_langauge_society_name + ' • ' : ''}
                Registration No: ${society?.registration_number || 'N/A'}
            </div>
            <div class="subtitle">
                Society ID: ${society?.society_id || 'N/A'}
                ${currentStatus ? `<span class="status-badge status-${currentStatus.key}">${currentStatus.title}</span>` : ''}
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Basic Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Registration Date</div>
                    <div class="info-value">${formatDate(society?.date_registration || '')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Reference Year</div>
                    <div class="info-value">${society?.reference_year || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Functional Status</div>
                    <div class="info-value">${society?.functional_status?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Operation Area</div>
                    <div class="info-value">${society?.area_of_operation?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Sector of Operation</div>
                    <div class="info-value">${society?.sector_of_operation?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Location Type</div>
                    <div class="info-value">${society?.operation_area_location || '-'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Address & Location</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Full Address</div>
                    <div class="info-value">${society?.full_address || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">State</div>
                    <div class="info-value">${society?.state?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">District</div>
                    <div class="info-value">${society?.district?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Pincode</div>
                    <div class="info-value">${society?.pincode || '-'}</div>
                </div>
                ${society?.location_of_head_quarter === 'rural' ? `
                <div class="info-item">
                    <div class="info-label">Block</div>
                    <div class="info-value">${society?.block?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Gram Panchayat</div>
                    <div class="info-value">${society?.gram_panchayat?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Village</div>
                    <div class="info-value">${society?.gram_panchayat?.village_name || society?.village_code || '-'}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Financial Information</h2>
            <div class="financial-highlight">
                <div class="financial-item">
                    <span class="financial-label">Annual Turnover</span>
                    <span class="financial-value">${formatCurrency(society?.annual_turnover || 0)}</span>
                </div>
                <div class="financial-item">
                    <span class="financial-label">Annual Loss</span>
                    <span class="financial-value">${formatCurrency(society?.annual_loss || 0)}</span>
                </div>
                ${society?.is_dividend_paid === 'yes' ? `
                <div class="financial-item">
                    <span class="financial-label">Dividend Rate</span>
                    <span class="financial-value">${society?.dividend_rate || '0'}%</span>
                </div>
                ` : ''}
                <div class="financial-item">
                    <span class="financial-label">Profit Making</span>
                    <span class="financial-value">${society?.is_profit_making === 'yes' ? 'Yes' : 'No'}</span>
                </div>
                <div class="financial-item">
                    <span class="financial-label">Dividend Paid</span>
                    <span class="financial-value">${society?.is_dividend_paid === 'yes' ? 'Yes' : 'No'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Legal & Tax Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">PAN Number</div>
                    <div class="info-value">${society?.pan_no || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">GST Number</div>
                    <div class="info-value">${society?.gst_no || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Bank Type</div>
                    <div class="info-value">${society?.bank_type || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Bank Name</div>
                    <div class="info-value">${society?.cooperative_society_bank?.name || society?.other_bank?.name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Number of Branches</div>
                    <div class="info-value">${society?.how_many_branches || '-'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Audit Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Financial Audit</div>
                    <div class="info-value">${society?.financial_audit === 'yes' ? 'Completed' : 'Not Done'}</div>
                </div>
                ${society?.financial_audit === 'yes' ? `
                <div class="info-item">
                    <div class="info-label">Audit Year</div>
                    <div class="info-value">${society?.audit_complete_year || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Audit Category</div>
                    <div class="info-value">${society?.category_audit || '-'}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Administrative Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Secretary Name</div>
                    <div class="info-value">${society?.secretary_name || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Secretary Mobile</div>
                    <div class="info-value">${society?.mobile_number_of_secretary || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Full-time Secretary</div>
                    <div class="info-value">${society?.full_time_secretary === 'yes' ? 'Yes' : 'No'}</div>
                </div>
            </div>
        </div>

        ${members && members.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Board Members (${members.length})</h2>
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Category</th>
                        <th>Designation</th>
                        <th>Promoter Since</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map((member: Member) => `
                        <tr>
                            <td>${member.name || '-'}</td>
                            <td>${member.gender || '-'}</td>
                            <td>${member.category || '-'}</td>
                            <td>${member.designation || '-'}</td>
                            <td>${formatDate(member.created_at || '')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="metadata">
            <strong>Report Generated:</strong> ${moment().format('DD MMM, YYYY hh:mm a')}<br>
            <strong>Generated By:</strong> ${createdByUser ? `${createdByUser.first_name} ${createdByUser.last_name}` : 'System'}<br>
            <strong>Society Created:</strong> ${formatDate(society?.created_at || '')}<br>
            <strong>Last Updated:</strong> ${formatDate(society?.updated_at || '')}
        </div>

        <div class="footer">
            <span>${moment().format('DD MMM, YYYY')}</span>
            <span>Generated by RCS system</span>
        </div>
    </body>
    </html>
  `;

  return htmlContent;
};

export const downloadPDF = (htmlContent: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Please allow popups to generate PDF');
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Auto-print after a short delay
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};
