import { useState } from "react";
import { getUsers } from "../../lib/data/users/api";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { FileText, Download } from "lucide-react";
import { getAmendments } from "../../lib/data/amendments/api";
import { getSocieties } from "../../lib/data/societies/api";
import { getAnnualFilings } from "../../lib/data/annualFilings/api";
import { getLiquidations } from "../../lib/data/liquidations/api";
import { getElectionRequests } from "../../lib/data/elections/api";
import { getAuditRequests } from "../../lib/data/audits/api";
import { getEnquiryInspections } from "../../lib/data/enquiryInspections/api";
import { getAppeals } from "../../lib/data/appeals/api";
import { columns } from "./columns";

import moment from "moment";

export const ExportUsersReport = ({ exportModule, searchTerm, filters }: { exportModule: 'amendment' | 'appeal' | 'audit' | 'liquidation' | 'election' | 'users' | 'annual-filing' | 'society' | 'enquiry-inspection', searchTerm: string, filters: any }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'CSV' | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const getUsersData = async () => {
        try {
            setIsExporting(true);
            const response = await getUsers({ search: searchTerm, ...filters, limit: 1000 });
            return response?.data?.users || [];
        } catch (error) {
            console.error('Error fetching users data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const getAmendmentData = async () => {
        try {
            const response = await getAmendments({ search: searchTerm, ...filters, limit: 10000 });
            return response.data?.amendments || [];
        } catch (error) {
            console.error('Error fetching amendments data:', error);
        }
    }

    const getSocietyData = async () => {
        try {
            setIsExporting(true);
            const response: any = await getSocieties({ search: searchTerm, ...filters, limit: 1000 });
            return response?.societyRegistrations || [];
        } catch (error) {
            console.error('Error fetching societies data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const getAnnualFilingData = async () => {
        try {
            setIsExporting(true);
            const response = await getAnnualFilings({ search: searchTerm, ...filters, limit: 1000 });
            return response?.annualForms || [];
        } catch (error) {
            console.error('Error fetching annual filings data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const getLiquidationData = async () => {
        try {
            setIsExporting(true);
            const response = await getLiquidations({ search: searchTerm, ...filters, limit: 1000 });
            console.log(response);
            return response?.data?.liquidations || [];
        } catch (error) {
            console.error('Error fetching liquidations data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const getElectionData = async () => {
        try {
            setIsExporting(true);
            const response = await getElectionRequests({ search: searchTerm, ...filters, limit: 1000 });
            return response?.data?.electionRequests || [];
        } catch (error) {
            console.error('Error fetching election data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const getAuditorData = async () => {
        try {
            setIsExporting(true);
            const response = await getAuditRequests({ search: searchTerm, ...filters, limit: 1000 });
            return response?.auditRequests || [];
        } catch (error) {
            console.error('Error fetching audit data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const getEnquiryInspectionData = async () => {
        try {
            setIsExporting(true);
            const response = await getEnquiryInspections({ search: searchTerm, ...filters, limit: 1000 });
            return response?.data?.enquiries || [];
        } catch (error) {
            console.error('Error fetching enquiry inspection data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const getAppealData = async () => {
        try {
            setIsExporting(true);
            const response = await getAppeals({ search: searchTerm, ...filters, limit: 1000 });
            return response?.appeals || [];
        } catch (error) {
            console.error('Error fetching appeals data:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }

    const handleExport = () => {
        setIsModalOpen(true);
    }

    const handleFormatSelection = (format: 'PDF' | 'CSV') => {
        setSelectedFormat(format);
    }

    const downloadCSV = (data: any[], columns: any, moduleName: string) => {
        if (!data || data.length === 0) {
            alert('No data available to export');
            return;
        }

        const headers = Object.keys(columns);

        const formatValueForCSV = (value: any, key: string) => {
            if (value === null || value === undefined || value === '') return '';
            
            // Handle objects
            if (typeof value === 'object') {
                // If it's an array, join the values
                if (Array.isArray(value)) {
                    return value.map(item => 
                        typeof item === 'object' && item.name ? item.name : String(item)
                    ).join(', ');
                }
                
                // If it's an object with a name property
                if (value.name) return value.name;
                
                // If it's an object with a title property
                if (value.title) return value.title;
                
                // If it's an object with a key property
                if (value.key) return value.key;
                
                // If it's an object with an id property
                if (value.id) return value.id;
                
                // For other objects, try to extract meaningful data
                const stringValue = JSON.stringify(value);
                if (stringValue === '{}') return '';
                return stringValue;
            }
            
            // Handle dates
            if (key.includes('date') || key.includes('Date') || key.includes('_at')) {
                return value ? moment(value).format('DD MMM, YYYY') : '';
            }
            
            // Handle boolean values
            if (typeof value === 'boolean') {
                return value ? 'Yes' : 'No';
            }
            
            // Handle numbers
            if (typeof value === 'number') {
                if (key.includes('amount') || key.includes('Amount') || 
                    key.includes('turnover') || key.includes('loss') || 
                    key.includes('capital') || key.includes('funds') ||
                    key.includes('assets') || key.includes('liabilities')) {
                    return `₹${value.toLocaleString('en-IN')}`;
                }
                return value.toLocaleString('en-IN');
            }
            
            // Handle strings
            if (typeof value === 'string') {
                // If it's a date string, try to format it
                if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                    return moment(value).format('DD MMM, YYYY');
                }
                return value;
            }
            
            // Fallback to string conversion
            return String(value);
        };

        const csvContent = [
            headers.map(header => columns[header]).join(','),
            ...data.map(row => {
                try {
                    return headers.map(header => {
                        const value = formatValueForCSV(row[header], header);
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',');
                } catch (error) {
                    console.error('Error formatting CSV row:', error, row);
                    return headers.map(() => 'Error').join(',');
                }
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${moduleName}_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const generateModulePDF = (data: any[], moduleName: string, csvColumns: any) => {
        if (!data || data.length === 0) {
            alert('No data available to export');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to generate PDF');
            return;
        }

        const formatDate = (date: string) => {
            return date ? moment(date).format('DD MMM, YYYY') : '-';
        };

        const formatValue = (value: any, key: string) => {
            if (value === null || value === undefined || value === '') return '-';
            
            // Handle objects
            if (typeof value === 'object') {
                // If it's an array, join the values
                if (Array.isArray(value)) {
                    return value.map(item => 
                        typeof item === 'object' && item.name ? item.name : String(item)
                    ).join(', ');
                }
                
                // If it's an object with a name property
                if (value.name) return value.name;
                
                // If it's an object with a title property
                if (value.title) return value.title;
                
                // If it's an object with a key property
                if (value.key) return value.key;
                
                // If it's an object with an id property
                if (value.id) return value.id;
                
                // If it's a boolean object
                if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                
                // For other objects, try to extract meaningful data
                const stringValue = JSON.stringify(value);
                if (stringValue === '{}') return '-';
                return stringValue;
            }
            
            // Handle dates
            if (key.includes('date') || key.includes('Date') || key.includes('_at')) {
                return formatDate(value);
            }
            
            // Handle boolean values
            if (typeof value === 'boolean') {
                return value ? 'Yes' : 'No';
            }
            
            // Handle numbers (amounts, counts, etc.)
            if (typeof value === 'number') {
                if (key.includes('amount') || key.includes('Amount') || 
                    key.includes('turnover') || key.includes('loss') || 
                    key.includes('capital') || key.includes('funds') ||
                    key.includes('assets') || key.includes('liabilities')) {
                    return `₹${value.toLocaleString('en-IN')}`;
                }
                return value.toLocaleString('en-IN');
            }
            
            // Handle strings
            if (typeof value === 'string') {
                // If it's a date string, try to format it
                if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                    return formatDate(value);
                }
                return value;
            }
            
            // Fallback to string conversion
            return String(value);
        };

        const headers = Object.keys(csvColumns);
        const tableRows = data.map(row => {
            try {
                return `<tr>${headers.map(header => {
                    const value = row[header];
                    const formattedValue = formatValue(value, header);
                    return `<td>${formattedValue}</td>`;
                }).join('')}</tr>`;
            } catch (error) {
                console.error('Error formatting row:', error, row);
                return `<tr>${headers.map(() => `<td>Error</td>`).join('')}</tr>`;
            }
        }).join('');

        const moduleTitle = moduleName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${moduleTitle} Report</title>
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
                    .summary {
                        background-color: #f8fafc;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .summary-item {
                        text-align: center;
                    }
                    .summary-label {
                        font-size: 12px;
                        color: #6b7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .summary-value {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1e40af;
                        margin-top: 4px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    th, td { 
                        border: 1px solid #d1d5db; 
                        padding: 8px 12px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f9fafb; 
                        font-weight: 600; 
                        color: #374151;
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    td {
                        color: #111827;
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
                    <h1>${moduleTitle} Report</h1>
                    <div class="subtitle">Generated on: ${moment().format('DD MMM, YYYY hh:mm a')}</div>
                </div>

                <div class="summary">
                    <div class="summary-item">
                        <div class="summary-label">Total Records</div>
                        <div class="summary-value">${data.length}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Export Date</div>
                        <div class="summary-value">${moment().format('DD MMM, YYYY')}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Module</div>
                        <div class="summary-value">${moduleTitle}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>${headers.map(header => `<th>${csvColumns[header]}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <div class="footer">
                    <span>${moment().format('DD MMM, YYYY')}</span>
                    <span>Generated by RCS system</span>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        // Auto-print after a short delay
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    const downloadPDF = (data: any[], moduleName: string, csvColumns: any) => {
        generateModulePDF(data, moduleName, csvColumns);
    }

    const handleDownload = async () => {
        if (!selectedFormat) {
            alert('Please select a format (PDF or CSV)');
            return;
        }

        try {
            let data: any = null;
            let csvColumns: any = null
            if (exportModule === 'users') {
                data = await getUsersData();
                csvColumns = columns.users;
            } else if (exportModule === 'amendment') {
                data = await getAmendmentData();
                csvColumns = columns.amendments;
            } else if (exportModule === 'society') {
                data = await getSocietyData();
                csvColumns = columns.society;
            } else if (exportModule === 'annual-filing') {
                data = await getAnnualFilingData();
                csvColumns = columns['annual-filing'];
            } else if (exportModule === 'liquidation') {
                data = await getLiquidationData();
                csvColumns = columns.liquidation;
            } else if (exportModule === 'election') {
                data = await getElectionData();
                csvColumns = columns.election;
            } else if (exportModule === 'audit') {
                data = await getAuditorData();
                csvColumns = columns.audit;
            } else if (exportModule === 'enquiry-inspection') {
                data = await getEnquiryInspectionData();
                csvColumns = columns['enquiry-inspection'];
            } else if (exportModule === 'appeal') {
                data = await getAppealData();
                csvColumns = columns.appeal;
            }

            if (!data) {
                alert('No data available to export');
                return;
            } else {
                if (selectedFormat === 'CSV') {
                    downloadCSV(data, csvColumns, exportModule);
                } else if (selectedFormat === 'PDF') {
                    downloadPDF(data, exportModule, csvColumns);
                }
                setIsModalOpen(false);
                setSelectedFormat(null);
            }
        } catch (error) {
            alert('Error exporting data. Please try again.');
        }
    }

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedFormat(null);
    }

    return (
        <div className="flex justify-end">
            <Button type="button" variant="success" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
            </Button>
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                    <div className="p-2">
                        <h2 className="text-xl font-semibold mb-4">Export {exportModule.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Report</h2>
                        <p className="text-gray-600 mb-6">Select the format for your export:</p>

                        <div className="space-y-4 mb-6">
                            <div
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedFormat === 'PDF'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => handleFormatSelection('PDF')}
                            >
                                <div className="flex items-center">
                                    <FileText className="h-6 w-6 text-red-500 mr-3" />
                                    <div>
                                        <h3 className="font-medium">PDF Format</h3>
                                        <p className="text-sm text-gray-500">Download as PDF document</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedFormat === 'CSV'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => handleFormatSelection('CSV')}
                            >
                                <div className="flex items-center">
                                    <FileText className="h-6 w-6 text-green-500 mr-3" />
                                    <div>
                                        <h3 className="font-medium">CSV Format</h3>
                                        <p className="text-sm text-gray-500">Download as CSV spreadsheet</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleDownload}
                                disabled={!selectedFormat || isExporting}
                            >
                                {isExporting ? 'Exporting...' : 'Download'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}